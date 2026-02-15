import type { RequestHandler } from "express";
import type { Logger } from "pino";

import type { AuthenticationConfig } from "../environment/config.js";

/**
 * Build (Express) middleware that guards paths requiring an authenticated user.
 */
export default function authenticationRequired(
  log: Logger,
  paths: AuthenticationConfig["pathsRequiringAuthentication"],
): RequestHandler {
  if (paths.length === 0) {
    log.warn("No paths require authentication: do you need this middleware?");

    return (_req, _res, next) => next();
  }

  const requiresAuth = requiresAuthentication(paths);

  return (req, res, next) => {
    const path = req.path;

    if (req.user) {
      log.trace({ user: req.user, path }, "Request has authenticated user");

      return next();
    }

    if (requiresAuth(path)) {
      log.trace({ path }, "Request requires authenticated user");

      return res.redirect("/login");
    }

    log.trace({ path }, "Request does not require authenticated user");

    return next();
  };
}

function requiresAuthentication(
  paths: AuthenticationConfig["pathsRequiringAuthentication"],
) {
  const patterns = paths.map((path) => new URLPattern({ pathname: path }));

  return (path: string) => !!patterns.find((pattern) => pattern.test(path));
}
