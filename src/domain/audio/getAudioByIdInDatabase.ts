import type { Logger } from "pino";

import type { AudioDto, GetDatabase } from "../../database/schema.js";

function getAudioByIdInDatabase(log: Logger, db: GetDatabase) {
  return (id: AudioDto["id"]) => {
    log.debug({ id }, "Getting audio by ID");

    return db()
      .selectFrom("audio")
      .selectAll()
      .where("audio.id", "=", id)
      .where("audio.isDeleted", "!=", true)
      .executeTakeFirst();
  };
}

export default getAudioByIdInDatabase;
