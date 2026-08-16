import { test, expect } from "@playwright/test";

import {
  dispatchCanvasMouse,
  enterFocus3D,
  gotoEligibleStory,
  projectSelector,
} from "./vsatlatariumBoard";

// WebGL-heavy page: allow retries (dev-server load makes first paints slow)
test.describe.configure({ retries: 2 });

// REMOVE verb (M-authoring-3d slice 3, GeomView focus board), both
// flavours: (1) hovering a narrative arc marks it as the current link —
// a chip names it with a Delete that strips the underlying link line(s)
// through the shared write path and the arc disappears; (2) the card
// popover's "− remove" deletes the scene itself after confirmation.
//
// Self-provisioning: adds a probe scene whose content links to an
// existing scene (so the probe owns exactly one arc), and the scene
// removal at the end doubles as cleanup.

const PROBE_TITLE = "E2E Remove Probe";
const PROBE_LABEL = "e2e-remove-probe-link";

test("GeomView focus board: arc delete strips the link line; scene remove deletes the scene", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const storyId = await gotoEligibleStory(page);

  // an existing scene to link to, and its title-derived target
  const targetTitle = await page.evaluate((sid) => {
    for (const el of document.querySelectorAll(
      `.story-cluster[data-story-id="${sid}"] .scene-node`,
    )) {
      const id = el.getAttribute("data-scene-id") ?? "";
      if (!id.endsWith("-hub")) return el.getAttribute("data-scene-title");
    }
    return null;
  }, storyId);
  expect(targetTitle).not.toBeNull();
  const target = targetTitle!.trim().replace(/\s+/g, "-").toLocaleLowerCase();

  const createRes = await page.request.post(`/api/story/${storyId}/scene`, {
    data: {},
  });
  expect(createRes.ok()).toBe(true);
  const probeSceneId: number = (await createRes.json()).id;

  try {
    await page.request.put(
      `/api/story/${storyId}/scene/${probeSceneId}/content`,
      {
        headers: { "content-type": "text/plain" },
        data: `# ${PROBE_TITLE}\n\n[${PROBE_LABEL}](${target})\n`,
      },
    );
    await page.request.post(`/api/story/${storyId}/publish`);
    await page.reload();
    await page.waitForSelector("a-scene", { state: "attached", timeout: 20000 });

    const probeCardSel = `.focus3d-card[data-card-scene="${probeSceneId}"]`;
    await enterFocus3D(page, storyId, probeCardSel);

    // --- flavour 1: hover the probe's arc, chip appears, Delete ----------
    // hunt across the story's arcs: hover each uid's mid segment until the
    // chip names our probe link
    const uids: number[] = await page.evaluate(
      (sid) => [
        ...new Set(
          [...document.querySelectorAll(
            `.arc-segment[data-story-id="${sid}"]`,
          )].map((el) => Number(el.getAttribute("data-arc-uid"))),
        ),
      ],
      storyId,
    );
    let named = false;
    for (const uid of uids.reverse()) {
      // several candidate points per arc — a single sample can project
      // behind the camera or under an overlapping arc bundle
      const points = await page.evaluate((u) => {
        const segs = [...document.querySelectorAll(
          `.arc-segment[data-arc-uid="${u}"]`,
        )] as any[];
        const scene = document.querySelector("a-scene") as any;
        const THREE = (window as any).AFRAME.THREE;
        const wp = new THREE.Vector3();
        const r = document.querySelector(".a-canvas")!.getBoundingClientRect();
        const out: Array<{ x: number; y: number }> = [];
        for (const idx of [Math.floor(segs.length / 2), 6, segs.length - 1 - ((segs.length - 1) % 6)]) {
          const seg = segs[idx];
          if (!seg?.object3D) continue;
          seg.object3D.getWorldPosition(wp);
          const p = wp.clone().project(scene.camera);
          if (p.z > 1) continue;
          out.push({
            x: r.left + ((p.x + 1) / 2) * r.width,
            y: r.top + ((1 - p.y) / 2) * r.height,
          });
        }
        return out;
      }, uid);
      for (const at of points) {
        await page.evaluate((pt) => {
          window.dispatchEvent(new MouseEvent("mousemove", {
            bubbles: true,
            clientX: pt.x,
            clientY: pt.y,
          }));
        }, at);
        await page.waitForTimeout(400);
        const chipText = await page
          .locator(".vsat-focus3d-linkchip span")
          .first()
          .textContent()
          .catch(() => null);
        if (chipText?.includes(PROBE_LABEL) || chipText?.includes(PROBE_TITLE)) {
          named = true;
          break;
        }
      }
      if (named) break;
    }
    expect(named, "hovering never surfaced the probe's arc as current link").toBe(true);

    await page.locator(".vsat-focus3d-linkchip button").click();
    await expect
      .poll(async () => {
        const res = await page.request.get(
          `/api/story/${storyId}/scene/${probeSceneId}`,
        );
        const content: string = (await res.json()).content ?? "";
        return content.includes("](");
      }, { timeout: 15000 })
      .toBe(false);
    expect(await page.locator(".vsat-focus3d-linkchip").count()).toBe(0);

    // now unconnected again → teal frame
    const frameColor = await page.evaluate((sid) => {
      const card = document.querySelector(
        `.focus3d-card[data-card-scene="${sid}"]`,
      );
      return (card?.querySelector("a-plane") as any)?.getAttribute("material")
        ?.color ?? null;
    }, probeSceneId);
    expect(frameColor).toBe("#3fa08f");

    // --- flavour 2: remove the scene itself ------------------------------
    await dispatchCanvasMouse(page, "click", (await projectSelector(page, probeCardSel))!);
    await page.waitForSelector(".vsat-focus__card--float", { timeout: 5000 });
    await page.locator(".vsat-focus__card-verbs button", { hasText: "remove" }).click();
    await page.waitForSelector(".vsat-focus3d-removeform", { timeout: 5000 });
    await page.locator(".vsat-focus3d-removeform [data-save]").click();
    await expect
      .poll(async () => {
        const res = await page.request.get(`/api/story/${storyId}`);
        const scenes: Array<{ id: number }> = (await res.json()).scenes ?? [];
        return scenes.some((s) => s.id === probeSceneId);
      }, { timeout: 15000 })
      .toBe(false);
    expect(await page.locator(probeCardSel).count()).toBe(0);
  } finally {
    // the scene-remove flavour doubles as cleanup; this is the backstop
    // for failures earlier in the test
    await page.request.delete(`/api/story/${storyId}/scene/${probeSceneId}`);
    await page.request.post(`/api/story/${storyId}/publish`);
  }
});
