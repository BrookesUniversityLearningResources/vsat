import PostgresSession from "connect-pg-simple";
import Session from "express-session";
import type { Pool } from "pg";

import type { ServerConfig } from "../environment/config.js";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

function httpSessionMiddleware(config: ServerConfig["session"], pool: Pool) {
  const pgs = PostgresSession(Session);

  const store = new pgs({
    pool,
    tableName: "session",
  });

  return Session({
    store,
    secret: config.secret,
    saveUninitialized: false,
    resave: false,
    unset: "destroy",
    cookie: {
      maxAge: ONE_DAY_IN_MS,
    },
  });
}

export default httpSessionMiddleware;
