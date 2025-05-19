import express, { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import type { SaveSceneTitleInDatabase } from "../../../database/schema.js";
import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";

function routeSaveSceneTitle(
  log: Logger,
  saveSceneTitle: SaveSceneTitleInDatabase,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.put(
    "/story/:storyId/scene/:sceneId/title",
    ...(otherHandlers ?? []),
    express.text(),
    (req, res) => {
      if (!req.user) {
        res.status(401).send(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = SaveSceneTitleRequestModel.safeParse({
        storyId: req.params.storyId,
        sceneId: req.params.sceneId,
        title: req.body,
      });

      if (!parseResult.success) {
        log.warn({ parseResult }, "Bad request when saving cene title");

        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      const { storyId, sceneId, title } = parseResult.data;

      saveSceneTitle({ storyId, sceneId, title })
        .then((scene) => {
          res.status(200).json(scene);
        })
        .catch((err) => {
          log.warn({ err, storyId, title }, "Error saving scene title");

          res
            .status(500)
            .json(errorCodedContext(ErrorCodes.ErrorSavingSceneContent, err));
        });
    },
  );

  return router;
}

export default routeSaveSceneTitle;

export const SaveSceneTitleRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  sceneId: z.coerce.number().min(0),
  title: z.string().trim().min(3).max(50),
});
