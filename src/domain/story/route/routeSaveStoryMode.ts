import express, { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import type { SaveStoryModeInDatabase } from "../../../database/schema.js";
import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";

function routeSaveStoryMode(
  log: Logger,
  saveStoryMode: SaveStoryModeInDatabase,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.put(
    "/story/:storyId/mode",
    ...(otherHandlers ?? []),
    express.text(),
    (req, res) => {
      if (!req.user) {
        res.status(401).send(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = SaveStoryModeRequestModel.safeParse({
        storyId: req.params.storyId,
        mode: req.body,
      });

      if (!parseResult.success) {
        log.warn({ parseResult }, "Bad request when saving story mode");

        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      const { storyId, mode } = parseResult.data;

      saveStoryMode({ storyId, mode })
        .then((story) => {
          res.status(200).json(story);
        })
        .catch((err) => {
          log.warn({ err, storyId, mode }, "Error saving story mode");

          res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
        });
    },
  );

  return router;
}

export default routeSaveStoryMode;

export const SaveStoryModeRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  mode: z.enum(["360", "2d"]),
});
