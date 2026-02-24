import type { Page, PublishedScene } from "@domain/story/publish/types";

const LINK_TITLE_CARD = "__titleCard__";

/**
 * Create a synthetic scene (and page) modelling a "title card."
 *
 * When the opening scene of a story has some audio, insert a synthetic
 * "title card" scene (and page) that just throws up some screen elements
 * for the story title and a big old "Start" button.
 *
 * The only reason for the existence of this synthetic title card is to
 * provoke an explicit user interaction from the reader so that the browser
 * won't block the auto-playing of the opening scene's audio.
 *
 * https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay#autoplay_availability
 */
export function titleCardSceneFor(
  title: string,
  openingScene: PublishedScene,
  openingPageLink: Page["link"],
): [PublishedScene, Page] {
  const page = {
    number: 0,
    link: LINK_TITLE_CARD,
    withinScene: openingScene.id,
    content: [
      {
        kind: "blockHeading",
        link: LINK_TITLE_CARD,
        text: title,
      },
      { kind: "blockLink", text: "Start", link: openingPageLink },
    ],
  } satisfies Page;

  const scene = {
    id: -16142, // some magic number, has no meaning
    title: LINK_TITLE_CARD,
    image: openingScene.image,
    link: LINK_TITLE_CARD,
    isOpeningScene: false,
    pages: {
      __titleCard__: page,
    },
  } satisfies PublishedScene;

  return [scene, page];
}

export function isTitleCardScene(scene: PublishedScene): boolean {
  return scene.link === LINK_TITLE_CARD;
}
