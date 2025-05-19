import type {
  Page,
  PublishedScene,
  PublishedStory,
} from "@domain/story/publish/types.js";

/**
 * The current state of the story and the reader's progress in the story.
 *
 * This is the type of the central data structure consumed by the various
 * A-Frame components.
 *
 * Implementation note: this is exposed on the `window`; see the `init` function
 * of the `story` component in `PrepareStory.astro`.
 */
export type Current = {
  page: Page;
  scene: PublishedScene;
  story: PublishedStory;
};
