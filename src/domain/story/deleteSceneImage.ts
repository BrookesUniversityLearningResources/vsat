import type { Logger } from "pino";

import { imageName } from "../image/types.js";
import type { DeleteSceneImage } from "../index.js";

type DeleteMedia = (mediaName: string) => Promise<void>;

export default function deleteSceneImage(
  log: Logger,
  deleteImageInDatabase: DeleteSceneImage,
  deleteMedia: DeleteMedia,
): DeleteSceneImage {
  return async (request) => {
    log.debug({ request }, "Deleting scene image");

    await deleteImageInDatabase(request);

    try {
      await deleteMedia(imageName(request.storyId, request.sceneId));
    } catch (err) {
      /*
       * A failure to delete the image (media) is swallowed because we can clean
       * that up later. We don't want such failures to frustrate the flow of
       * "delete this scene (image)" so that's why we swallow it.
       */

      log.warn({ err, request }, "Failed to delete scene image; swallowing");
    }
  };
}
