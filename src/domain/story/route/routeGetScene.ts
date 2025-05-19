import { type RequestHandler, Router } from "express";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { GetScene } from "../../index.js";

function routeGetScene(
  getScene: GetScene,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.get(
    "/story/:storyId/scene/:sceneId",
    ...(otherHandlers ?? []),
    (req, res) => {
      const parseResult = GetSceneRequestModel.safeParse({
        storyId: req.params.storyId,
        sceneId: req.params.sceneId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      getScene(parseResult.data)
        .then((scene) => {
          if (!scene) {
            res.status(404).json(errorCodedContext(ErrorCodes.SceneNotFound));
          } else {
            res.status(200).json(scene);
          }
        })
        .catch((err) => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
        });
    },
  );

  return router;
}

export default routeGetScene;

export const GetSceneRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  sceneId: z.coerce.number().min(0),
});
