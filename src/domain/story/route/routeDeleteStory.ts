import { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { DeleteStory } from "../../index.js";

export default function routeDeleteStory(
  log: Logger,
  deleteStory: DeleteStory,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.delete("/story/:storyId", ...(otherHandlers ?? []), (req, res) => {
    const parseResult = DeleteStoryRequestModel.safeParse({
      storyId: req.params.storyId,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    deleteStory(parseResult.data)
      .then(() => {
        res.status(204).send();
      })
      .catch((err) => {
        log.error(
          { err, deleteStoryRequest: parseResult.data },
          "Error deleting story",
        );

        res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
      });
  });

  return router;
}

export const DeleteStoryRequestModel = z.object({
  storyId: z.coerce.number().min(0),
});
