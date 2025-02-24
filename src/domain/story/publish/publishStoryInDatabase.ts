import type { Logger } from "pino";

import type {
  GetDatabase,
  PublishStoryInDatabase,
} from "../../../database/schema.js";

export default function publishStoryInDatabase(
  log: Logger,
  db: GetDatabase,
): PublishStoryInDatabase {
  return async ({ story }) => {
    log.debug({ story }, "Publishing story in DB");

    const content = JSON.stringify(story.scenes);

    const publishedStory = await db()
      .insertInto("storyPublished")
      .values({
        id: story.id,
        title: story.title,
        content,
        imageUrl: story.imageUrl,
        createdAt: story.createdAt,
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({
          title: story.title,
          content,
          imageUrl: story.imageUrl,
          createdAt: story.createdAt,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    log.debug({ story, publishedStory }, "Published story in DB");

    return publishedStory;
  };
}
