import { Migrator } from "kysely";

import getEnvironment from "../../environment/getEnvironment.js";
import ESMFileMigrationProvider from "./ESMFileMigrationProvider.js";

/**
 * Run the database migrations.
 *
 * This will exit with a non-zero exit code in the event of errors.
 */
async function main() {
  const {
    log,
    database: { db },
  } = getEnvironment<App.WithLog & App.WithDatabase>();

  const migrator = new Migrator({
    db,
    provider: new ESMFileMigrationProvider(),
  });

  const { error, results } = await migrator.migrateToLatest();

  for (const result of results ?? []) {
    if (result.status === "Success") {
      log.info({ result }, "'%s' migration successful", result.migrationName);
    } else {
      log.error(
        { result },
        "Failed to execute migration '%s'",
        result.migrationName,
      );
    }
  }

  if (error) {
    const unsuccessfulMigrations =
      results?.filter((result) => result.status !== "Success") ?? [];

    log.error(
      {
        err: error,
        unsuccessfulMigrations,
      },
      "Error running migrations",
    );

    process.exit(1);
  } else {
    log.info({ results }, "Completed migrations");
  }

  await db.destroy();
}

main();
