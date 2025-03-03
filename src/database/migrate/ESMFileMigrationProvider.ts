import fs from "node:fs/promises";
import path from "node:path";

import type { Migration, MigrationProvider } from "kysely";

/**
 * @see https://github.com/kysely-org/kysely/issues/277
 */
export default class ESMFileMigrationProvider implements MigrationProvider {
  /**
   * Create an instance of the `ESMFileMigrationProvider` class.
   *
   * @param relativePath the path _relative to this class_.
   */
  constructor(private relativePath = "migrations") {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = Object.create(null);

    const resolvedPath = path.resolve(import.meta.dirname, this.relativePath);

    const files = await fs.readdir(resolvedPath);

    for (const fileName of files) {
      if (!fileName.endsWith(".js")) {
        continue;
      }

      const importPath = `./${this.relativePath}/${fileName}`;

      const migration = await import(importPath);

      const migrationKey = fileName.substring(0, fileName.lastIndexOf("."));

      migrations[migrationKey] = migration;
    }

    return migrations;
  }
}
