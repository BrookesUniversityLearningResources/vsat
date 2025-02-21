import type { Logger } from "pino";

import type { AudioDto, GetDatabase } from "../../database/schema.js";

export default function getAudioByUniqueUrlInDatabase(
  log: Logger,
  db: GetDatabase,
) {
  return (url: AudioDto["url"], includeDeleted = false) => {
    log.debug({ url, includeDeleted }, "Getting audio by unique URL");

    let select = db()
      .selectFrom("audio")
      .selectAll()
      .where("audio.url", "=", url);

    if (includeDeleted) {
      select = select.where("audio.isDeleted", "=", true);
    }

    return select.executeTakeFirst();
  };
}
