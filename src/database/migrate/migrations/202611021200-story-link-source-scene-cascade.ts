import type { Kysely } from "kysely";

const TABLE_STORY_LINK = "storyLink";
const CONSTRAINT = "story_link_from_scene_id_fkey";

// A link cannot retain its meaning after its source scene is removed. Deleting
// that scene therefore removes the link, just as deleting its source story
// already does. This also lets the story deletion service remove scenes before
// it removes the story row.
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY_LINK)
    .dropConstraint(CONSTRAINT)
    .execute();

  await db.schema
    .alterTable(TABLE_STORY_LINK)
    .addForeignKeyConstraint(
      CONSTRAINT,
      ["from_scene_id"],
      "scene",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_STORY_LINK)
    .dropConstraint(CONSTRAINT)
    .execute();

  await db.schema
    .alterTable(TABLE_STORY_LINK)
    .addForeignKeyConstraint(CONSTRAINT, ["from_scene_id"], "scene", ["id"])
    .execute();
}
