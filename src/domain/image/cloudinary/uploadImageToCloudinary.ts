import { v2 as cloudinary } from "cloudinary";
import type { Logger } from "pino";

import type { Image } from "../../index.js";
import type { UploadImage } from "../types.js";

/**
 * The width that uploaded images will be scaled to.
 *
 * The height will be scaled accordingly to preserve the aspect ratio.
 *
 * @see [Scaling](https://cloudinary.com/documentation/resizing_and_cropping#scale)
 */
const SCALED_WIDTH = 2500;

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
            {
              // paired with the `scaledUrl` function below
              crop: "scale",
              width: SCALED_WIDTH,
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
            url: scaledUrl(url),
            thumbnailUrl: thumbnailUrl(url),
          };

          log.debug({ name, image }, "Uploaded image to Cloudinary");

          resolve(image);
        },
      ).end(data);
    });
}

/**
 * Tweak the URL so that Cloudinary will automatically scale it to a reasonable
 * size when we're displaying the image in the VR scene.
 */
function scaledUrl(url: string): string {
  return url.replace(/image\/upload/, `image/upload/c_scale,w_${SCALED_WIDTH}`);
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
