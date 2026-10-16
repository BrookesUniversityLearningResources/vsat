import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { modeForScene } from "@components/story/published/sceneView.js";
import { flattenPublishedStory } from "@domain/story/getPublishedStoryInDatabase.js";
import type {
  PublishedScene,
  PublishedStory,
} from "@domain/story/publish/types.js";

const scene = (id: number, mode?: "360" | "2d") =>
  ({ id, title: `Scene ${id}`, mode }) as unknown as PublishedScene;

const mixedStory = {
  id: 1,
  title: "Mixed",
  author: { id: 1, name: "Author" },
  createdAt: new Date(0),
  imageUrl: null,
  mode: "360",
  scenes: [scene(10, "360"), scene(11, "2d"), scene(12)],
} as unknown as PublishedStory;

describe("flattenPublishedStory (VSAT_PHOTOSPHERES=false)", () => {
  test("resolves the story and every scene to 2d", () => {
    const flat = flattenPublishedStory(mixedStory);

    assert.equal(flat.mode, "2d");
    for (const s of flat.scenes) {
      assert.equal(s.mode, "2d");
      // the viewer's scene-to-scene hop agrees, so a scene stored as 360
      // cannot bounce the reader back to the photosphere
      assert.equal(modeForScene(flat, s), "2d");
    }
  });

  test("keeps everything else and leaves the original untouched", () => {
    const flat = flattenPublishedStory(mixedStory);

    assert.equal(flat.title, "Mixed");
    assert.deepEqual(
      flat.scenes.map((s) => s.id),
      [10, 11, 12],
    );
    assert.equal(mixedStory.mode, "360");
    assert.equal(mixedStory.scenes[0].mode, "360");
  });
});
