import type { RequestHandler } from "express";
import type { Logger } from "pino";

import toStoryId from "../toStoryId.js";
import type { IsAuthorOfTheStory } from "./isAuthorOfTheStory.js";

/**
 * Build Express middleware asserting that the current user is the author of the
 * story.
 *
 * Plug this middleware into routes of the form `/story/:storyId/...`
 */
export default function assertIsAuthorOfTheStoryHandler(
  log: Logger,
  isAuthorOfTheStory: IsAuthorOfTheStory,
): RequestHandler {
  return (req, _res, next) => {
    log.trace({ author: req.user, path: req.path }, "Asserting authorship");

    if (!req.user) {
      const message =
        "Asserting story authorship requires an authenticated user: no user found on the request";
      log.debug({ req }, message);
      return next(new Error(message));
    }

    const storyId = toStoryId(req.params.storyId);

    if (!storyId) {
      log.warn(
        { req },
        "No parameter 'storyId' found in the URL path; is this handler configured correctly?",
      );

      return next();
    }

    isAuthorOfTheStory({ storyId, authorId: req.user.id })
      .then((isAuthor) => {
        if (isAuthor) {
          log.trace(
            { author: req.user, path: req.path },
            "Asserted story authorship",
          );

          return next();
        }

        const message = `Declining to continue processing request because the current user is not the author of the story with ID "${storyId}"`;
        log.debug({ req, author: req.user, storyId }, message);
        return next(new Error(message));
      })
      .catch(next);
  };
}
