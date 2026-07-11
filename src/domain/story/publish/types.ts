import type { NonEmptyArray } from "@util/nonEmptyArray.js";
import type { Prettify, RequireAtLeastOne } from "@util/types.js";

import type {
  PersistentAudio,
  PersistentImage,
  PersistentScene,
  PersistentStory,
} from "../../index.js";

/**
 * How a story's scene images are presented.
 *
 * * `"360"` — equirectangular photospheres on an `<a-sky>` (the classic VSAT)
 * * `"2d"` — flat photos rendered without WebGL
 *
 * The mode lives on the `story` row and is read live at render time (not
 * snapshotted into `story_published`), so toggling it affects the published
 * view immediately.
 */
export type StoryMode = "360" | "2d";

export type PublishedStory = Readonly<
  Prettify<
    Omit<PersistentStory, "scenes" | "publishedOn"> & {
      createdAt: Date;
      scenes: NonEmptyArray<PublishedScene>;
      imageUrl: string | null;
      mode: StoryMode;
    }
  >
>;

export type PublishedScene = Readonly<
  Prettify<
    Omit<PersistentScene, "content" | "image" | "audio"> & {
      pages: RequireAtLeastOne<Record<Page["link"], Page>>;

      image: PersistentImage | null;

      audio?: PersistentAudio;

      // a scene is a valid link target from the fiction
      link: LinkTarget | null;
    }
  >
>;

export type LinkTarget = string;

export type HeadingBlock = {
  kind: "blockHeading";
  text: string;
  link: LinkTarget;
};

export type PlaintextBlock = {
  kind: "blockPlaintext";
  text: string;
};

export type LinkBlock = {
  kind: "blockLink";
  text: string;
  link: LinkTarget;
};

/**
 * A positioned link (`[text](target @ x,y)`): rendered as a clickable
 * hotspot on the scene photo at x% across / y% down, rather than as a
 * button in the fiction block.
 */
export type HotspotBlock = {
  kind: "blockHotspot";
  text: string;
  link: LinkTarget;
  x: number;
  y: number;
};

export type Block = HeadingBlock | PlaintextBlock | LinkBlock | HotspotBlock;

export type Page = Readonly<{
  /**
   * This page's anchor.
   *
   * Other content can link to this page by using this value.
   */
  link: LinkTarget;

  /**
   * This page's number in the scene.
   *
   * * the first page has number `0`
   * * the second page has number `1`
   * * etc.
   */
  number: number;

  /**
   * This page's fiction.
   */
  content: NonEmptyArray<Block>;

  /**
   * The ID that uniquely identifies the `Scene` that this `Page` is contained
   * within.
   */
  withinScene: PublishedScene["id"];
}>;
