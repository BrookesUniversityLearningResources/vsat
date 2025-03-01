import { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { GetPublishedStorySummaries } from "../../index.js";

export default function routeGetPublishedStories(
  log: Logger,
  getPublishedStories: GetPublishedStorySummaries,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.get("/story/published", ...(otherHandlers ?? []), (req, res) => {
    const parseResult = GetPublishedStoriesRequestModel.safeParse({
      // TODO: grab the filtering and pagination
    });

    if (!parseResult.success) {
      log.warn(
        { result: parseResult.error, req },
        "Bad request getting published stories",
      );

      res.status(400).json(errorCodedContext(ErrorCodes.Bad_Request));
      return;
    }

    getPublishedStories(parseResult.data)
      .then((stories) => {
        res.status(200).json({
          // TODO: echo back the filtering and pagination
          stories,
        });
      })
      .catch((err) => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
      });
  });

  return router;
}

const GetPublishedStoriesRequestModel = z.object({
  // TODO: add filtering and pagination
});
