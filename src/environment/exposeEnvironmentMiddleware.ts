import type { MiddlewareHandler } from "astro";

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
const exposeEnvironmentMiddleware: MiddlewareHandler = (context, next) => {
  context.locals.environment = getEnvironment;

  return next();
};

export default exposeEnvironmentMiddleware;
