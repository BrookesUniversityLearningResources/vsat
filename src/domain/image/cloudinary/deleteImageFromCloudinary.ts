import type { Logger } from "pino";

import deleteMediaInCloudinary from "../../../util/cloudinary/deleteMediaInCloudinary.js";
import type { ImageName } from "../types.js";

/**
 * @see https://cloudinary.com/documentation/image_upload_api_reference#destroy
 */
export default function deleteImageFromCloudinary(
  log: Logger,
): (name: ImageName) => Promise<void> {
  return deleteMediaInCloudinary(log, {
    resource_type: "image",
    // https://cloudinary.com/documentation/invalidate_cached_media_assets_on_the_cdn
    invalidate: true,
  });
}
