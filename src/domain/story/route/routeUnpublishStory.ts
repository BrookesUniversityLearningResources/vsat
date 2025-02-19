import { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { UnpublishStory } from "../../index.js";

function routeUnpublishStory(
  log: Logger,
  unpublishStory: UnpublishStory,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.delete(
    "/story/:storyId/publish",
    ...(otherHandlers ?? []),
    (req, res) => {
      const parseResult = UnpublishStoryRequestModel.safeParse({
        storyId: req.params.storyId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.Bad_Request));
        return;
      }

      unpublishStory(parseResult.data.storyId)
        .then((result) => {
          switch (result.kind) {
            case "unpublished": {
              return res.status(200).json(result.story);
            }

            case "unpublishingFailed": {
              log.debug({ result }, "Failed to unpublish story");

              if (
                result.errorCode ===
                ErrorCodes.UnableToUnpublishStoryThatIsNotPublished
              ) {
                return res
                  .status(400)
                  .json(errorCodedContext(result.errorCode, result));
              }

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
          log.warn({ err, parseResult }, "Failed to unpublish story");

          res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
        });
    },
  );

  return router;
}

export default routeUnpublishStory;

export const UnpublishStoryRequestModel = z.object({
  storyId: z.coerce.number().min(0),
});
