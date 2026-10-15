import express, { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import type { SaveAuthorDefaultStoryModeInDatabase } from "../../../database/schema.js";
import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";

export default function routeSaveAuthorDefaultStoryMode(
  log: Logger,
  saveAuthorDefaultStoryMode: SaveAuthorDefaultStoryModeInDatabase,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.put(
    "/author/:authorId/default-story-mode",
    ...(otherHandlers ?? []),
    express.text(),
    (req, res) => {
      if (!req.user) {
        res.status(401).send(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = SaveAuthorDefaultStoryModeRequestModel.safeParse({
        id: req.params.authorId,
        defaultStoryMode: req.body,
      });

      if (!parseResult.success) {
        log.warn(
          { parseResult },
          "Bad request when saving author default story mode",
        );

        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      const { id, defaultStoryMode } = parseResult.data;

      if (id !== req.user.id) {
        log.warn(
          { req },
          "Rejecting attempt to change the default story mode of another author",
        );

        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      saveAuthorDefaultStoryMode({ id, defaultStoryMode })
        .then(() => {
          res.status(204).send();
        })
        .catch((err) => {
          log.warn(
            { err, id, defaultStoryMode },
            "Error saving author default story mode",
          );

          res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
        });
    },
  );

  return router;
}

export const SaveAuthorDefaultStoryModeRequestModel = z.object({
  id: z.coerce.number().min(0),
  defaultStoryMode: z.enum(["360", "2d"]),
});
