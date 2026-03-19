import { test, expect } from "@playwright/test";

test("accept toggles to accepted and back to proposed", async ({ page, request }) => {
  const rationale = `QA toggle ${Date.now()}`;

  const create = await request.post("/api/story/1011/links", {
    data: {
      toStoryId: 1014,
      linkType: "thematic",
      rationale,
    },
  });

  expect(create.ok()).toBeTruthy();
  const created = await create.json();
  const linkId = created.id;

  await page.goto("/author/links");

  const card = page.locator(".link-card", { hasText: rationale });
  await expect(card).toBeVisible();

  const status = card.locator(".link-status");
  const accept = card.getByRole("button", { name: "Accept" });

  await expect(status).toHaveText(/proposed/i);
  const voteResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/links/${linkId}/vote`) &&
    response.request().method() === "POST" &&
    response.status() === 200,
  );
  await accept.click();
  const voteRes = await voteResponse;
  const voteBody = await voteRes.json();
  expect(voteBody.link.status).toMatch(/accepted/i);
  await page.reload();
  await expect(status).toHaveText(/accepted/i);

  const unvoteResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/links/${linkId}/vote`) &&
    response.request().method() === "POST" &&
    response.status() === 200,
  );
  await accept.click();
  const unvoteRes = await unvoteResponse;
  const unvoteBody = await unvoteRes.json();
  expect(unvoteBody.link.status).toMatch(/proposed/i);
  await page.reload();
  await expect(status).toHaveText(/proposed/i);
});
