import { test, expect } from "@playwright/test";

// mode='360' fixture story
const STORY = 1209;

// Empirically calibrated equirect mapping (see M-gaze-mirror VERIFY):
// u = (0.8125 - yaw/360) mod 1
const CASES: Array<[number, number]> = [
  [0, 0.8125],
  [90, 0.5625],
  [-90, 0.0625],
];

test("remote gaze indicator tracks the host camera orientation", async ({
  page,
  context,
}) => {
  await page.goto(`/story/${STORY}?room=GZE2E`);
  await page.waitForSelector("a-sky", { state: "attached" });

  const remote = await context.newPage();
  await remote.goto("/remote?room=GZE2E");
  await remote.waitForSelector("[data-headset-img]:not([hidden])", {
    timeout: 15000,
  });

  const setYaw = (deg: number) =>
    page.evaluate((d) => {
      const camera = document.querySelector("a-camera") as unknown as {
        components: {
          "look-controls": { yawObject: { rotation: { y: number } } };
        };
      };
      camera.components["look-controls"].yawObject.rotation.y =
        (d * Math.PI) / 180;
    }, deg);

  // back-compute the image-space fraction u from the indicator's position
  const measureU = () =>
    remote.evaluate(() => {
      const gaze = document.querySelector(
        "[data-headset-gaze]",
      ) as HTMLElement;
      if (gaze.hidden) return null;
      const img = document.querySelector(
        "[data-headset-img]",
      ) as HTMLImageElement;
      const rect = img.getBoundingClientRect();
      const scale = Math.max(
        rect.width / img.naturalWidth,
        rect.height / img.naturalHeight,
      );
      const dw = img.naturalWidth * scale;
      const ox = (rect.width - dw) / 2;
      const cx =
        parseFloat(gaze.style.left) + parseFloat(gaze.style.width) / 2;
      return (cx - ox) / dw;
    });

  for (const [yaw, expectedU] of CASES) {
    await setYaw(yaw);
    // gaze packets: 100ms delta-send + 2s keepalive headroom
    await remote.waitForTimeout(2600);
    const u = await measureU();
    expect(u, `indicator visible after yaw=${yaw}`).not.toBeNull();
    expect(
      Math.abs((u as number) - expectedU),
      `u for yaw=${yaw}`,
    ).toBeLessThan(0.02);
  }

  // the pointing cursor sits at the viewport's centre; the fiction card is
  // projected as labeled rows a watcher can steer by
  const overlays = await remote.evaluate(() => {
    const mid = (sel: string) => {
      const box = document.querySelector(sel) as HTMLElement;
      if (box.hidden) return null;
      return {
        x: parseFloat(box.style.left) + parseFloat(box.style.width) / 2,
        y: parseFloat(box.style.top) + parseFloat(box.style.height) / 2,
      };
    };
    const linkRows = [
      ...document.querySelectorAll(".headset-row--link"),
    ].filter((row) => !(row as HTMLElement).hidden);
    return {
      gaze: mid("[data-headset-gaze]"),
      cursor: mid("[data-headset-cursor]"),
      linkRowLabels: linkRows.map((row) => row.textContent ?? ""),
    };
  });
  expect(overlays.gaze).not.toBeNull();
  expect(overlays.cursor).not.toBeNull();
  expect(Math.abs(overlays.cursor!.x - overlays.gaze!.x)).toBeLessThan(1);
  expect(Math.abs(overlays.cursor!.y - overlays.gaze!.y)).toBeLessThan(1);
  // every labeled link row of the card is drawn (main + ghost per link)
  expect(overlays.linkRowLabels.length).toBeGreaterThan(0);
  expect(overlays.linkRowLabels.every((label) => label.length > 0)).toBe(true);

  // tap-to-enlarge: the coaching view grows the panorama
  const smallHeight = await remote.evaluate(
    () => document.querySelector(".headset-pano")!.getBoundingClientRect().height,
  );
  await remote.locator(".headset-pano").click();
  const bigHeight = await remote.evaluate(
    () => document.querySelector(".headset-pano")!.getBoundingClientRect().height,
  );
  expect(bigHeight).toBeGreaterThan(smallHeight * 1.5);

  await remote
    .locator(".headset-pano")
    .screenshot({ path: "test-results/gaze-indicator.png" });
});
