import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { GetPilot, Pilot } from "../pilot/types.js";

export default function getPilotInDatabase(
  log: Logger,
  db: GetDatabase,
): GetPilot {
  return async (pilotId) => {
    log.debug({ pilotId }, "Getting pilot");

    const pilot = await db()
      .selectFrom("pilot")
      .selectAll()
      .where("pilot.id", "=", pilotId)
      .executeTakeFirst();

    return pilot as Pilot | undefined;
  };
}
