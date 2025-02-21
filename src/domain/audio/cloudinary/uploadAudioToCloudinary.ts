import { v2 as cloudinary } from "cloudinary";
import type { Logger } from "pino";

import type { Audio } from "../../index.js";
import type { UploadAudio } from "../types.js";

export default function uploadAudioToCloudinary(log: Logger): UploadAudio {
  const upload = cloudinary.uploader.upload_stream;

  return (name, data) =>
    new Promise((resolve, reject) => {
      log.debug({ name }, "Uploading audio to Cloudinary");

      return upload(
        {
          public_id: name,
          resource_type: "video",
        },
        (err, result) => {
          if (err) {
            log.warn({ err, name }, "Error uploading audio to Cloudinary");

            return reject(err);
          }

          if (!result) {
            log.warn({ name }, "No result from uploading audio to Cloudinary");

            return reject(
              new Error(
                `No result from uploading audio "${name}" to Cloudinary`,
              ),
            );
          }

          const audio: Audio = {
            url: result.secure_url,
          };

          log.debug({ name, audio }, "Uploaded audio to Cloudinary");

          resolve(audio);
        },
      ).end(data);
    });
}
