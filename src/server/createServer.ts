import type { Server } from "node:http";

import express, { type RequestHandler } from "express";

import type { ServerConfig } from "../environment/config.js";
// @ts-expect-error See the "outDir" in astro.config.mjs
import { handler as astroHandler } from "./astro/entry.mjs";

type StartServerResult = {
  server: Server;
  config: ServerConfig;
};

/**
 * Start the server.
 *
 * This doesn't _need_ to be asynchronous but we're explicitly making it such so
 * that we can continue to chain invocations upstream.
 */
export type StartServer = () => Promise<StartServerResult>;

function createServer(
  config: ServerConfig,
  routes: RequestHandler[],
  middlewares: RequestHandler[],
): StartServer {
  const app = express();

  for (const middleware of middlewares) {
    app.use(middleware);
  }

  for (const route of routes) {
    app.use(route);
  }

  // https://docs.astro.build/en/guides/integrations-guide/node/
  app.use("/", express.static("dist/client/"));

  // delegate here because we want to expose the user (if any) on the .locals
  app.use((req, res, next) => astroHandler(req, res, next, { user: req.user }));

  const startServer = async () => {
    const server = app.listen(config.port);
    return { server, config };
  };

  return startServer;
}

export default createServer;
