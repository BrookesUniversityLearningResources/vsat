import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { Json } from "../../util/json/types.js";
import type { NonEmptyArray } from "../../util/nonEmptyArray.js";
import type { GetPublishedStory } from "../index.js";
import type { PublishedScene, PublishedStory } from "./publish/types.js";

function getPublishedStoryInDatabase(
  log: Logger,
  db: GetDatabase,
): GetPublishedStory {
  return async (storyId) => {
    log.debug({ storyId }, "Getting published story");

    const row = await db()
      .selectFrom("storyPublished")
      .innerJoin("authorToStory", "authorToStory.storyId", "storyPublished.id")
      .innerJoin("author", "authorToStory.authorId", "author.id")
      .select([
        "storyPublished.id as storyId",
        "storyPublished.title as storyTitle",
        "storyPublished.content as storyContent",
        "storyPublished.imageUrl as storyImageUrl",
        "storyPublished.createdAt",
        "author.id as authorId",
        "author.name as authorName",
      ])
      .where("authorToStory.storyId", "=", storyId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return mapPublishedStory(row);
  };
}

export default getPublishedStoryInDatabase;

type PublishedStoryAndAuthorRow = {
  storyId: number;
  storyTitle: string;
  storyContent: Json;
  storyImageUrl: string | null;
  createdAt: Date;
  authorId: number;
  authorName: string;
};

function mapPublishedStory(row: PublishedStoryAndAuthorRow): PublishedStory {
  return {
    id: row.storyId,
    title: row.storyTitle,
    author: {
      id: row.authorId,
      name: row.authorName,
    },
    createdAt: row.createdAt,
    scenes: row.storyContent as NonEmptyArray<PublishedScene>,
    imageUrl: row.storyImageUrl,
  };
}
