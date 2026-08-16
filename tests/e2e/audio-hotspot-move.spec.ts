import { expect, test } from "@playwright/test";

import { gotoEligibleStory } from "./vsatlatariumBoard";

test.describe.configure({ retries: 2 });

const PROBE_URL = "https://cdn.example/probe.mp3";

test("Shift-gaze moves one audio hotspot without rewriting its line", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const storyId = await gotoEligibleStory(page);
  const createRes = await page.request.post(`/api/story/${storyId}/scene`, {
    data: {},
  });
  expect(createRes.ok()).toBe(true);
  const sceneId: number = (await createRes.json()).id;
  // gazeToImagePercent(0, 0) is 81.3,50 after its one-decimal rounding.
  const originalLine = `  ![ ambience ]  ( ${PROBE_URL}   @   81.3 ,  50 )`;
  const movedLine = `  ![ ambience ]  ( ${PROBE_URL}   @   72.9 ,  44.4 )`;

  try {
    const contentRes = await page.request.put(
      `/api/story/${storyId}/scene/${sceneId}/content`,
      {
        headers: { "content-type": "text/plain" },
        data: `# Move Audio Probe\n\n${originalLine}\n`,
      },
    );
    expect(contentRes.ok()).toBe(true);
    const publishRes = await page.request.post(`/api/story/${storyId}/publish`);
    expect(publishRes.ok()).toBe(true);

    await page.goto(`/story/${storyId}?view=360&scene=${sceneId}`);
    await page.waitForFunction(
      () => {
        const emitter = document.querySelector(
          "#hotspots [scene-audio-hotspot]",
        ) as Element & { components?: Record<string, unknown> };
        return emitter?.components?.["scene-audio-hotspot"];
      },
      undefined,
      { timeout: 20_000 },
    );
    await page.locator("a-camera").evaluate((element) => {
      const camera = element as Element & {
        components: {
          "look-controls": {
            yawObject: { rotation: { y: number } };
            pitchObject: { rotation: { x: number } };
          };
        };
      };
      camera.components["look-controls"].yawObject.rotation.y = 0;
      camera.components["look-controls"].pitchObject.rotation.x = 0;
    });

    await page.keyboard.down("Shift");
    await expect(page.locator("body")).toHaveClass(
      /audio-hotspot-grab--active/,
    );
    await expect(
      page.getByRole("button", { name: "Release Shift to drop audio marker" }),
    ).toBeVisible();

    await page.locator("a-camera").evaluate((element) => {
      const camera = element as Element & {
        components: {
          "look-controls": {
            yawObject: { rotation: { y: number } };
            pitchObject: { rotation: { x: number } };
          };
        };
      };
      camera.components["look-controls"].yawObject.rotation.y = Math.PI / 6;
      camera.components["look-controls"].pitchObject.rotation.x = Math.PI / 18;
      return new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
    await page.keyboard.up("Shift");

    await expect
      .poll(
        async () => {
          const draft = await page.request.get(
            `/api/story/${storyId}/scene/${sceneId}`,
          );
          return String((await draft.json()).content);
        },
        { timeout: 20_000 },
      )
      .toContain(movedLine);

    const draftRes = await page.request.get(
      `/api/story/${storyId}/scene/${sceneId}`,
    );
    const draft = await draftRes.json();
    expect(String(draft.content)).not.toContain(originalLine);
    expect(String(draft.content)).toContain(movedLine);
  } finally {
    await page.keyboard.up("Shift").catch(() => {});
    await page.request.delete(`/api/story/${storyId}/scene/${sceneId}`);
    await page.request.post(`/api/story/${storyId}/publish`);
  }
});
