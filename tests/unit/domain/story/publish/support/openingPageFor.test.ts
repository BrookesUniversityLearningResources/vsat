import assert from "node:assert/strict";
import { describe, test } from "node:test";

import openingPageFor from "@domain/story/publish/support/openingPage.js";
import type { PublishedScene } from "@domain/story/publish/types.js";

describe("openingPageFor", () => {
  test("given a scene with no explicit opening page" +
    " then the page with the lowest pagee number is returned", () => {
    const scene: PublishedScene = {
      id: 7,
      isOpeningScene: false,
      title: "In The Shelves",
      link: "in-the-shelves",
      pages: {
        "introduction-the-opening": {
          number: 100, // ⬅️ large page number for testing
          link: "introduction-the-opening",
          withinScene: 7,
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
              text: "Mark's eye is caught by a book",
              link: "bookshelves",
            },
            {
              kind: "blockLink",
              text: "Chat with Lucy",
              link: "the-erudite-colleague",
            },
          ],
        },
        bookshelves: {
          number: 1, // ⬅️ the lowest page number
          link: "bookshelves",
          withinScene: 7,
          content: [
            {
              kind: "blockHeading",
              link: "bookshelves",
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
        id: 18,
        url: "https://res.cloudinary.com/1-8.jpg",
        thumbnailUrl: "https://res.cloudinary.com/1-8-thumbnail.jpg",
      },
    };

    const page = openingPageFor(scene);

    assert.equal(page.link, "bookshelves");
  });
});
