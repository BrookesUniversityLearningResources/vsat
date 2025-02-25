import type { PersistentImage, PersistentStory } from "../../index.js";

/**
 * Given a `Story`, find a suitable image to represent it.
 *
 * The idea is that this image will then be the representative image for the
 * `Story`, used in thumbnails, search results, that sort of thing.
 */
export default function imageUrlFor(
  story: PersistentStory,
): PersistentImage["thumbnailUrl"] | null {
  return (
    (story.scenes.find((scene) => scene.isOpeningScene) ?? story.scenes[0])
      ?.image?.thumbnailUrl ?? null
  );
}
