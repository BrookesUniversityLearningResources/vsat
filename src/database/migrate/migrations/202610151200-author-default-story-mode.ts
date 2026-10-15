import type { Kysely } from "kysely";

const TABLE_AUTHOR = "author";

const COLUMN_DEFAULT_STORY_MODE = "default_story_mode";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_AUTHOR)
    .addColumn(COLUMN_DEFAULT_STORY_MODE, "varchar", (col) =>
      col.notNull().defaultTo("360"),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_AUTHOR)
    .dropColumn(COLUMN_DEFAULT_STORY_MODE)
    .execute();
}
