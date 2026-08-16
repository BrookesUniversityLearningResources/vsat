import { expect, type Page, test } from "@playwright/test";

import { dispatchCanvasMouse, gotoEligibleStory } from "./vsatlatariumBoard";

test.describe.configure({ retries: 2 });

type HoverTarget = {
  at: { x: number; y: number };
  sceneTitle: string;
  storyTitle: string;
};

async function marginPickedNode(
  page: Page,
  storyId: string,
  kind: "scene" | "hub",
): Promise<HoverTarget> {
  const target = await page.evaluate(
    ({ storyId, kind }) => {
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
      type Projected = {
        element: Node3D;
        at: { x: number; y: number };
      };
      const scene = document.querySelector("a-scene") as unknown as {
        camera: unknown;
      };
      const canvas = document.querySelector(".a-canvas") as HTMLElement;
      const THREE = (
        window as unknown as {
          AFRAME: { THREE: { Vector3: new () => Vector } };
        }
      ).AFRAME.THREE;
      const rect = canvas.getBoundingClientRect();
      const world = new THREE.Vector3();
      const project = (element: Node3D) => {
        element.object3D.getWorldPosition(world);
        const point = world.clone().project(scene.camera);
        if (point.z > 1) return null;
        return {
          x: rect.left + ((point.x + 1) / 2) * rect.width,
          y: rect.top + ((1 - point.y) / 2) * rect.height,
        };
      };
      const projected = (
        [...document.querySelectorAll(".scene-node")] as Node3D[]
      )
        .filter((element) => element.object3D)
        .map((element) => ({ element, at: project(element) }))
        .filter((entry): entry is Projected => entry.at !== null);
      const candidates = projected.filter(({ element }) => {
        const sceneId = element.getAttribute("data-scene-id") ?? "";
        return (
          element.getAttribute("data-story-id") === storyId &&
          (kind === "hub"
            ? sceneId.endsWith("-hub")
            : !sceneId.endsWith("-hub"))
        );
      });
      let best: (Projected & { margin: number }) | null = null;
      for (const candidate of candidates) {
        const others = projected.filter((entry) => entry !== candidate);
        const margin = others.length
          ? Math.min(
              ...others.map((entry) =>
                Math.hypot(
                  candidate.at.x - entry.at.x,
                  candidate.at.y - entry.at.y,
                ),
              ),
            )
          : Infinity;
        if (!best || margin > best.margin) best = { ...candidate, margin };
      }
      if (!best) return null;
      return {
        at: best.at,
        sceneTitle: best.element.getAttribute("data-scene-title") ?? "",
        storyTitle: best.element.getAttribute("data-story-title") ?? "",
      };
    },
    { storyId, kind },
  );
  expect(target, `no projectable ${kind} node`).not.toBeNull();
  if (!target) throw new Error(`no projectable ${kind} node`);
  return target;
}

async function hoverUntilPanelUpdates(page: Page, target: HoverTarget) {
  await expect
    .poll(
      async () => {
        await dispatchCanvasMouse(page, "mousemove", target.at);
        return {
          scene: await page
            .locator("#vsat-info .vsatlatarium__info-scene")
            .textContent(),
          story: await page
            .locator("#vsat-info .vsatlatarium__info-story")
            .textContent(),
        };
      },
      { timeout: 30_000 },
    )
    .toEqual({ scene: target.sceneTitle, story: target.storyTitle });
}

test("vsatlatarium node hover updates the current info panel", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const storyId = await gotoEligibleStory(page);

  const scene = await marginPickedNode(page, storyId, "scene");
  await hoverUntilPanelUpdates(page, scene);

  const hub = await marginPickedNode(page, storyId, "hub");
  await expect
    .poll(
      async () => {
        await dispatchCanvasMouse(page, "mousemove", hub.at);
        return {
          scene: await page
            .locator("#vsat-info .vsatlatarium__info-scene")
            .textContent(),
          story: await page
            .locator("#vsat-info .vsatlatarium__info-story")
            .textContent(),
        };
      },
      { timeout: 30_000 },
    )
    .toEqual({ scene: "Story hub", story: hub.storyTitle });
});
