import express, { type RequestHandler, Router } from "express";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type {
  AssignStoryToPilot,
  CreatePilot,
  GetPilot,
  GetPilotStories,
} from "../types.js";
import type {
  CreateInterpretiveNote,
  GetInterpretiveNotes,
} from "../interpretiveNotes.js";
import type { GetStoryLinksForStory, StoryLinkSummary } from "../../index.js";

function routePilot(
  createPilot: CreatePilot,
  getPilot: GetPilot,
  getPilots: import("../types.js").GetPilots,
  assignStoryToPilot: AssignStoryToPilot,
  getPilotStories: GetPilotStories,
  createInterpretiveNote: CreateInterpretiveNote,
  getInterpretiveNotes: GetInterpretiveNotes,
  getStoryLinksForStory: GetStoryLinksForStory,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.post("/pilot", ...(otherHandlers ?? []), express.json(), (req, res) => {
    if (!req.user) {
      res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
      return;
    }

    const parseResult = CreatePilotRequestModel.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    createPilot(parseResult.data)
      .then((pilot) => {
        res.status(201).json(pilot);
      })
      .catch(() => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error));
      });
  });

  router.get("/pilot", ...(otherHandlers ?? []), (_req, res) => {
    getPilots()
      .then((pilots) => {
        res.status(200).json({ pilots });
      })
      .catch(() => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error));
      });
  });

  router.get("/pilot/:pilotId", ...(otherHandlers ?? []), (req, res) => {
    const parseResult = GetPilotRequestModel.safeParse({
      pilotId: req.params.pilotId,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    Promise.all([
      getPilot(parseResult.data.pilotId),
      getPilotStories(parseResult.data.pilotId),
    ])
      .then(([pilot, stories]) => {
        if (!pilot) {
          res.status(404).json(errorCodedContext(ErrorCodes.StoryNotFound));
          return;
        }

        res.status(200).json({ pilot, stories });
      })
      .catch(() => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error));
      });
  });

  router.post(
    "/pilot/:pilotId/stories",
    ...(otherHandlers ?? []),
    express.json(),
    (req, res) => {
      if (!req.user) {
        res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = AssignStoryToPilotRequestModel.safeParse({
        pilotId: req.params.pilotId,
        storyId: req.body?.storyId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      assignStoryToPilot(parseResult.data)
        .then(() => {
          res.status(204).send();
        })
      .catch(() => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error));
      });
    },
  );

  router.post(
    "/pilot/:pilotId/notes",
    ...(otherHandlers ?? []),
    express.json(),
    (req, res) => {
      if (!req.user) {
        res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = CreateInterpretiveNoteRequestModel.safeParse({
        pilotId: req.params.pilotId,
        storyId: req.body?.storyId,
        note: req.body?.note,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      createInterpretiveNote({
        pilotId: parseResult.data.pilotId,
        storyId: parseResult.data.storyId,
        authorId: req.user.id,
        note: parseResult.data.note,
      })
        .then((note) => {
          res.status(201).json(note);
        })
        .catch(() => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error));
        });
    },
  );

  router.get("/pilot/:pilotId/notes", ...(otherHandlers ?? []), (req, res) => {
    const parseResult = GetPilotRequestModel.safeParse({
      pilotId: req.params.pilotId,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    getInterpretiveNotes(parseResult.data.pilotId)
      .then((notes) => {
        res.status(200).json({ notes });
      })
      .catch(() => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error));
      });
  });

  router.get("/pilot/:pilotId/report", ...(otherHandlers ?? []), (req, res) => {
    const parseResult = GetPilotRequestModel.safeParse({
      pilotId: req.params.pilotId,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    Promise.all([
      getPilot(parseResult.data.pilotId),
      getPilotStories(parseResult.data.pilotId),
      getInterpretiveNotes(parseResult.data.pilotId),
    ])
      .then(async ([pilot, stories, notes]) => {
        if (!pilot) {
          res.status(404).json(errorCodedContext(ErrorCodes.StoryNotFound));
          return;
        }

        const linkLists = await Promise.all(
          stories.map((story) => getStoryLinksForStory(story.id)),
        );

        const linkMap = new Map<number, StoryLinkSummary>();
        for (const links of linkLists) {
          for (const link of links) {
            linkMap.set(link.id, link);
          }
        }

        const links = Array.from(linkMap.values());
        const stats = {
          totalLinks: links.length,
          byStatus: countBy(links, (link) => link.status),
          byType: countBy(links, (link) => link.linkType),
          acceptedRatio:
            links.length === 0
              ? 0
              : (countBy(links, (link) => link.status).accepted ?? 0) /
                links.length,
        };

        res.status(200).json({
          pilot,
          stories,
          links,
          notes,
          stats,
        });
      })
      .catch(() => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error));
      });
  });

  return router;
}

export default routePilot;

const CreatePilotRequestModel = z.object({
  title: z.string().trim().min(3).max(120),
  question: z.string().trim().min(5).max(2000),
  partner: z.string().trim().min(2).max(120).optional(),
  status: z.enum(["draft", "active", "complete"]).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
});

const GetPilotRequestModel = z.object({
  pilotId: z.coerce.number().min(0),
});

const AssignStoryToPilotRequestModel = z.object({
  pilotId: z.coerce.number().min(0),
  storyId: z.coerce.number().min(0),
});

const CreateInterpretiveNoteRequestModel = z.object({
  pilotId: z.coerce.number().min(0),
  storyId: z.coerce.number().min(0),
  note: z.string().trim().min(3).max(5000),
});

function countBy<T>(
  items: ReadonlyArray<T>,
  getKey: (item: T) => string,
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
