import type { Logger } from "pino";
import sharp from "sharp";

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

    const data = await sharp(request.data).resize({ width: 2500 }).toBuffer();

    const { url, thumbnailUrl } = await uploadImage(name, data);

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
      .where("scene.storyId", "=", request.storyId)
      .executeTakeFirstOrThrow();

    log.debug(
      { storyId: request.storyId, sceneId: request.sceneId, name, image },
      "Saved scene image",
    );

    return image;
  };
}
