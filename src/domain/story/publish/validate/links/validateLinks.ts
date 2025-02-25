import {
  type NonEmptyArray,
  isNonEmptyArray,
} from "../../../../../util/nonEmptyArray.js";
import { allLinksIn } from "../../allLinkables.js";
import type { PublishedScene, LinkTarget } from "../../types.js";

export type BadLink = {
  scene: PublishedScene;
  nonExistentTarget: LinkTarget;
};

export type LinksAreGood = {
  kind: "linksAreGood";
  scenes: NonEmptyArray<PublishedScene>;
};

export type LinksAreBad = {
  kind: "linksAreBad";
  badLinks: BadLink[];
  scenes: NonEmptyArray<PublishedScene>;
};

export type LinkValidationResult = LinksAreGood | LinksAreBad;

function validateLinks(
  scenes: NonEmptyArray<PublishedScene>,
): LinkValidationResult {
  const allTargets = allLinksIn(scenes);

  const badLinks: BadLink[] = [];

  for (const scene of scenes) {
    for (const page of Object.values(scene.pages)) {
      for (const content of page.content) {
        if (content.kind === "blockLink") {
          // does this actually link to a known target?
          if (!allTargets.has(content.link)) {
            // nope; add it to the bad links
            badLinks.push({
              scene,
              nonExistentTarget: content.link,
            });
          }
        }
      }
    }
  }

  if (isNonEmptyArray(badLinks)) {
    return {
      kind: "linksAreBad",
      scenes,
      badLinks,
    };
  }

  return {
    kind: "linksAreGood",
    scenes,
  };
}

export default validateLinks;
