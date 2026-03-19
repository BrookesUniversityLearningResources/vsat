import type { Server } from "node:http";

import express, { type RequestHandler } from "express";

import type { ServerConfig } from "../environment/config.js";

type StartServerResult = {
  server: Server;
  config: ServerConfig;
};

export type StartApiServer = () => Promise<StartServerResult>;

function createApiServer(
  config: ServerConfig,
  routes: RequestHandler[],
  middlewares: RequestHandler[],
): StartApiServer {
  const app = express();

  for (const middleware of middlewares) {
    app.use(middleware);
  }

  for (const route of routes) {
    app.use(route);
  }

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  const startServer = async () => {
    const server = app.listen(config.port);
    return { server, config };
  };

  return startServer;
}

export default createApiServer;
