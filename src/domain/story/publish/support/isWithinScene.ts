import type { PublishedScene, Page } from "../types.js";

export default function isWithinScene(
  scene: PublishedScene,
  page: Page,
): boolean {
  return scene.id === page.withinScene;
}
