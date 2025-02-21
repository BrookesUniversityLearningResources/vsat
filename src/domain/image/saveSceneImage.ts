import type { Logger } from "pino";

import type {
  GetDatabase,
  ImageDto,
  ImageInsert,
} from "../../database/schema.js";
import type { SaveSceneImage } from "../index.js";
import { type UploadImage, imageName } from "./types.js";

type SaveImage = (image: ImageInsert) => Promise<ImageDto>;

export default function saveSceneImage(
  log: Logger,
  db: GetDatabase,
  uploadImage: UploadImage,
  saveImage: SaveImage,
): SaveSceneImage {
  return async (request) => {
    log.debug(
      { storyId: request.storyId, sceneId: request.sceneId },
      "Saving scene image",
    );

    const name = imageName(request.storyId, request.sceneId);

    const { url, thumbnailUrl } = await uploadImage(name, request.data);

    const image = await saveImage({
      url,
      thumbnailUrl,
    });

    await db()
      .updateTable("scene")
      .set({
        imageId: image.id,
      })
      .where("scene.id", "=", request.sceneId)
      .execute();

    log.debug(
      { storyId: request.storyId, sceneId: request.sceneId, name, image },
      "Saved scene image",
    );

    return image;
  };
}
