import type { Logger } from "pino";

import type {
  AudioDto,
  AudioInsert,
  GetDatabase,
} from "../../database/schema.js";
import type { SaveSceneAudio } from "../index.js";
import { type UploadAudio, audioName } from "./types.js";

type SaveAudio = (audio: AudioInsert) => Promise<AudioDto>;

export default function saveSceneAudio(
  log: Logger,
  db: GetDatabase,
  uploadAudio: UploadAudio,
  saveAudio: SaveAudio,
): SaveSceneAudio {
  return async (request) => {
    log.debug(
      { storyId: request.storyId, sceneId: request.sceneId },
      "Saving scene audio",
    );

    const name = audioName(request.storyId, request.sceneId);

    const { url } = await uploadAudio(name, request.data);

    const audio = await saveAudio({
      url,
    });

    await db()
      .updateTable("scene")
      .set({
        audioId: audio.id,
      })
      .where("scene.id", "=", request.sceneId)
      .execute();

    log.debug(
      { storyId: request.storyId, sceneId: request.sceneId, name, audio },
      "Saved scene audio",
    );

    return audio;
  };
}
