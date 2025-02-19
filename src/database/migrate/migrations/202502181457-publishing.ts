import { type Kysely, sql } from "kysely";

import type { Database } from "../../schema.js";

const TABLE_STORY = "story";
const TABLE_STORY_PUBLISHED = "story_published";

const COLUMN_PUBLISHED_ON = "publishedOn";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable(TABLE_STORY_PUBLISHED)
    .addColumn("id", "integer", (col) =>
      col.unique().references(`${TABLE_STORY}.id`),
    )
    .addColumn("title", "varchar", (col) => col.notNull())
    .addColumn("content", "json", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) => col.defaultTo(sql`now()`))
    .execute();

  await db.schema
    .alterTable(TABLE_STORY)
    .dropColumn(COLUMN_PUBLISHED_ON)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(TABLE_STORY_PUBLISHED).execute();

  await db.schema
    .alterTable(TABLE_STORY)
    .addColumn(COLUMN_PUBLISHED_ON, "date", (col) => col.defaultTo(null))
    .execute();
}
