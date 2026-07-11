import { type Kysely, sql } from "kysely";

// Append-only audit trail for story edits. Deliberately FK-free: the log must
// outlive the story/scene/editor it references (delete-story is itself a
// logged action), so a foreign key with cascade would erase exactly the record
// we want to keep. Written by the auditStoryEdits middleware on any successful
// story-scoped mutation; read by the per-story history page.
const TABLE = "storyEditLog";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(TABLE)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("story_id", "integer", (col) => col.notNull())
    .addColumn("scene_id", "integer")
    .addColumn("editor_id", "integer", (col) => col.notNull())
    .addColumn("action", "varchar", (col) => col.notNull())
    .addColumn("summary", "text")
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("story_edit_log_story_id_idx")
    .on(TABLE)
    .column("story_id")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(TABLE).execute();
}
