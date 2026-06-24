import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { RemoveStoryFromAnthology } from "./types.js";

export default function removeStoryFromAnthologyInDatabase(
  log: Logger,
  db: GetDatabase,
): RemoveStoryFromAnthology {
  return async ({ anthologyId, storyId }) => {
    log.debug({ anthologyId, storyId }, "Removing story from anthology");

    await db()
      .deleteFrom("anthologyStory")
      .where("anthologyStory.anthologyId", "=", anthologyId)
      .where("anthologyStory.storyId", "=", storyId)
      .execute();
  };
}
