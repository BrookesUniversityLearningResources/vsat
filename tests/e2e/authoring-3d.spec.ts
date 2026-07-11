import { test, expect } from "@playwright/test";

// story 1137's opening scene has two flat-authored hotspot fixtures:
// [secret passage](a-heading @ 25.1,40.7) and [tree](look-here @ 84.5,53.9)
const STORY = 1137;

async function enterStory(page: import("@playwright/test").Page) {
  await page.goto(`/story/${STORY}?view=360`);
  await page.waitForSelector("a-sky", { state: "attached" });
  await page.waitForFunction(() => (window as any).current?.page);
  // step off the synthetic title card into the opening scene
  await page.evaluate(() => {
    const current = (window as any).current;
    const link = current.page.content.find(
      (b: { kind: string }) => b.kind === "blockLink",
    )?.link;
    (document.querySelector("[story]") as any).emit("linkactivated", link);
  });
  await page.waitForFunction(
    () => document.querySelectorAll("#hotspots [scene-hotspot]").length > 0,
    undefined,
    { timeout: 10000 },
  );
}

test("flat-authored hotspots render as markers in the photosphere", async ({
  page,
}) => {
  await enterStory(page);

  const markers = await page.evaluate(() =>
    [...document.querySelectorAll("#hotspots [scene-hotspot]")].map((el) => ({
      data: (el as any).getAttribute("scene-hotspot"),
      position: (el as any).getAttribute("position"),
    })),
  );
  expect(markers.length).toBeGreaterThanOrEqual(2);

  // the marker direction follows the calibrated mapping:
  // x=25.1 → yaw=(0.8125−0.251)·360=202.14°, y=40.7 → pitch=16.74°, r=9
  const secret = markers.find((m) => m.data.text === "secret passage");
  expect(secret).toBeTruthy();
  const yaw = ((0.8125 - 25.1 / 100) * 360 * Math.PI) / 180;
  const pitch = ((0.5 - 40.7 / 100) * 180 * Math.PI) / 180;
  expect(
    Math.abs(secret!.position.x - -Math.sin(yaw) * Math.cos(pitch) * 9),
  ).toBeLessThan(0.05);
  expect(Math.abs(secret!.position.y - Math.sin(pitch) * 9)).toBeLessThan(
    0.05,
  );
  expect(
    Math.abs(secret!.position.z - -Math.cos(yaw) * Math.cos(pitch) * 9),
  ).toBeLessThan(0.05);
});

test("clicking a photosphere hotspot navigates to its target", async ({
  page,
}) => {
  await enterStory(page);
  const before = await page.evaluate(() => (window as any).current.scene.id);
  await page.evaluate(() => {
    (
      document.querySelector("#hotspots [scene-hotspot]") as any
    ).emit("click");
  });
  await page.waitForFunction(
    (prev) => (window as any).current.scene.id !== prev,
    before,
  );
});

test("pressing h opens the place-at-gaze form with percent coordinates", async ({
  page,
}) => {
  await enterStory(page);
  await page.keyboard.press("h");
  const form = page.locator("[data-gaze-hotspot-form]");
  await expect(form).toBeVisible();
  await expect(form.locator("strong")).toContainText("%");
  // the target picker offers the story's known anchors
  expect(
    await form.locator("#gaze-hotspot-targets option").count(),
  ).toBeGreaterThan(0);
  await form.locator("[data-cancel]").click();
  await expect(form).toBeHidden();
});
