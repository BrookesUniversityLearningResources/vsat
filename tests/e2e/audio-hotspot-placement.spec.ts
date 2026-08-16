import { expect, test } from "@playwright/test";

import { gotoEligibleStory } from "./vsatlatariumBoard";

test.describe.configure({ retries: 2 });

const PROBE_LABEL = "e2e flat ambience";
const PROBE_URL = "https://cdn.example/flat-placement-probe.mp3";

test("the flat placement form writes and renders an audio hotspot", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const storyId = await gotoEligibleStory(page);
  const createRes = await page.request.post(`/api/story/${storyId}/scene`, {
    data: {},
  });
  expect(createRes.ok()).toBe(true);
  const probeSceneId: number = (await createRes.json()).id;

  try {
    const contentRes = await page.request.put(
      `/api/story/${storyId}/scene/${probeSceneId}/content`,
      {
        headers: { "content-type": "text/plain" },
        data: "# Audio Placement Probe\n\nClick-placement probe.\n",
      },
    );
    expect(contentRes.ok()).toBe(true);
    expect(
      (await page.request.post(`/api/story/${storyId}/publish`)).ok(),
    ).toBe(true);

    await page.goto(
      `/story/${storyId}?view=flat&edit=hotspots&scene=${probeSceneId}`,
    );
    await expect(page.locator("main.flat")).toHaveClass(/flat--editing/);

    // New scenes have no image asset. Supply a browser-only image matching
    // the hero aspect so the real cover-geometry click path can be exercised;
    // nothing synthetic is persisted.
    await page.evaluate(async () => {
      const hero = document.querySelector(".flat-hero") as HTMLElement;
      const image = document.querySelector("[data-img]") as HTMLImageElement;
      const rect = hero.getBoundingClientRect();
      const loaded = new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
      });
      image.src = `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}"><rect width="100%" height="100%" fill="#222"/></svg>`,
      )}`;
      image.hidden = false;
      await loaded;

      hero.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          clientX: rect.left + rect.width * 0.2,
          clientY: rect.top + rect.height * 0.8,
        }),
      );
    });

    const form = page.locator("[data-hotspot-form]");
    await expect(form).toBeVisible();
    await form.locator('input[name="kind"][value="audio"]').check();
    await form.locator('input[name="label"]').fill(PROBE_LABEL);
    await form.locator('input[name="audio-url"]').fill(PROBE_URL);
    await form.locator('button[type="submit"]').click();
    const expectedLine = `![${PROBE_LABEL}](${PROBE_URL} @ 20,80)`;
    await expect
      .poll(
        async () => {
          const draftRes = await page.request.get(
            `/api/story/${storyId}/scene/${probeSceneId}`,
          );
          expect(draftRes.ok()).toBe(true);
          const draft: { content: string } = await draftRes.json();
          return draft.content;
        },
        { timeout: 20_000 },
      )
      .toContain(expectedLine);

    await page.goto(`/story/${storyId}?view=360&scene=${probeSceneId}`);
    const emitter = page.locator("#hotspots [scene-audio-hotspot]");
    await expect(emitter).toHaveCount(1, { timeout: 20_000 });
    await expect
      .poll(() =>
        emitter.evaluate((entity) =>
          String(entity.getAttribute("sound")?.src ?? ""),
        ),
      )
      .toContain(PROBE_URL);
  } finally {
    await page.request.delete(`/api/story/${storyId}/scene/${probeSceneId}`);
    await page.request.post(`/api/story/${storyId}/publish`);
  }
});
