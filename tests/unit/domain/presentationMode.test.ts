import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CamelCasePlugin,
  type CompiledQuery,
  DummyDriver,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
} from "kysely";
import pino from "pino";
import type { Database } from "../../../src/database/schema.js";
import presentationModeInDatabase, {
  type PresentationMode,
  resolvePresentationMode,
} from "../../../src/domain/presentationMode.js";
import createStory from "../../../src/domain/story/createStory.js";
import getPublishedStoryInDatabase from "../../../src/domain/story/getPublishedStoryInDatabase.js";

// Exercise real Kysely query compilation and row mapping; only the SQL port is fake.
function database(run: (query: CompiledQuery) => unknown[]) {
  class Driver extends DummyDriver {
    async acquireConnection() {
      return {
        async executeQuery<R>(query: CompiledQuery) {
          return { rows: run(query) as R[] };
        },
        async *streamQuery<R>(): AsyncGenerator<{ rows: R[] }> {
          yield { rows: [] };
        },
      };
    }
  }
  return new Kysely<Database>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new Driver(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
    plugins: [new CamelCasePlugin()],
  });
}
const log = pino({ enabled: false });

test("presentation precedence includes invalid DB fallback and legacy false", () => {
  assert.equal(
    resolvePresentationMode("360", { presentation: "2d", photospheres: false }),
    "360",
  );
  assert.equal(
    resolvePresentationMode("invalid", {
      presentation: "both",
      photospheres: false,
    }),
    "both",
  );
  assert.equal(
    resolvePresentationMode(undefined, {
      presentation: "360",
      photospheres: false,
    }),
    "360",
  );
  assert.equal(
    resolvePresentationMode(undefined, { photospheres: false }),
    "2d",
  );
  assert.equal(resolvePresentationMode(undefined, {}), "both");
});

test("DB-backed cache expires, save upserts audit fields and invalidates", async () => {
  let value: string | undefined;
  let reads = 0;
  let clock = 0;
  const db = database((q) => {
    if (q.sql.startsWith("select")) {
      reads++;
      return value ? [{ value }] : [];
    }
    assert.match(q.sql, /insert into "site_setting"/);
    assert.match(q.sql, /on conflict \("key"\) do update/);
    assert.match(q.sql, /"updated_at" = now\(\)/);
    assert.ok(q.parameters.includes("steward-test"));
    value = q.parameters[1] as string;
    return [];
  });
  const settings = presentationModeInDatabase(
    () => db,
    { photospheres: false },
    () => clock,
  );
  assert.equal(await settings.getPresentationMode(), "2d");
  value = "both";
  assert.equal(await settings.getPresentationMode(), "2d");
  assert.equal(reads, 1);
  clock = 30_000;
  assert.equal(await settings.getPresentationMode(), "both");
  await settings.savePresentationMode("360", "steward-test");
  assert.equal(await settings.getPresentationMode(), "360");
  assert.equal(reads, 3);
  await assert.rejects(
    settings.savePresentationMode("invalid" as PresentationMode, null),
  );
  await db.destroy();
});

for (const mode of ["both", "360", "2d"] as const) {
  test(`published story in ${mode} preserves stored modes except 2d flattening`, async () => {
    const db = database((q) =>
      q.sql.includes('from "story_published"')
        ? [
            {
              story_id: 7,
              story_title: "Invented",
              story_content: [{ id: 11 }, { id: 12 }],
              story_image_url: null,
              created_at: new Date(0),
              story_mode: "2d",
              author_id: 2,
              author_name: "Author",
            },
          ]
        : [
            { id: 11, mode: "360" },
            { id: 12, mode: null },
          ],
    );
    const story = await getPublishedStoryInDatabase(
      log,
      () => db,
      async () => mode,
    )(7);
    assert.equal(story?.mode, "2d"); // 360-only must NEVER convert existing flat photos to sky.
    assert.deepEqual(
      story?.scenes.map((s) => s.mode),
      mode === "2d" ? ["2d", "2d"] : ["360", "2d"],
    );
    await db.destroy();
  });
  test(`new story in ${mode} respects the site creation rule`, async () => {
    let defaultReads = 0;
    const create = createStory(
      log,
      async (story) => ({ ...story, id: 9, scenes: [], publishedOn: null }),
      async () => {
        defaultReads++;
        return "2d";
      },
      async () => mode,
    );
    const story = await create({ author: { id: 2, name: "Author" } });
    assert.equal(story.mode, mode === "360" ? "360" : "2d");
    assert.equal(defaultReads, mode === "360" ? 0 : 1);
  });
}
