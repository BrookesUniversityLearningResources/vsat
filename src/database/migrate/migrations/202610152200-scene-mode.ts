import type { Kysely } from "kysely";

const TABLE_SCENE = "scene";

// null = the scene follows its story's mode; "360"/"2d" = the author pinned it
const COLUMN_MODE = "mode";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_SCENE)
    .addColumn(COLUMN_MODE, "varchar")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable(TABLE_SCENE).dropColumn(COLUMN_MODE).execute();
}
