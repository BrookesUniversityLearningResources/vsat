import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import type pg from "pg";
import type { Logger } from "pino";

import type { DatabaseLogConfig } from "../environment/config.js";
import logUsingPino from "./logUsingPino.js";

export default function createKysely<Schema>(
  log: Logger,
  logConfig: DatabaseLogConfig,
  pool: pg.Pool,
): Kysely<Schema> {
  return new Kysely<Schema>({
    log: logUsingPino(log, logConfig),
    dialect: new PostgresDialect({
      pool,
    }),
    plugins: [new CamelCasePlugin()],
  });
}
