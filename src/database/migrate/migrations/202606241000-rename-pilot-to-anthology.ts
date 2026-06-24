import { type Kysely, sql } from "kysely";

// Renames the "pilot" concept to "anthology" at the database level. Postgres
// keeps foreign keys pointing at the renamed tables automatically, so we only
// rename tables, the join column, and the primary-key constraint.
export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE pilot RENAME TO anthology`.execute(db);
  await sql`ALTER TABLE pilot_story RENAME TO anthology_story`.execute(db);
  await sql`ALTER TABLE anthology_story RENAME COLUMN pilot_id TO anthology_id`.execute(
    db,
  );
  await sql`ALTER TABLE anthology_story RENAME CONSTRAINT pilot_story_pk TO anthology_story_pk`.execute(
    db,
  );
  await sql`ALTER TABLE interpretive_note RENAME COLUMN pilot_id TO anthology_id`.execute(
    db,
  );
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE interpretive_note RENAME COLUMN anthology_id TO pilot_id`.execute(
    db,
  );
  await sql`ALTER TABLE anthology_story RENAME CONSTRAINT anthology_story_pk TO pilot_story_pk`.execute(
    db,
  );
  await sql`ALTER TABLE anthology_story RENAME COLUMN anthology_id TO pilot_id`.execute(
    db,
  );
  await sql`ALTER TABLE anthology_story RENAME TO pilot_story`.execute(db);
  await sql`ALTER TABLE anthology RENAME TO pilot`.execute(db);
}
