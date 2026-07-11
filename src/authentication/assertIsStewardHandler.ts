import type { RequestHandler } from "express";
import type { Logger } from "pino";

import { ErrorCodes } from "../domain/error/errorCode.js";
import { errorCodedContext } from "../domain/error/errorCodedContext.js";
import isStewardUser from "./isStewardUser.js";

/**
 * Build Express middleware asserting that the current user is a steward.
 *
 * Steward is the curator role in the VSATLAS model: it gates anthology
 * curation and (later) the anthology-scoped pinned-position writes, mirroring
 * the existing steward gate on link retirement. Reuses `isStewardUser`
 * (STEWARD_EMAILS, the `*` dev wildcard, and the DEV_STEWARD_TOGGLE cookie),
 * so the dev auth story is identical to the rest of the app.
 *
 * Plug this middleware into the mutating routes that curate shared shelves;
 * leave public GET routes ungated.
 */
export default function assertIsStewardHandler(log: Logger): RequestHandler {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json(errorCodedContext(ErrorCodes.Unauthorized));
      return;
    }

    if (!isStewardUser(req.user, req.headers.cookie)) {
      log.debug(
        { user: req.user, path: req.path },
        "Declining to continue: current user is not a steward",
      );
      res.status(403).json(errorCodedContext(ErrorCodes.Unauthorized));
      return;
    }

    next();
  };
}
