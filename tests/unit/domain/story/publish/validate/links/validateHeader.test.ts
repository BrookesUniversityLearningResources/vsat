import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ErrorCodes } from "@domain/error/errorCode";
import type { ParsedStory } from "@domain/story/publish/parseStory";
import type { PublishedScene } from "@domain/story/publish/types.js";
import validateHeader from "@domain/story/publish/validate/links/validateHeader.js";
import type { NonEmptyArray } from "@util/nonEmptyArray.js";

describe("validateHeader", () => {
  test(
    "given scenes where the (named) header link is unique across all scenes" +
      " when the header is validated" +
      " then we get back the header 'cos it's valid",
    () => {
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
                  kind: "blockLink",
                  text: "Mark's ::eye:: is caught by a book",
                  link: "thebookshelves",
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
          },
          image: {
            id: 17,
            url: "https://res.cloudinary.com/1-7.jpg",
            thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
          },
        },
        {
          id: 8,
          isOpeningScene: false,
          title: "Second scene",
          link: "second-scene",
          pages: {
            "second-scene-opening": {
              number: 0,
              withinScene: 8,
              link: "second-scene-opening",
              content: [
                {
                  kind: "blockHeading",
                  link: "second-scene-the-big-reveal",
                  text: "Second Scene: The Big Reveal!",
                },
                {
                  kind: "blockPlaintext",
                  text: "Mark entered the Sackler.",
                },
                {
                  kind: "blockLink",
                  text: "Mark's ::eye:: is caught by a book",
                  link: "exit",
                },
              ],
            },
            exit: {
              number: 1,
              link: "exit",
              withinScene: 8,
              content: [
                {
                  kind: "blockHeading",
                  link: "exit",
                  text: "Exiting the second scene",
                },
                {
                  kind: "blockPlaintext",
                  text: "The yawning pit.",
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

      const story: ParsedStory = {
        id: 12,
        title: "Whatever",
        author: { id: 87, name: "Jenny" },
        scenes,
      };

      const result = validateHeader(
        story,
        7,
      )({
        kind: "headerNamed",
        text: "Borgen",
        name: "borgen",
      });

      assert.equal(result.kind, "headerNamed");
    },
  );

  test(
    "given scenes where the (named) header link is not unique to the surrounding scene" +
      " when the header is validated" +
      " then we get back the invalid result",
    () => {
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
          },
          image: {
            id: 17,
            url: "https://res.cloudinary.com/1-7.jpg",
            thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
          },
        },
      ];

      const story: ParsedStory = {
        id: 12,
        title: "Whatever",
        author: { id: 87, name: "Jenny" },
        scenes,
      };

      const result = validateHeader(
        story,
        7,
      )({
        kind: "headerNamed",
        text: "Introduction: The Opening!",
        name: "introduction-the-opening",
      });

      assert.equal(result.kind, "invalid");
      assert.equal(result.errorCode, ErrorCodes.LinkNamesMustBeUnique);
    },
  );

  test(
    "given scenes where the (named) header link" +
      " is unique to the surrounding scene" +
      " but is not unique across all scenes" +
      " when the header is validated" +
      " then we get back the header 'cos it's valid (within the surrounding scene)",
    () => {
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
                  kind: "blockLink",
                  text: "Mark's ::eye:: is caught by a book",
                  link: "thebookshelves",
                },
                {
                  kind: "blockLink",
                  text: "Chat with Lucy",
                  link: "exit", // ⬅️ targets the "local to this scene" exit below
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
            exit: {
              // ⬅️ the target of the earlier link
              number: 2,
              link: "exit",
              withinScene: 7,
              content: [
                {
                  kind: "blockHeading",
                  link: "exit",
                  text: "Exiting the first scene",
                },
                {
                  kind: "blockPlaintext",
                  text: "The yawning pit.",
                },
                {
                  kind: "blockLink",
                  text: "Next scene",
                  link: "second-scene-opening",
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
        {
          id: 8,
          isOpeningScene: false,
          title: "Second scene",
          link: "second-scene",
          pages: {
            "second-scene-opening": {
              number: 0,
              withinScene: 8,
              link: "second-scene-opening",
              content: [
                {
                  kind: "blockHeading",
                  link: "second-scene-the-big-reveal",
                  text: "Second Scene: The Big Reveal!",
                },
                {
                  kind: "blockPlaintext",
                  text: "Mark entered the Sackler.",
                },
                {
                  kind: "blockLink",
                  text: "Mark's ::eye:: is caught by a book",
                  link: "pick-up-book", // ⬅️ targets the "local to this scene" pick-up-book below
                },
              ],
            },
            "pick-up-book": {
              number: 1,
              link: "exit",
              withinScene: 8,
              content: [
                {
                  kind: "blockHeading",
                  link: "exit",
                  text: "Exiting the second scene",
                },
                {
                  kind: "blockPlaintext",
                  text: "The yawning pit.",
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

      const story: ParsedStory = {
        id: 12,
        title: "Whatever",
        author: { id: 87, name: "Jenny" },
        scenes,
      };

      // another scene (ID=8) in this story has an existing pick-up-book link
      // target however, we're using another scene (ID=7) which *doesn't* have
      // an existing pick-up-book link target
      // so, even though the "pick-up-book" link target is not unique within the
      // story as a whole, it is unique within each scene so it's valid
      const result = validateHeader(
        story,
        7,
      )({
        kind: "headerNamed",
        text: "Pick up the book",
        name: "pick-up-book",
      });

      assert.equal(result.kind, "headerNamed");
    },
  );

  test(
    "given a single scene where the (named) header link" +
      " is the same as the link for the scene itself" +
      " when the header is validated" +
      " then we get back the header 'cos it's valid",
    () => {
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
                  kind: "blockLink",
                  text: "Mark's ::eye:: is caught by a book",
                  link: "thebookshelves",
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
          },
          image: {
            id: 17,
            url: "https://res.cloudinary.com/1-7.jpg",
            thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
          },
        },
      ];

      const story: ParsedStory = {
        id: 12,
        title: "Whatever",
        author: { id: 87, name: "Jenny" },
        scenes,
      };

      const result = validateHeader(
        story,
        7,
      )({
        kind: "headerNamed",
        text: "Introduction",
        name: "introduction", // ⬅️ same link as scene's
      });

      assert.equal(result.kind, "headerNamed");
    },
  );
});
