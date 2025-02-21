import type { Logger } from "pino";

import type { GetDatabase, ImageInsert } from "../../database/schema.js";
import getImageByUniqueUrlInDatabase from "./getImageByUniqueUrlInDatabase.js";
import undeleteImageInDatabase from "./undeleteImageInDatabase.js";

export default function createImageInDatabase(log: Logger, db: GetDatabase) {
  const undeleteImage = undeleteImageInDatabase(log, db);

  const getImageByUrl = getImageByUniqueUrlInDatabase(log, db);

  return async (image: ImageInsert) => {
    log.debug({ image }, "Creating image");

    const result = await db()
      .insertInto("image")
      .values(image)
      .onConflict((oc) => oc.column("url").doNothing())
      .returningAll()
      .executeTakeFirst();

    if (result) {
      return result;
    }

    log.info(
      { image },
      "Attempt to insert duplicate image; returning existing image",
    );

    const existingImage = await getImageByUrl(image.url, true);

    if (!existingImage) {
      throw new Error(
        `Error returning existing image after attempt to insert duplicate image: "${image.url}"`,
      );
    }

    if (!existingImage.isDeleted) {
      return existingImage;
    }

    await undeleteImage(existingImage.id);

    return {
      ...existingImage,
      isDeleted: false,
    };
  };
}
