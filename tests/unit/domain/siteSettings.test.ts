import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import express from "express";
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
import assertIsStewardHandler from "../../../src/authentication/assertIsStewardHandler.js";
import type { Database } from "../../../src/database/schema.js";
import { showInterpretiveLinkAuthoring } from "../../../src/domain/interpretiveLinkVisibility.js";
import routeSiteSettings from "../../../src/domain/routeSiteSettings.js";
import siteSettingsInDatabase, {
  resolveInterpretiveLinks,
} from "../../../src/domain/siteSettings.js";

function store() {
  const rows = new Map<
    string,
    { value: string; updated_by: string | null; updated_at: Date }
  >();
  class Driver extends DummyDriver {
    async acquireConnection() {
      return {
        async executeQuery<R>(query: CompiledQuery) {
          const [key, value, by] = query.parameters;
          if (query.sql.startsWith("select"))
            return {
              rows: (rows.has(String(key))
                ? [rows.get(String(key))]
                : []) as R[],
            };
          rows.set(String(key), {
            value: String(value),
            updated_by: by as string | null,
            updated_at: new Date(0),
          });
          return { rows: [] as R[] };
        },
        async *streamQuery<R>(): AsyncGenerator<{ rows: R[] }> {
          yield { rows: [] };
        },
      };
    }
  }
  const db = new Kysely<Database>({
    dialect: {
      createAdapter: () => new PostgresAdapter(),
      createDriver: () => new Driver(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
    plugins: [new CamelCasePlugin()],
  });
  return {
    db,
    rows,
    settings: siteSettingsInDatabase(() => db, { interpretiveLinks: "off" }),
  };
}

test("interpretive links precedence includes invalid DB fallback", () => {
  assert.equal(resolveInterpretiveLinks("on", "off"), "on");
  assert.equal(resolveInterpretiveLinks("off", "on"), "off");
  assert.equal(resolveInterpretiveLinks("invalid", "off"), "off");
  assert.equal(resolveInterpretiveLinks(undefined, "off"), "off");
  assert.equal(resolveInterpretiveLinks(undefined), "on");
});

test("settings provenance; a stored change is read at once", async () => {
  const { db, rows, settings } = store();
  assert.deepEqual(await settings.getSetting("interpretive_links"), {
    value: "off",
    source: "deployment",
    updatedAt: null,
    updatedBy: null,
  });
  rows.set("interpretive_links", {
    value: "on",
    updated_at: new Date(0),
    updated_by: "curator@example.test",
  });
  assert.deepEqual(await settings.getSetting("interpretive_links"), {
    value: "on",
    source: "stored",
    updatedAt: new Date(0),
    updatedBy: "curator@example.test",
  });
  await db.destroy();
});

test("off removes link authoring, on restores it (reader links are not affected)", () => {
  assert.equal(showInterpretiveLinkAuthoring("off"), false);
  assert.equal(showInterpretiveLinkAuthoring("on"), true);
});

test("settings route uses steward guard, rejects invalid values, persists actor email", async (t) => {
  const previous = process.env.STEWARD_EMAILS;
  process.env.STEWARD_EMAILS = "curator@example.test";
  t.after(() => {
    if (previous === undefined) delete process.env.STEWARD_EMAILS;
    else process.env.STEWARD_EMAILS = previous;
  });
  const { db, rows, settings } = store();
  t.after(() => db.destroy());
  const app = express();
  app.use((req, _res, next) => {
    req.user = {
      id: 1,
      name: "Invented",
      email:
        req.headers["x-test-role"] === "steward"
          ? "curator@example.test"
          : "author@example.test",
    };
    next();
  });
  app.use(
    routeSiteSettings(
      settings,
      assertIsStewardHandler(pino({ enabled: false })),
    ),
  );
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  );
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  async function post(role: string, body: unknown) {
    return fetch(`http://127.0.0.1:${address.port}/site-settings`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-role": role },
      body: JSON.stringify(body),
    });
  }
  assert.equal(
    (await post("author", { key: "interpretive_links", value: "off" })).status,
    403,
  );
  assert.equal(rows.size, 0);
  assert.equal(
    (await post("steward", { key: "interpretive_links", value: "both" }))
      .status,
    400,
  );
  assert.equal(
    (await post("steward", { key: "presentation_mode", value: "off" })).status,
    400,
  );
  assert.equal(
    (await post("steward", { key: "unknown", value: "on" })).status,
    400,
  );
  assert.equal(rows.size, 0);
  assert.equal(
    (
      await post("steward", {
        key: "interpretive_links",
        value: "off",
        updated_by: "forged@example.test",
      })
    ).status,
    200,
  );
  assert.equal(
    rows.get("interpretive_links")?.updated_by,
    "curator@example.test",
  );
  assert.equal(await settings.getInterpretiveLinks(), "off");
  const response = await fetch(
    `http://127.0.0.1:${address.port}/site-settings`,
    {
      method: "POST",
      redirect: "manual",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-test-role": "steward",
      },
      body: "key=presentation_mode&value=360",
    },
  );
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/author/settings");
  assert.equal(await settings.getPresentationMode(), "360");
});
