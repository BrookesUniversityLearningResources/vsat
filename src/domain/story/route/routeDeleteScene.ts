import { type RequestHandler, Router } from "express";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { DeleteScene } from "../../index.js";

function routeDeleteScene(
  deleteScene: DeleteScene,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.delete(
    "/story/:storyId/scene/:sceneId",
    ...(otherHandlers ?? []),
    (req, res) => {
      const parseResult = DeleteSceneRequestModel.safeParse({
        storyId: req.params.storyId,
        sceneId: req.params.sceneId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      deleteScene(parseResult.data)
        .then(() => {
          res.status(204).send();
        })
        .catch((err) => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
        });
    },
  );

  return router;
}

export default routeDeleteScene;

export const DeleteSceneRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  sceneId: z.coerce.number().min(0),
});
