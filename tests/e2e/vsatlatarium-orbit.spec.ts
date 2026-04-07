import { test, expect } from "@playwright/test";

test("planetarium view renders and survives drag", async ({ page }) => {
  await page.goto("/story/vsatlatarium?view=planetarium");
  await page.waitForSelector("a-scene", { state: "attached" });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: "test-results/vsat-planetarium-initial.png" });

  const nodesBefore = await page.locator(".scene-node").count();
  console.log("Planetarium scene nodes:", nodesBefore);
  expect(nodesBefore).toBeGreaterThan(0);

  // Drag to look around
  const canvas = page.locator(".vsatlatarium__canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas not found");
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 0; i < 15; i++) {
    await page.mouse.move(cx + i * 8, cy + i * 3, { steps: 1 });
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  await page.waitForTimeout(500);

  await page.screenshot({ path: "test-results/vsat-planetarium-after-drag.png" });

  const nodesAfter = await page.locator(".scene-node").count();
  expect(nodesAfter).toBe(nodesBefore);

  // Reset
  await page.click("#vsat-reset-cam");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/vsat-planetarium-after-reset.png" });
});

test("geomview mode still works", async ({ page }) => {
  await page.goto("/story/vsatlatarium?view=geomview");
  await page.waitForSelector("a-scene", { state: "attached" });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: "test-results/vsat-geomview.png" });

  const nodes = await page.locator(".scene-node").count();
  console.log("GeomView scene nodes:", nodes);
  expect(nodes).toBeGreaterThan(0);
});
