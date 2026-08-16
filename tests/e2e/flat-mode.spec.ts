import { expect, type Page, test } from "@playwright/test";

// dev-database fixtures: 1137 has mode='2d', the others are mode='360'
const FLAT_STORY = 1137;
const SPHERE_STORY = 1209;
const REGRESSION_STORY = 1133;

async function createProbeScene(page: Page, content: string): Promise<number> {
  const create = await page.request.post(`/api/story/${FLAT_STORY}/scene`, {
    data: {},
  });
  expect(create.ok()).toBe(true);
  const sceneId: number = (await create.json()).id;
  const save = await page.request.put(
    `/api/story/${FLAT_STORY}/scene/${sceneId}/content`,
    {
      headers: { "content-type": "text/plain" },
      data: content,
    },
  );
  expect(save.ok()).toBe(true);
  expect(
    (await page.request.post(`/api/story/${FLAT_STORY}/publish`)).ok(),
  ).toBe(true);
  return sceneId;
}

async function deleteProbeScene(page: Page, sceneId: number) {
  expect(
    (
      await page.request.delete(`/api/story/${FLAT_STORY}/scene/${sceneId}`)
    ).ok(),
  ).toBe(true);
  expect(
    (await page.request.post(`/api/story/${FLAT_STORY}/publish`)).ok(),
  ).toBe(true);
}

async function installProbeImage(page: Page) {
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
  });
}

async function createProbeStory(page: Page): Promise<number> {
  const create = await page.request.post("/api/story");
  expect(create.ok()).toBe(true);
  const match = /\/author\/story\/(\d+)/.exec(create.headers().location ?? "");
  expect(match, "created story response has no story id").not.toBeNull();
  return Number(match?.[1]);
}

test("mode=2d story renders flat by default with no A-Frame", async ({
  page,
}) => {
  await page.goto(`/story/${FLAT_STORY}`);
  await expect(page.locator(".flat-panel")).toBeVisible();
  const aframe = await page.evaluate(() =>
    Boolean((window as unknown as { AFRAME?: unknown }).AFRAME),
  );
  expect(aframe).toBe(false);
  await expect(page.locator("[data-badge]")).toHaveText("2D");
  await page.screenshot({ path: "test-results/flat-default.png" });
});

test("2d story badge toggles flat → poster (2D-in-3D) and back", async ({
  page,
}) => {
  await page.goto(`/story/${FLAT_STORY}?view=flat`);
  await expect(page.locator(".flat-panel")).toBeVisible();

  await page.locator("[data-badge]").click();
  await expect(page.locator("a-scene")).toBeAttached();
  await expect(page.locator("[data-badge]")).toHaveText("3D");
  expect(new URL(page.url()).searchParams.get("view")).toBe("poster");
  // let the poster texture load before the screenshot
  await page.waitForFunction(() =>
    document.querySelector("[data-poster]")?.getAttribute("src"),
  );
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/poster.png" });

  await page.locator("[data-badge]").click();
  await expect(page.locator(".flat-img")).toBeAttached();
  await expect(page.locator("[data-badge]")).toHaveText("2D");
});

test("360 story badge pops from flat into the photosphere, not a poster", async ({
  page,
}) => {
  await page.goto(`/story/${SPHERE_STORY}?view=flat`);
  await expect(page.locator(".flat-panel")).toBeVisible();

  await page.locator("[data-badge]").click();
  await page.waitForURL(/view=360/);
  await expect(page.locator("a-sky")).toBeAttached();
  expect(await page.locator("[data-poster]").count()).toBe(0);
});

test("digit keys hop views: 2 → flat from the photosphere, 3 → back", async ({
  page,
}) => {
  await page.goto(`/story/${SPHERE_STORY}`);
  await expect(page.locator("a-sky")).toBeAttached();
  // give the viewer a moment to establish window.current
  await page.waitForFunction(
    () =>
      (window as unknown as { current?: { scene?: { id?: number } } }).current
        ?.scene?.id,
  );

  await page.keyboard.press("2");
  await page.waitForURL(/view=flat/);
  await expect(page.locator(".flat-panel")).toBeVisible();

  await page.keyboard.press("3");
  await page.waitForURL(/view=360/);
  await expect(page.locator("a-sky")).toBeAttached();
});

test("digit key 2 hops from poster back to flat", async ({ page }) => {
  await page.goto(`/story/${FLAT_STORY}?view=poster`);
  await expect(page.locator("a-scene")).toBeAttached();
  await page.keyboard.press("2");
  await page.waitForURL(/view=flat/);
  await expect(page.locator(".flat-panel")).toBeVisible();
});

