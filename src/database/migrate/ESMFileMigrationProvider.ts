import fs from "node:fs/promises";
import path from "node:path";

import type { Migration, MigrationProvider } from "kysely";

export type GetMigrationsDirectory = () => string;

const DIRECTORY_MIGRATIONS = "migrations";

export const defaultGetMigrationsDirectory: GetMigrationsDirectory = () => {
  return path.resolve(import.meta.dirname, DIRECTORY_MIGRATIONS);
};

/**
 * @see https://github.com/kysely-org/kysely/issues/277
 */
export default class ESMFileMigrationProvider implements MigrationProvider {
  /**
   * Create an instance of the `ESMFileMigrationProvider` class.
   *
   * @param relativePath the path _relative to this class_.
   */
  constructor(private getMigrationsDirectory = defaultGetMigrationsDirectory) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = Object.create(null);

    const resolvedPath = this.getMigrationsDirectory();

    const files = await fs.readdir(resolvedPath);

    for (const fileName of files) {
      if (!fileName.endsWith(".js")) {
        continue;
      }

      const importPath = `./${DIRECTORY_MIGRATIONS}/${fileName}`;

      const migration = await import(importPath);

      const migrationKey = fileName.substring(0, fileName.lastIndexOf("."));

      migrations[migrationKey] = migration;
    }

    return migrations;
  }
}
