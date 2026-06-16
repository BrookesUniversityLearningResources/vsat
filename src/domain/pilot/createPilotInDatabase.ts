import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { CreatePilot, Pilot } from "../pilot/types.js";

export default function createPilotInDatabase(
  log: Logger,
  db: GetDatabase,
): CreatePilot {
  return async (request) => {
    log.debug({ request }, "Creating pilot");

    const pilot = await db()
      .insertInto("pilot")
      .values({
        title: request.title,
        question: request.question,
        partner: request.partner ?? null,
        status: request.status ?? "draft",
        startAt: request.startAt ?? null,
        endAt: request.endAt ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return pilot as Pilot;
  };
}
