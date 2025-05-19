import { type RequestHandler, Router } from "express";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { GetStory } from "../../index.js";

function routeGetStory(
  getStory: GetStory,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.get("/story/:storyId", ...(otherHandlers ?? []), (req, res) => {
    const parseResult = GetStoryRequestModel.safeParse({
      storyId: req.params.storyId,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    getStory({
      id: parseResult.data.storyId,
    })
      .then((story) => {
        if (!story) {
          res.status(404).json(errorCodedContext(ErrorCodes.StoryNotFound));
          return;
        }

        res.status(200).json(story);
      })
      .catch((err) => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
      });
  });

  return router;
}

export default routeGetStory;

export const GetStoryRequestModel = z.object({
  storyId: z.coerce.number().min(0),
});
