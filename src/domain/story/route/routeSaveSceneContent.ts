import express, { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import type { SaveSceneContentInDatabase } from "../../../database/schema.js";
import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";

function routeSaveSceneContent(
  log: Logger,
  saveSceneContent: SaveSceneContentInDatabase,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.put(
    "/story/:storyId/scene/:sceneId/content",
    ...(otherHandlers ?? []),
    express.text(),
    (req, res) => {
      if (!req.user) {
        res.status(401).send(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = SaveSceneContentRequestModel.safeParse({
        storyId: req.params.storyId,
        sceneId: req.params.sceneId,
        content: req.body,
      });

      if (!parseResult.success) {
        log.warn({ parseResult }, "Bad request when saving scene content");

        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      const { storyId, sceneId, content } = parseResult.data;

      saveSceneContent({ storyId, sceneId, content })
        .then(() => {
          res.status(204).send();
        })
        .catch((err) => {
          log.warn({ err, sceneId }, "Error saving scene content");

          res
            .status(500)
            .json(errorCodedContext(ErrorCodes.ErrorSavingSceneContent, err));
        });
    },
  );

  return router;
}

export default routeSaveSceneContent;

export const SaveSceneContentRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  sceneId: z.coerce.number().min(0),
  content: z.string().trim().min(1),
});
