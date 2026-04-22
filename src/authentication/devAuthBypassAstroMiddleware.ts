import type { MiddlewareHandler } from "astro";

import type { PersistentUser } from "./types.js";

const isLocalDevHost = (host: string) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "::1" ||
  host.endsWith(".localhost");

let cachedUser: PersistentUser | null = null;
let inflight: Promise<PersistentUser> | null = null;

const devAuthBypassAstroMiddleware: MiddlewareHandler = async (
  context,
  next,
) => {
  const { log, repositoryAuthor } = context.locals.environment<
    App.WithLog & App.WithAuthorRepository
  >();

  const enabled =
    process.env.NODE_ENV === "development" &&
    (process.env.DEV_AUTH_BYPASS === "1" ||
      process.env.DEV_AUTH_BYPASS === "true");

  if (!enabled || context.locals.user) {
    return next();
  }

  const host = context.url.hostname;
  if (!isLocalDevHost(host)) {
    log.warn({ host }, "Skipping dev auth bypass for non-local Astro host");
    return next();
  }

  const email = process.env.DEV_AUTH_BYPASS_EMAIL ?? "dev@localhost";
  const name = process.env.DEV_AUTH_BYPASS_NAME ?? "Dev User";

  const getOrCreateUser = async () => {
    if (cachedUser) {
      return cachedUser;
    }

    if (inflight) {
      return inflight;
    }

    inflight = (async () => {
      const existing = await repositoryAuthor.getAuthorByEmail(email);

      if (existing) {
        cachedUser = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
        };
        return cachedUser;
      }

      const created = await repositoryAuthor.createAuthor({
        name,
        email,
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

  context.locals.user = await getOrCreateUser();
  log.debug(
    { user: context.locals.user, host },
    "Dev auth bypass attached user to Astro request",
  );

  return next();
};

export default devAuthBypassAstroMiddleware;
