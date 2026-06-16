import express, { type Express } from "express";

// @ts-expect-error Astro builds entry.mjs into dist/build/server/astro/ (see astro.config.mjs build.server)
import { handler as astroHandler } from "./astro/entry.mjs";

export default function attachAstroMiddleware(app: Express) {
  // https://docs.astro.build/en/guides/integrations-guide/node/
  app.use("/", express.static("dist/client/"));

  // delegate here because we want to expose the user (if any) on the .locals
  app.use((req, res, next) => astroHandler(req, res, next, { user: req.user }));
}
