import { test, expect } from "@playwright/test";

test("vsatlatarium selections update panel", async ({ page }) => {
  await page.goto("/story/vsatlatarium");

  const first = page.locator(".vsatlatarium__story").first();
  const second = page.locator(".vsatlatarium__story").nth(1);

  await expect(first).toBeVisible();
  await expect(second).toBeVisible();

  const firstTitle = (await first.textContent())?.trim();
  const secondTitle = (await second.textContent())?.trim();

  await first.click();
  await second.click();

  const from = page.locator("#vsat-from");
  const to = page.locator("#vsat-to");

  if (firstTitle) {
    await expect(from).toHaveText(firstTitle);
  }
  if (secondTitle) {
    await expect(to).toHaveText(secondTitle);
  }
});
