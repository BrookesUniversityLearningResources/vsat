import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

import saveAuthorNameInDatabase from "@domain/author/saveAuthorNameInDatabase.js";
import {
  type IntegrationTestEnvironment,
  getEnvironment,
} from "tests/integration/getEnvironment";
import createPostgreSqlContainer from "tests/integration/support/container";

describe("saveAuthorNameInDatabase", () => {
  let environment: IntegrationTestEnvironment;

  before(async () => {
    const container = await createPostgreSqlContainer().start();

    environment = await getEnvironment(container.getConnectionUri());
  });

  test("save changed name", async () => {
    const { log, getDB } = environment;

    const savedAuthor = await getDB()
      .insertInto("author")
      .values({
        name: "Old Demdike",
        email: "old.demdike@malkin.gb",
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const saveName = saveAuthorNameInDatabase(log, getDB);

    await saveName({
      id: savedAuthor.id,
      name: "Elizabeth Southerns",
    });

    const changedAuthor = await getDB()
      .selectFrom("author")
      .selectAll()
      .where("email", "=", "old.demdike@malkin.gb")
      .executeTakeFirstOrThrow();

    assert.ok(changedAuthor !== undefined);
    assert.ok(changedAuthor.id);
    assert.equal(changedAuthor.name, "Elizabeth Southerns");
    assert.equal(changedAuthor.email, "old.demdike@malkin.gb");
  });
});
