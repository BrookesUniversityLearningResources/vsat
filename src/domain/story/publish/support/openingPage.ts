import type { Page, PublishedScene } from "../types.js";
import sortPages from "./sortPages.js";

export default function openingPageFor(scene: PublishedScene): Page {
  return sortPages(scene.pages)[0];
}
