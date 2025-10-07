import type { Logger } from "pino";

import type {
  DeleteSceneInDatabase,
  GetDatabase,
} from "../../database/schema.js";

function deleteSceneInDatabase(
  log: Logger,
  db: GetDatabase,
): DeleteSceneInDatabase {
  return ({ storyId, sceneId }) => {
    log.debug({ storyId, sceneId }, "Deleting scene");

    return db()
      .deleteFrom("scene")
      .where("scene.id", "=", sceneId)
      .where("scene.storyId", "=", storyId)
      .returning(["imageId", "audioId"])
      .executeTakeFirstOrThrow();
  };
}

export default deleteSceneInDatabase;
