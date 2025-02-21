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
    log.debug({ audioId }, "(Soft) deleting audio in DB");

    await db()
      .updateTable("audio")
      .set({ isDeleted: true })
      .where("id", "=", audioId)
      .executeTakeFirstOrThrow();
  };
}
