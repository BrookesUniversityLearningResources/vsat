import { expect, type Page } from "@playwright/test";

// Shared machinery for VSATLATARIUM GeomView specs. Interactions are
// dispatched as synthetic MouseEvents at projected node coordinates: the
// canvas pick handlers do their own screen-space math, and real pointer
// input does not land reliably under headless GeomView.

export const dispatchCanvasMouse = (
  page: Page,
  type: string,
  at: { x: number; y: number },
) =>
  page.evaluate(
    ({ type, at }) => {
      document.querySelector(".a-canvas")!.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: at.x,
          clientY: at.y,
        }),
      );
    },
    { type, at },
  );

/**
 * Find the first anthology whose GeomView constellation has a story with
 * ≥ 2 scenes; leaves the page on that view and returns the story id.
 */
export const gotoEligibleStory = async (page: Page): Promise<string> => {
  await page.goto("/story/vsatlatarium");
  const anthologyIds = await page.$$eval(".anthology-chip", (chips) =>
    chips
      .map((c) =>
        new URL((c as HTMLAnchorElement).href).searchParams.get("anthology"),
      )
      .filter((id): id is string => id !== null),
  );
  expect(anthologyIds.length).toBeGreaterThan(0);

  for (const anthologyId of anthologyIds) {
    await page.goto(
      `/story/vsatlatarium?anthology=${anthologyId}&view=geomview`,
    );
    await page.waitForSelector("a-scene", { state: "attached", timeout: 45000 });
    await page
      .waitForFunction(
        () => document.querySelectorAll(".scene-node").length > 0,
        undefined,
        { timeout: 45000 },
      )
      .catch(() => undefined);
    const storyId = await page.evaluate(() => {
      for (const cluster of document.querySelectorAll(".story-cluster")) {
        // hub node included in the count, hence > 2 means ≥ 2 scenes
        if (cluster.querySelectorAll(".scene-node").length > 2) {
          return cluster.getAttribute("data-story-id");
        }
      }
      return null;
    });
    if (storyId) return storyId;
  }
  throw new Error("no story with ≥ 2 scenes in any anthology");
};
