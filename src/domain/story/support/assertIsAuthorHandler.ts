import type { RequestHandler } from "express";
import type { Logger } from "pino";

import { ErrorCodes } from "../../error/errorCode.js";
import { errorCodedContext } from "../../error/errorCodedContext.js";

/**
 * Build Express middleware asserting that there is a current user (author).
 *
 * Plug this middleware into routes where a logged-in user is required.
 */
export default function assertIsAuthorHandler(log: Logger): RequestHandler {
  return (req, res, next) => {
    log.trace({ author: req.user, path: req.path }, "Asserting author");

    if (!req.user) {
      log.debug(
        { req },
        "The assert author handler requires an authenticated user: no user found on the request",
      );

      res
        .status(401)
        .json(errorCodedContext(ErrorCodes.Unauthorized));

      return;
    }

    return next();
  };
}
