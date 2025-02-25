import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { PersistentScene, PersistentStory } from "@domain/index.js";
import imageUrlFor from "@domain/story/publish/imageUrlFor.js";

describe("imageUrlFor", () => {
  test("given a story with no scenes returns null", () => {
    const story = stubStory({ scenes: [] });

    assert.equal(imageUrlFor(story), null);
  });

  test("given a story with one scene having no image returns null", () => {
    const story = stubStory({
      scenes: [
        stubScene({
          image: null,
        }),
      ],
    });

    assert.equal(imageUrlFor(story), null);
  });

  test("given a story with one scene having an image" +
    " returns the thumbnail URL of that singular scene's image", () => {
    const story = stubStory({
      scenes: [
        stubScene({
          image: {
            url: "http://foo.png",
            thumbnailUrl: "http://success.png",
          },
        }),
      ],
    });

    assert.equal(imageUrlFor(story), "http://success.png");
  });

  test("given a story with two scenes -- neither is marked as the opening scene -- both having an image" +
    " returns the thumbnail URL of the first scene's image", () => {
    const story = stubStory({
      scenes: [
        stubScene({
          image: {
            url: "http://foo.png",
            thumbnailUrl: "http://success.png",
          },
        }),
        stubScene({
          image: {
            url: "http://foo.png",
            thumbnailUrl: "http://failure.png",
          },
        }),
      ],
    });

    assert.equal(imageUrlFor(story), "http://success.png");
  });

  test("given a story with two scenes -- where the second is marked as the opening scene -- both having an image" +
    " returns the thumbnail URL of the second scene's image", () => {
    const story = stubStory({
      scenes: [
        stubScene({
          image: {
            url: "http://foo.png",
            thumbnailUrl: "http://failure.png",
          },
        }),
        stubScene({
          isOpeningScene: true, // ⬅️
          image: {
            url: "http://foo.png",
            thumbnailUrl: "http://success.png",
          },
        }),
      ],
    });

    assert.equal(imageUrlFor(story), "http://success.png");
  });
});

function stubStory(overrides?: Partial<PersistentStory>): PersistentStory {
  return {
    id: 0,
    author: {
      id: 1,
      name: "Borges",
    },
    title: "Imaginary Beasts",
    publishedOn: null,
    scenes: [],
    ...overrides,
  };
}

function stubScene(overrides?: Partial<PersistentScene>): PersistentScene {
  return {
    id: 3,
    content: "",
    title: "Introduction",
    isOpeningScene: false,
    ...overrides,
  };
}
