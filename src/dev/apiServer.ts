import createApiServer from "../server/createApiServer.js";
import { createAppParts } from "../createApp.js";

const port = Number(process.env.DEV_API_PORT ?? "3001");

const { log, config, middlewares, routes } = await createAppParts();
const startServer = createApiServer({ ...config.server, port }, routes, middlewares);

startServer()
  .then(() => {
    log.info("Dev API server listening on port %d", port);
  })
  .catch((err) => {
    log.error({ err }, "Error starting dev API server");
    process.exit(1);
  });
