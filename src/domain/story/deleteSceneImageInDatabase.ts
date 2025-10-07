import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import deleteImageInDatabase from "../image/deleteImageInDatabase.js";
import type { DeleteSceneImage } from "../index.js";

export default function deleteSceneImageInDatabase(
  log: Logger,
  db: GetDatabase,
): DeleteSceneImage {
  const deleteImage = deleteImageInDatabase(log, db);

  return async ({ storyId, sceneId, imageId }) => {
    log.debug({ storyId, sceneId, imageId }, "Deleting scene's image from DB");

    // the scene may already be deleted: we don't care and plough on
    await db()
      .updateTable("scene")
      .set({ imageId: null })
      .where("scene.id", "=", sceneId)
      .where("scene.storyId", "=", storyId)
      .execute();

    await deleteImage(imageId);

    log.debug({ storyId, sceneId, imageId }, "Deleted scene's image from DB");
  };
}
