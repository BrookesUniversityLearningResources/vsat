import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { allLinksIn } from "@domain/story/publish/allLinkables";
import type { PublishedScene } from "@domain/story/publish/types";
import type { NonEmptyArray } from "@util/nonEmptyArray";

describe("allLinksIn", () => {
  test("given a scene with one page" +
    " when we ask for all the links in those scenes" +
    " we get back two links, one for the scene and one for the page", () => {
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

    const links = allLinksIn(scenes);

    assert.deepStrictEqual(
      [...links],
      ["introduction", "introduction-the-opening"],
    );
  });

  test("given a scene with one page" +
    " where the scene's link are identical to the page's link" +
    " when we ask for all the links in those scenes" +
    " we get back one (unique) link", () => {
    const scenes: NonEmptyArray<PublishedScene> = [
      {
        id: 7,
        isOpeningScene: true,
        title: "Introduction",
        link: "introduction",
        pages: {
          introduction: {
            number: 0,
            withinScene: 7,
            link: "introduction",
            content: [
              {
                kind: "blockHeading",
                link: "introduction-the-opening",
                text: "Introduction: The Opening!",
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

    const links = allLinksIn(scenes);

    assert.deepStrictEqual([...links], ["introduction"]);
  });
});
