import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { Anthology, CreateAnthology } from "./types.js";

export default function createAnthologyInDatabase(
  log: Logger,
  db: GetDatabase,
): CreateAnthology {
  return async (request) => {
    log.debug({ request }, "Creating anthology");

    const anthology = await db()
      .insertInto("anthology")
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

    return anthology as Anthology;
  };
}
