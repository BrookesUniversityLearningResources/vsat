import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type {
  GetPublishedStorySummaries,
  PublishedStorySummary,
} from "../index.js";

export default function getPublishedStorySummariesInDatabase(
  log: Logger,
  db: GetDatabase,
): GetPublishedStorySummaries {
  return async (request) => {
    log.debug({ request }, "Getting published stories");

    const resultSet = await db()
      .selectFrom("storyPublished")
      .innerJoin("authorToStory", "authorToStory.storyId", "storyPublished.id")
      .innerJoin("author", "authorToStory.authorId", "author.id")
      .innerJoin("scene", "scene.storyId", "storyPublished.id")
      .leftJoin("image", "scene.imageId", "image.id")
      .select([
        // storyPublished
        "storyPublished.id as storyId",
        "storyPublished.title as storyTitle",
        "storyPublished.createdAt as storyPublishedOn",
        // author
        "author.id as authorId",
        "author.name as authorName",
        // image
        "image.thumbnailUrl as imageThumbnailUrl",
      ])
      .orderBy("storyPublished.createdAt", "desc")
      .execute();

    const publishedStorySummaries: PublishedStorySummary[] = resultSet.map(
      (row) => ({
        id: row.storyId,
        title: row.storyTitle,
        publishedOn: row.storyPublishedOn,
        imageUrl: row.imageThumbnailUrl,
        author: {
          id: row.authorId,
          name: row.authorName,
        },
      }),
    );

    log.debug(
      { request },
      "Got %d published stories",
      publishedStorySummaries.length,
    );

    return publishedStorySummaries;
  };
}
