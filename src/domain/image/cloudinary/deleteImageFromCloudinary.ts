import type { Logger } from "pino";

import deleteMediaInCloudinary from "../../../util/cloudinary/deleteMediaInCloudinary.js";
import type { ImageName } from "../types.js";

export default function deleteImageFromCloudinary(
  log: Logger,
): (name: ImageName) => Promise<void> {
  return deleteMediaInCloudinary(log, {
    resource_type: "image",
    invalidate: true,
  });
}
