import { test, expect } from "@playwright/test";

test("hover shows gold ring", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  page.on("pageerror", e => console.log("PAGE ERROR:", e.message));
  await page.goto("/story/vsatlatarium?view=planetarium");
  await page.waitForSelector("a-scene", { state: "attached" });
  await page.waitForTimeout(6000);

  // Find visible node and hover
  const target = await page.evaluate(() => {
    const scene = document.querySelector("a-scene");
    const cam = scene?.camera;
    const aCanvas = scene?.canvas;
    if (!cam || !aCanvas) return null;
    const rect = aCanvas.getBoundingClientRect();
    const vec = new THREE.Vector3();
    for (const el of document.querySelectorAll(".scene-node")) {
      if (!el.object3D) continue;
      el.object3D.getWorldPosition(vec);
      const p = vec.clone().project(cam);
      if (p.z > 1 || p.z < 0) continue;
      const sx = (p.x + 1) * rect.width / 2;
      const sy = (-p.y + 1) * rect.height / 2;
      if (sx > 50 && sx < rect.width - 50 && sy > 50 && sy < rect.height - 50) {
        return {
          title: el.getAttribute("data-scene-title"),
          clientX: Math.round(rect.left + sx),
          clientY: Math.round(rect.top + sy),
        };
      }
    }
    return null;
  });

  await page.mouse.move(target.clientX, target.clientY, { steps: 10 });
  await page.waitForTimeout(500);

  // Check the highlight element's computed style
  const ringState = await page.evaluate(() => {
    const ring = document.querySelector(".vsatlatarium__highlight");
    if (!ring) return { error: "no ring element" };
    const style = ring.style;
    const computed = window.getComputedStyle(ring);
    return {
      display: style.display,
      left: style.left,
      top: style.top,
      width: style.width,
      height: style.height,
      computedDisplay: computed.display,
      computedBorder: computed.border,
      computedBoxShadow: computed.boxShadow,
      parentTag: ring.parentElement?.tagName,
      parentClass: ring.parentElement?.className,
    };
  });

  console.log("Ring state:", JSON.stringify(ringState, null, 2));
  await page.screenshot({ path: "test-results/vsat-interact-ring.png" });
  await context.close();
});
