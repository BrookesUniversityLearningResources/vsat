import type { RequestHandler } from "express";
import type { Logger } from "pino";

import type { RepositoryAuthor } from "../domain/index.js";
import type { PersistentUser } from "./types.js";

type DevAuthBypassOptions = {
  enabled: boolean;
  email: string;
  name: string;
};

const isLocalDevHost = (host: string) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "::1" ||
  host.endsWith(".localhost");

export default function devAuthBypass(
  log: Logger,
  repositoryAuthor: RepositoryAuthor,
  options: DevAuthBypassOptions,
): RequestHandler {
  if (!options.enabled) {
    return (_req, _res, next) => next();
  }

  let cachedUser: PersistentUser | null = null;
  let inflight: Promise<PersistentUser> | null = null;

  const getOrCreateUser = async () => {
    if (cachedUser) {
      return cachedUser;
    }

    if (inflight) {
      return inflight;
    }

    inflight = (async () => {
      const existing = await repositoryAuthor.getAuthorByEmail(options.email);

      if (existing) {
        cachedUser = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
        };
        return cachedUser;
      }

      const created = await repositoryAuthor.createAuthor({
        name: options.name,
        email: options.email,
      });

      cachedUser = {
        id: created.id,
        name: created.name,
        email: created.email,
      };

      return cachedUser;
    })();

    try {
      return await inflight;
    } finally {
      inflight = null;
    }
  };

  return (req, _res, next) => {
    if (req.user) {
      return next();
    }

    const host = req.hostname || req.host || "";
    if (!isLocalDevHost(host)) {
      log.warn({ host }, "Skipping dev auth bypass for non-local host");
      return next();
    }

    getOrCreateUser()
      .then((user) => {
        req.user = user;
        log.debug({ user, host }, "Dev auth bypass attached user to request");
        next();
      })
      .catch((err) => {
        log.warn({ err, host }, "Dev auth bypass failed to attach user");
        next(err);
      });
  };
}
