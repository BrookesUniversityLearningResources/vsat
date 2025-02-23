import { type UploadApiOptions, v2 as cloudinary } from "cloudinary";
import type { Logger } from "pino";

type MediaDestroyer = (mediaName: string) => Promise<void>;

export default function deleteMediaInCloudinary(
  log: Logger,
  options: UploadApiOptions,
): MediaDestroyer {
  const destroy = cloudinary.uploader.destroy;

  return async (name) => {
    log.debug({ name }, "Deleting media from Cloudinary");

    const result = await destroy(name, options);

    log.debug({ name, result }, "Deleted media from Cloudinary");
  };
}
