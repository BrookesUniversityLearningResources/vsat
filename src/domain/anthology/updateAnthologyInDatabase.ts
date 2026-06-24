import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { Anthology, UpdateAnthology } from "./types.js";

export default function updateAnthologyInDatabase(
  log: Logger,
  db: GetDatabase,
): UpdateAnthology {
  return async ({ anthologyId, ...fields }) => {
    log.debug({ anthologyId, fields }, "Updating anthology");

    // Only set the fields that were actually provided, so a partial edit
    // (e.g. status only) leaves the rest untouched.
    const values: Record<string, unknown> = {};
    if (fields.title !== undefined) values.title = fields.title;
    if (fields.question !== undefined) values.question = fields.question;
    if (fields.partner !== undefined) values.partner = fields.partner;
    if (fields.status !== undefined) values.status = fields.status;

    if (Object.keys(values).length === 0) {
      const existing = await db()
        .selectFrom("anthology")
        .selectAll()
        .where("anthology.id", "=", anthologyId)
        .executeTakeFirst();
      return existing as Anthology | undefined;
    }

    const anthology = await db()
      .updateTable("anthology")
      .set(values)
      .where("anthology.id", "=", anthologyId)
      .returningAll()
      .executeTakeFirst();

    return anthology as Anthology | undefined;
  };
}
