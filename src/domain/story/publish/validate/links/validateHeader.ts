import { ErrorCodes, type ErrorCode } from "../../../../error/errorCode.js";
import { allLinksInScene } from "../../allLinkables.js";
import type { HeaderAnonymous, HeaderNamed } from "../../parse/parseTypes.js";
import type { ParsedStory } from "../../parseStory.js";
import deriveLinkTarget, {
  deriveLinkTargetLeniently,
} from "../../support/deriveLinkTarget.js";
import type { LinkTarget, PublishedScene } from "../../types.js";

export type HeaderValidationResult =
  | HeaderNamed
  | HeaderAnonymous
  | HeaderIsInvalid;

export type HeaderIsInvalid = Readonly<{
  kind: "invalid";
  header: HeaderNamed | HeaderAnonymous;
  errorCode: ErrorCode;
  message: string;
}>;

function validateHeader(
  story: ParsedStory,
  currentSceneId: PublishedScene["id"],
): (header: HeaderNamed | HeaderAnonymous) => HeaderValidationResult {
  const currentScene = story.scenes.find(
    (scene) => scene.id === currentSceneId,
  );

  let sceneLinks: Set<LinkTarget>;

  if (currentScene) {
    sceneLinks = new Set<LinkTarget>(
      Object.keys(allLinksInScene(currentScene)),
    );
    if (currentScene.link) {
      // don't consider the link (if any) for the current scene when validating
      // a header 'cos it's fine to add an explicit link with the same name
      // as the surrounding scene. (The fact that a scene is itself linkable is
      // rarely used and is more an artifact of the original implementation.)
      sceneLinks.delete(currentScene.link);
    }
  } else {
    sceneLinks = new Set();
  }

  return (header) => {
    if (!currentScene) {
      return header;
    }

    const linkName = deriveLinkTargetLeniently(
      header.kind === "headerNamed" ? header.name : deriveLinkTarget(header),
    );

    if (sceneLinks.has(linkName)) {
      return {
        kind: "invalid",
        header,
        errorCode: ErrorCodes.LinkNamesMustBeUnique,
        message: "Link names must be unique within a scene",
      } satisfies HeaderIsInvalid;
    }

    return header;
  };
}

export default validateHeader;
