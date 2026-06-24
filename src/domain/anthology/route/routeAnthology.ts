import express, { type RequestHandler, Router } from "express";
import { z } from "zod";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import type {
  AssignStoryToAnthology,
  CreateAnthology,
  DeleteAnthology,
  GetAnthology,
  GetAnthologies,
  GetAnthologyStories,
  RemoveStoryFromAnthology,
  UpdateAnthology,
} from "../types.js";
import type {
  CreateInterpretiveNote,
  GetInterpretiveNotes,
} from "../interpretiveNotes.js";
import type { GetStoryLinksForStory, StoryLinkSummary } from "../../index.js";

function routeAnthology(
  createAnthology: CreateAnthology,
  getAnthology: GetAnthology,
  getAnthologies: GetAnthologies,
  updateAnthology: UpdateAnthology,
  deleteAnthology: DeleteAnthology,
  assignStoryToAnthology: AssignStoryToAnthology,
  removeStoryFromAnthology: RemoveStoryFromAnthology,
  getAnthologyStories: GetAnthologyStories,
  createInterpretiveNote: CreateInterpretiveNote,
  getInterpretiveNotes: GetInterpretiveNotes,
  getStoryLinksForStory: GetStoryLinksForStory,
  ...otherHandlers: RequestHandler[]
): Router {
  const router = Router();

  router.post(
    "/anthology",
    ...(otherHandlers ?? []),
    express.json(),
    (req, res) => {
      if (!req.user) {
        res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = CreateAnthologyRequestModel.safeParse(req.body);

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      createAnthology(parseResult.data)
        .then((anthology) => {
          res.status(201).json(anthology);
        })
        .catch(() => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error));
        });
    },
  );

  router.get("/anthology", ...(otherHandlers ?? []), (_req, res) => {
    getAnthologies()
      .then((anthologies) => {
        res.status(200).json({ anthologies });
      })
      .catch(() => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error));
      });
  });

  router.get("/anthology/:anthologyId", ...(otherHandlers ?? []), (req, res) => {
    const parseResult = GetAnthologyRequestModel.safeParse({
      anthologyId: req.params.anthologyId,
    });

    if (!parseResult.success) {
      res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
      return;
    }

    Promise.all([
      getAnthology(parseResult.data.anthologyId),
      getAnthologyStories(parseResult.data.anthologyId),
    ])
      .then(([anthology, stories]) => {
        if (!anthology) {
          res.status(404).json(errorCodedContext(ErrorCodes.StoryNotFound));
          return;
        }

        res.status(200).json({ anthology, stories });
      })
      .catch(() => {
        res.status(500).json(errorCodedContext(ErrorCodes.Error));
      });
  });

  router.patch(
    "/anthology/:anthologyId",
    ...(otherHandlers ?? []),
    express.json(),
    (req, res) => {
      if (!req.user) {
        res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = UpdateAnthologyRequestModel.safeParse({
        anthologyId: req.params.anthologyId,
        ...req.body,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      updateAnthology(parseResult.data)
        .then((anthology) => {
          if (!anthology) {
            res.status(404).json(errorCodedContext(ErrorCodes.StoryNotFound));
            return;
          }
          res.status(200).json(anthology);
        })
        .catch(() => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error));
        });
    },
  );

  router.delete(
    "/anthology/:anthologyId",
    ...(otherHandlers ?? []),
    (req, res) => {
      if (!req.user) {
        res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = GetAnthologyRequestModel.safeParse({
        anthologyId: req.params.anthologyId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      deleteAnthology(parseResult.data.anthologyId)
        .then(() => {
          res.status(204).send();
        })
        .catch(() => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error));
        });
    },
  );

  router.post(
    "/anthology/:anthologyId/stories",
    ...(otherHandlers ?? []),
    express.json(),
    (req, res) => {
      if (!req.user) {
        res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = AssignStoryToAnthologyRequestModel.safeParse({
        anthologyId: req.params.anthologyId,
        storyId: req.body?.storyId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      assignStoryToAnthology(parseResult.data)
        .then(() => {
          res.status(204).send();
        })
        .catch(() => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error));
        });
    },
  );

  router.delete(
    "/anthology/:anthologyId/stories/:storyId",
    ...(otherHandlers ?? []),
    (req, res) => {
      if (!req.user) {
        res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = AssignStoryToAnthologyRequestModel.safeParse({
        anthologyId: req.params.anthologyId,
        storyId: req.params.storyId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      removeStoryFromAnthology(parseResult.data)
        .then(() => {
          res.status(204).send();
        })
        .catch(() => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error));
        });
    },
  );

  router.post(
    "/anthology/:anthologyId/notes",
    ...(otherHandlers ?? []),
    express.json(),
    (req, res) => {
      if (!req.user) {
        res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
        return;
      }

      const parseResult = CreateInterpretiveNoteRequestModel.safeParse({
        anthologyId: req.params.anthologyId,
        storyId: req.body?.storyId,
        note: req.body?.note,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      createInterpretiveNote({
        anthologyId: parseResult.data.anthologyId,
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

  router.get(
    "/anthology/:anthologyId/notes",
    ...(otherHandlers ?? []),
    (req, res) => {
      const parseResult = GetAnthologyRequestModel.safeParse({
        anthologyId: req.params.anthologyId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      getInterpretiveNotes(parseResult.data.anthologyId)
        .then((notes) => {
          res.status(200).json({ notes });
        })
        .catch(() => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error));
        });
    },
  );

  router.get(
    "/anthology/:anthologyId/report",
    ...(otherHandlers ?? []),
    (req, res) => {
      const parseResult = GetAnthologyRequestModel.safeParse({
        anthologyId: req.params.anthologyId,
      });

      if (!parseResult.success) {
        res.status(400).json(errorCodedContext(ErrorCodes.BadRequest));
        return;
      }

      Promise.all([
        getAnthology(parseResult.data.anthologyId),
        getAnthologyStories(parseResult.data.anthologyId),
        getInterpretiveNotes(parseResult.data.anthologyId),
      ])
        .then(async ([anthology, stories, notes]) => {
          if (!anthology) {
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
            anthology,
            stories,
            links,
            notes,
            stats,
          });
        })
        .catch(() => {
          res.status(500).json(errorCodedContext(ErrorCodes.Error));
        });
    },
  );

  return router;
}

export default routeAnthology;

const CreateAnthologyRequestModel = z.object({
  title: z.string().trim().min(3).max(120),
  question: z.string().trim().min(5).max(2000),
  partner: z.string().trim().min(2).max(120).optional(),
  status: z.enum(["draft", "active", "complete"]).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
});

const UpdateAnthologyRequestModel = z.object({
  anthologyId: z.coerce.number().min(0),
  title: z.string().trim().min(3).max(120).optional(),
  question: z.string().trim().min(5).max(2000).optional(),
  partner: z.string().trim().min(2).max(120).nullable().optional(),
  status: z.enum(["draft", "active", "complete"]).optional(),
});

const GetAnthologyRequestModel = z.object({
  anthologyId: z.coerce.number().min(0),
});

const AssignStoryToAnthologyRequestModel = z.object({
  anthologyId: z.coerce.number().min(0),
  storyId: z.coerce.number().min(0),
});

const CreateInterpretiveNoteRequestModel = z.object({
  anthologyId: z.coerce.number().min(0),
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
