/**
 * @see https://docs.astro.build/en/guides/middleware/
 */
import { sequence } from "astro:middleware";

import assertAuthor from "./domain/story/support/assertAuthorMiddleware.js";
import exposeEnvironment from "./environment/exposeEnvironmentMiddleware.js";

export const onRequest = sequence(
  /* the environment must be exposed first */ exposeEnvironment,
  assertAuthor,
);
