import { expect, test } from "@playwright/test";

import { gotoEligibleStory } from "./vsatlatariumBoard";

test.describe.configure({ retries: 2 });

test("an audio load timeout marks its emitter hollow and red", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const storyId = await gotoEligibleStory(page);
  const missingAudioUrl = new URL(
    "/api/audio-hotspot-definitely-missing.mp3",
    page.url(),
  ).href;
  const createRes = await page.request.post(`/api/story/${storyId}/scene`, {
    data: {},
  });
  expect(createRes.ok()).toBe(true);
  const sceneId: number = (await createRes.json()).id;

  try {
    const contentRes = await page.request.put(
      `/api/story/${storyId}/scene/${sceneId}/content`,
      {
        headers: { "content-type": "text/plain" },
        data: `# Failed Audio Probe\n\n![missing](${missingAudioUrl} @ 50,50)\n`,
      },
    );
    expect(contentRes.ok()).toBe(true);
    expect(
      (await page.request.post(`/api/story/${storyId}/publish`)).ok(),
    ).toBe(true);

    await page.goto(`/story/${storyId}?view=360&scene=${sceneId}`);
    const emitter = page.locator("#hotspots [scene-audio-hotspot]");
    await expect(emitter).toHaveAttribute("data-audio-load-failed", "", {
      timeout: 15_000,
    });
    await expect(emitter).toHaveAttribute("title", "Audio could not be loaded");

    const glyph = emitter.locator("a-troika-text");
    await expect(glyph).toHaveAttribute("color", "#e74c3c");
    await expect(glyph).toHaveAttribute("fill-opacity", "0.18");
    await expect(glyph).toHaveAttribute("title", "Audio could not be loaded");
  } finally {
    await page.request.delete(`/api/story/${storyId}/scene/${sceneId}`);
    await page.request.post(`/api/story/${storyId}/publish`);
  }
});
