import type { Kysely } from "kysely";

const TABLE_STORY = "story";

const COLUMN_MODE = "mode";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY)
    .addColumn(COLUMN_MODE, "varchar", (col) => col.notNull().defaultTo("360"))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable(TABLE_STORY).dropColumn(COLUMN_MODE).execute();
}
