import type { Logger } from "pino";

import type { GetScene } from "@domain/index.js";
import type {
  GetDatabase,
  SaveSceneTitleInDatabase,
} from "../../database/schema.js";

function saveSceneTitleInDatabase(
  log: Logger,
  db: GetDatabase,
  getScene: GetScene,
): SaveSceneTitleInDatabase {
  return async ({ storyId, sceneId, title }) => {
    log.debug({ storyId, sceneId, title }, "Saving scene title");

    await db()
      .updateTable("scene")
      .set({
        title,
      })
      .where("scene.id", "=", sceneId)
      .executeTakeFirstOrThrow();

    log.debug({ sceneId, title }, "Saved scene title");

    const scene = await getScene({ storyId, sceneId });

    if (scene === null) {
      throw new Error(
        `Scene with ID "${sceneId}" (story ID = "${storyId}") not found after saving scene title`,
      );
    }

    return scene;
  };
}

export default saveSceneTitleInDatabase;
