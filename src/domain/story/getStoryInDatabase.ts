import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { GetScenesForStory, GetStory } from "../index.js";
import { mapStory } from "./mapper/mapStory.js";

function getStoryInDatabase(
  log: Logger,
  db: GetDatabase,
  getScenes: GetScenesForStory,
): GetStory {
  return async (request) => {
    log.debug({ request }, "Getting story");

    const data = await db()
      .selectFrom("story")
      .innerJoin("authorToStory", "authorToStory.storyId", "story.id")
      .innerJoin("author", "authorToStory.authorId", "author.id")
      .leftJoin("storyPublished", "story.id", "storyPublished.id")
      .select([
        // story
        "story.id as storyId",
        "story.title as storyTitle",
        // author
        "author.id as authorId",
        "author.name as authorName",
        // storyPublished
        "storyPublished.createdAt as publishedOn",
      ])
      .where("authorToStory.storyId", "=", request.id)
      .executeTakeFirst();

    if (!data) {
      return null;
    }

    const scenes = await getScenes(data.storyId);

    return mapStory(data, scenes);
  };
}

export default getStoryInDatabase;
