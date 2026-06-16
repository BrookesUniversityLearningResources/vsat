import { test } from "@playwright/test";

test("screenshot polished 2D pages", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Manifold (public)
  await page.goto("/story/manifold");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/page-manifold.png" });

  // Stewardship (public)
  await page.goto("/stewardship");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/page-stewardship.png" });

  // Author links (needs auth bypass cookie)
  await page.goto("/author/links");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/page-author-links.png" });

  // Pilot index
  await page.goto("/author/pilot");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/page-pilot.png" });

  await context.close();
});
