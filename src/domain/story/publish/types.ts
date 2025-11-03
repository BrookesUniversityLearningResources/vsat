import type { NonEmptyArray } from "@util/nonEmptyArray.js";
import type { Prettify, RequireAtLeastOne } from "@util/types.js";

import type {
  PersistentAudio,
  PersistentImage,
  PersistentScene,
  PersistentStory,
} from "../../index.js";

export type PublishedStory = Readonly<
  Prettify<
    Omit<PersistentStory, "scenes" | "publishedOn"> & {
      createdAt: Date;
      scenes: NonEmptyArray<PublishedScene>;
      imageUrl: string | null;
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

export type Block = HeadingBlock | PlaintextBlock | LinkBlock;

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
