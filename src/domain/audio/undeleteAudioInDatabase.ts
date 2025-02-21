import type { Logger } from "pino";

import type { AudioDto, GetDatabase } from "../../database/schema.js";

export default function undeleteAudioInDatabase(log: Logger, db: GetDatabase) {
  return async (id: AudioDto["id"]) => {
    log.debug({ id }, "Undeleting audio in DB");

    await db()
      .updateTable("audio")
      .set({
        isDeleted: false,
      })
      .where("id", "=", id)
      .executeTakeFirstOrThrow();
  };
}
