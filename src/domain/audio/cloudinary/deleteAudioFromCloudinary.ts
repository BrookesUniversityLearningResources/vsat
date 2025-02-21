import { type UploadApiOptions, v2 as cloudinary } from "cloudinary";
import type { Logger } from "pino";

import type { AudioName } from "../types.js";

export default function deleteAudioFromCloudinary(
  log: Logger,
): (name: AudioName) => Promise<void> {
  const deleteAudio = cloudinary.uploader.destroy;

  const options: UploadApiOptions = {
    resource_type: "video",
    invalidate: true,
  };

  return (name) =>
    new Promise((resolve, reject) => {
      log.debug({ name }, "Deleting audio from Cloudinary");

      return deleteAudio(name, options, (err) => {
        if (err) {
          log.warn({ err, name }, "Error when deleting audio from Cloudinary");

          return reject(err);
        }

        log.debug({ name }, "Deleted audio from Cloudinary");

        return resolve();
      });
    });
}
