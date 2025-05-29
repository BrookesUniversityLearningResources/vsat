import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

import getAuthorByEmailInDatabase from "@domain/author/getAuthorByEmailInDatabase.js";
import {
  type IntegrationTestEnvironment,
  getEnvironment,
} from "tests/integration/getEnvironment";
import createPostgreSqlContainer from "tests/integration/support/container";

describe("getAuthorByEmailInDatabase", () => {
  let environment: IntegrationTestEnvironment;

  before(async () => {
    const container = await createPostgreSqlContainer().start();

    environment = await getEnvironment(container.getConnectionUri());
  });

  test("get an author by existing email", async () => {
    const { log, getDB } = environment;

    await getDB()
      .insertInto("author")
      .values({
        name: "Old Demdike",
        email: "old.demdike@malkin.gb",
      })
      .executeTakeFirstOrThrow();

    const getAuthor = getAuthorByEmailInDatabase(log, getDB);

    const author = await getAuthor("old.demdike@malkin.gb");

    assert.ok(author !== undefined);
    assert.ok(author.id);
    assert.equal(author.name, "Old Demdike");
    assert.equal(author.email, "old.demdike@malkin.gb");
  });

  test("get an author by unknown email", async () => {
    const { log, getDB } = environment;

    const getAuthor = getAuthorByEmailInDatabase(log, getDB);

    const author = await getAuthor("__@no.pe");

    assert.ok(author === undefined);
  });
});
