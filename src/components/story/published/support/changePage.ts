import { allLinkablesIn } from "@domain/story/publish/allLinkables.js";
import findSceneById from "@domain/story/publish/support/findSceneById.js";
import isWithinScene from "@domain/story/publish/support/isWithinScene.js";
import openingPageFor from "@domain/story/publish/support/openingPage.js";
import type {
  PublishedScene,
  PublishedStory,
  LinkTarget,
  Page,
} from "@domain/story/publish/types.js";

export type ChangeToPage = Readonly<{
  /**
   * The page to change _to_.
   */
  toPage: Page;

  /**
   * If the page being turned _to_ is in a different scene then we'll also need
   * to change to that other scene.
   *
   * If the page being turned _to_ is in the same (current) scene then this'll
   * be `undefined`. (There's no need to change the scene.)
   */
  toScene?: PublishedScene;
}>;

export type ChangePage = (
  link: LinkTarget,
  currentScene: PublishedScene,
) => ChangeToPage | null;

export default function changePage(story: PublishedStory): ChangePage {
  const allLinks = allLinkablesIn(story.scenes);

  return (link, currentScene) => {
    const theLink = allLinks[link];

    if (!theLink) {
      return null;
    }

    switch (theLink.kind) {
      /*
       * We're turning to a page.
       *
       * The page may be part of the current scene; if so we'll return just the
       * page being turned to and the current scene will remain unchanged.
       *
       * The page may be part of another scene; if so, we'll return the page
       * being turned to and the scene that page is in.
       */
      case "page": {
        const newPage = theLink.page;

        if (isWithinScene(currentScene, newPage)) {
          return {
            toPage: newPage,
          };
        }

        const otherScene = findSceneById(story.scenes, newPage.withinScene);
        if (otherScene) {
          return {
            toPage: newPage,
            toScene: otherScene,
          };
        }

        break;
      }

      case "scene": {
        /*
         * We're turning to a scene.
         *
         * The page will be the opening page of the scene.
         */
        const scene = theLink.scene;
        return {
          toScene: scene,
          toPage: openingPageFor(scene),
        };
      }

      default: {
        ((_: never) => _)(theLink);
        return null;
      }
    }

    return null;
  };
}
