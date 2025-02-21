import { type UploadApiOptions, v2 as cloudinary } from "cloudinary";
import type { Logger } from "pino";

import type { ImageName } from "../types.js";

export default function deleteImageFromCloudinary(
  log: Logger,
): (name: ImageName) => Promise<void> {
  const deleteImage = cloudinary.uploader.destroy;

  const options: UploadApiOptions = {
    resource_type: "image",
    invalidate: true,
  };

  return (name) =>
    new Promise((resolve, reject) => {
      log.debug({ name }, "Deleting image from Cloudinary");

      return deleteImage(name, options, (err) => {
        if (err) {
          log.warn({ err, name }, "Error when deleting image from Cloudinary");

          return reject(err);
        }

        log.debug({ name }, "Deleted image from Cloudinary");

        return resolve();
      });
    });
}
