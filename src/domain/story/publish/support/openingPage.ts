import type { NonEmptyArray } from "../../../../util/nonEmptyArray.js";
import type { PublishedScene, Page } from "../types.js";

export default function openingPageFor(scene: PublishedScene): Page {
  // the explicit cast is fine 'cos' we know that there is at least one page
  const allPages = Object.values(scene.pages) as NonEmptyArray<Page>;

  const sortedPages = allPages.toSorted(
    inAscendingOrderOfPageNumber,
  ) as NonEmptyArray<Page>;

  return sortedPages[0];
}

function inAscendingOrderOfPageNumber(a: Page, b: Page): number {
  return a.number - b.number;
}
