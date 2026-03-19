import express, { type RequestHandler, Router } from "express";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import isStewardUser from "../../../authentication/isStewardUser.js";
import {
  LinkVoteValues,
  StoryLinkStatuses,
  StoryLinkTypes,
  type CreateStoryLink,
  type GetStoryLinksForStory,
  type RetireStoryLink,
  type VoteOnStoryLink,
} from "../../index.js";

function routeStoryLinks(
  createStoryLink: CreateStoryLink,
  getStoryLinksForStory: GetStoryLinksForStory,
  voteOnStoryLink: VoteOnStoryLink,
  retireStoryLink: RetireStoryLink,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.get("/story/:storyId/links", ...(otherHandlers ?? []), (req, res) => {
    const parseResult = StoryLinksForStoryRequestModel.safeParse({
      storyId: req.params.storyId,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    getStoryLinksForStory(parseResult.data.storyId)
      .then((links) => {
        res.status(200).json({ links });
      })
      .catch((err) => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
      });
  });

  router.post(
    "/story/:storyId/links",
    ...(otherHandlers ?? []),
    express.json(),
    (req, res) => {
      if (!req.user) {
        res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

    const parseResult = CreateStoryLinkRequestModel.safeParse({
      storyId: req.params.storyId,
      toStoryId: req.body?.toStoryId,
      toSceneId: req.body?.toSceneId,
      toPageNumber: req.body?.toPageNumber,
      linkType: req.body?.linkType,
      rationale: req.body?.rationale,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    if (parseResult.data.storyId === parseResult.data.toStoryId) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

      createStoryLink({
        fromStoryId: parseResult.data.storyId,
        toStoryId: parseResult.data.toStoryId,
        toSceneId: parseResult.data.toSceneId ?? null,
        toPageNumber: parseResult.data.toPageNumber ?? null,
        linkType: parseResult.data.linkType,
        rationale: parseResult.data.rationale,
        createdBy: req.user.id,
      })
        .then((link) => {
          res.status(201).json(link);
        })
        .catch((err) => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
        });
    },
  );

  router.post("/links/:linkId/vote", ...(otherHandlers ?? []), express.json(), (req, res) => {
    if (!req.user) {
      res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
      return;
    }

    const parseResult = VoteOnStoryLinkRequestModel.safeParse({
      linkId: req.params.linkId,
      vote: req.body?.vote,
      comment: req.body?.comment,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    voteOnStoryLink({
      linkId: parseResult.data.linkId,
      userId: req.user.id,
      vote: parseResult.data.vote,
      comment: parseResult.data.comment,
    })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((err) => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
      });
  });

  router.post("/links/:linkId/retire", ...(otherHandlers ?? []), (req, res) => {
    if (!req.user) {
      res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
      return;
    }

    if (!isStewardUser(req.user, req.headers.cookie)) {
      res.status(403).json(errorCodedContext(ErrorCodes.Unauthorized));
      return;
    }

    const parseResult = RetireStoryLinkRequestModel.safeParse({
      linkId: req.params.linkId,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    retireStoryLink({
      linkId: parseResult.data.linkId,
      userId: req.user.id,
    })
      .then((link) => {
        res.status(200).json(link);
      })
      .catch((err) => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error, err));
      });
  });

  return router;
}

export default routeStoryLinks;

export const StoryLinksForStoryRequestModel = z.object({
  storyId: z.coerce.number().min(0),
});

export const CreateStoryLinkRequestModel = z.object({
  storyId: z.coerce.number().min(0),
  toStoryId: z.coerce.number().min(0),
  toSceneId: z.coerce.number().min(0).optional().nullable(),
  toPageNumber: z.coerce.number().min(1).optional().nullable(),
  linkType: z.enum(StoryLinkTypes),
  rationale: z.string().trim().min(3).max(2000),
  status: z.enum(StoryLinkStatuses).optional(),
});

export const VoteOnStoryLinkRequestModel = z.object({
  linkId: z.coerce.number().min(0),
  vote: z.enum(LinkVoteValues),
  comment: z.string().trim().min(1).max(2000).optional(),
});

export const RetireStoryLinkRequestModel = z.object({
  linkId: z.coerce.number().min(0),
});
