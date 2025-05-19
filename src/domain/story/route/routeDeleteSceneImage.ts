import { type RequestHandler, Router } from "express";
import type { Logger } from "pino";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { DeleteSceneImage } from "../../index.js";

function routeDeleteSceneImage(
  log: Logger,
  deleteSceneImage: DeleteSceneImage,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.delete(
    "/story/:storyId/scene/:sceneId/image/:imageId",
    ...(otherHandlers ?? []),
    (req, res) => {
      log.trace({ path: req.path }, "Deleting scene image");

      const parseResult = DeleteSceneImageRequestModel.safeParse({
        storyId: req.params.storyId,
        sceneId: req.params.sceneId,
        imageId: req.params.imageId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      deleteSceneImage(parseResult.data)
        .then(() => {
          res.status(204).send();
        })
        .catch((err) => {
          log.warn({ path: req.path, err }, "Error deleting scene image");

          res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
        });
    },
  );

  return router;
}

export default routeDeleteSceneImage;

export const DeleteSceneImageRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  sceneId: z.coerce.number().min(0),
  imageId: z.coerce.number().min(0),
});
