import type { Kysely } from "kysely";

const TABLE_STORY_LINK = "storyLink";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY_LINK)
    .addColumn("to_scene_id", "integer", (col) =>
      col.references("scene.id").onDelete("set null"),
    )
    .addColumn("to_page_number", "integer")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY_LINK)
    .dropColumn("to_page_number")
    .dropColumn("to_scene_id")
    .execute();
}
