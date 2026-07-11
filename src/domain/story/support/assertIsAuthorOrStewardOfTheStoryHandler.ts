import type { RequestHandler } from "express";
import type { Logger } from "pino";

import isStewardUser from "../../../authentication/isStewardUser.js";
import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";
import toStoryId from "../toStoryId.js";
import type { IsAuthorOfTheStory } from "./isAuthorOfTheStory.js";

/**
 * Build Express middleware asserting that the current user may act on the
 * story as an author would: either they authored it, OR they are a steward.
 *
 * This is the story-scoped half of the VSATLAS permission model (see
 * docs/missions/M-anthology-auth.md): a steward may restructure any story
 * (e.g. from the planetarium in a workshop), the owner always can. It composes
 * the steward predicate (`isStewardUser`) with the same authorship check as
 * `assertIsAuthorOfTheStory`, checking steward first so a steward never needs
 * a database round-trip.
 *
 * NOTE: widening story editing to stewards makes "who changed my scene?" a
 * real question — the edit changelog (docs/missions/M-edit-changelog.md) is
 * the accountability counterweight and should be live wherever this gate is.
 *
 * Plug this middleware into routes of the form `/story/:storyId/...`
 */
export default function assertIsAuthorOrStewardOfTheStoryHandler(
  log: Logger,
  isAuthorOfTheStory: IsAuthorOfTheStory,
): RequestHandler {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
      return;
    }

    // Steward shortcut: a steward acts on any story, no authorship lookup.
    if (isStewardUser(req.user, req.headers.cookie)) {
      log.trace(
        { user: req.user, path: req.path },
        "Asserted story access via steward role",
      );
      return next();
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
          return next();
        }

        const message = `Declining to continue processing request because the current user is neither the author of the story with ID "${storyId}" nor a steward`;
        log.debug({ req, user: req.user, storyId }, message);

        res
          .status(403)
          .json(errorCodedContext(ErrorCodes.Unauthorized, { storyId }));

        return;
      })
      .catch(next);
  };
}
