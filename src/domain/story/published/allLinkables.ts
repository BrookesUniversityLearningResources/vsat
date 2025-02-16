import type { NonEmptyArray } from "../../../util/nonEmptyArray.js";
import type { PublishedScene, LinkTarget, Page } from "./types.js";

export type LinkableScene = {
  kind: "scene";
  scene: PublishedScene;
  link: LinkTarget;
};

export type LinkablePage = {
  kind: "page";
  page: Page;
  link: LinkTarget;
};

export type Linkable = LinkableScene | LinkablePage;

export function allLinkablesIn(scenes: NonEmptyArray<PublishedScene>) {
  return scenes.reduce(
    (links, scene) => {
      if (scene.link) {
        // a scene can itself be the target of a link in the fiction
        links[scene.link] = {
          kind: "scene",
          scene,
          link: scene.link,
        };
      }

      for (const [link, page] of Object.entries(scene.pages)) {
        links[link] = {
          kind: "page",
          page,
          link,
        };
      }

      return links;
    },
    {} as Record<LinkTarget, Linkable>,
  );
}

export function allLinksIn(scenes: NonEmptyArray<PublishedScene>) {
  return new Set<LinkTarget>(Object.keys(allLinkablesIn(scenes)));
}
