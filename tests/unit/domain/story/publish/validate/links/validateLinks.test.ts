import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { PublishedScene } from "@domain/story/publish/types.js";
import validateLinks, {
  type BadLink,
} from "@domain/story/publish/validate/links/validateLinks.js";
import type { NonEmptyArray } from "@util/nonEmptyArray.js";

describe("validateLinks", () => {
  test("given scenes where all links link to targets that exist" +
    " when the links are validated" +
    " then we get back the scenes we passed in and no bad links found", () => {
    const scenes: NonEmptyArray<PublishedScene> = [
      {
        id: 7,
        isOpeningScene: true,
        title: "Introduction",
        link: "introduction",
        pages: {
          "introduction-the-opening": {
            number: 0,
            withinScene: 7,
            link: "introduction-the-opening",
            content: [
              {
                kind: "blockHeading",
                link: "introduction-the-opening",
                text: "Introduction: The Opening!",
              },
              {
                kind: "blockPlaintext",
                text: "Mark entered the Sackler.",
              },
              {
                kind: "blockPlaintext",
                text: "To his right are shelves of books.",
              },
              {
                kind: "blockPlaintext",
                text: "To his left he sees Lucy, his colleague.",
              },
              {
                kind: "blockLink",
                text: "Mark's ::eye:: is caught by a book",
                link: "thebookshelves",
              },
              {
                kind: "blockLink",
                text: "Chat with Lucy",
                link: "the-erudite-colleague",
              },
            ],
          },
          thebookshelves: {
            number: 1,
            link: "thebookshelves",
            withinScene: 7,
            content: [
              {
                kind: "blockHeading",
                link: "thebookshelves",
                text: "The Book's Story",
              },
              {
                kind: "blockPlaintext",
                text: "There are many valuable books to borrow.",
              },
            ],
          },
          "the-erudite-colleague": {
            number: 2,
            link: "the-erudite-colleague",
            withinScene: 7,
            content: [
              {
                kind: "blockHeading",
                link: "the-erudite-colleague",
                text: "The Erudite Colleague",
              },
              {
                kind: "blockPlaintext",
                text: "Lucy's knowledge of Akkadian is peerless.",
              },
            ],
          },
        },
        image: {
          id: 17,
          url: "https://res.cloudinary.com/1-7.jpg",
          thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
        },
      },
    ];

    const result = validateLinks(scenes);

    assert.equal(result.kind, "linksAreGood");
    assert.deepStrictEqual(result.scenes, scenes);
  });

  test("given a story containing a link that doesn't target anything" +
    " when the links are validated" +
    " then we get an error identifying the bad link", () => {
    const sceneWithBadLink: PublishedScene = {
      id: 7,
      isOpeningScene: true,
      title: "Introduction",
      link: "introduction",
      pages: {
        "introduction-the-opening": {
          number: 0,
          withinScene: 7,
          link: "introduction-the-opening",
          content: [
            {
              kind: "blockHeading",
              link: "introduction-the-opening",
              text: "Introduction: The Opening!",
            },
            {
              kind: "blockLink",
              text: "Chat with Lucy",
              link: "the-chat", // ⬅️ no target
            },
          ],
        },
      },
      image: {
        id: 17,
        url: "https://res.cloudinary.com/1-7.jpg",
        thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
      },
    };

    const scenes: NonEmptyArray<PublishedScene> = [sceneWithBadLink];

    const expectedBadLinks: BadLink[] = [
      {
        nonExistentTarget: "the-chat",
        scene: sceneWithBadLink,
      },
    ];

    const result = validateLinks(scenes);

    assert.equal(result.kind, "linksAreBad");
    assert.deepStrictEqual(result.badLinks, expectedBadLinks);
  });
});
