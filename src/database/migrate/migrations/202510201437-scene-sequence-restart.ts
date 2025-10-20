import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  /*
   * We're restarting serial ID sequence for scenes at a higher value because
   * the DB at the time of writing has some scenes with IDs above 1109 (and
   * including 1109)… and the current serial ID sequence for scenes is 1109.
   *
   * This means that when we attempt to insert a new scene — which would use
   * the next sequence value of 1110 — the insert fails because there already
   * exists a scene with the ID 1100.
   *
   * This migration restarts the serial ID sequence for scenes at a value
   * greater than the ID of any existing scene.
   *
   * Unsure as to the root cause of how this has happened: it could happen again
   * 'cos this fix doesn't address the (unknown) root cause.
   */
  await sql`ALTER SEQUENCE scene_id_seq RESTART 1200`.execute(db);
}

export async function down(_db: Kysely<unknown>): Promise<void> {
  // nothing to do
}
