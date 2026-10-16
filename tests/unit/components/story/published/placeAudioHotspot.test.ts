import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  canLoadExternalAudio,
  placeAudioHotspot,
  replaceSectionText,
} from "@components/story/published/placeHotspot";

async function withFetch(
  replacement: typeof fetch,
  run: () => Promise<void>,
): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = replacement;
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function placedContent(url?: string): Promise<string> {
  const originalFetch = globalThis.fetch;
  let savedContent = "";
  globalThis.fetch = async (_input, init) => {
    if (!init?.method) {
      return Response.json({ content: "# Shore\nListen.\n" });
    }
    if (init.method === "PUT") {
      savedContent = String(init.body);
      return new Response(null, { status: 200 });
    }
    return Response.json({}, { status: 200 });
  };

  try {
    await placeAudioHotspot({
      storyId: 3,
      sceneId: 7,
      pageNumber: 0,
      label: "Waves",
      ...(url ? { url } : {}),
      x: 25.5,
      y: 75,
    });
    return savedContent;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

describe("placeAudioHotspot", () => {
  test("emits the scene-audio keyword form", async () => {
    const content = await placedContent();

    assert.ok(content.includes("![Waves](audio @ 25.5,75)"));
  });

  test("emits the explicit URL form", async () => {
    const content = await placedContent(" https://media.example/waves.mp3 ");

    assert.ok(
      content.includes("![Waves](https://media.example/waves.mp3 @ 25.5,75)"),
    );
  });

  test("survives later flat-editor fiction changes", () => {
    const content = replaceSectionText(
      "# Shore\nOld words.\n![Waves](audio @ 25,75)\n",
      0,
      "Shore",
      "New words.",
    );

    assert.ok(content.includes("![Waves](audio @ 25,75)"));
  });
});

describe("canLoadExternalAudio", () => {
  test("skips verification for the scene-audio keyword form", async () => {
    let called = false;
    await withFetch(
      async () => {
        called = true;
        return new Response();
      },
      async () => assert.equal(await canLoadExternalAudio(""), true),
    );
    assert.equal(called, false);
  });

  test("accepts an accessible successful HEAD response", async () => {
    await withFetch(
      async (_input, init) => {
        assert.equal(init?.method, "HEAD");
        assert.equal(init?.mode, "cors");
        return new Response(null, { status: 200 });
      },
      async () =>
        assert.equal(
          await canLoadExternalAudio("https://media.example/audio.mp3"),
          true,
        ),
    );
  });

  test("warns when verification throws", async () => {
    await withFetch(
      async () => {
        throw new TypeError("CORS blocked");
      },
      async () =>
        assert.equal(
          await canLoadExternalAudio("https://blocked.example/audio.mp3"),
          false,
        ),
    );
  });
});
