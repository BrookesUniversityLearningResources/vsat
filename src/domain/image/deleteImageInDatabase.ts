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
    log.debug({ imageId }, "(Soft) deleting image in DB");

    await db()
      .updateTable("image")
      .set({ isDeleted: true })
      .where("id", "=", imageId)
      .executeTakeFirstOrThrow();
  };
}
