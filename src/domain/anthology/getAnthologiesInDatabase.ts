import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { Anthology, GetAnthologies } from "./types.js";

export default function getAnthologiesInDatabase(
  log: Logger,
  db: GetDatabase,
): GetAnthologies {
  return async () => {
    log.debug("Getting anthologies");

    const rows = await db()
      .selectFrom("anthology")
      .selectAll()
      .orderBy("anthology.createdAt", "desc")
      .execute();

    return rows as Anthology[];
  };
}
