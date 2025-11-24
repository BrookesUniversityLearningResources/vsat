import { type RequestHandler, Router } from "express";
import multer from "multer";
import type { Logger } from "pino";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { SaveSceneImage } from "../../index.js";

type UploadLimit = {
  maxBytes: number;
};

function routeUploadSceneImage(
  log: Logger,
  saveSceneImage: SaveSceneImage,
  limit: UploadLimit,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.post(
    "/story/:storyId/scene/:sceneId/image",
    ...(otherHandlers ?? []),
    multer({
      limits: {
        fileSize: limit.maxBytes,
      },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
          cb(null, true);
          return;
        }

        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
      },
    }).single("scene-image"),
    (req, res) => {
      const parseResult = UploadSceneImageRequestModel.safeParse({
        storyId: req.params.storyId,
        sceneId: req.params.sceneId,
        data: req.file?.buffer,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      saveSceneImage(parseResult.data)
        .then((image) => {
          res.status(200).json(image);
        })
        .catch((err) => {
          log.warn(
            {
              err,
              storyId: parseResult.data.storyId,
              sceneId: parseResult.data.sceneId,
            },
            "Error uploading scene image",
          );

          res
            .status(500)
            .json(errorCodedContext(ErrorCodes.ErrorUploadingImage, err));
        });
    },
  );

  return router;
}

export default routeUploadSceneImage;

export const UploadSceneImageRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  sceneId: z.coerce.number().min(0),
  data: z.instanceof(Buffer),
});
