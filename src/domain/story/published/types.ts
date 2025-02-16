import type { NonEmptyArray } from "@util/nonEmptyArray.js";
import type { Prettify, RequireAtLeastOne } from "@util/types.js";

import type {
  PersistentAudio,
  PersistentImage,
  PersistentScene,
  PersistentStory,
} from "../../index.js";

/**
 * A notionally published story is one where the `publishedOn` field is set but
 * the story may not meet the criteria for full publication.
 *
 * In order for a story to be published &mdash;the `publishedOn` field is
 * set&mdash; the story must have once met the criteria for full publication.
 *
 * However, after publication, the author may have changed elements of the story
 * such that it no longer meets the criteria for full publication.
 */
export type NotionallyPublishedStory = Prettify<
  Omit<PersistentStory, "publishedOn"> & {
    publishedOn: Date;
  }
>;

export function isNotionallyPublishedStory(
  story: PersistentStory,
): story is NotionallyPublishedStory {
  return !!story.publishedOn;
}

export type PublishedStory = Readonly<
  Prettify<
    Omit<PersistentStory, "publishedOn" | "scenes"> & {
      publishedOn: Date;
      scenes: NonEmptyArray<PublishedScene>;
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
