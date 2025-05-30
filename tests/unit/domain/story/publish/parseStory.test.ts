import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ErrorCodes } from "@domain/error/errorCode";
import type { PersistentStory } from "@domain/index";
import parseStory, {
  type ParsedStory,
  type ParseStoryFailed,
  type ParseStorySuccess,
} from "@domain/story/publish/parseStory.js";

describe("parseStory", () => {
  test(
    "given a story with one scene of three pages" +
      " when that story is parsed" +
      " then we get a published story with one scene of three pages",
    () => {
      const story: PersistentStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        publishedOn: null,
        scenes: [
          {
            id: 7,
            isOpeningScene: true,
            title: "Introduction",
            content:
              "# Introduction: The Opening!\n\n" +
              "Mark entered the Sackler.\n\n" +
              "To his right are shelves of books.\n\n" +
              "To his left he sees Lucy, his colleague.\n\n" +
              "[Mark's ::eye:: is caught by a book](thebookshelves)\n" +
              "[Chat with Lucy](the erudite colleague)\n\n" +
              "# The Book's Story|thebookshelves\n\n" +
              "There are many valuable books to borrow.\n\n" +
              "# The Erudite Colleague\n\n" +
              "Lucy's knowledge of Akkadian is peerless.\n",
            image: {
              id: 17,
              url: "https://res.cloudinary.com/1-7.jpg",
              thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
            },
          },
        ],
      };

      const expectedStory: ParsedStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        scenes: [
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
        ],
      };

      const result = parseStory(story);

      assert.equal(result.kind, "storyParsed");
      assert.deepStrictEqual(result.story, expectedStory);
    },
  );

  test(
    "given a story with two scenes that are linked" +
      " when that story is parsed" +
      " then we get a published story with those scenes",
    () => {
      const story: PersistentStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        publishedOn: null,
        scenes: [
          {
            id: 7,
            isOpeningScene: true,
            title: "Introduction",
            content:
              "# Introduction: The Opening!\n\n" +
              "Mark entered the Sackler.\n\n" +
              "To his right are shelves of books.\n\n" +
              "To his left he sees Lucy, his colleague.\n\n" +
              "[Mark's eye is caught by a book](in the shelves)\n" + // ⬅️ link to second scene
              "[Chat with Lucy](the erudite colleague)\n\n" +
              "# The Erudite Colleague\n\n" +
              "Lucy's knowledge of Akkadian is peerless.\n",
            image: {
              id: 17,
              url: "https://res.cloudinary.com/1-7.jpg",
              thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
            },
          },
          {
            id: 8,
            isOpeningScene: false,
            title: "In The Shelves", // ⬅️ target from first scene
            content:
              "# In The Shelves\n\n" + "The shelves are dark and foreboding\n",
            image: {
              id: 18,
              url: "https://res.cloudinary.com/1-8.jpg",
              thumbnailUrl: "https://res.cloudinary.com/1-8-thumbnail.jpg",
            },
          },
        ],
      };

      const expectedStory: ParsedStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        scenes: [
          {
            id: 7,
            isOpeningScene: true,
            title: "Introduction",
            link: "introduction",
            pages: {
              "introduction-the-opening": {
                number: 0,
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
                    link: "in-the-shelves",
                  },
                  {
                    kind: "blockLink",
                    text: "Chat with Lucy",
                    link: "the-erudite-colleague",
                  },
                ],
              },
              "the-erudite-colleague": {
                number: 1,
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
          {
            id: 8,
            isOpeningScene: false,
            title: "In The Shelves",
            link: "in-the-shelves",
            pages: {
              "in-the-shelves": {
                number: 0,
                link: "in-the-shelves",
                withinScene: 8,
                content: [
                  {
                    kind: "blockHeading",
                    link: "in-the-shelves",
                    text: "In The Shelves",
                  },
                  {
                    kind: "blockPlaintext",
                    text: "The shelves are dark and foreboding",
                  },
                ],
              },
            },
            image: {
              id: 18,
              url: "https://res.cloudinary.com/1-8.jpg",
              thumbnailUrl: "https://res.cloudinary.com/1-8-thumbnail.jpg",
            },
          },
        ],
      };

      const result = parseStory(story);

      assert.equal(result.kind, "storyParsed");
      assert.deepStrictEqual(result.story, expectedStory);
    },
  );

  test(
    "given a story with plaintext scene content that does not start with a header" +
      " when that story is parsed" +
      " then we get an error about the header",
    () => {
      const story: PersistentStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        publishedOn: null,
        scenes: [
          {
            id: 7,
            isOpeningScene: true,
            title: "Introduction",
            content: "Mark entered the Sackler.\n", // ⬅️ not a header
            image: {
              id: 17,
              url: "https://res.cloudinary.com/1-7.jpg",
              thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
            },
          },
        ],
      };

      const expectedResult: ParseStoryFailed = {
        kind: "storyFailedToParse",
        story,
        errorCode: ErrorCodes.AllScenesMustHaveContent,
        reason:
          'Error parsing scene "Introduction": you must create enough content in the scene for at least one page',
      };

      const result = parseStory(story);

      assert.deepStrictEqual(result, expectedResult);
    },
  );

  test(
    "given a story with link scene content that does not start with a header" +
      " when that story is parsed" +
      " then we get an error about the header",
    () => {
      const story: PersistentStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        publishedOn: null,
        scenes: [
          {
            id: 7,
            isOpeningScene: true,
            title: "Introduction",
            content: "[Gaze in awe](gaze)\n", // ⬅️ not a header
            image: {
              id: 17,
              url: "https://res.cloudinary.com/1-7.jpg",
              thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
            },
          },
        ],
      };

      const expectedResult: ParseStoryFailed = {
        kind: "storyFailedToParse",
        story,
        errorCode: ErrorCodes.AllScenesMustHaveContent,
        reason:
          'Error parsing scene "Introduction": you must create enough content in the scene for at least one page',
      };

      const result = parseStory(story);

      assert.deepStrictEqual(result, expectedResult);
    },
  );

  test(
    "given a story with empty scene content" +
      " when that story is parsed" +
      " then we get an error about the empty scene content",
    () => {
      const story: PersistentStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        publishedOn: null,
        scenes: [
          {
            id: 7,
            isOpeningScene: true,
            title: "Introduction",
            content: "", // ⬅️ empty
            image: {
              id: 17,
              url: "https://res.cloudinary.com/1-7.jpg",
              thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
            },
          },
        ],
      };

      const expectedResult: ParseStoryFailed = {
        kind: "storyFailedToParse",
        story,
        errorCode: ErrorCodes.AllScenesMustHaveContent,
        reason:
          'Error parsing scene "Introduction": you must create enough content in the scene for at least one page',
      };

      const result = parseStory(story);

      assert.deepStrictEqual(result, expectedResult);
    },
  );

  test(
    "given a story with an exit that doesn't link to a known target" +
      " when that story is parsed" +
      " then we get an error about the errant link",
    () => {
      const story: PersistentStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        publishedOn: null,
        scenes: [
          {
            id: 7,
            isOpeningScene: true,
            title: "Introduction",
            content:
              "# Introduction: The Opening!\n\n" +
              "Mark entered the Sackler.\n\n" +
              "To his right are shelves of books.\n\n" +
              "To his left he sees Lucy, his colleague.\n\n" +
              "[Mark's ::eye:: is caught by a book](thebookshelves)\n" +
              "[Chat with Lucy](the peerless colleague)\n\n" + // ⬅️ misnamed link "peerless", should be "erudite"
              "# The Book's Story|thebookshelves\n\n" +
              "There are many valuable books to borrow.\n\n" +
              "# The Erudite Colleague\n\n" +
              "Lucy's knowledge of Akkadian is peerless.\n",
            image: {
              id: 17,
              url: "https://res.cloudinary.com/1-7.jpg",
              thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
            },
          },
        ],
      };

      const expectedStory: ParsedStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        scenes: [
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
                    link: "the-peerless-colleague",
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
        ],
      };

      const expectedResult: ParseStorySuccess = {
        kind: "storyParsed",
        story: expectedStory,
        errors: [
          {
            errorCode: ErrorCodes.MalformedLink,
            reason:
              "One or more of the links in the story don't link to a known target",
          },
        ],
      };

      const result = parseStory(story);

      assert.deepStrictEqual(result, expectedResult);
    },
  );

  test(
    "given a story with an exit that is empty text" +
      " when that story is parsed" +
      " then we get an error about the errant link",
    () => {
      const story: PersistentStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        publishedOn: null,
        scenes: [
          {
            id: 7,
            isOpeningScene: true,
            title: "Introduction",
            content:
              "# Introduction: The Opening!\n\n" +
              "Mark entered the Sackler.\n\n" +
              "To his right are shelves of books.\n\n" +
              "To his left he sees Lucy, his colleague.\n\n" +
              "[Mark's ::eye:: is caught by a book](thebookshelves)\n" +
              "[ ](the erudite colleague)\n\n" + // ⬅️ empty link text
              "# The Book's Story|thebookshelves\n\n" +
              "There are many valuable books to borrow.\n\n" +
              "# The Erudite Colleague\n\n" +
              "Lucy's knowledge of Akkadian is peerless.\n",
            image: {
              id: 17,
              url: "https://res.cloudinary.com/1-7.jpg",
              thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
            },
          },
        ],
      };

      const expectedStory: ParsedStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        scenes: [
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
        ],
      };

      const expectedResult: ParseStorySuccess = {
        kind: "storyParsed",
        story: expectedStory,
        errors: [
          {
            errorCode: ErrorCodes.MalformedLink,
            reason:
              'Error parsing scene "Introduction" at line #9: "Link doesn\'t have any text"',
            line: {
              number: 9,
              text: "[ ](the erudite colleague)",
            },
          },
        ],
      };

      const result = parseStory(story);

      assert.deepStrictEqual(result, expectedResult);
    },
  );

  test(
    "given a story with an exit link target that is empty text" +
      " when that story is parsed" +
      " then we get an error about the errant link",
    () => {
      const story: PersistentStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        publishedOn: null,
        scenes: [
          {
            id: 7,
            isOpeningScene: true,
            title: "Introduction",
            content:
              "# Introduction: The Opening!\n\n" +
              "Mark entered the Sackler.\n\n" +
              "To his right are shelves of books.\n\n" +
              "To his left he sees Lucy, his colleague.\n\n" +
              "[Mark's ::eye:: is caught by a book](thebookshelves)\n" +
              "[The colleague](  )\n\n" + // ⬅️ empty link target
              "# The Book's Story|thebookshelves\n\n" +
              "There are many valuable books to borrow.\n\n" +
              "# The Erudite Colleague\n\n" +
              "Lucy's knowledge of Akkadian is peerless.\n",
            image: {
              id: 17,
              url: "https://res.cloudinary.com/1-7.jpg",
              thumbnailUrl: "https://res.cloudinary.com/1-7-thumbnail.jpg",
            },
          },
        ],
      };

      const expectedStory: ParsedStory = {
        id: 0,
        title: "Mark at the Sackler",
        author: {
          id: 987,
          name: "Mark",
        },
        scenes: [
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
        ],
      };

      const expectedResult: ParseStorySuccess = {
        kind: "storyParsed",
        story: expectedStory,
        errors: [
          {
            errorCode: ErrorCodes.MalformedLink,
            reason:
              'Error parsing scene "Introduction" at line #9: "Link doesn\'t have a target"',
            line: {
              number: 9,
              text: "[The colleague](  )",
            },
          },
        ],
      };

      const result = parseStory(story);

      assert.deepStrictEqual(result, expectedResult);
    },
  );
});
