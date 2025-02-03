import express, { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import type { SaveStoryTitleInDatabase } from "../../../database/schema.js";
import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";

function routeSaveStoryTitle(
  log: Logger,
  saveStoryTitle: SaveStoryTitleInDatabase,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.put(
    "/story/:storyId/title",
    ...(otherHandlers ?? []),
    express.text(),
    (req, res) => {
      if (!req.user) {
        res.status(401).send(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = SaveStoryTitleRequestModel.safeParse({
        storyId: req.params.storyId,
        title: req.body,
      });

      if (!parseResult.success) {
        log.warn({ parseResult }, "Bad request when saving story title");

        res.status(400).json(errorCodedContext(ErrorCodes.Bad_Request));
        return;
      }

      const { storyId, title } = parseResult.data;

      saveStoryTitle({ storyId, title })
        .then((story) => {
          res.status(200).json(story);
        })
        .catch((err) => {
          log.warn({ err, storyId, title }, "Error saving story title");

          res
            .status(500)
            .json(errorCodedContext(ErrorCodes.ErrorSavingSceneContent, err));
        });
    },
  );

  return router;
}

export default routeSaveStoryTitle;

export const SaveStoryTitleRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  title: z.string().trim().min(3).max(50),
});
