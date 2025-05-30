import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { PersistentScene } from "@domain/index";
import { parseScene } from "@domain/story/publish/parseStory.js";
import type { PublishedScene } from "@domain/story/publish/types";
import { ErrorCodes } from "@domain/error/errorCode";

describe("parseScene", () => {
  test(
    "given a single scene with a malformed header" +
      " when that scene is parsed" +
      " then we get a parse result that contains the error",
    () => {
      const scene: PersistentScene = {
        id: 7,
        isOpeningScene: true,
        title: "Introduction",
        content:
          "# Introduction\n\n" +
          "Mark entered the Sackler.\n\n" +
          "# Shelving|\n\n" + // ⬅️ malformed header; ends with (empty) pipe
          "The bookshelves were dark.\n",
        image: {
          id: 17,
          url: "https://res.cloudinary.com/1-7.jpg",
          thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
        },
      };

      const expectedScene: PublishedScene = {
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
                link: "introduction",
                text: "Introduction",
              },
              {
                kind: "blockPlaintext",
                text: "Mark entered the Sackler.",
              },
              {
                kind: "blockPlaintext",
                text: "The bookshelves were dark.",
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

      const result = parseScene(scene);

      assert.equal(result.kind, "sceneParsed");
      assert.deepStrictEqual(result.scene, expectedScene);
      assert.deepStrictEqual(result.errors, [
        {
          errorCode: ErrorCodes.ParseErrorHeaderNeedsName,
          reason:
            'Error parsing scene "Introduction" at line #4: "An anonymous header must not end with a |"',
          line: {
            number: 4,
            text: "# Shelving|",
          },
        },
      ]);
    },
  );
});
