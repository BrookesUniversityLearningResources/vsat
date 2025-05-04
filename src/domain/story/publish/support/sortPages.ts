import type { NonEmptyArray } from "../../../../util/nonEmptyArray.js";
import type { Page, PublishedScene } from "../types.js";

export default function sortPages(
  pages: PublishedScene["pages"],
): NonEmptyArray<Page> {
  // the explicit cast is fine 'cos' we know there is at least one page
  return Object.values(pages).toSorted(
    inAscendingOrderOfPageNumber,
  ) as NonEmptyArray<Page>;
}

function inAscendingOrderOfPageNumber(a: Page, b: Page): number {
  return a.number - b.number;
}