test("hotspot markers render on the photo and navigate on click", async ({
  page,
}) => {
  // story 1137's opening scene has the fixture hotspot
  // `[secret passage](a-heading @ 25.1,40.7)`
  await page.goto(`/story/${FLAT_STORY}?view=flat`);
  const marker = page.locator(".flat-hotspot", { hasText: "secret passage" });
  await expect(marker).toBeVisible();
  const sceneBefore = new URL(page.url()).searchParams.get("scene");
  await marker.click();
  await page.waitForFunction(
    (before) => new URL(location.href).searchParams.get("scene") !== before,
    sceneBefore,
  );
});

test("edit mode opens the placement form on photo click", async ({ page }) => {
  const sceneId = await createProbeScene(
    page,
    "# Placement Form Probe\n\nProbe content.\n",
  );
  try {
    await page.goto(
      `/story/${FLAT_STORY}?view=flat&edit=hotspots&scene=${sceneId}`,
    );
    await expect(page.locator("main.flat")).toHaveClass(/flat--editing/);
    await installProbeImage(page);

    // far left-bottom: clear of the floating panel
    const vp = page.viewportSize() ?? { width: 1280, height: 720 };
    await page.mouse.click(vp.width * 0.08, vp.height * 0.85);
    const form = page.locator("[data-hotspot-form]");
    await expect(form).toBeVisible();
    const options = await page.locator("#flat-hotspot-targets option").count();
    expect(options).toBeGreaterThan(0);

    await page.click("[data-form-cancel]");
    await expect(form).toBeHidden();
  } finally {
    await deleteProbeScene(page, sceneId);
  }
});

test("editor mode toggle flips story.mode and back", async ({ page }) => {
  const storyId = await createProbeStory(page);
  try {
    const set2d = await page.request.put(`/api/story/${storyId}/mode`, {
      headers: { "content-type": "text/plain" },
      data: "2d",
    });
    expect(set2d.ok()).toBe(true);
    await page.goto(`/author/story/${storyId}`);
    const toggle = page.locator("button", { hasText: "Mode:" });
    await expect(toggle).toHaveText(/2D/);
    await toggle.click();
    await expect(toggle).toHaveText(/360/);
    await toggle.click();
    await expect(toggle).toHaveText(/2D/);
  } finally {
    expect((await page.request.delete(`/api/story/${storyId}`)).ok()).toBe(
      true,
    );
  }
});

test("edit mode makes the panel text editable and offers + link", async ({
  page,
}) => {
  const sceneId = await createProbeScene(
    page,
    "# Editable Panel Probe\n\nProbe content.\n",
  );
  try {
    await page.goto(
      `/story/${FLAT_STORY}?view=flat&edit=hotspots&scene=${sceneId}`,
    );
    await expect(page.locator("main.flat")).toHaveClass(/flat--editing/);
    const bodyEditable = await page.evaluate(
      () =>
        (document.querySelector("[data-body]") as HTMLElement).contentEditable,
    );
    expect(bodyEditable).not.toBe("false");
    await expect(page.locator(".flat-link--add")).toBeVisible();
  } finally {
    await deleteProbeScene(page, sceneId);
  }
});

test("a persisted @panel directive places the panel", async ({ page }) => {
  const sceneId = await createProbeScene(
    page,
    "# Panel Placement Probe\n\nProbe content.\n\n@panel 25,40\n",
  );
  try {
    await page.goto(`/story/${FLAT_STORY}?view=flat&scene=${sceneId}`);
    await expect(page.locator(".flat-panel")).toBeVisible();
    await installProbeImage(page);
    await page.waitForFunction(
      () =>
        (document.querySelector("[data-panel]") as HTMLElement).style
          .position === "absolute",
    );
    const style = await page.evaluate(() => {
      const panel = document.querySelector("[data-panel]") as HTMLElement;
      return { position: panel.style.position, left: panel.style.left };
    });
    expect(style.position).toBe("absolute");
    expect(style.left).toMatch(/px$/);
  } finally {
    await deleteProbeScene(page, sceneId);
  }
});

test("legacy /story2d/ URLs redirect with params preserved", async ({
  page,
}) => {
  await page.goto(`/story2d/${SPHERE_STORY}?layout=doc&room=QA99`);
  await page.waitForURL(new RegExp(`/story/${SPHERE_STORY}\\?`));
  const url = new URL(page.url());
  expect(url.searchParams.get("view")).toBe("flat");
  expect(url.searchParams.get("layout")).toBe("doc");
  expect(url.searchParams.get("room")).toBe("QA99");
  await expect(page.locator(".flat-panel")).toBeVisible();
});

test("360 story still loads the A-Frame photosphere by default", async ({
  page,
}) => {
  await page.goto(`/story/${REGRESSION_STORY}`);
  await expect(page.locator("a-sky")).toBeAttached();
  const aframe = await page.evaluate(() =>
    Boolean((window as unknown as { AFRAME?: unknown }).AFRAME),
  );
  expect(aframe).toBe(true);
});
