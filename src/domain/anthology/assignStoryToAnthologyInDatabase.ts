import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { AssignStoryToAnthology } from "./types.js";

export default function assignStoryToAnthologyInDatabase(
  log: Logger,
  db: GetDatabase,
): AssignStoryToAnthology {
  return async (request) => {
    log.debug({ request }, "Assigning story to anthology");

    await db()
      .insertInto("anthologyStory")
      .values({
        anthologyId: request.anthologyId,
        storyId: request.storyId,
      })
      .onConflict((oc) => oc.columns(["anthologyId", "storyId"]).doNothing())
      .execute();
  };
}
