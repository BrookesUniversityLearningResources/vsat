import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("site_setting")
    .addColumn("key", "varchar", (col) => col.primaryKey())
    .addColumn("value", "varchar", (col) => col.notNull())
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_by", "varchar")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("site_setting").execute();
}
