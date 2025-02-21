import type { Logger } from "pino";

import type { GetDatabase, ImageDto } from "../../database/schema.js";

export default function getImageByUniqueUrlInDatabase(
  log: Logger,
  db: GetDatabase,
) {
  return (url: ImageDto["url"], includeDeleted = false) => {
    log.debug({ url, includeDeleted }, "Getting image by unique URL");

    let select = db()
      .selectFrom("image")
      .selectAll()
      .where("image.url", "=", url);

    if (includeDeleted) {
      select = select.where("image.isDeleted", "=", true);
    }

    return select.executeTakeFirst();
  };
}
