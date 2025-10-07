import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import deleteAudioInDatabase from "../audio/deleteAudioInDatabase.js";
import type { DeleteSceneAudio } from "../index.js";

function deleteSceneAudioInDatabase(
  log: Logger,
  db: GetDatabase,
): DeleteSceneAudio {
  const deleteAudio = deleteAudioInDatabase(log, db);

  return async ({ storyId, sceneId, audioId }) => {
    log.debug({ storyId, sceneId, audioId }, "Deleting scene's audio from DB");

    // the scene may already be deleted: we don't care and plough on
    await db()
      .updateTable("scene")
      .set({ audioId: null })
      .where("scene.id", "=", sceneId)
      .where("scene.storyId", "=", storyId)
      .execute();

    await deleteAudio(audioId);

    log.debug({ storyId, sceneId, audioId }, "Deleted scene's audio from DB");
  };
}

export default deleteSceneAudioInDatabase;
