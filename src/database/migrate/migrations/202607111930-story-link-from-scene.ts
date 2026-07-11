import type { Kysely } from "kysely";

const TABLE_STORY_LINK = "storyLink";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY_LINK)
    .addColumn("from_scene_id", "integer", (col) =>
      col.references("scene.id").defaultTo(null),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY_LINK)
    .dropColumn("from_scene_id")
    .execute();
}
