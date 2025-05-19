import { type RequestHandler, Router } from "express";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { DeleteSceneAudio } from "../../index.js";

function routeDeleteSceneAudio(
  deleteSceneAudio: DeleteSceneAudio,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.delete(
    "/story/:storyId/scene/:sceneId/audio/:audioId",
    ...(otherHandlers ?? []),
    (req, res) => {
      const parseResult = DeleteSceneAudioRequestModel.safeParse({
        storyId: req.params.storyId,
        sceneId: req.params.sceneId,
        audioId: req.params.audioId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      deleteSceneAudio(parseResult.data)
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

export default routeDeleteSceneAudio;

export const DeleteSceneAudioRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  sceneId: z.coerce.number().min(0),
  audioId: z.coerce.number().min(0),
});
