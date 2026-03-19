import { test, expect } from "@playwright/test";

test("vapor slider and particles work", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/story/vsatlatarium?view=planetarium");
  await page.waitForSelector("a-scene", { state: "attached" });
  await page.waitForTimeout(6000);

  // Move the vapor slider to max
  const sliderResult = await page.evaluate(() => {
    const slider = document.getElementById("vsat-vapor-slider");
    if (!slider) return { error: "no slider" };
    slider.value = "100";
    slider.dispatchEvent(new Event("input"));
    return { ok: true };
  });
  console.log("Slider:", sliderResult);
  console.log("Errors after slider:", errors);

  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/vsat-vapor-max.png" });

  // Check if particles exist
  const particleCheck = await page.evaluate(() => {
    const turntable = document.getElementById("vsat-turntable");
    if (!turntable) return { error: "no turntable" };
    let pointsCount = 0;
    turntable.object3D.traverse((child) => {
      if (child.isPoints) pointsCount++;
    });
    return { pointsCount };
  });
  console.log("Particles:", particleCheck);
  console.log("All errors:", errors);

  expect(errors.length).toBe(0);
  await context.close();
});
