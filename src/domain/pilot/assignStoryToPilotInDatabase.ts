import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { AssignStoryToPilot } from "../pilot/types.js";

export default function assignStoryToPilotInDatabase(
  log: Logger,
  db: GetDatabase,
): AssignStoryToPilot {
  return async (request) => {
    log.debug({ request }, "Assigning story to pilot");

    await db()
      .insertInto("pilotStory")
      .values({
        pilotId: request.pilotId,
        storyId: request.storyId,
      })
      .onConflict((oc) => oc.columns(["pilotId", "storyId"]).doNothing())
      .execute();
  };
}
