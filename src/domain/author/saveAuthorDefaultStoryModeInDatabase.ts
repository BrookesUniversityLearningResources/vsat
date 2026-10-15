import type { Logger } from "pino";

import type {
  GetDatabase,
  SaveAuthorDefaultStoryModeInDatabase,
} from "../../database/schema.js";

export default function saveAuthorDefaultStoryModeInDatabase(
  log: Logger,
  db: GetDatabase,
): SaveAuthorDefaultStoryModeInDatabase {
  return async (request) => {
    log.debug({ request }, "Saving author default story mode");

    await db()
      .updateTable("author")
      .set({
        defaultStoryMode: request.defaultStoryMode,
      })
      .where("author.id", "=", request.id)
      .executeTakeFirstOrThrow();

    log.debug({ request }, "Saved author default story mode");
  };
}
