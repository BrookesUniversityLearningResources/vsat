import type { Logger } from "pino";

import type {
  GetDatabase,
  SaveAuthorNameInDatabase,
} from "../../database/schema.js";

export default function saveAuthorNameInDatabase(
  log: Logger,
  db: GetDatabase,
): SaveAuthorNameInDatabase {
  return async (request) => {
    log.debug({ request }, "Saving author name");

    await db()
      .updateTable("author")
      .set({
        name: request.name,
      })
      .where("author.id", "=", request.id)
      .executeTakeFirstOrThrow();

    log.debug({ request }, "Saved author name");
  };
}
