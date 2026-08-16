import { expect, type Page } from "@playwright/test";

// Shared machinery for GeomView focus-board specs (M-authoring-3d slice 3).
// Interactions are dispatched as synthetic MouseEvents at projected node
// coordinates: the canvas pick handlers do their own screen-space math, and
// real pointer input does not land reliably under headless GeomView (see
// the M-authoring-3d testing note).

/** Screen coords of an element's object3D, in the page's coordinate space. */
export const projectSelector = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel) as any;
    if (!el?.object3D) return null;
    const scene = document.querySelector("a-scene") as any;
    const THREE = (window as any).AFRAME.THREE;
    const wp = new THREE.Vector3();
    el.object3D.getWorldPosition(wp);
    const p = wp.clone().project(scene.camera);
    if (p.z > 1) return null;
    const r = document.querySelector(".a-canvas")!.getBoundingClientRect();
    return {
      x: r.left + ((p.x + 1) / 2) * r.width,
      y: r.top + ((1 - p.y) / 2) * r.height,
    };
  }, selector);

export const dispatchCanvasMouse = (
  page: Page,
  type: string,
  at: { x: number; y: number },
) =>
  page.evaluate(
    ({ type, at }) => {
      document.querySelector(".a-canvas")!.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: at.x,
          clientY: at.y,
        }),
      );
    },
    { type, at },
  );

/**
 * Find the first anthology whose GeomView constellation has a story with
 * ≥ 2 scenes; leaves the page on that view and returns the story id.
 */
export const gotoEligibleStory = async (page: Page): Promise<string> => {
  await page.goto("/story/vsatlatarium");
  const anthologyIds = await page.$$eval(".anthology-chip", (chips) =>
    chips
      .map((c) =>
        new URL((c as HTMLAnchorElement).href).searchParams.get("anthology"),
      )
      .filter((id): id is string => id !== null),
  );
  expect(anthologyIds.length).toBeGreaterThan(0);

  for (const anthologyId of anthologyIds) {
    await page.goto(
      `/story/vsatlatarium?anthology=${anthologyId}&view=geomview`,
    );
    await page.waitForSelector("a-scene", { state: "attached", timeout: 45000 });
    await page
      .waitForFunction(
        () => document.querySelectorAll(".scene-node").length > 0,
        undefined,
        { timeout: 45000 },
      )
      .catch(() => undefined);
    const storyId = await page.evaluate(() => {
      for (const cluster of document.querySelectorAll(".story-cluster")) {
        // hub node included in the count, hence > 2 means ≥ 2 scenes
        if (cluster.querySelectorAll(".scene-node").length > 2) {
          return cluster.getAttribute("data-story-id");
        }
      }
      return null;
    });
    if (storyId) return storyId;
  }
  throw new Error("no story with ≥ 2 scenes in any anthology");
};

/**
 * Right-click into the story's 3D focus board and wait until
 * `readySelector` exists. The contextmenu handler picks the nearest node
 * on screen whatever story it belongs to, so the click goes to OUR
 * story's node with the biggest screen margin from every other story's
 * nodes. initInteraction attaches its handlers 500ms after the scene's
 * 'loaded' event, which a headless first paint can stretch well past any
 * fixed wait — so this polls; re-dispatching contextmenu is idempotent.
 */
export const enterFocus3D = async (
  page: Page,
  storyId: string,
  readySelector: string,
) => {
  const hubSel = `.scene-node[data-scene-id="story-${storyId}-hub"]`;
  await page.waitForFunction(
    (sel) => (document.querySelector(sel) as any)?.object3D,
    hubSel,
    { timeout: 45000 },
  );
  const entryAt = await page.evaluate((sid) => {
    const scene = document.querySelector("a-scene") as any;
    const THREE = (window as any).AFRAME.THREE;
    const wp = new THREE.Vector3();
    const r = document.querySelector(".a-canvas")!.getBoundingClientRect();
    const proj = (el: any) => {
      el.object3D.getWorldPosition(wp);
      const p = wp.clone().project(scene.camera);
      if (p.z > 1) return null;
      return {
        x: r.left + ((p.x + 1) / 2) * r.width,
        y: r.top + ((1 - p.y) / 2) * r.height,
      };
    };
    const mine: any[] = [];
    const others: any[] = [];
    for (const el of document.querySelectorAll(".scene-node")) {
      if (!(el as any).object3D) continue;
      const at = proj(el);
      if (!at) continue;
      (el.getAttribute("data-story-id") === String(sid) ? mine : others).push(at);
    }
    let best: any = null;
    for (const m of mine) {
      const margin = others.length
        ? Math.min(...others.map((o) => Math.hypot(m.x - o.x, m.y - o.y)))
        : Infinity;
      if (!best || margin > best.margin) best = { x: m.x, y: m.y, margin };
    }
    return best;
  }, storyId);
  expect(entryAt, "no projectable node for the story").not.toBeNull();

  await expect
    .poll(
      async () => {
        await dispatchCanvasMouse(page, "contextmenu", entryAt!);
        return page.locator(readySelector).count();
      },
      { timeout: 30000 },
    )
    .toBeGreaterThan(0);
};
