import type { MiddlewareHandler } from "astro";

import {
  demoIdentityFor,
  wantsSignedOutPreview,
} from "../authentication/demoRole.js";
import getEnvironment from "./getEnvironment.js";

/**
 * Astro [middleware](https://docs.astro.build/en/guides/middleware/) that
 * exposes the environment to
 * [the context](https://docs.astro.build/en/guides/middleware/#storing-data-in-contextlocals).
 *
 * Pages can then grab whatever they need from the environment in a typesafe
 * fashion.
 *
 * You'll almost certainly want to put this middleware first (or early) in the
 * midleware chain so that any subsequent middleware can use the environment.
 */
const exposeEnvironmentMiddleware: MiddlewareHandler = async (
  context,
  next,
) => {
  context.locals.environment = getEnvironment;

  const devBypassEnabled =
    process.env.DEV_AUTH_BYPASS === "1" ||
    process.env.DEV_AUTH_BYPASS === "true";

  const signedOutPreview = wantsSignedOutPreview(
    context.request.headers.get("cookie"),
  );

  if (devBypassEnabled && !signedOutPreview && !context.locals.user) {
    const { email: devEmail, name: devName } = demoIdentityFor(
      context.request.headers.get("cookie"),
      {
        email: process.env.DEV_AUTH_BYPASS_EMAIL ?? "dev@localhost",
        name: process.env.DEV_AUTH_BYPASS_NAME ?? "Dev User",
      },
    );

    try {
      const {
        database: { db },
      } = getEnvironment<App.WithDatabase>();

      const existing = await db
        .selectFrom("author")
        .selectAll()
        .where("author.email", "=", devEmail)
        .executeTakeFirst();

      const author =
        existing ??
        (await db
          .insertInto("author")
          .values({ name: devName, email: devEmail })
          .returningAll()
          .executeTakeFirstOrThrow());

      context.locals.user = {
        id: author.id,
        name: author.name,
        email: author.email,
      };
    } catch {
      // fall through without a user
    }
  }

  return next();
};

export default exposeEnvironmentMiddleware;
