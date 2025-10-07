import type { Logger } from "pino";

import type {
  GetDatabase,
  SaveSceneContentInDatabase,
} from "../../database/schema.js";

function saveSceneContentInDatabase(
  log: Logger,
  db: GetDatabase,
): SaveSceneContentInDatabase {
  return async ({ storyId, sceneId, content }) => {
    log.debug({ storyId, sceneId }, "Saving scene content");

    await db()
      .updateTable("scene")
      .set({
        content,
      })
      .where("scene.id", "=", sceneId)
      .where("scene.storyId", "=", storyId)
      .executeTakeFirstOrThrow();

    log.debug({ storyId, sceneId }, "Saved scene content");
  };
}

export default saveSceneContentInDatabase;
