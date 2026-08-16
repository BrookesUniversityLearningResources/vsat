import { test, expect } from "@playwright/test";

import { enterFocus3D, gotoEligibleStory } from "./vsatlatariumBoard";

// WebGL-heavy page: allow retries (dev-server load makes first paints slow)
test.describe.configure({ retries: 2 });

// CREATE verb (M-authoring-3d slice 3, GeomView focus board): the focused
// board's "+ scene" pill → title form → the scene exists in the published
// story and appears as a fresh card with the unconnected (teal) frame,
// without a reload. Deletes the created scene afterwards, so the spec
// leaves the database as it found it.

const PROBE_TITLE = "E2E Create Probe";
const TEAL_UNCONNECTED = "#3fa08f";

test("GeomView focus board: + scene creates a published scene and a teal card", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const storyId = await gotoEligibleStory(page);
  await enterFocus3D(page, storyId, ".vsat-focus3d-create");

  const cardsBefore = await page.locator(".focus3d-card").count();
  let createdSceneId: number | null = null;

  try {
    await page.locator(".vsat-focus3d-create").click();
    await page.waitForSelector(".vsat-focus3d-createform", { timeout: 5000 });
    await page.locator(".vsat-focus3d-createform input").fill(PROBE_TITLE);
    await page.locator(".vsat-focus3d-createform [data-save]").click();
    await page.waitForSelector(".vsat-focus3d-createform", {
      state: "detached",
      timeout: 15000,
    });

    // the scene is real: present in the published story
    const pubRes = await page.request.get(`/api/story/${storyId}`);
    expect(pubRes.ok()).toBe(true);
    const scenes: Array<{ id: number; title: string }> =
      (await pubRes.json()).scenes ?? [];
    createdSceneId = scenes.find((s) => s.title === PROBE_TITLE)?.id ?? null;
    expect(createdSceneId, "created scene missing from published story").not.toBeNull();

    // ...and on the board: one more card, ours, teal (unconnected)
    expect(await page.locator(".focus3d-card").count()).toBe(cardsBefore + 1);
    const frameColor = await page.evaluate((sid) => {
      const card = document.querySelector(
        `.focus3d-card[data-card-scene="${sid}"]`,
      );
      return (card?.querySelector("a-plane") as any)?.getAttribute("material")
        ?.color ?? null;
    }, createdSceneId);
    expect(frameColor).toBe(TEAL_UNCONNECTED);
  } finally {
    if (createdSceneId !== null) {
      await page.request.delete(
        `/api/story/${storyId}/scene/${createdSceneId}`,
      );
      await page.request.post(`/api/story/${storyId}/publish`);
    }
  }
});
