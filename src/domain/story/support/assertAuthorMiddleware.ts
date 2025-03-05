import type { MiddlewareHandler } from "astro";

import { ErrorCodes } from "../../error/errorCode.js";
import toStoryId from "../toStoryId.js";
import isAuthorOfTheStory from "./isAuthorOfTheStory.js";

/**
 * Astro middleware asserting that the current user is the author of the story.
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

      if (!isAuthor) {
        log.warn(
          {
            req: context.request,
            path: context.routePattern,
            storyId,
            authorId,
          },
          "The current user is not the author of the story",
        );

        return context.redirect(`/author/story?err=${ErrorCodes.Unauthorized}`);
      }

      return next();
    } catch (err) {
      return context.redirect(`/?err=${ErrorCodes.Error}`);
    }
  }

  return next();
};

export default assertAuthorMiddleware;
