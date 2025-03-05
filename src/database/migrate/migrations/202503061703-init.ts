import { type Kysely, sql } from "kysely";

const TABLE_SCENE = "scene";
const TABLE_AUTHOR = "author";
const TABLE_STORY = "story";
const TABLE_IMAGE = "image";
const TABLE_AUDIO = "audio";
const TABLE_AUTHOR_TO_STORY = "authorToStory";
const TABLE_STORY_PUBLISHED = "storyPublished";

const TABLE_SESSION = "session";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(TABLE_AUTHOR)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("email", "varchar", (col) => col.notNull().unique())
    .execute();

  /*
   * We're restarting serial ID sequences at a higher value because we need to
   * import data from the earlier version of the app. Those earlier data will
   * have IDs in the rough range of `1-500` so we're restarting the sequences
   * for this latest version of the app to accommodate those earlier data.
   */
  await sql`ALTER SEQUENCE author_id_seq RESTART 1000`.execute(db);

  await db.schema
    .createTable(TABLE_STORY)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("title", "varchar", (col) => col.notNull())
    .execute();
  await sql`ALTER SEQUENCE story_id_seq RESTART 1000`.execute(db);

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
    .execute();
  await sql`ALTER SEQUENCE image_id_seq RESTART 1000`.execute(db);

  await db.schema
    .createTable(TABLE_AUDIO)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("url", "varchar", (col) => col.notNull().unique())
    .execute();
  await sql`ALTER SEQUENCE audio_id_seq RESTART 1000`.execute(db);

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
  await sql`ALTER SEQUENCE scene_id_seq RESTART 1000`.execute(db);

  await db.schema
    .createTable(TABLE_STORY_PUBLISHED)
    .addColumn("id", "integer", (col) =>
      col.unique().references(`${TABLE_STORY}.id`),
    )
    .addColumn("title", "varchar", (col) => col.notNull())
    .addColumn("content", "json", (col) => col.notNull())
    .addColumn("imageUrl", "varchar", (col) => col.defaultTo(null))
    .addColumn("created_at", "timestamp", (col) => col.defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable(TABLE_SESSION)
    .addColumn("sid", "varchar", (col) => col.primaryKey())
    .addColumn("sess", "json", (col) => col.notNull())
    .addColumn("expire", "timestamp", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(TABLE_AUTHOR_TO_STORY).execute();
  await db.schema.dropTable(TABLE_SCENE).execute();
  await db.schema.dropTable(TABLE_IMAGE).execute();
  await db.schema.dropTable(TABLE_AUDIO).execute();
  await db.schema.dropTable(TABLE_STORY).execute();
  await db.schema.dropTable(TABLE_AUTHOR).execute();
  await db.schema.dropTable(TABLE_STORY_PUBLISHED).execute();
  await db.schema.dropTable(TABLE_SESSION).execute();
}
