import { test, expect } from "@playwright/test";

import {
  dispatchCanvasMouse,
  enterFocus3D,
  gotoEligibleStory,
  projectSelector,
} from "./vsatlatariumBoard";

// WebGL-heavy page: allow retries (dev-server load makes first paints slow)
test.describe.configure({ retries: 2 });

// CONNECT verb (M-authoring-3d slice 3, GeomView focus board): popover's
// "⤳ connect" → click target card → label form → an ordinary
// [label](target) line lands in the source scene's draft and the arc is
// drawn without a reload.
//
// Data-driven: adds its OWN probe scene to a discovered story so the
// created arc is guaranteed new — and deletes the probe scene afterwards,
// so the spec leaves the database as it found it.

const PROBE_TITLE = "E2E Connect Probe";
const PROBE_LABEL = "e2e-connect-check";

test("GeomView focus board: connect writes the link line and draws the arc", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const storyId = await gotoEligibleStory(page);

  // --- add the probe scene (guarantees the connect creates a NEW arc) -----
  const createRes = await page.request.post(`/api/story/${storyId}/scene`, {
    data: {},
  });
  expect(createRes.ok()).toBe(true);
  const probeSceneId: number = (await createRes.json()).id;
  // routeCreateScene ignores `source` today, so stamp the probe content in a
  // second step — this is also what makes the scene recognisable as ours
  const stampRes = await page.request.put(
    `/api/story/${storyId}/scene/${probeSceneId}/content`,
    {
      headers: { "content-type": "text/plain" },
      data: `# ${PROBE_TITLE}\n\nProbe scene created by vsatlatarium-connect.spec.ts; safe to delete.`,
    },
  );
  expect(stampRes.ok()).toBe(true);

  try {
    await page.request.post(`/api/story/${storyId}/publish`);
    await page.reload();
    await page.waitForSelector("a-scene", { state: "attached", timeout: 20000 });

    const probeCardSel = `.focus3d-card[data-card-scene="${probeSceneId}"]`;
    await enterFocus3D(page, storyId, probeCardSel);

    const targetSceneId = await page.evaluate((probe) => {
      const card = [...document.querySelectorAll(".focus3d-card")].find(
        (el) => el.getAttribute("data-card-scene") !== String(probe),
      );
      return card?.getAttribute("data-card-scene") ?? null;
    }, probeSceneId);
    expect(targetSceneId).not.toBeNull();
    const targetCardSel = `.focus3d-card[data-card-scene="${targetSceneId}"]`;

    const segsFor = () =>
      page.evaluate(
        (sid) =>
          document.querySelectorAll(`.arc-segment[data-story-id="${sid}"]`)
            .length,
        storyId,
      );
    const segsBefore = await segsFor();

    // --- Esc cancels an in-flight connect without writing -----------------
    await dispatchCanvasMouse(page, "click", (await projectSelector(page, probeCardSel))!);
    await page.waitForSelector(".vsat-focus__card--float", { timeout: 5000 });
    await page.locator(".vsat-focus__card-verbs button").click();
    await page.waitForSelector(".vsat-focus3d-hint", { timeout: 5000 });
    await page.keyboard.press("Escape");
    expect(await page.locator(".vsat-focus3d-hint").count()).toBe(0);
    expect(
      await page.locator(".focus3d-card").count(),
      "Esc during connect must not collapse the focus board",
    ).toBeGreaterThan(0);

    // --- the connect itself ----------------------------------------------
    await dispatchCanvasMouse(page, "click", (await projectSelector(page, probeCardSel))!);
    await page.waitForSelector(".vsat-focus__card--float", { timeout: 5000 });
    await page.locator(".vsat-focus__card-verbs button").click();
    await page.waitForSelector(".vsat-focus3d-hint", { timeout: 5000 });
    await dispatchCanvasMouse(page, "click", (await projectSelector(page, targetCardSel))!);
    await page.waitForSelector(".vsat-focus3d-connect", { timeout: 5000 });
    await page.locator(".vsat-focus3d-connect input").fill(PROBE_LABEL);
    await page.locator(".vsat-focus3d-connect [data-save]").click();
    await page.waitForSelector(".vsat-focus3d-connect", {
      state: "detached",
      timeout: 15000,
    });

    // arc drawn live, no reload
    expect(await segsFor()).toBeGreaterThan(segsBefore);

    // exactly one new [label](target) line, in the probe scene's draft
    const draftRes = await page.request.get(
      `/api/story/${storyId}/scene/${probeSceneId}`,
    );
    expect(draftRes.ok()).toBe(true);
    const content: string = (await draftRes.json()).content ?? "";
    const linkLines = content
      .split("\n")
      .filter((line) => line.includes(`[${PROBE_LABEL}](`));
    expect(linkLines).toHaveLength(1);
  } finally {
    // leave the database as we found it
    await page.request.delete(`/api/story/${storyId}/scene/${probeSceneId}`);
    await page.request.post(`/api/story/${storyId}/publish`);
  }
});
