import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

import { PostgreSqlContainer } from "@testcontainers/postgresql";

import createAuthorInDatabase from "@domain/author/createAuthorInDatabase.js";
import {
  type IntegrationTestEnvironment,
  getEnvironment,
} from "tests/integration/getEnvironment";

describe("createAuthorInDatabase", () => {
  let environment: IntegrationTestEnvironment;

  before(async () => {
    const container = await new PostgreSqlContainer(
      "postgres:13.3-alpine",
    ).start();

    environment = await getEnvironment(container.getConnectionUri());
  });

  test("create an author", async () => {
    const { log, getDB } = environment;

    const createAuthor = createAuthorInDatabase(log, getDB);

    const createdAuthor = await createAuthor({
      name: "Old Demdike",
      email: "old.demdike@malkin.gb",
    });

    assert.ok(createdAuthor.id);
    assert.equal(createdAuthor.name, "Old Demdike");
    assert.equal(createdAuthor.email, "old.demdike@malkin.gb");

    try {
      await createAuthor({
        name: "Elizabeth Southerns",
        email: "old.demdike@malkin.gb",
      });

      assert.fail("Must have thrown because of duplicate email");
    } catch (err) {}
  });
});
