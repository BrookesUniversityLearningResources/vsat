import type { Logger } from "pino";

import type { GetDatabase, ImageDto } from "../../database/schema.js";

function getImageByIdInDatabase(log: Logger, db: GetDatabase) {
  return (id: ImageDto["id"]) => {
    log.debug({ id }, "Getting image by ID");

    return db()
      .selectFrom("image")
      .selectAll()
      .where("image.id", "=", id)
      .where("image.isDeleted", "!=", true)
      .executeTakeFirst();
  };
}

export default getImageByIdInDatabase;
