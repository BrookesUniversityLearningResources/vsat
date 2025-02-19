import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import { isNonEmptyArray } from "../../util/nonEmptyArray.js";
import type { GetScenesForStory, PersistentScene } from "../index.js";
import { mapScene } from "./mapper/mapScene.js";

function getScenesForStoryInDatabase(
  log: Logger,
  db: GetDatabase,
): GetScenesForStory {
  return async (storyId) => {
    log.debug({ storyId }, "Getting scenes for story");

    const rows = await db()
      .selectFrom("scene")
      .leftJoin("audio", "audio.id", "scene.audioId")
      .leftJoin("image", "image.id", "scene.imageId")
      .select([
        // scene
        "scene.id as sceneId",
        "scene.title as sceneTitle",
        "scene.content as sceneContent",
        "scene.isOpeningScene as isOpeningScene",
        // audio
        "audio.id as audioId",
        "audio.url as audioUrl",
        // image
        "image.id as imageId",
        "image.url as imageUrl",
        "image.thumbnailUrl as imageThumbnailUrl",
      ])
      .where("scene.storyId", "=", storyId)
      .orderBy("scene.id", "asc")
      .execute();

    if (!isNonEmptyArray(rows)) {
      log.debug({ storyId }, 'No scenes found for story with ID "%s"', storyId);

      return [];
    }

    return rows.reduce((scenes, row) => {
      scenes.push(mapScene(row));

      return scenes;
    }, [] as PersistentScene[]);
  };
}

export default getScenesForStoryInDatabase;
