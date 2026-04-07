import { test, expect } from "@playwright/test";

test("hi-res planetarium screenshot", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  await page.goto("/story/vsatlatarium?view=planetarium");
  await page.waitForSelector("a-scene", { state: "attached" });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "test-results/vsat-planetarium-hires.png" });

  // Drag to see another angle
  const canvas = page.locator(".vsatlatarium__canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("no canvas");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 0; i < 20; i++) {
    await page.mouse.move(box.x + box.width / 2 + i * 12, box.y + box.height / 2 + i * 4, { steps: 1 });
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/vsat-planetarium-hires-dragged.png" });

  await context.close();
});
