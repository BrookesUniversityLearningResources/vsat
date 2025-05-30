import { isNonEmptyArray } from "../../../util/nonEmptyArray.js";
import { isPersistentAudio } from "../../audio/types.js";
import { type ErrorCoded, ErrorCodes } from "../../error/errorCode.js";
import { isPersistentImage } from "../../image/types.js";
import type {
  PersistentImage,
  PersistentScene,
  PersistentStory,
} from "../../index.js";
import parse from "./parse/parse.js";
import parseLinkTarget from "./parse/parseLinkTarget.js";
import type { Page, PublishedScene, PublishedStory } from "./types.js";
import validateLinks from "./validate/links/validateLinks.js";

export type ParseStoryFailed = ErrorCoded & {
  kind: "storyFailedToParse";
  story: PersistentStory;
  reason: string;
};

export type ParseSceneFailed = ErrorCoded & {
  kind: "sceneFailedToParse";
  scene: PersistentScene;
  reason: string;
};

export type ParsedStory = Omit<PublishedStory, "createdAt" | "imageUrl">;

export type ParseStorySuccess = {
  kind: "storyParsed";
  story: ParsedStory;
  errors: ReadonlyArray<ParseError>;
};

export type ParseError = ErrorCoded & {
  reason: string;
  line?: {
    text: string;
    number: number;
  };
};

export type ParseStoryResult = ParseStorySuccess | ParseStoryFailed;

export type ParseSceneSuccess = {
  kind: "sceneParsed";
  scene: PublishedScene;
  errors: ReadonlyArray<ParseError>;
};

export type ParseSceneResult = ParseSceneSuccess | ParseSceneFailed;

export function parseScene(scene: PersistentScene): ParseSceneResult {
  const parseErrors: ParseError[] = [];

  if (!isPersistentImage(scene.image)) {
    parseErrors.push({
      errorCode: ErrorCodes.AllScenesMustHaveAnImage,
      reason: `Error parsing scene "${scene.title}": image is missing"`,
    });
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
          parseErrors.push({
            errorCode: ErrorCodes.MalformedLink,
            reason: `Error parsing scene "${scene.title}" at line #${lineNumber}: ${targetResult.reason}`,
            line: {
              number: lineNumber,
              text: line,
            },
          });
        } else {
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
        }

        break;
      }

      case "plaintext": {
        if (!page) {
          parseErrors.push({
            errorCode: ErrorCodes.MustAddHeadingBeforeAddingAParagraph,
            reason: `Error parsing scene "${scene.title}" at line #${lineNumber}: you must create a heading before adding a paragraph`,

            line: {
              number: lineNumber,
              text: line,
            },
          });
        } else {
          page.content.push({
            kind: "blockPlaintext",
            text: result.text,
          });
        }

        break;
      }

      case "link": {
        if (!page) {
          parseErrors.push({
            errorCode: ErrorCodes.MustAddHeadingBeforeAddingALink,
            reason: `Error parsing scene "${scene.title}" at line #${lineNumber}: you must create a heading before adding a link`,

            line: {
              number: lineNumber,
              text: line,
            },
          });
        } else {
          page.content.push({
            kind: "blockLink",
            text: result.text,
            link: result.link,
          });
        }

        break;
      }

      case "error": {
        parseErrors.push({
          errorCode: result.errorCode ?? ErrorCodes.UnableToParseStory,
          reason: `Error parsing scene "${scene.title}" at line #${result.line.number}: "${result.message}"`,
          line: {
            number: lineNumber,
            text: line,
          },
        });

        break;
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
      kind: "sceneFailedToParse",
      scene,
      errorCode: ErrorCodes.AllScenesMustHaveContent,
      reason: `Error parsing scene "${scene.title}": you must create enough content in the scene for at least one page`,
    };
  }

  const sceneLink = parseLinkTarget(scene.title);

  if (sceneLink.kind === "failure") {
    parseErrors.push({
      errorCode: ErrorCodes.MalformedLink,
      reason: `Error parsing scene "${scene.title}": unable to derive link from title because "${sceneLink.reason}"`,
    });
  }

  const publishedScene: PublishedScene = {
    id: scene.id,
    title: scene.title,
    image: (scene.image as PersistentImage) ?? null,
    link: sceneLink.kind === "link" ? sceneLink.link : null,
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

  return {
    kind: "sceneParsed",
    scene: publishedScene,
    errors: parseErrors,
  };
}

function parseStory(story: PersistentStory): ParseStoryResult {
  const parseErrors: ParseError[] = [];
  const publishedScenes: PublishedScene[] = [];

  for (const scene of story.scenes) {
    const parseSceneResult = parseScene(scene);

    switch (parseSceneResult.kind) {
      case "sceneParsed": {
        publishedScenes.push(parseSceneResult.scene);
        parseErrors.push(...parseSceneResult.errors);
        break;
      }

      case "sceneFailedToParse": {
        return {
          kind: "storyFailedToParse",
          story,
          errorCode: parseSceneResult.errorCode,
          reason: parseSceneResult.reason,
        };
      }

      default: {
        ((_: never) => _)(parseSceneResult);
      }
    }
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
    parseErrors.push({
      errorCode: ErrorCodes.MalformedLink,
      reason:
        "One or more of the links in the story don't link to a known target",
    });
  }

  const publishedStory: ParsedStory = {
    id: story.id,
    title: story.title,
    author: story.author,
    scenes: publishedScenes,
  };

  return {
    kind: "storyParsed",
    story: publishedStory,
    errors: parseErrors,
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
