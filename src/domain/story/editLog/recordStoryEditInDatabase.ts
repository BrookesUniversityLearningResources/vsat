import type { Logger } from "pino";

import type {
  GetDatabase,
  RecordStoryEditInDatabase,
} from "../../../database/schema.js";

export default function recordStoryEditInDatabase(
  log: Logger,
  db: GetDatabase,
): RecordStoryEditInDatabase {
  return async (request) => {
    log.debug({ request }, "Recording story edit in the audit log");

    return db()
      .insertInto("storyEditLog")
      .values({
        storyId: request.storyId,
        sceneId: request.sceneId ?? null,
        editorId: request.editorId,
        action: request.action,
        summary: request.summary ?? null,
      })
      .returning("id")
      .executeTakeFirstOrThrow();
  };
}
