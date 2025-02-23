import type { Logger } from "pino";

import type { AudioInsert, GetDatabase } from "../../database/schema.js";

export default function createAudioInDatabase(log: Logger, db: GetDatabase) {
  return (audio: AudioInsert) => {
    log.debug({ audio }, "Creating audio");

    return db()
      .insertInto("audio")
      .values(audio)
      .returningAll()
      .executeTakeFirstOrThrow();
  };
}
