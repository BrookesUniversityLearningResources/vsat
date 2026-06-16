import { test, expect } from "@playwright/test";

test("hover works in fullscreen", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  page.on("pageerror", e => console.log("PAGE ERROR:", e.message));
  await page.goto("/story/vsatlatarium?view=planetarium");
  await page.waitForSelector("a-scene", { state: "attached" });
  await page.waitForTimeout(6000);

  // Enter fullscreen
  await page.evaluate(async () => {
    const scene = document.querySelector("a-scene");
    if (scene) await scene.requestFullscreen();
  });
  await page.waitForTimeout(1000);

  // Debug: find a node and check all the values findNearest would use
  const debug = await page.evaluate(() => {
    const scene = document.querySelector("a-scene");
    const cam = scene?.camera;
    const aCanvas = scene?.canvas;
    if (!cam || !aCanvas) return { error: "no cam/canvas" };

    const canvasRect = aCanvas.getBoundingClientRect();
    const vec = new THREE.Vector3();

    // Find a visible node
    for (const el of document.querySelectorAll(".scene-node")) {
      if (!el.object3D) continue;
      el.object3D.getWorldPosition(vec);
      const p = vec.clone().project(cam);
      if (p.z > 1 || p.z < 0) continue;
      const sx = (p.x + 1) * canvasRect.width / 2;
      const sy = (-p.y + 1) * canvasRect.height / 2;
      if (sx > 50 && sx < canvasRect.width - 50 && sy > 50 && sy < canvasRect.height - 50) {
        const clientX = canvasRect.left + sx;
        const clientY = canvasRect.top + sy;

        // Now dispatch a mousemove and see what happens
        window.dispatchEvent(new MouseEvent("mousemove", { clientX, clientY, bubbles: true }));

        const info = document.getElementById("vsat-info")?.innerHTML ?? "";

        return {
          title: el.getAttribute("data-scene-title"),
          canvasRect: { left: canvasRect.left, top: canvasRect.top, w: canvasRect.width, h: canvasRect.height },
          clientX: Math.round(clientX),
          clientY: Math.round(clientY),
          isFullscreen: !!document.fullscreenElement,
          infoAfterDispatch: info.substring(0, 100),
          screenSize: { w: window.innerWidth, h: window.innerHeight },
        };
      }
    }
    return { error: "no visible node" };
  });

  console.log("Debug:", JSON.stringify(debug, null, 2));

  // Also try with Playwright mouse
  if (debug.clientX) {
    await page.mouse.move(debug.clientX, debug.clientY, { steps: 5 });
    await page.waitForTimeout(300);
    const info = await page.locator("#vsat-info").innerHTML();
    console.log("Info after Playwright mouse:", info.substring(0, 100) || "(empty)");
  }

  await page.screenshot({ path: "test-results/vsat-fs-hover.png" });
  await context.close();
});
