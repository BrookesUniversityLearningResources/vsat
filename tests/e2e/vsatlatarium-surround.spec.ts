import { expect, test } from "@playwright/test";

test.describe.configure({ retries: 2 });

test("planetarium surround creates and removes positional story emitters", async ({
  page,
}) => {
  test.setTimeout(120_000);

  await page.goto("/story/vsatlatarium?view=planetarium");
  const toggle = page.locator("#vsat-toggle-surround");
  await expect(toggle).toBeVisible({ timeout: 20_000 });
  await page.waitForFunction(
    () =>
      !!(window as unknown as { vsatlatariumClientData?: unknown })
        .vsatlatariumClientData,
  );

  const expectedCount = await page.evaluate(() => {
    const data = (
      window as unknown as {
        vsatlatariumClientData: {
          clusters: Array<{ audioUrl: string | null }>;
        };
      }
    ).vsatlatariumClientData;
    return data.clusters.filter((cluster) => !!cluster.audioUrl).length;
  });
  console.log(`VSATLATARIUM clusters with audio: ${expectedCount}`);

  await expect(page.locator(".vsat-surround-emitter")).toHaveCount(0);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const emitters = page.locator(".vsat-surround-emitter");
  await expect(emitters).toHaveCount(expectedCount);

  if (expectedCount > 0) {
    const attributes = await emitters.evaluateAll((entities) =>
      entities.map((entity) => {
        const sound = entity.getAttribute("sound") as unknown as {
          positional: boolean;
          volume: number;
        };
        const position = entity.getAttribute("position") as unknown as {
          x: number;
          y: number;
          z: number;
        };
        return { sound, position };
      }),
    );
    for (const { sound, position } of attributes) {
      expect(sound.positional).toBe(true);
      expect(sound.volume).toBeCloseTo(0.4);
      expect(Math.hypot(position.x, position.y, position.z)).toBeGreaterThan(1);
    }
  }

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(emitters).toHaveCount(0);

  const anthology = new URL(page.url()).searchParams.get("anthology");
  await page.goto(
    `/story/vsatlatarium?view=geomview${anthology ? `&anthology=${anthology}` : ""}`,
  );
  await expect(page.locator("#vsat-toggle-surround")).toHaveCount(0);
});
