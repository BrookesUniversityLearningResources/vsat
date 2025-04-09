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

    const rows = await db()
      .selectFrom("storyPublished")
      .innerJoin("authorToStory", "authorToStory.storyId", "storyPublished.id")
      .innerJoin("author", "authorToStory.authorId", "author.id")
      .select([
        // storyPublished
        "storyPublished.id as storyId",
        "storyPublished.title as storyTitle",
        "storyPublished.createdAt as storyPublishedOn",
        "storyPublished.imageUrl as storyImageUrl",
        "storyPublished.featuredActive as storyFeaturedActive",
        "storyPublished.featuredOn as storyFeaturedOn",
        // author
        "author.id as authorId",
        "author.name as authorName",
      ])
      .orderBy("storyPublished.createdAt", "desc")
      .execute();

    const summaries: PublishedStorySummary[] = rows.map((row) => ({
      id: row.storyId,
      title: row.storyTitle,
      publishedOn: row.storyPublishedOn,
      imageUrl: row.storyImageUrl,
      author: {
        id: row.authorId,
        name: row.authorName,
      },
      featured: {
        active: row.storyFeaturedActive,
        on: row.storyFeaturedOn,
      },
    }));

    log.debug({ request }, "Got %d published stories", summaries.length);

    return summaries;
  };
}
