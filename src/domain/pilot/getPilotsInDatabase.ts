import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { GetPilots, Pilot } from "../pilot/types.js";

export default function getPilotsInDatabase(
  log: Logger,
  db: GetDatabase,
): GetPilots {
  return async () => {
    log.debug("Getting pilots");

    const rows = await db()
      .selectFrom("pilot")
      .selectAll()
      .orderBy("pilot.createdAt", "desc")
      .execute();

    return rows as Pilot[];
  };
}
