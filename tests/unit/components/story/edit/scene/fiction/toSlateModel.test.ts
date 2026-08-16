import assert from "node:assert/strict";
import { describe, test } from "node:test";

import getContent from "@components/story/edit/scene/fiction/getContent";
import toSlateModel from "@components/story/edit/scene/fiction/toSlateModel";
import type { PersistentScene } from "@domain/index";

describe("toSlateModel audio hotspots", () => {
  test("round-trips an audio-hotspot line without changing it", () => {
    const content =
      "# Shore | shore\nListen carefully.\n![  Breaking waves  ](AuDiO @ 43.5, 61.25)\n";
    const scene: PersistentScene = {
      id: 7,
      title: "Shore",
      isOpeningScene: true,
      content,
      image: {
        id: 17,
        url: "https://media.example/shore.jpg",
        thumbnailUrl: "https://media.example/shore-thumb.jpg",
      },
      audio: { id: 27, url: "https://media.example/waves.mp3" },
    };

    assert.equal(getContent(toSlateModel(scene)), content);
  });
});
