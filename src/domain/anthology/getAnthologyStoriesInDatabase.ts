import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { GetAnthologyStories } from "./types.js";

export default function getAnthologyStoriesInDatabase(
  log: Logger,
  db: GetDatabase,
): GetAnthologyStories {
  return async (anthologyId) => {
    log.debug({ anthologyId }, "Getting anthology stories");

    const rows = await db()
      .selectFrom("anthologyStory")
      .innerJoin("story", "story.id", "anthologyStory.storyId")
      .select(["story.id as id", "story.title as title"])
      .where("anthologyStory.anthologyId", "=", anthologyId)
      .orderBy("story.id", "asc")
      .execute();

    return rows.map((row) => ({ id: row.id, title: row.title }));
  };
}
