import { type RequestHandler, Router } from "express";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type { CreateSceneInStory } from "../../index.js";

export default function routeCreateScene(
  createScene: CreateSceneInStory,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.post("/story/:storyId/scene", ...(otherHandlers ?? []), (req, res) => {
    const parseResult = CreateSceneRequestModel.safeParse({
      storyId: req.params.storyId,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.Bad_Request));
      return;
    }

    createScene(parseResult.data)
      .then((scene) => {
        res.status(200).json(scene);
      })
      .catch((err) => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
      });
  });

  return router;
}

export const CreateSceneRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  locale: z.string().optional(),
  source: z
    .object({
      title: z.string().trim().min(1).optional(),
      content: z.string().trim().min(1).optional(),
      isOpeningScene: z.coerce.boolean().default(false).optional(),
    })
    .optional(),
});
