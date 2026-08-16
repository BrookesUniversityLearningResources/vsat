import assert from "node:assert/strict";
import { describe, test } from "node:test";

import shouldAttachSceneAudio from "@components/story/published/aframe/shouldAttachSceneAudio";
import type {
  AudioHotspotBlock,
  PublishedScene,
} from "@domain/story/publish/types";

const sceneWith = (
  block: AudioHotspotBlock,
  audioUrl = "https://media.example/scene.mp3",
): PublishedScene => ({
  id: 7,
  title: "Shore",
  isOpeningScene: true,
  link: "shore",
  image: null,
  audio: { id: 27, url: audioUrl },
  pages: {
    shore: {
      number: 0,
      link: "shore",
      withinScene: 7,
      content: [{ kind: "blockHeading", text: "Shore", link: "shore" }, block],
    },
  },
});

describe("shouldAttachSceneAudio", () => {
  test("suppresses the bed when a hotspot uses the scene audio", () => {
    const scene = sceneWith({
      kind: "blockAudioHotspot",
      text: "Waves",
      src: "https://media.example/scene.mp3",
      x: 25,
      y: 75,
    });

    assert.equal(shouldAttachSceneAudio(scene), false);
  });

  test("keeps the bed when a hotspot uses another URL", () => {
    const scene = sceneWith({
      kind: "blockAudioHotspot",
      text: "Birds",
      src: "https://media.example/birds.mp3",
      x: 25,
      y: 75,
    });

    assert.equal(shouldAttachSceneAudio(scene), true);
  });

  test("does not attach a bed when the scene has no audio", () => {
    const scene = sceneWith({
      kind: "blockAudioHotspot",
      text: "Unresolved",
      src: null,
      x: 25,
      y: 75,
    });
    const sceneWithoutAudio = { ...scene, audio: undefined } as PublishedScene;

    assert.equal(shouldAttachSceneAudio(sceneWithoutAudio), false);
  });
});
