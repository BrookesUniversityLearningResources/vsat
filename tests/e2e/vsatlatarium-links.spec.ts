import { test, expect } from "@playwright/test";

// WebGL-heavy page: allow retries (dev-server load makes first paints slow)
test.describe.configure({ retries: 2 });

// Fixture (dev DB): link 17 is scene-to-scene — from "homage" (a scene of
// Sinking City) to "Border Control" (a scene of Dangerous Commutes), both
// in the "Cities & Public Space" anthology. Regression for the bug where
// the from-scene was silently dropped and the arc appeared to come from
// nowhere the author had selected.
test("scene-to-scene links render arcs between the actual scene nodes", async ({
  page,
}) => {
  await page.goto("/story/vsatlatarium?anthology=1");
  await page.waitForSelector("a-scene", { state: "attached", timeout: 20000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.arc-segment[data-arc-id="17"]').length > 0,
    undefined,
    { timeout: 20000 },
  );

  const check = await page.evaluate(() => {
    const nodePos = (sceneTitle: string) => {
      const node = [...document.querySelectorAll(".scene-node")].find(
        (el) => el.getAttribute("data-scene-title") === sceneTitle,
      ) as any;
      if (!node?.object3D) return null;
      const v = new (window as any).AFRAME.THREE.Vector3();
      node.object3D.getWorldPosition(v);
      return v;
    };
    const homage = nodePos("homage");
    const border = nodePos("Border Control");
    const segments = [
      ...document.querySelectorAll('.arc-segment[data-arc-id="17"]'),
    ] as any[];
    if (!segments.length || !homage || !border) {
      return { segments: segments.length, ok: false };
    }
    const worldPos = (el: any) => {
      const v = new (window as any).AFRAME.THREE.Vector3();
      el.object3D.getWorldPosition(v);
      return v;
    };
    const first = worldPos(segments[0]);
    const last = worldPos(segments[segments.length - 1]);
    const nearEither = (point: any) =>
      first.distanceTo(point) < 3 || last.distanceTo(point) < 3;
    return {
      segments: segments.length,
      ok: nearEither(homage) && nearEither(border),
    };
  });

  expect(check.segments).toBeGreaterThan(0);
  expect(check.ok).toBe(true);
});
