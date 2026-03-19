import type { Server } from "node:http";

import express, { type RequestHandler } from "express";

import type { ServerConfig } from "../environment/config.js";
import attachAstroMiddleware from "./attachAstroMiddleware.js";

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

  attachAstroMiddleware(app);

  const startServer = async () => {
    const server = app.listen(config.port);
    return { server, config };
  };

  return startServer;
}

export default createServer;
