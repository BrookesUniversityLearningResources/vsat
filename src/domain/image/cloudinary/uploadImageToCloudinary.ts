import { v2 as cloudinary } from "cloudinary";
import type { Logger } from "pino";

import type { Image } from "../../index.js";
import type { UploadImage } from "../types.js";

const THUMBNAIL_WIDTH = 288;
const THUMBNAIL_HEIGHT = 192;

export default function uploadImageToCloudinary(log: Logger): UploadImage {
  const upload = cloudinary.uploader.upload_stream;

  return (name, data) =>
    new Promise((resolve, reject) => {
      log.debug({ name }, "Uploading image to Cloudinary");

      return upload(
        {
          public_id: name,
          eager: [
            {
              width: THUMBNAIL_WIDTH,
              height: THUMBNAIL_HEIGHT,
            },
          ],
        },
        (err, result) => {
          if (err) {
            log.warn({ err, name }, "Error when uploading image to Cloudinary");

            return reject(err);
          }

          if (!result) {
            log.warn({ name }, "No result from uploading image to Cloudinary");

            return reject(
              new Error(
                `No result from uploading image "${name}" to Cloudinary`,
              ),
            );
          }

          const url = result.secure_url;

          const image: Image = {
            url,
            thumbnailUrl: thumbnailUrl(url),
          };

          log.debug({ name, image }, "Uploaded image to Cloudinary");

          resolve(image);
        },
      ).end(data);
    });
}

type ThumbnailDimensions = {
  height: number;
  width: number;
};

function thumbnailUrl(
  url: string,
  dimensions: ThumbnailDimensions = {
    height: THUMBNAIL_HEIGHT,
    width: THUMBNAIL_WIDTH,
  },
): string {
  return url.replace(
    /image\/upload/,
    `image/upload/w_${dimensions.width},h_${dimensions.height}`,
  );
}
