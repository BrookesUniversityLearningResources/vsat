import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { PersistentScene } from "@domain/index";
import { parseScene } from "@domain/story/publish/parseStory.js";
import type { PublishedScene } from "@domain/story/publish/types.js";
import validateLinks from "@domain/story/publish/validate/links/validateLinks.js";
import type { NonEmptyArray } from "@util/nonEmptyArray.js";

const sceneWith = (
  audioHotspot: string,
  audio?: PersistentScene["audio"],
): PersistentScene => ({
  id: 7,
  isOpeningScene: true,
  title: "Introduction",
  content: `# Introduction\n${audioHotspot}\n`,
  image: {
    id: 17,
    url: "https://media.example/image.jpg",
    thumbnailUrl: "https://media.example/image-thumb.jpg",
  },
  ...(audio ? { audio } : {}),
});

describe("audio-hotspot publishing", () => {
  test("resolves the audio keyword to the scene audio", () => {
    const result = parseScene(
      sceneWith("![Waves](audio @ 43.5,61.25)", {
        id: 27,
        url: "https://media.example/waves.mp3",
      }),
    );

    assert.equal(result.kind, "sceneParsed");
    assert.deepStrictEqual(result.errors, []);
    assert.deepStrictEqual(result.scene.pages.introduction?.content[1], {
      kind: "blockAudioHotspot",
      text: "Waves",
      src: "https://media.example/waves.mp3",
      x: 43.5,
      y: 61.25,
    });
  });

  test("publishes a null source when the scene has no audio asset", () => {
    const result = parseScene(sceneWith("![Waves](audio @ 43,62)"));

    assert.equal(result.kind, "sceneParsed");
    assert.deepStrictEqual(result.errors, []);
    assert.deepStrictEqual(result.scene.pages.introduction?.content[1], {
      kind: "blockAudioHotspot",
      text: "Waves",
      src: null,
      x: 43,
      y: 62,
    });
  });

  test("publishes the literal source from an explicit URL", () => {
    const result = parseScene(
      sceneWith("![Birds](https://media.example/birds.mp3 @ 10,20)"),
    );

    assert.equal(result.kind, "sceneParsed");
    assert.deepStrictEqual(result.errors, []);
    assert.deepStrictEqual(result.scene.pages.introduction?.content[1], {
      kind: "blockAudioHotspot",
      text: "Birds",
      src: "https://media.example/birds.mp3",
      x: 10,
      y: 20,
    });
  });

  test("does not treat an audio hotspot as a link", () => {
    const result = parseScene(sceneWith("![Waves](audio @ 50,50)"));
    assert.equal(result.kind, "sceneParsed");

    const scenes: NonEmptyArray<PublishedScene> = [result.scene];
    assert.equal(validateLinks(scenes).kind, "linksAreGood");
  });
});
