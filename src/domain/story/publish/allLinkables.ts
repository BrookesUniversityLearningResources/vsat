import type { NonEmptyArray } from "../../../util/nonEmptyArray.js";
import type { LinkTarget, Page, PublishedScene } from "./types.js";

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
  const links: Map<LinkTarget, Linkable> = new Map();

  return scenes.reduce((all, scene) => {
    const sceneLinks = allLinksInScene(scene);
    for (const [link, linkable] of Object.entries(sceneLinks)) {
      all.set(link, linkable);
    }
    return all;
  }, links);
}

export function allLinksIn(scenes: NonEmptyArray<PublishedScene>) {
  return new Set<LinkTarget>(allLinkablesIn(scenes).keys());
}

export function allLinksInScene(scene: PublishedScene) {
  const links = {} as Record<LinkTarget, Linkable>;

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
}
