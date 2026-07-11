import {
  isHeadingBlock,
  isLinkBlock,
  isPlaintextBlock,
} from "@domain/story/publish/support/isBlock";
import openingPageFor from "@domain/story/publish/support/openingPage";
import openingSceneFor from "@domain/story/publish/support/openingScene";
import { isTitleCardScene } from "../published/aframe/titleCardSceneFor";
import type { Current } from "../published/aframe/types";
import {
  type LinkOption,
  type StateMessage,
  startRemoteHost,
} from "./remoteHost";

/**
 * Wires the 360° A-Frame story viewer to the shared remote host: it reads the
 * live `window.current`, drives navigation by re-emitting `linkactivated`, and
 * restarts by re-rendering the opening scene. Auto-arms on every load (the
 * lobby is steward-gated, so only an operator sees/drives sessions).
 */
export function startHostController(): void {
  const getState = (): StateMessage | null => {
    const current = (window as unknown as { current?: Current }).current;
    if (!current?.page) {
      return null;
    }

    const links: LinkOption[] = current.page.content
      .filter(isLinkBlock)
      .map((block) => ({ text: block.text, link: block.link }));

    // The title card is a synthetic scene whose title is an internal sentinel;
    // show the story title there instead.
    const sceneTitle = isTitleCardScene(current.scene)
      ? (current.story?.title ?? "")
      : (current.scene?.title ?? "");

    const heading = current.page.content.find(isHeadingBlock)?.text ?? "";
    const body = current.page.content
      .filter(isPlaintextBlock)
      .map((block) => block.text)
      .join("\n\n");
    const image = current.scene?.image?.url ?? null;

    return {
      type: "state",
      storyTitle: current.story?.title ?? "",
      sceneId: current.scene?.id,
      sceneTitle,
      heading,
      body,
      image,
      pageNumber: current.page.number,
      links,
    };
  };

  const navigate = (link: string) => {
    const storyEl = document.querySelector("[story]") as
      | (Element & { emit?: (name: string, detail: unknown) => void })
      | null;
    if (!storyEl) {
      return;
    }
    if (typeof storyEl.emit === "function") {
      storyEl.emit("linkactivated", link);
    } else {
      storyEl.dispatchEvent(new CustomEvent("linkactivated", { detail: link }));
    }
  };

  const restart = () => {
    const current = (window as unknown as { current?: Current }).current;
    const storyEl = document.querySelector("[story]") as
      | (Element & {
          components?: {
            story?: {
              render?: (c: Current, o: { isSceneChange: boolean }) => void;
            };
          };
        })
      | null;
    const story = current?.story;
    const render = storyEl?.components?.story?.render;
    if (!story || !render) {
      return;
    }
    const openingScene = openingSceneFor(story);
    current.scene = openingScene;
    current.page = openingPageFor(openingScene);
    render.call(storyEl.components?.story, current, { isSceneChange: true });
  };

  const host = startRemoteHost({
    getState,
    navigate,
    restart,
    // a newcomer gets the next gaze tick immediately instead of waiting
    // out the keepalive
    onRemoteJoined: () => {
      lastYaw = Number.NaN;
    },
  });

  // The story view dispatches this on every (re)render — re-broadcast then.
  window.addEventListener("vsat:story-context", host.notifyChange);

  // Gaze mirroring (M-gaze-mirror): broadcast where the operator is looking
  // so watchers on /remote see a live viewport indicator on the panorama.
  // Throttled and delta-gated — orientation changes continuously but only
  // meaningful movement is worth a packet.
  const GAZE_INTERVAL_MS = 100;
  const GAZE_MIN_DELTA_DEGREES = 0.5;
  // resend a still camera every ~2s so late-joining watchers get a packet
  const GAZE_KEEPALIVE_TICKS = 20;
  let lastYaw = Number.NaN;
  let lastPitch = Number.NaN;
  let ticksSinceSend = 0;

  window.setInterval(() => {
    const cameraEl = document.querySelector("a-camera") as
      | (Element & {
          getAttribute: (name: string) => unknown;
          components?: { camera?: { camera?: { fov: number; aspect: number } } };
        })
      | null;
    if (!cameraEl) {
      return;
    }
    const rotation = cameraEl.getAttribute("rotation") as {
      x: number;
      y: number;
    } | null;
    if (!rotation) {
      return;
    }
    const yaw = rotation.y;
    const pitch = rotation.x;
    ticksSinceSend += 1;
    if (
      Math.abs(yaw - lastYaw) < GAZE_MIN_DELTA_DEGREES &&
      Math.abs(pitch - lastPitch) < GAZE_MIN_DELTA_DEGREES &&
      ticksSinceSend < GAZE_KEEPALIVE_TICKS
    ) {
      return;
    }
    lastYaw = yaw;
    lastPitch = pitch;
    ticksSinceSend = 0;

    const threeCamera = cameraEl.components?.camera?.camera;
    host.send({
      type: "gaze",
      yaw,
      pitch,
      fov: threeCamera?.fov ?? 80,
      aspect: threeCamera?.aspect ?? window.innerWidth / window.innerHeight,
      rows: fictionRows(cameraEl),
    });
  }, GAZE_INTERVAL_MS);
}

