import { test, expect } from "@playwright/test";

test("hover over story title text highlights hub node", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  page.on("pageerror", e => console.log("PAGE ERROR:", e.message));
  await page.goto("/story/vsatlatarium?view=planetarium");
  await page.waitForSelector("a-scene", { state: "attached" });
  await page.waitForTimeout(6000);

  // Debug: check the hover entries
  const debug = await page.evaluate(() => {
    const scene = document.querySelector("a-scene");
    const cam = scene?.camera;
    const aCanvas = scene?.canvas;
    if (!cam || !aCanvas) return { error: "no cam/canvas" };
    const rect = aCanvas.getBoundingClientRect();
    const vec = new THREE.Vector3();
    const proj = new THREE.Vector3();
    const hw = rect.width / 2;
    const hh = rect.height / 2;

    // Check structure of story-clusters
    const clusters = document.querySelectorAll(".story-cluster");
    const clusterInfo = [];
    for (const cluster of Array.from(clusters).slice(0, 3)) {
      const hubNode = cluster.querySelector(".scene-node");
      const hubTitle = hubNode?.getAttribute("data-scene-title") ?? "none";

      // Find troika-text children of cluster (not inside scene-node)
      const titleTexts = [];
      for (const child of cluster.children) {
        if (child.classList?.contains("scene-node")) continue;
        if (child.classList?.contains("cluster-wireframe")) continue;
        if (child.classList?.contains("dome-wireframe")) continue;
        const tag = child.tagName;
        const hasTroika = child.hasAttribute("troika-text");
        const hasText = child.tagName === "A-TEXT";
        const hasObj = !!child.object3D;
        titleTexts.push({ tag, hasTroika, hasText, hasObj });

        // Project position
        if (child.object3D) {
          child.object3D.getWorldPosition(vec);
          proj.copy(vec).project(cam);
          if (proj.z < 1) {
            const sx = (proj.x + 1) * hw;
            const sy = (-proj.y + 1) * hh;
            titleTexts[titleTexts.length - 1].screenPos = `${Math.round(sx)}, ${Math.round(sy)}`;
            titleTexts[titleTexts.length - 1].clientPos = `${Math.round(rect.left + sx)}, ${Math.round(rect.top + sy)}`;
          }
        }
      }

      clusterInfo.push({ hubTitle, childCount: cluster.children.length, titleTexts });
    }

    return { clusterCount: clusters.length, clusterInfo };
  });

  console.log("Debug:", JSON.stringify(debug, null, 2));

  // Find a story title's screen position and try hovering it
  const titleTarget = await page.evaluate(() => {
    const scene = document.querySelector("a-scene");
    const cam = scene?.camera;
    const aCanvas = scene?.canvas;
    if (!cam || !aCanvas) return null;
    const rect = aCanvas.getBoundingClientRect();
    const vec = new THREE.Vector3();
    const proj = new THREE.Vector3();
    const hw = rect.width / 2;
    const hh = rect.height / 2;

    for (const cluster of document.querySelectorAll(".story-cluster")) {
      for (const child of cluster.children) {
        if (child.classList?.contains("scene-node")) continue;
        if (!child.hasAttribute("troika-text") && child.tagName !== "A-TEXT") continue;
        if (!child.object3D) continue;

        child.object3D.getWorldPosition(vec);
        proj.copy(vec).project(cam);
        if (proj.z > 1 || proj.z < 0) continue;
        const sx = (proj.x + 1) * hw;
        const sy = (-proj.y + 1) * hh;
        if (sx > 50 && sx < rect.width - 50 && sy > 50 && sy < rect.height - 50) {
          const hubNode = cluster.querySelector(".scene-node");
          return {
            storyTitle: hubNode?.getAttribute("data-scene-title") ?? "unknown",
            clientX: Math.round(rect.left + sx),
            clientY: Math.round(rect.top + sy),
          };
        }
      }
    }
    return null;
  });

  console.log("Title target:", titleTarget);

  if (titleTarget) {
    await page.mouse.move(titleTarget.clientX, titleTarget.clientY, { steps: 5 });
    await page.waitForTimeout(300);
    const info = await page.locator("#vsat-info").innerHTML();
    console.log("Info after hovering title:", info.substring(0, 120) || "(empty)");
  }

  await page.screenshot({ path: "test-results/vsat-texthover.png" });
  await context.close();
});
