import { expect, test } from "@playwright/test";

import { gotoEligibleStory } from "./vsatlatariumBoard";

test("accept toggles a self-provisioned link to accepted and back", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const toStoryId = Number(await gotoEligibleStory(page));
  const rationale = `QA toggle ${Date.now()}`;
  let probeStoryId: number | null = null;

  try {
    const probeStory = await page.request.post("/api/story");
    expect(probeStory.ok()).toBe(true);
    const location = probeStory.headers().location;
    const match = /\/author\/story\/(\d+)/.exec(location ?? "");
    expect(match, "created story response has no story id").not.toBeNull();
    probeStoryId = Number(match?.[1]);
    expect(Number.isFinite(probeStoryId)).toBe(true);

    const create = await page.request.post(`/api/story/${probeStoryId}/links`, {
      data: {
        toStoryId,
        linkType: "thematic",
        rationale,
      },
    });
    expect(create.ok()).toBe(true);
    const created: { id: number } = await create.json();
    const linkId = created.id;

    await page.goto("/author/links");
    const card = page.locator(".link-card", { hasText: rationale });
    await expect(card).toBeVisible();
    const status = card.locator(".link-status");
    const accept = card.getByRole("button", { name: "Accept" });

    await expect(status).toHaveText(/proposed/i);
    const voteResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/links/${linkId}/vote`) &&
        response.request().method() === "POST" &&
        response.status() === 200,
    );
    await accept.click();
    const voteBody = await (await voteResponse).json();
    expect(voteBody.link.status).toMatch(/accepted/i);
    await page.reload();
    await expect(status).toHaveText(/accepted/i);

    const unvoteResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/links/${linkId}/vote`) &&
        response.request().method() === "POST" &&
        response.status() === 200,
    );
    await accept.click();
    const unvoteBody = await (await unvoteResponse).json();
    expect(unvoteBody.link.status).toMatch(/proposed/i);
    await page.reload();
    await expect(status).toHaveText(/proposed/i);
  } finally {
    if (probeStoryId !== null) {
      const cleanup = await page.request.delete(`/api/story/${probeStoryId}`);
      expect(cleanup.ok()).toBe(true);
    }
  }
});
