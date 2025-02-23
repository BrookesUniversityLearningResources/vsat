import type { Logger } from "pino";

import type {
  DeleteImageInDatabase,
  GetDatabase,
} from "../../database/schema.js";

export default function deleteImageInDatabase(
  log: Logger,
  db: GetDatabase,
): DeleteImageInDatabase {
  return async (imageId) => {
    log.debug({ imageId }, "Deleting image in DB");

    await db()
      .deleteFrom("image")
      .where("id", "=", imageId)
      .executeTakeFirstOrThrow();
  };
}
