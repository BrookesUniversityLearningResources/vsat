import type { Logger } from "pino";

import type {
  GetAuthorDefaultStoryModeInDatabase,
  GetDatabase,
} from "../../database/schema.js";

// Read live rather than off req.user: sessions (and the dev auth bypass,
// which caches its user) carry only id/name/email.
export default function getAuthorDefaultStoryModeInDatabase(
  log: Logger,
  db: GetDatabase,
): GetAuthorDefaultStoryModeInDatabase {
  return async (id) => {
    log.trace({ id }, "Getting author default story mode");

    const row = await db()
      .selectFrom("author")
      .select("author.defaultStoryMode")
      .where("author.id", "=", id)
      .executeTakeFirst();

    return row?.defaultStoryMode ?? "360";
  };
}
