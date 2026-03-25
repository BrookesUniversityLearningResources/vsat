import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { GetPilotStories } from "../pilot/types.js";

export default function getPilotStoriesInDatabase(
  log: Logger,
  db: GetDatabase,
): GetPilotStories {
  return async (pilotId) => {
    log.debug({ pilotId }, "Getting pilot stories");

    const rows = await db()
      .selectFrom("pilotStory")
      .innerJoin("story", "story.id", "pilotStory.storyId")
      .select(["story.id as id", "story.title as title"])
      .where("pilotStory.pilotId", "=", pilotId)
      .orderBy("story.id", "asc")
      .execute();

    return rows.map((row) => ({ id: row.id, title: row.title }));
  };
}
