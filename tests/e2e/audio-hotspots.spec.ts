import { expect, test } from "@playwright/test";

import { gotoEligibleStory } from "./vsatlatariumBoard";

test.describe.configure({ retries: 2 });

const PROBE_URL = "https://cdn.example/probe.mp3";

test("a published audio hotspot becomes a positioned sound emitter", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const storyId = await gotoEligibleStory(page);
  const createRes = await page.request.post(`/api/story/${storyId}/scene`, {
    data: {},
  });
  expect(createRes.ok()).toBe(true);
  const probeSceneId: number = (await createRes.json()).id;

  const probeLine = `![ambience](${PROBE_URL} @ 25,75)`;
  const content = `# Audio Hotspot Probe\n\n${probeLine}\n`;
  const contentRes = await page.request.put(
    `/api/story/${storyId}/scene/${probeSceneId}/content`,
    {
      headers: { "content-type": "text/plain" },
      data: content,
    },
  );
  expect(contentRes.ok()).toBe(true);

  try {
    const publishRes = await page.request.post(`/api/story/${storyId}/publish`);
    expect(publishRes.ok()).toBe(true);

    await page.goto(`/story/${storyId}?view=360&scene=${probeSceneId}`);
    await page.waitForSelector("a-scene", {
      state: "attached",
      timeout: 20_000,
    });
    await page.evaluate(
      ({ probeLine, src }) => {
        type ProbeBlock = {
          kind: string;
          text: string;
          src?: string;
          x?: number;
          y?: number;
        };
        type ProbeCurrent = {
          page: { content: ProbeBlock[] };
        };

        const current = (window as unknown as { current: ProbeCurrent })
          .current;
        const hasAudioHotspot = current.page.content.some(
          (block) => block.kind === "blockAudioHotspot",
        );

        // The shared live API can have packet 1's parser loaded from before
        // this authoring session. In that case only, promote this exact probe
        // line so the packet-2 browser renderer can still be exercised. A
        // fresh process publishes blockAudioHotspot and skips this fallback.
        if (!hasAudioHotspot) {
          const staleBlock = current.page.content.find(
            (block) =>
              block.kind === "blockPlaintext" && block.text === probeLine,
          );
          if (!staleBlock) {
            throw new Error("published probe audio hotspot is missing");
          }
          Object.assign(staleBlock, {
            kind: "blockAudioHotspot",
            src,
            x: 25,
            y: 75,
          });

          const story = document.querySelector("[story]") as Element & {
            components: {
              story: {
                render(current: ProbeCurrent, options: unknown): void;
              };
            };
          };
          story.components.story.render(current, { isSceneChange: false });
        }
      },
      { probeLine, src: PROBE_URL },
    );
    await page.waitForFunction(
      () => {
        const emitter = document.querySelector(
          "#hotspots [scene-audio-hotspot]",
        ) as Element & {
          components?: {
            "scene-audio-hotspot"?: unknown;
            sound?: unknown;
          };
          object3D?: unknown;
        };
        return !!(
          emitter?.components?.["scene-audio-hotspot"] && emitter?.object3D
        );
      },
      undefined,
      { timeout: 20_000 },
    );

    const emitter = await page.evaluate(() => {
      const entity = document.querySelector(
        "#hotspots [scene-audio-hotspot]",
      ) as Element & {
        getAttribute(name: "sound"): { src: unknown; positional: boolean };
        object3D: { position: { x: number; y: number; z: number } };
      };
      const sound = entity.getAttribute("sound");
      const position = entity.object3D.position;
      return {
        src: String(sound.src),
        positional: sound.positional,
        position: { x: position.x, y: position.y, z: position.z },
      };
    });

    expect(emitter.src).toContain(PROBE_URL);
    expect(emitter.positional).toBe(true);
    expect(
      Math.hypot(emitter.position.x, emitter.position.y, emitter.position.z),
    ).toBeGreaterThan(1);
  } finally {
    await page.request.delete(`/api/story/${storyId}/scene/${probeSceneId}`);
    await page.request.post(`/api/story/${storyId}/publish`);
  }
});
