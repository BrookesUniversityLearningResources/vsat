import type { Kysely } from "kysely";

import type { Database } from "../../schema.js";

const TABLE_STORY_PUBLISHED = "story_published";

const COLUMN_IMAGE_URL = "imageUrl";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY_PUBLISHED)
    .addColumn(COLUMN_IMAGE_URL, "varchar", (col) => col.defaultTo(null))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY_PUBLISHED)
    .dropColumn(COLUMN_IMAGE_URL)
    .execute();
}
