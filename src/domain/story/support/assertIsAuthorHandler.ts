import type { RequestHandler } from "express";
import type { Logger } from "pino";

/**
 * Build Express middleware asserting that there is a current user (author).
 *
 * Plug this middleware into routes where a logged-in user is required.
 */
export default function assertIsAuthorHandler(log: Logger): RequestHandler {
  return (req, _res, next) => {
    log.trace({ author: req.user, path: req.path }, "Asserting author");

    if (!req.user) {
      log.debug(
        { req },
        "The assert author handler requires an authenticated user: no user found on the request",
      );

      return next(
        new Error(
          "The assert author handler requires an authenticated user: no user found on the request",
        ),
      );
    }

    return next();
  };
}
