import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
  Router,
} from "express";
import multer from "multer";
import type { Logger } from "pino";
import { z } from "zod";

import type { UploadLimitConfig } from "../../../environment/config.js";
import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { SaveSceneImage } from "../../index.js";

function routeUploadSceneImage(
  log: Logger,
  saveSceneImage: SaveSceneImage,
  limit: UploadLimitConfig,
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
    (req: Request, res: Response) => {
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
    // @ts-expect-error the signature is fine
    (err: unknown, _req: Request, res: Response, next: NextFunction) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json(
            errorCodedContext(ErrorCodes.ErrorUploadingImageExceedsSizeLimit, {
              err,
            }),
          );
        }
      }

      if (err) {
        return res.status(500).json(
          errorCodedContext(ErrorCodes.ErrorUploadingAudio, {
            err,
          }),
        );
      }

      return next();
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
