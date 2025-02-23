import type { Logger } from "pino";

import type {
  DeleteAudioInDatabase,
  GetDatabase,
} from "../../database/schema.js";

export default function deleteAudioInDatabase(
  log: Logger,
  db: GetDatabase,
): DeleteAudioInDatabase {
  return async (audioId) => {
    log.debug({ audioId }, "Deleting audio in DB");

    await db()
      .deleteFrom("audio")
      .where("id", "=", audioId)
      .executeTakeFirstOrThrow();
  };
}
