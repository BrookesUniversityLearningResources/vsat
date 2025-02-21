import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { CreateAuthor } from "../../domain/index.js";

export default function createAuthorInDatabase(
  log: Logger,
  db: GetDatabase,
): CreateAuthor {
  return (author) => {
    log.debug({ author }, "Creating author");

    return db()
      .insertInto("author")
      .values(author)
      .returningAll()
      .executeTakeFirstOrThrow();
  };
}
