import {
  isHeadingBlock,
  isLinkBlock,
} from "@domain/story/publish/support/isBlock";
import { isTitleCardScene } from "../published/aframe/titleCardSceneFor";
import type { Current } from "../published/aframe/types";

/**
 * The "host" side of the remote-control feature.
 *
 * Runs inside the story viewer (the screen being driven — headset second
 * monitor, SimLab projection, etc.). Activates only when the page URL carries a
 * `?room=<code>`; otherwise it does nothing, so normal viewing is unaffected.
 *
 * Responsibilities:
 *  - publish the current scene + its available links to the room (the phone's
 *    "monitor" view), and
 *  - apply `navigate` commands coming back from the phone by re-emitting the
 *    same `linkactivated` event a click would have produced.
 */
type LinkOption = { text: string; link: string };

type StateMessage = {
  type: "state";
  storyTitle: string;
  sceneId: number | undefined;
  sceneTitle: string;
  /** The current page's `# Heading` — the big text the reader sees on screen. */
  heading: string;
  pageNumber: number;
  links: LinkOption[];
};

/**
 * Codes a person may have to read aloud (e.g. from inside a headset), so the
 * alphabet drops easily-confused characters (no 0/O, 1/I/L).
 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(length = 4): string {
  const buffer = new Uint32Array(length);
  window.crypto?.getRandomValues?.(buffer);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const value = buffer[i] || Math.floor(Math.random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[value % CODE_ALPHABET.length];
  }
  return code;
}

function showBadge(code: string): void {
  const badge = document.createElement("div");
  badge.textContent = `Remote: ${code}`;
  badge.style.cssText = [
    "position:fixed",
    "top:0.6rem",
    "right:0.6rem",
    "z-index:10002",
    "padding:0.35rem 0.6rem",
    "border-radius:999px",
    "background:rgba(20,23,28,0.85)",
    "color:#ecf0f1",
    "font:600 0.8rem/1 'Source Sans Pro',system-ui,sans-serif",
    "letter-spacing:0.08em",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(badge);
}

export function startHostController(): void {
  const params = new URLSearchParams(window.location.search);

  // Arming is opt-in: only when the URL carries a `room` param. An empty value
  // (`?room` / `?room=`) means "start a session" — generate a code and pin it
  // into the URL so it can be shared or reloaded.
  if (!params.has("room")) {
    return;
  }

  let room = params.get("room")?.trim() ?? "";
  if (!room) {
    room = generateCode();
    params.set("room", room);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${query}${window.location.hash}`,
    );
  }

  showBadge(room);

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const url = `${protocol}://${window.location.host}/ws/relay?room=${encodeURIComponent(room)}&role=host`;
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  const collectState = (): StateMessage | null => {
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

    // The page heading is what the reader actually reads on the 3D screen, so
    // it's the most recognisable "where am I now" label for the remote.
    const heading = current.page.content.find(isHeadingBlock)?.text ?? "";

    return {
      type: "state",
      storyTitle: current.story?.title ?? "",
      sceneId: current.scene?.id,
      sceneTitle,
      heading,
      pageNumber: current.page.number,
      links,
    };
  };

  const sendState = () => {
    if (socket?.readyState !== WebSocket.OPEN) {
      return;
    }
    const state = collectState();
    if (state) {
      socket.send(JSON.stringify(state));
    }
  };

  const handleMessage = (event: MessageEvent) => {
    let message: { type?: string; link?: unknown };
    try {
      message = JSON.parse(event.data as string);
    } catch {
      return;
    }

    if (message.type === "hello") {
      // A phone just connected and wants the current state.
      sendState();
      return;
    }

    if (message.type === "navigate" && typeof message.link === "string") {
      const storyEl = document.querySelector("[story]") as
        | (Element & { emit?: (name: string, detail: unknown) => void })
        | null;
      if (!storyEl) {
        return;
      }
      if (typeof storyEl.emit === "function") {
        storyEl.emit("linkactivated", message.link);
      } else {
        storyEl.dispatchEvent(
          new CustomEvent("linkactivated", { detail: message.link }),
        );
      }
    }
  };

  // Reconnect if the socket drops (e.g. Heroku dyno cycling, network blip) so
  // the experience stays drivable without a page reload.
  const connect = () => {
    socket = new WebSocket(url);
    socket.addEventListener("open", sendState);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", () => {
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 1000);
    });
    socket.addEventListener("error", () => socket?.close());
  };

  // The story view dispatches this every time it (re)renders a page.
  window.addEventListener("vsat:story-context", sendState);

  connect();
}
