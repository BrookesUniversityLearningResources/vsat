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
      .where("scene.storyId", "=", request.storyId)
      .executeTakeFirstOrThrow();

    // A photosphere is a 2:1 equirectangular image; anything else wrapped
    // onto the sky comes out smeared. So when a scene that would render in
    // 360° gets a photo that can't be one, pin that scene to 2D. A scene the
    // author has already pinned is left alone either way.
    const isPanorama = await isEquirectangular(request.data, log);
    if (isPanorama === false) {
      const row = await db()
        .selectFrom("scene")
        .innerJoin("story", "story.id", "scene.storyId")
        .select(["scene.mode as sceneMode", "story.mode as storyMode"])
        .where("scene.id", "=", request.sceneId)
        .where("scene.storyId", "=", request.storyId)
        .executeTakeFirst();

      if (row && row.sceneMode === null && row.storyMode === "360") {
        await db()
          .updateTable("scene")
          .set({ mode: "2d" })
          .where("scene.id", "=", request.sceneId)
          .where("scene.storyId", "=", request.storyId)
          .execute();

        log.debug(
          { storyId: request.storyId, sceneId: request.sceneId },
          "Pinned scene to 2D: its photo is not a 360° panorama",
        );
      }
    }

    log.debug(
      { storyId: request.storyId, sceneId: request.sceneId, name, image },
      "Saved scene image",
    );

    return image;
  };
}

// null when the image can't be read: then we don't guess
async function isEquirectangular(
  data: Buffer,
  log: Logger,
): Promise<boolean | null> {
  try {
    const { width, height, orientation } = await sharp(data).metadata();
    if (!width || !height) return null;
    // EXIF orientations 5-8 swap the displayed width and height
    const [w, h] =
      orientation && orientation >= 5 ? [height, width] : [width, height];
    return Math.abs(w / h - 2) < 0.05;
  } catch (err) {
    log.warn({ err }, "Could not read scene image dimensions");
    return null;
  }
}
