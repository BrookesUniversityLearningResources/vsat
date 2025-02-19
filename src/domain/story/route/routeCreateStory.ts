import url from "node:url";

import { Router } from "express";
import type { Logger } from "pino";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { SaveStory } from "../../index.js";

function routeCreateStory(log: Logger, createStory: SaveStory): Router {
  const router = Router();

  router.post("/story", (req, res) => {
    if (!req.user) {
      res.status(401).send();
      return;
    }

    createStory({
      title: "My story",
      author: req.user,
      scenes: [
        {
          title: "On the bus",
          content: "",
          isOpeningScene: true,
        },
      ],
    })
      .then((story) => {
        const location = url.format({
          protocol: req.protocol,
          host: req.get("host"),
          pathname: `/author/story/${story.id}`,
        });

        log.info({ location, story }, "Created story");

        res.status(201).setHeader("Location", location).send();
      })
      .catch((err) => {
        log.error({ err }, "Error creating story");

        res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
      });
  });

  return router;
}

export default routeCreateStory;
