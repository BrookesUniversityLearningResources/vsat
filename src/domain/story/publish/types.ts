import type { NonEmptyArray } from "@util/nonEmptyArray.js";
import type { Prettify, RequireAtLeastOne } from "@util/types.js";

import type {
  PersistentAudio,
  PersistentImage,
  PersistentScene,
  PersistentStory,
} from "../../index.js";

export type IsFeatured = {
  /**
   * `true` iff the story currently is featured.
   */
  active: boolean;

  /**
   * The date the story was featured.
   */
  on: Date | null;
};

export type PublishedStory = Readonly<
  Prettify<
    Omit<PersistentStory, "scenes" | "publishedOn"> & {
      createdAt: Date;
      scenes: NonEmptyArray<PublishedScene>;
      imageUrl: string | null;
      featured: IsFeatured | null;
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
  link: LinkTarget;
  number: number;
  content: NonEmptyArray<Block>;

  /**
   * The ID that uniquely identifies the `Scene` that this `Page` is contained
   * within.
   */
  withinScene: PublishedScene["id"];
}>;
