import type { RequestHandler } from "express";
import type { Logger } from "pino";

import type { RepositoryAuthor } from "../domain/index.js";
import {
  type DemoIdentity,
  demoIdentityFor,
  wantsSignedOutPreview,
} from "./demoRole.js";
import type { PersistentUser } from "./types.js";

type DevAuthBypassOptions = {
  enabled: boolean;
  email: string;
  name: string;
  allowedHosts: string[];
};

const isLocalDevHost = (host: string) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "::1" ||
  host.endsWith(".localhost");

const hostWithoutPort = (host: string) => host.replace(/:\d+$/, "");

export default function devAuthBypass(
  log: Logger,
  repositoryAuthor: RepositoryAuthor,
  options: DevAuthBypassOptions,
): RequestHandler {
  if (!options.enabled) {
    return (_req, _res, next) => next();
  }

  // Keyed by email: the demo role bar can ask for a second author, and a
  // single cached user would hand back whichever identity arrived first.
  const cache = new Map<string, PersistentUser>();
  const inflight = new Map<string, Promise<PersistentUser>>();

  const getOrCreateUser = async (identity: DemoIdentity) => {
    const cached = cache.get(identity.email);
    if (cached) {
      return cached;
    }

    const pending = inflight.get(identity.email);
    if (pending) {
      return pending;
    }

    const load = (async () => {
      const existing = await repositoryAuthor.getAuthorByEmail(identity.email);

      const author =
        existing ??
        (await repositoryAuthor.createAuthor({
          name: identity.name,
          email: identity.email,
        }));

      const user: PersistentUser = {
        id: author.id,
        name: author.name,
        email: author.email,
      };

      cache.set(identity.email, user);
      return user;
    })();

    inflight.set(identity.email, load);

    try {
      return await load;
    } finally {
      inflight.delete(identity.email);
    }
  };

  return (req, _res, next) => {
    if (req.user) {
      return next();
    }

    if (wantsSignedOutPreview(req.headers.cookie)) {
      return next();
    }

    const host = hostWithoutPort(req.hostname || req.host || "");
    if (!isLocalDevHost(host) && !options.allowedHosts.includes(host)) {
      log.warn({ host }, "Skipping dev auth bypass for non-local host");
      return next();
    }

    const identity = demoIdentityFor(req.headers.cookie, {
      email: options.email,
      name: options.name,
    });

    getOrCreateUser(identity)
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
