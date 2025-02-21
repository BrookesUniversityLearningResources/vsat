import type { Logger } from "pino";

import type { AudioInsert, GetDatabase } from "../../database/schema.js";
import getAudioByUniqueUrlInDatabase from "./getAudioByUniqueUrlInDatabase.js";
import undeleteAudioInDatabase from "./undeleteAudioInDatabase.js";

export default function createAudioInDatabase(log: Logger, db: GetDatabase) {
  const undeleteAudio = undeleteAudioInDatabase(log, db);

  const getAudioByUrl = getAudioByUniqueUrlInDatabase(log, db);

  return async (audio: AudioInsert) => {
    log.debug({ audio }, "Creating audio");

    const result = await db()
      .insertInto("audio")
      .values(audio)
      .onConflict((oc) => oc.column("url").doNothing())
      .returningAll()
      .executeTakeFirst();

    if (result) {
      return result;
    }

    log.info(
      { audio },
      "Attempt to insert duplicate audio; returning existing audio",
    );

    const existingAudio = await getAudioByUrl(audio.url, true);

    if (!existingAudio) {
      throw new Error(
        `Error returning existing audio after attempt to insert duplicate audio: "${audio.url}"`,
      );
    }

    if (!existingAudio.isDeleted) {
      return existingAudio;
    }

    await undeleteAudio(existingAudio.id);

    return {
      ...existingAudio,
      isDeleted: false,
    };
  };
}
