import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { GetAuthorByEmail } from "../../domain/index.js";

export default function getAuthorByEmailInDatabase(
  log: Logger,
  db: GetDatabase,
): GetAuthorByEmail {
  return (email) => {
    log.trace({ email }, "Getting author by email");

    return db()
      .selectFrom("author")
      .selectAll()
      .where("author.email", "=", email)
      .executeTakeFirst();
  };
}
