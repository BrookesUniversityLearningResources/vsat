import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { GetScene } from "../index.js";
import { mapScene } from "./mapper/mapScene.js";

function getSceneForStoryInDatabase(log: Logger, db: GetDatabase): GetScene {
  return async ({ storyId, sceneId }) => {
    log.debug({ storyId, sceneId }, "Getting scene for story");

    const row = await db()
      .selectFrom("scene")
      .leftJoin("audio", "audio.id", "scene.audioId")
      .leftJoin("image", "image.id", "scene.imageId")
      .select([
        // scene
        "scene.id as sceneId",
        "scene.title as sceneTitle",
        "scene.content as sceneContent",
        "scene.isOpeningScene as isOpeningScene",
        "scene.mode as sceneMode",
        // audio
        "audio.id as audioId",
        "audio.url as audioUrl",
        // image
        "image.id as imageId",
        "image.url as imageUrl",
        "image.thumbnailUrl as imageThumbnailUrl",
      ])
      .where("scene.storyId", "=", storyId)
      .where("scene.id", "=", sceneId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    return mapScene(row);
  };
}

export default getSceneForStoryInDatabase;
