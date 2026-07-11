import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

import assertIsStewardHandler from "@authentication/assertIsStewardHandler.js";

// Minimal fakes — the middleware only touches req.user, req.headers.cookie,
// req.path and res.status().json(); no Express machinery needed.
const silentLog = {
  debug() {},
  trace() {},
} as unknown as Parameters<typeof assertIsStewardHandler>[0];

const makeRes = () => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
};

const run = (user: unknown, cookie?: string) => {
  const handler = assertIsStewardHandler(silentLog);
  const req = { user, headers: { cookie }, path: "/anthology" } as never;
  const res = makeRes();
  let nextCalled = false;
  handler(req, res as never, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
};

describe("assertIsStewardHandler", () => {
  let previousStewardEmails: string | undefined;

  beforeEach(() => {
    previousStewardEmails = process.env.STEWARD_EMAILS;
  });

  afterEach(() => {
    if (previousStewardEmails === undefined) {
      delete process.env.STEWARD_EMAILS;
    } else {
      process.env.STEWARD_EMAILS = previousStewardEmails;
    }
  });

  test("anonymous request is rejected with 401", () => {
    process.env.STEWARD_EMAILS = "steward@example.com";
    const { res, nextCalled } = run(undefined);
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  });

  test("authenticated non-steward is rejected with 403", () => {
    process.env.STEWARD_EMAILS = "steward@example.com";
    const { res, nextCalled } = run({ id: 1, email: "plain@example.com" });
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
  });

  test("a steward passes through to next()", () => {
    process.env.STEWARD_EMAILS = "steward@example.com";
    const { res, nextCalled } = run({ id: 2, email: "steward@example.com" });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 0);
  });

  test("the * wildcard grants any authenticated user", () => {
    process.env.STEWARD_EMAILS = "*";
    const { nextCalled } = run({ id: 3, email: "anyone@example.com" });
    assert.equal(nextCalled, true);
  });
});
