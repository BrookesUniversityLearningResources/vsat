import type { Logger } from "pino";

import type { GetDatabase, ImageInsert } from "../../database/schema.js";

export default function createImageInDatabase(log: Logger, db: GetDatabase) {
  return (image: ImageInsert) => {
    log.debug({ image }, "Creating image");

    return db()
      .insertInto("image")
      .values(image)
      .returningAll()
      .executeTakeFirstOrThrow();
  };
}
