import type { GetScene } from "@domain/index.js";
import type { Logger } from "pino";
import type {
  GetDatabase,
  SaveSceneModeInDatabase,
} from "../../database/schema.js";

function saveSceneModeInDatabase(
  log: Logger,
  db: GetDatabase,
  getScene: GetScene,
): SaveSceneModeInDatabase {
  return async ({ storyId, sceneId, mode }) => {
    log.debug({ storyId, sceneId, mode }, "Saving scene mode");

    await db()
      .updateTable("scene")
      .set({
        mode,
      })
      .where("scene.id", "=", sceneId)
      .where("scene.storyId", "=", storyId)
      .executeTakeFirstOrThrow();

    log.debug({ sceneId, mode }, "Saved scene mode");

    const scene = await getScene({ storyId, sceneId });

    if (scene === null) {
      throw new Error(
        `Scene with ID "${sceneId}" (story ID = "${storyId}") not found after saving scene mode`,
      );
    }

    return scene;
  };
}

export default saveSceneModeInDatabase;
