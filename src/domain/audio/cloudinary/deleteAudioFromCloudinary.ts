import type { Logger } from "pino";

import deleteMediaInCloudinary from "../../../util/cloudinary/deleteMediaInCloudinary.js";
import type { AudioName } from "../types.js";

export default function deleteAudioFromCloudinary(
  log: Logger,
): (name: AudioName) => Promise<void> {
  return deleteMediaInCloudinary(log, {
    resource_type: "video",
    invalidate: true,
  });
}
