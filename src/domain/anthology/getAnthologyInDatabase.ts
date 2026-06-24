import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { Anthology, GetAnthology } from "./types.js";

export default function getAnthologyInDatabase(
  log: Logger,
  db: GetDatabase,
): GetAnthology {
  return async (anthologyId) => {
    log.debug({ anthologyId }, "Getting anthology");

    const anthology = await db()
      .selectFrom("anthology")
      .selectAll()
      .where("anthology.id", "=", anthologyId)
      .executeTakeFirst();

    return anthology as Anthology | undefined;
  };
}
