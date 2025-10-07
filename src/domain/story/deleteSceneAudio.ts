import type { Logger } from "pino";

import { audioName } from "../audio/types.js";
import type { DeleteSceneAudio } from "../index.js";

type DeleteMedia = (mediaName: string) => Promise<void>;

export default function deleteSceneAudio(
  log: Logger,
  deleteAudioInDatabase: DeleteSceneAudio,
  deleteMedia: DeleteMedia,
): DeleteSceneAudio {
  return async (request) => {
    log.debug({ request }, "Deleting scene audio");

    await deleteAudioInDatabase(request);

    try {
      await deleteMedia(audioName(request.storyId, request.sceneId));
    } catch (err) {
      /*
       * A failure to delete the audio (media) is swallowed because we can clean
       * that up later. We don't want such failures to frustrate the flow of
       * "delete this scene (audio)" so that's why we swallow it.
       */

      log.warn({ err, request }, "Failed to delete scene audio; swallowing");
    }
  };
}
