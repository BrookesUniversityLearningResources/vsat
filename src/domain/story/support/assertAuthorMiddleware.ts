import type { MiddlewareHandler } from "astro";

import isStewardUser from "../../../authentication/isStewardUser.js";
import { ErrorCodes } from "../../error/errorCode.js";
import toStoryId from "../toStoryId.js";
import isAuthorOfTheStory from "./isAuthorOfTheStory.js";

/**
 * Astro middleware asserting that the current user may edit the story:
 * its author, or a steward (story editing was widened to author-or-steward
 * with the edit changelog, 2026-07 — the API routes already honour this;
 * this middleware predated it and used to check plain authorship only,
 * locking stewards out of the editor UI they were allowed to write through).
 *
 * This middleware will fire for all requests but will target Astro pages/routes
 * of the form `/author/story/:storyId/...`
 */
const assertAuthorMiddleware: MiddlewareHandler = async (context, next) => {
  const {
    log,
    database: { db },
  } = context.locals.environment<App.WithLog & App.WithDatabase>();

  if (!context.routePattern.startsWith("/author")) {
    return next();
  }

  if (!context.locals.user) {
    log.info(
      { req: context.request },
      "The assert author middleware requires an authenticated user: no user found on the request",
    );

    return context.redirect(`/login?err=${ErrorCodes.MustBeLoggedIn}`);
  }

  if (context.routePattern.endsWith("/links")) {
    return next();
  }

  const storyId = toStoryId(context.params.storyId);

  if (storyId !== null && context.locals.user.id !== undefined) {
    const authorId = context.locals.user.id;

    log.trace(
      { path: context.routePattern, storyId, authorId },
      "Asserting authorship",
    );

    try {
      const isAuthor = await isAuthorOfTheStory(db)({
        authorId,
        storyId,
      });

      if (
        !isAuthor &&
        !isStewardUser(
          context.locals.user,
          context.request.headers.get("cookie"),
        )
      ) {
        log.warn(
          {
            req: context.request,
            path: context.routePattern,
            storyId,
            authorId,
          },
          "The current user is neither the author of the story nor a steward",
        );

        return context.redirect(`/author/story?err=${ErrorCodes.Unauthorized}`);
      }

      return next();
    } catch {
      return context.redirect(`/?err=${ErrorCodes.Error}`);
    }
  }

  return next();
};

export default assertAuthorMiddleware;
