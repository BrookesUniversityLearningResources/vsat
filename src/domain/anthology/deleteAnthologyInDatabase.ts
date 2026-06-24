import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { DeleteAnthology } from "./types.js";

export default function deleteAnthologyInDatabase(
  log: Logger,
  db: GetDatabase,
): DeleteAnthology {
  return async (anthologyId) => {
    log.debug({ anthologyId }, "Deleting anthology");

    // anthology_story and interpretive_note rows cascade on the FK, so deleting
    // the anthology row is enough to clean up its membership and notes.
    await db()
      .deleteFrom("anthology")
      .where("anthology.id", "=", anthologyId)
      .execute();
  };
}
