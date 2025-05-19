import express, { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import type { SaveAuthorNameInDatabase } from "../../../database/schema.js";
import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";

export default function routeSaveAuthorName(
  log: Logger,
  saveAuthorName: SaveAuthorNameInDatabase,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.put(
    "/author/:authorId/name",
    ...(otherHandlers ?? []),
    express.text(),
    (req, res) => {
      if (!req.user) {
        res.status(401).send(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = SaveAuthorNameRequestModel.safeParse({
        id: req.params.authorId,
        name: req.body,
      });

      if (!parseResult.success) {
        log.warn({ parseResult }, "Bad request when saving author name");

        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      const { id, name } = parseResult.data;

      if (id !== req.user.id) {
        log.warn(
          { req },
          "Rejecting attempt to change the name of another author",
        );

        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      saveAuthorName({ id, name })
        .then(() => {
          res.status(204).send();
        })
        .catch((err) => {
          log.warn({ err, id, name }, "Error saving author name");

          res
            .status(500)
            .json(errorCodedContext(ErrorCodes.ErrorSavingSceneContent, err));
        });
    },
  );

  return router;
}

export const SaveAuthorNameRequestModel = z.object({
  id: z.coerce.number().min(0),
  name: z.string().trim().min(3).max(50),
});
