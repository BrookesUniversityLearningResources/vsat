import type { Kysely } from "kysely";

import type { Database } from "../../schema.js";

const TABLE_IMAGE = "image";

const COLUMN_IS_DELETED = "isDeleted";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable(TABLE_IMAGE)
    .dropColumn(COLUMN_IS_DELETED)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable(TABLE_IMAGE)
    .addColumn("is_deleted", "boolean", (col) => col.notNull().defaultTo(false))
    .execute();
}
