import { isNonEmptyArray } from "../../../util/nonEmptyArray.js";
import { isPersistentAudio } from "../../audio/types.js";
import { type ErrorCoded, ErrorCodes } from "../../error/errorCode.js";
import { isPersistentImage } from "../../image/types.js";
import type { PersistentStory } from "../../index.js";
import parse from "./parse/parse.js";
import parseLinkTarget from "./parse/parseLinkTarget.js";
import type {
  NotionallyPublishedStory,
  Page,
  PublishedScene,
  PublishedStory,
} from "./types.js";
import validateLinks from "./validate/links/validateLinks.js";

export type ParseStoryFailed = ErrorCoded & {
  kind: "storyFailedToParse";
  story: PersistentStory;
  reason: string;
};

export type ParseStorySuccess = {
  kind: "storyParsed";
  story: PublishedStory;
};

export type ParseStoryResult = ParseStorySuccess | ParseStoryFailed;

function parseStory(story: NotionallyPublishedStory): ParseStoryResult {
  const publishedScenes: PublishedScene[] = [];

  for (const scene of story.scenes) {
    const sceneLink = parseLinkTarget(scene.title);

    if (sceneLink.kind === "failure") {
      return {
        kind: "storyFailedToParse",
        story,
        errorCode: ErrorCodes.MalformedLink,
        reason: `Error parsing scene "${scene.title}": unable to derive link from title because "${sceneLink.reason}"`,
      };
    }

    if (!isPersistentImage(scene.image)) {
      return {
        kind: "storyFailedToParse",
        story,
        errorCode: ErrorCodes.AllScenesMustHaveAnImage,
        reason: `Error parsing scene "${scene.title}": image is missing"`,
      };
    }

    const pages: Page[] = [];

    const lines = scene.content
      .trim()
      .split("\n")
      .map((line) => line.trim());

    let page: Page | undefined;

    for (let lineNumber = 0; lineNumber < lines.length; ++lineNumber) {
      const line = lines[lineNumber];

      if (!line) {
        continue;
      }

      const result = parse(line, lineNumber);

      switch (result.kind) {
        case "emptyLine":
        case "nothing": {
          break;
        }

        case "headerNamed":
        case "headerAnonymous": {
          // add any existing page to the list of pages we're accumulating
          if (page) {
            pages.push(page);
          }

          // and start a new page
          const targetResult = parseLinkTarget(
            result.kind === "headerNamed"
              ? result.name
              : result.text.toLowerCase().replace(/[^a-z0-9 ]+/gi, ""),
          );

          if (targetResult.kind === "failure") {
            return {
              kind: "storyFailedToParse",
              story,
              errorCode: ErrorCodes.MalformedLink,
              reason: `Error parsing scene "${scene.title}" at line #${lineNumber}: ${targetResult.reason}`,
            };
          }

          page = {
            number: pages.length,
            link: targetResult.link,
            withinScene: scene.id,
            content: [
              {
                kind: "blockHeading",
                link: targetResult.link,
                text: result.text,
              },
            ],
          };

          break;
        }

        case "plaintext": {
          if (!page) {
            return {
              kind: "storyFailedToParse",
              story,
              errorCode: ErrorCodes.MustAddHeadingBeforeAddingAParagraph,
              reason: `Error parsing scene "${scene.title}" at line #${lineNumber}: you must create a heading before adding a paragraph`,
            };
          }

          page.content.push({
            kind: "blockPlaintext",
            text: result.text,
          });

          break;
        }

        case "link": {
          if (!page) {
            return {
              kind: "storyFailedToParse",
              story,
              errorCode: ErrorCodes.MustAddHeadingBeforeAddingALink,
              reason: `Error parsing scene "${scene.title}" at line #${lineNumber}: you must create a heading before adding a link`,
            };
          }

          page.content.push({
            kind: "blockLink",
            text: result.text,
            link: result.link,
          });

          break;
        }

        case "error": {
          return {
            kind: "storyFailedToParse",
            story,
            errorCode: result.errorCode ?? ErrorCodes.UnableToParseStory,
            reason: `Error parsing scene "${scene.title}" at line #${result.line.number}: "${result.message}"`,
          };
        }

        default:
          ((_: never) => _)(result);
      }
    }

    // add any existing page to the list of pages we're accumulating
    if (page) {
      pages.push(page);
    }

    if (pages.length === 0) {
      return {
        kind: "storyFailedToParse",
        story,
        errorCode: ErrorCodes.AllScenesMustHaveContent,
        reason: `Error parsing scene "${scene.title}": you must create enough content in the scene for at least one page`,
      };
    }

    const publishedScene: PublishedScene = {
      id: scene.id,
      title: scene.title,
      image: scene.image,
      link: sceneLink.link,
      isOpeningScene: scene.isOpeningScene,

      ...((audio) => (isPersistentAudio(audio) ? { audio } : {}))(scene.audio),

      pages: pages.reduce(
        (allPages, page) => {
          allPages[page.link] = page;

          return allPages;
        },
        {} as PublishedScene["pages"],
      ),
    };

    publishedScenes.push(publishedScene);
  }

  if (!isNonEmptyArray(publishedScenes)) {
    return {
      kind: "storyFailedToParse",
      story,
      errorCode: ErrorCodes.MustHaveAtLeastOneScene,
      reason: "No scenes",
    };
  }

  const linksResult = validateLinks(publishedScenes);

  if (linksResult.kind === "linksAreBad") {
    return {
      kind: "storyFailedToParse",
      story,
      errorCode: ErrorCodes.MalformedLink,
      reason:
        "One or more of the links in the story don't link to a known target",
    };
  }

  const publishedStory: PublishedStory = {
    id: story.id,
    title: story.title,
    author: story.author,
    publishedOn: story.publishedOn,
    scenes: publishedScenes,
  };

  return {
    kind: "storyParsed",
    story: publishedStory,
  };
}

export default parseStory;

export function isParseStorySuccess(
  result: ParseStoryResult,
): result is ParseStorySuccess {
  return result.kind === "storyParsed";
}

export function isParseStoryFailed(
  result: ParseStoryResult,
): result is ParseStoryFailed {
  return result.kind === "storyFailedToParse";
}
