import type { Kysely } from "kysely";

const TABLE_STORY_PUBLISHED = "storyPublished";

const COLUMN_FEATURED_ACTIVE = "featuredActive";
const COLUMN_FEATURED_ON = "featuredOn";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY_PUBLISHED)
    .dropColumn(COLUMN_FEATURED_ACTIVE)
    .dropColumn(COLUMN_FEATURED_ON)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY_PUBLISHED)
    .addColumn("featured_active", "boolean", (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn("featured_on", "timestamp", (col) => col.defaultTo(null))
    .execute();
}
