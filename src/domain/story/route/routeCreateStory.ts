import { Router } from "express";
import type { Logger } from "pino";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { CreateStory } from "../../index.js";

export default function routeCreateStory(
  log: Logger,
  createStory: CreateStory,
): Router {
  const router = Router();

  router.post("/story", (req, res) => {
    if (!req.user) {
      res.status(401).send();
      return;
    }

    createStory({
      author: req.user,
    })
      .then((story) => {
        log.info({ story }, "Created story");

        res.status(200).json({
          id: story.id,
        });
      })
      .catch((err) => {
        log.error({ err }, "Error creating story");

        res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
      });
  });

  return router;
}
