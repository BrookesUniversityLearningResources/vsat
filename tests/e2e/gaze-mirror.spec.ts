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

  await remote
    .locator(".headset-pano")
    .screenshot({ path: "test-results/gaze-indicator.png" });
});
