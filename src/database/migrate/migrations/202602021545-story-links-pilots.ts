import { type Kysely, sql } from "kysely";

const TABLE_STORY_LINK = "storyLink";
const TABLE_LINK_VOTE = "linkVote";
const TABLE_PILOT = "pilot";
const TABLE_PILOT_STORY = "pilotStory";
const TABLE_INTERPRETIVE_NOTE = "interpretiveNote";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable(TABLE_STORY_LINK)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("from_story_id", "integer", (col) =>
      col.references("story.id").onDelete("cascade").notNull(),
    )
    .addColumn("to_story_id", "integer", (col) =>
      col.references("story.id").onDelete("cascade").notNull(),
    )
    .addColumn("link_type", "varchar", (col) => col.notNull())
    .addColumn("rationale", "text", (col) => col.notNull())
    .addColumn("status", "varchar", (col) =>
      col.notNull().defaultTo("proposed"),
    )
    .addColumn("created_by", "integer", (col) =>
      col.references("author.id").onDelete("cascade").notNull(),
    )
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("story_link_from_story_id_idx")
    .on(TABLE_STORY_LINK)
    .column("from_story_id")
    .execute();

  await db.schema
    .createIndex("story_link_to_story_id_idx")
    .on(TABLE_STORY_LINK)
    .column("to_story_id")
    .execute();

  await db.schema
    .createTable(TABLE_LINK_VOTE)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("link_id", "integer", (col) =>
      col.references("storyLink.id").onDelete("cascade").notNull(),
    )
    .addColumn("user_id", "integer", (col) =>
      col.references("author.id").onDelete("cascade").notNull(),
    )
    .addColumn("vote", "varchar", (col) => col.notNull())
    .addColumn("comment", "text")
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("link_vote_link_id_idx")
    .on(TABLE_LINK_VOTE)
    .column("link_id")
    .execute();

  await db.schema
    .createIndex("link_vote_user_id_idx")
    .on(TABLE_LINK_VOTE)
    .column("user_id")
    .execute();

  await db.schema
    .createIndex("link_vote_link_id_user_id_unique")
    .on(TABLE_LINK_VOTE)
    .columns(["link_id", "user_id"])
    .unique()
    .execute();

  await db.schema
    .createTable(TABLE_PILOT)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("title", "varchar", (col) => col.notNull())
    .addColumn("question", "text", (col) => col.notNull())
    .addColumn("partner", "varchar")
    .addColumn("status", "varchar", (col) =>
      col.notNull().defaultTo("draft"),
    )
    .addColumn("start_at", "timestamp")
    .addColumn("end_at", "timestamp")
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable(TABLE_PILOT_STORY)
    .addColumn("pilot_id", "integer", (col) =>
      col.references("pilot.id").onDelete("cascade").notNull(),
    )
    .addColumn("story_id", "integer", (col) =>
      col.references("story.id").onDelete("cascade").notNull(),
    )
    .addPrimaryKeyConstraint("pilot_story_pk", ["pilot_id", "story_id"])
    .execute();

  await db.schema
    .createTable(TABLE_INTERPRETIVE_NOTE)
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("pilot_id", "integer", (col) =>
      col.references("pilot.id").onDelete("cascade").notNull(),
    )
    .addColumn("story_id", "integer", (col) =>
      col.references("story.id").onDelete("cascade").notNull(),
    )
    .addColumn("author_id", "integer", (col) =>
      col.references("author.id").onDelete("cascade").notNull(),
    )
    .addColumn("note", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable(TABLE_INTERPRETIVE_NOTE).execute();
  await db.schema.dropTable(TABLE_PILOT_STORY).execute();
  await db.schema.dropTable(TABLE_PILOT).execute();
  await db.schema.dropTable(TABLE_LINK_VOTE).execute();
  await db.schema.dropTable(TABLE_STORY_LINK).execute();
}
