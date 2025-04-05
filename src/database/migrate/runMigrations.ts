import { type Kysely, Migrator } from "kysely";

import type { Database } from "../schema.js";
import ESMFileMigrationProvider, {
  type GetMigrationsDirectory,
} from "./ESMFileMigrationProvider.js";

export async function runMigrations(
  db: Kysely<Database>,
  getMigrationsDirectory?: GetMigrationsDirectory,
) {
  const migrator = new Migrator({
    db,
    provider: new ESMFileMigrationProvider(getMigrationsDirectory),
  });

  return await migrator.migrateToLatest();
}
