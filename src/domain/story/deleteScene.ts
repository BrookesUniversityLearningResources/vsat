import type { Logger } from "pino";

import type { DeleteSceneInDatabase } from "../../database/schema.js";
import type {
  DeleteScene,
  DeleteSceneAudio,
  DeleteSceneImage,
} from "../index.js";

export default function deleteScene(
  log: Logger,
  deleteSceneInDatabase: DeleteSceneInDatabase,
  deleteImage: DeleteSceneImage,
  deleteAudio: DeleteSceneAudio,
): DeleteScene {
  return async (request) => {
    log.debug({ request }, "Deleting scene");

    const { storyId, sceneId } = request;

    const { imageId, audioId } = await deleteSceneInDatabase({
      storyId,
      sceneId,
    });

    await Promise.all([
      imageId ? deleteImage({ storyId, sceneId, imageId }) : Promise.resolve(),
      audioId ? deleteAudio({ storyId, sceneId, audioId }) : Promise.resolve(),
    ]);
  };
}