type AngularBox = {
  yaw: number;
  pitch: number;
  width: number;
  height: number;
};

type FictionRow = AngularBox & {
  kind: "link" | "heading" | "text" | "audio" | "start" | "item";
  label: string;
};

/**
 * The fiction panel projected row by row: each child of `#fiction` (heading,
 * text plate, one entity per link button, audio controls) becomes a labeled
 * viewer-relative angular box, so the remote can redraw the card a watcher
 * can steer by ("point up to the next row"). World-anchored, so rows only
 * move when a render moves them — but they ride the gaze packet because
 * that's the channel watchers already consume.
 */
function fictionRows(cameraEl: Element): FictionRow[] | null {
  const THREE = (window as unknown as { AFRAME?: { THREE?: unknown } }).AFRAME
    ?.THREE as any;
  const fiction = document.getElementById("fiction");
  const cameraObj = (cameraEl as unknown as { object3D?: any }).object3D;
  if (!THREE || !fiction || !cameraObj) {
    return null;
  }

  const cameraPosition = new THREE.Vector3();
  cameraObj.getWorldPosition(cameraPosition);

  const toAngles = (point: any) => {
    const d = point.clone().sub(cameraPosition);
    return {
      yaw: (Math.atan2(-d.x, -d.z) * 180) / Math.PI,
      pitch: (Math.atan2(d.y, Math.hypot(d.x, d.z)) * 180) / Math.PI,
    };
  };

  const angularBoxOf = (obj: any): AngularBox | null => {
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) {
      return null;
    }
    const center = toAngles(box.getCenter(new THREE.Vector3()));
    let minYaw = 0;
    let maxYaw = 0;
    let minPitch = 0;
    let maxPitch = 0;
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          const corner = toAngles(new THREE.Vector3(x, y, z));
          // unwrap corner yaw around the centre so the seam can't split it
          let dy = corner.yaw - center.yaw;
          while (dy > 180) dy -= 360;
          while (dy < -180) dy += 360;
          minYaw = Math.min(minYaw, dy);
          maxYaw = Math.max(maxYaw, dy);
          minPitch = Math.min(minPitch, corner.pitch - center.pitch);
          maxPitch = Math.max(maxPitch, corner.pitch - center.pitch);
        }
      }
    }
    return {
      yaw: center.yaw + (minYaw + maxYaw) / 2,
      pitch: center.pitch + (minPitch + maxPitch) / 2,
      width: maxYaw - minYaw,
      height: maxPitch - minPitch,
    };
  };

  const rows: FictionRow[] = [];
  for (const child of Array.from(fiction.children)) {
    const entity = child as unknown as {
      object3D?: unknown;
      components?: Record<string, { data?: { text?: string; title?: string } }>;
    };
    if (!entity.object3D) {
      continue;
    }
    const box = angularBoxOf(entity.object3D);
    if (!box) {
      continue;
    }
    const components = entity.components ?? {};
    const [kind, label]: [FictionRow["kind"], string] = components[
      "block-link"
    ]
      ? ["link", components["block-link"].data?.text ?? ""]
      : components["block-heading"]
        ? ["heading", components["block-heading"].data?.text ?? ""]
        : components["block-plaintext"]
          ? ["text", ""]
          : components["control-panel"]
            ? ["audio", "audio"]
            : components["title-card"]
              ? ["start", components["title-card"].data?.title ?? "start"]
              : ["item", ""];
    rows.push({ kind, label, ...box });
  }

  return rows.length > 0 ? rows : null;
}
