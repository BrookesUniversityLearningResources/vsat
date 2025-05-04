import type { Page, PublishedScene } from "../types.js";
import sortPages from "./sortPages.js";

/**
 * Is the supplied `page` the first page of the supplied `scene` _and_ is the
 * supplied `scene` the first scene in the story?
 *
 * This function is about finding the first page in the story overall, not just
 * the first page in a particular scene.
 */
export function isFirstPageInStory(page: Page, scene: PublishedScene): boolean {
  if (!scene.isOpeningScene) {
    return false;
  }

  const sortedPages = sortPages(scene.pages);

  return sortedPages[0].number === page.number;
}
