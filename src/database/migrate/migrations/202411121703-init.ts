import type { Kysely } from "kysely";

const TABLE_SCENE = "scene";
const TABLE_AUTHOR = "author";
const TABLE_STORY = "story";
const TABLE_IMAGE = "image";
const TABLE_AUDIO = "audio";
const TABLE_AUTHOR_TO_STORY = "author_to_story";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(TABLE_AUTHOR)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("email", "varchar", (col) => col.notNull().unique())
    .execute();

  /*
   * Because we do lookups on the (author) email all the time
   */
  await db.schema
    .createIndex("idx_author_email")
    .on(TABLE_AUTHOR)
    .column("email")
    .execute();

  await db.schema
    .createTable(TABLE_STORY)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("title", "varchar", (col) => col.notNull())
    .addColumn("publishedOn", "date", (col) => col.defaultTo(null))
    .execute();

  await db.schema
    .createTable(TABLE_AUTHOR_TO_STORY)
    .addColumn("author_id", "integer", (col) =>
      col.references("author.id").onDelete("cascade").notNull(),
    )
    .addColumn("story_id", "integer", (col) =>
      col.references("story.id").onDelete("cascade").notNull(),
    )
    .addPrimaryKeyConstraint("pk_author_to_story", ["author_id", "story_id"])
    .execute();

  await db.schema
    .createTable(TABLE_IMAGE)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("url", "varchar", (col) => col.notNull().unique())
    .addColumn("thumbnail_url", "varchar", (col) => col.notNull())
    .addColumn("is_deleted", "boolean", (col) => col.notNull().defaultTo(false))
    .execute();

  await db.schema
    .createTable(TABLE_AUDIO)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("url", "varchar", (col) => col.notNull().unique())
    .addColumn("is_deleted", "boolean", (col) => col.notNull().defaultTo(false))
    .execute();

  await db.schema
    .createTable(TABLE_SCENE)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("title", "varchar", (col) => col.notNull())
    .addColumn("content", "text", (col) => col.notNull())
    .addColumn("is_opening_scene", "boolean", (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn("story_id", "integer", (col) =>
      col.references("story.id").notNull(),
    )
    .addColumn("image_id", "integer", (col) => col.references("image.id"))
    .addColumn("audio_id", "integer", (col) => col.references("audio.id"))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(TABLE_AUTHOR_TO_STORY).execute();
  await db.schema.dropTable(TABLE_SCENE).execute();
  await db.schema.dropTable(TABLE_IMAGE).execute();
  await db.schema.dropTable(TABLE_AUDIO).execute();
  await db.schema.dropTable(TABLE_STORY).execute();
  await db.schema.dropTable(TABLE_AUTHOR).execute();
}
