import { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { PublishStory } from "../../index.js";

function routePublishStory(
  log: Logger,
  publishStory: PublishStory,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.post(
    "/story/:storyId/publish",
    ...(otherHandlers ?? []),
    (req, res) => {
      const parseResult = PublishStoryRequestModel.safeParse({
        storyId: req.params.storyId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      publishStory(parseResult.data.storyId)
        .then((result) => {
          switch (result.kind) {
            case "published": {
              return res.status(200).json(result.story);
            }

            case "publishingFailed": {
              log.debug({ result }, "Failed to publish story");

              return res
                .status(500)
                .json(errorCodedContext(result.errorCode, result));
            }

            default: {
              return ((_: never) =>
                res.status(500).json(errorCodedContext(ErrorCodes.Absurd, _)))(
                result,
              );
            }
          }
        })
        .catch((err) => {
          log.warn({ err, parseResult }, "Failed to publish story");

          res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
        });
    },
  );

  return router;
}

export default routePublishStory;

export const PublishStoryRequestModel = z.object({
  storyId: z.coerce.number().min(0),
});
