import { expect, test } from "@playwright/test";

const STORY = 1137;

test.describe.configure({ retries: 2 });

test("360 story key hint toggles its control list", async ({ page }) => {
  await page.goto(`/story/${STORY}?view=360`);

  const toggle = page.getByRole("button", { name: "360° keyboard controls" });
  const panel = page.locator("#story-key-hint-list");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("place link hotspot");
  await expect(panel).toContainText("place audio hotspot");
  await expect(panel).toContainText("move story panel");
  await expect(panel).toContainText("switch to flat view");

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
});

test("key hint is limited to the 360 story view", async ({ page }) => {
  await page.goto(`/story/${STORY}?view=flat`);
  await expect(page.locator(".story-key-hint")).toHaveCount(0);
});
