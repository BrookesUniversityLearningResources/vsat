import type { MiddlewareHandler } from "astro";

import { demoIdentityFor, wantsSignedOutPreview } from "./demoRole.js";
import type { PersistentUser } from "./types.js";

const isLocalDevHost = (host: string) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "::1" ||
  host.endsWith(".localhost");

const cache = new Map<string, PersistentUser>();

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

  if (
    !enabled ||
    context.locals.user ||
    wantsSignedOutPreview(context.request.headers.get("cookie"))
  ) {
    return next();
  }

  const host = context.url.hostname;
  if (!isLocalDevHost(host)) {
    log.warn({ host }, "Skipping dev auth bypass for non-local Astro host");
    return next();
  }

  const { email, name } = demoIdentityFor(
    context.request.headers.get("cookie"),
    {
      email: process.env.DEV_AUTH_BYPASS_EMAIL ?? "dev@localhost",
      name: process.env.DEV_AUTH_BYPASS_NAME ?? "Dev User",
    },
  );

  const getOrCreateUser = async (): Promise<PersistentUser> => {
    const cached = cache.get(email);
    if (cached) {
      return cached;
    }

    const existing = await repositoryAuthor.getAuthorByEmail(email);
    const author =
      existing ?? (await repositoryAuthor.createAuthor({ name, email }));

    const user: PersistentUser = {
      id: author.id,
      name: author.name,
      email: author.email,
    };

    cache.set(email, user);
    return user;
  };

  context.locals.user = await getOrCreateUser();
  log.debug(
    { user: context.locals.user, host },
    "Dev auth bypass attached user to Astro request",
  );

  return next();
};

export default devAuthBypassAstroMiddleware;
