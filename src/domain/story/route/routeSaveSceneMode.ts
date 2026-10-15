import express, { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import type { SaveSceneModeInDatabase } from "../../../database/schema.js";
import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";

function routeSaveSceneMode(
  log: Logger,
  saveSceneMode: SaveSceneModeInDatabase,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.put(
    "/story/:storyId/scene/:sceneId/mode",
    ...(otherHandlers ?? []),
    express.text(),
    (req, res) => {
      if (!req.user) {
        res.status(401).send(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = SaveSceneModeRequestModel.safeParse({
        storyId: req.params.storyId,
        sceneId: req.params.sceneId,
        mode: req.body,
      });

      if (!parseResult.success) {
        log.warn({ parseResult }, "Bad request when saving scene mode");

        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      const { storyId, sceneId, mode } = parseResult.data;

      saveSceneMode({ storyId, sceneId, mode })
        .then((scene) => {
          res.status(200).json(scene);
        })
        .catch((err) => {
          log.warn({ err, storyId, sceneId, mode }, "Error saving scene mode");

          res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
        });
    },
  );

  return router;
}

export default routeSaveSceneMode;

export const SaveSceneModeRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  sceneId: z.coerce.number().min(0),
  // "inherit" clears the pin so the scene follows the story again
  mode: z
    .enum(["360", "2d", "inherit"])
    .transform((mode) => (mode === "inherit" ? null : mode)),
});
