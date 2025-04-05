import assert from "node:assert/strict";
import path from "node:path";
import { cwd } from "node:process";

import pg from "pg";
import pino, { type Logger } from "pino";

import createKysely from "src/database/createKysely.js";
import { runMigrations } from "src/database/migrate/runMigrations.js";
import type { Database, GetDatabase } from "src/database/schema.js";

export type IntegrationTestEnvironment = {
  getDB: GetDatabase;
  log: Logger;
};

export async function getEnvironment(
  connectionString: string,
): Promise<IntegrationTestEnvironment> {
  const log = pino({ enabled: false });

  const connectionPool = new pg.Pool({
    connectionString,
  });

  const db = createKysely<Database>(
    log,
    { error: false, query: false },
    connectionPool,
  );

  const { error } = await runMigrations(db, () =>
    path.resolve(cwd(), "dist/build/database/migrate/migrations"),
  );

  if (error) {
    assert.fail(`Error running migrations: ${JSON.stringify(error)}`);
  }

  return {
    getDB: () => db,
    log,
  };
}
