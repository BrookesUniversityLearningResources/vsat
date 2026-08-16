import { expect, test } from "@playwright/test";

import { enterFocus3D, gotoEligibleStory } from "./vsatlatariumBoard";

// WebGL-heavy page: allow retries (dev-server load makes first paints slow)
test.describe.configure({ retries: 2 });

// M-authoring-3d C1: right-click a story → focus board of editable scene
// cards wired by narrative arcs. Read-only checks (no content mutation).
test("right-clicking a story opens its focus board of scene cards", async ({
  page,
}) => {
  await page.goto("/story/vsatlatarium?anthology=1");
  await page.waitForSelector("a-scene", { state: "attached", timeout: 20000 });
  await page.waitForFunction(
    () => document.querySelectorAll(".scene-node").length > 0,
  );
  await page.waitForTimeout(3000);

  // right-click a story hub that actually projects inside the canvas
  const pos = await page.evaluate(() => {
    type Vector = {
      x: number;
      y: number;
      z: number;
      clone(): Vector;
      project(camera: unknown): Vector;
    };
    type Node3D = Element & {
      object3D: { getWorldPosition(vector: Vector): void };
    };
    const scene = document.querySelector("a-scene") as unknown as {
      camera: unknown;
      canvas: HTMLElement;
    };
    const rect = scene.canvas.getBoundingClientRect();
    const Vector3 = (
      window as unknown as {
        AFRAME: { THREE: { Vector3: new () => Vector } };
      }
    ).AFRAME.THREE.Vector3;
    const v = new Vector3();
    for (const el of document.querySelectorAll(
      ".scene-node",
    ) as NodeListOf<Node3D>) {
      const id = el.getAttribute("data-scene-id") || "";
      if (!id.endsWith("-hub")) continue;
      el.object3D.getWorldPosition(v);
      const p = v.clone().project(scene.camera);
      if (p.z > 1 || p.z < 0) continue;
      const x = rect.left + ((p.x + 1) / 2) * rect.width;
      const y = rect.top + ((1 - p.y) / 2) * rect.height;
      if (
        x > rect.left + 80 &&
        x < rect.right - 80 &&
        y > rect.top + 100 &&
        y < rect.bottom - 80
      ) {
        return { x, y };
      }
    }
    return null;
  });
  expect(pos).not.toBeNull();
  if (!pos) throw new Error("no projectable story hub");
  // retry the right-click: under load the hover index may not be primed yet
  let boardOpen = false;
  for (let attempt = 0; attempt < 3 && !boardOpen; attempt++) {
    await page.mouse.move(pos.x, pos.y);
    await page.waitForTimeout(300);
    await page.mouse.click(pos.x, pos.y, { button: "right" });
    boardOpen = await page
      .waitForSelector(".vsat-focus__card", { timeout: 4000 })
      .then(() => true)
      .catch(() => false);
  }
  expect(boardOpen).toBe(true);
  const cards = page.locator(".vsat-focus__card");
  expect(await cards.count()).toBeGreaterThan(0);
  // cards carry real scene content, not just titles
  const headings = await page.evaluate(() =>
    [...document.querySelectorAll(".vsat-focus__card-heading")]
      .map((el) => el.textContent?.trim() ?? "")
      .filter(Boolean),
  );
  expect(headings.length).toBeGreaterThan(0);

  // clicking a card opens the editor chrome (then cancel — no mutation).
  // dispatchEvent: the facing animation may still be repositioning cards,
  // so a hit-tested click can land on stale coordinates.
  await page.waitForTimeout(1200);
  await cards.first().dispatchEvent("click");
  await page.waitForSelector(".vsat-focus__card--editing [data-save]", {
    timeout: 8000,
  });
  await page.locator(".vsat-focus__card--editing [data-cancel]").click();
  expect(await page.locator(".vsat-focus__card--editing").count()).toBe(0);

  // Esc closes the board
  await page.keyboard.press("Escape");
  expect(await page.locator(".vsat-focus").count()).toBe(0);
});

// GeomView flavour: the cards live IN the 3D space (a-plane + troika
// entities), everything else hidden in-scene — the VR-capable path.
test("right-click in GeomView spawns floating 3D scene cards", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const storyId = await gotoEligibleStory(page);
  await enterFocus3D(page, storyId, ".focus3d-card");

  const cardSceneIds = await page.$$eval(".focus3d-card", (cards) =>
    cards.map((card) => card.getAttribute("data-card-scene")),
  );
  expect(cardSceneIds.length).toBeGreaterThan(0);
  const storySceneIds = await page.$$eval(
    `.story-cluster[data-story-id="${storyId}"] .scene-node[data-db-scene-id]`,
    (nodes) => nodes.map((node) => node.getAttribute("data-db-scene-id")),
  );
  expect(cardSceneIds.every((sceneId) => storySceneIds.includes(sceneId))).toBe(
    true,
  );

  await page.keyboard.press("Escape");
  await expect(page.locator(".focus3d-card")).toHaveCount(0);
});
