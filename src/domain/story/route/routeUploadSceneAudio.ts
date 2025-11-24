import { type RequestHandler, Router } from "express";
import multer from "multer";
import type { Logger } from "pino";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { SaveSceneAudio } from "../../index.js";

type UploadLimit = {
  maxBytes: number;
};

function routeUploadSceneAudio(
  log: Logger,
  saveSceneAudio: SaveSceneAudio,
  limit: UploadLimit,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.post(
    "/story/:storyId/scene/:sceneId/audio",
    ...(otherHandlers ?? []),
    multer({
      limits: {
        fileSize: limit.maxBytes,
      },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("audio/")) {
          cb(null, true);
          return;
        }

        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
      },
    }).single("scene-audio"),
    (req, res) => {
      const parseResult = UploadSceneAudioRequestModel.safeParse({
        storyId: req.params.storyId,
        sceneId: req.params.sceneId,
        data: req.file?.buffer,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      saveSceneAudio(parseResult.data)
        .then((audio) => {
          res.status(200).json(audio);
        })
        .catch((err) => {
          log.warn(
            {
              err,
              storyId: parseResult.data.storyId,
              sceneId: parseResult.data.sceneId,
            },
            "Error uploading scene audio",
          );

          res
            .status(500)
            .json(errorCodedContext(ErrorCodes.ErrorUploadingAudio, err));
        });
    },
  );

  return router;
}

export default routeUploadSceneAudio;

export const UploadSceneAudioRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  sceneId: z.coerce.number().min(0),
  data: z.instanceof(Buffer),
});
