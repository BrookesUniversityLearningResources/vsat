import type { Logger } from "pino";

import type { GetDatabase, ImageDto } from "../../database/schema.js";

export default function undeleteImageInDatabase(log: Logger, db: GetDatabase) {
  return async (id: ImageDto["id"]) => {
    log.debug({ id }, "Undeleting image in DB");

    await db()
      .updateTable("image")
      .set({
        isDeleted: false,
      })
      .where("id", "=", id)
      .executeTakeFirstOrThrow();
  };
}
