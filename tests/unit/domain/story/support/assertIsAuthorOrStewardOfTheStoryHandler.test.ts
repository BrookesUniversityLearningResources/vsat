import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, mock, test } from "node:test";

import assertIsAuthorOrStewardOfTheStoryHandler from "@domain/story/support/assertIsAuthorOrStewardOfTheStoryHandler.js";

const silentLog = {
  debug() {},
  trace() {},
  warn() {},
} as unknown as Parameters<typeof assertIsAuthorOrStewardOfTheStoryHandler>[0];

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

// steward flag drives STEWARD_EMAILS so isStewardUser resolves deterministically
const run = async (
  user: { id: number; email: string } | undefined,
  opts: { steward: boolean; isAuthor: boolean },
) => {
  process.env.STEWARD_EMAILS =
    opts.steward && user ? user.email : "nobody@example.com";
  const isAuthorOfTheStory = mock.fn(async () => opts.isAuthor);
  const handler = assertIsAuthorOrStewardOfTheStoryHandler(
    silentLog,
    isAuthorOfTheStory,
  );
  const req = {
    user,
    headers: { cookie: undefined },
    params: { storyId: "42" },
    path: "/story/42",
  } as never;
  const res = makeRes();
  let nextCalled = false;
  handler(req, res as never, () => {
    nextCalled = true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  return { res, nextCalled, authLookups: isAuthorOfTheStory.mock.callCount() };
};

describe("assertIsAuthorOrStewardOfTheStoryHandler", () => {
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

  test("anonymous request is rejected with 401 and never looks up authorship", async () => {
    const { res, nextCalled, authLookups } = await run(undefined, {
      steward: false,
      isAuthor: false,
    });
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
    assert.equal(authLookups, 0);
  });

  test("a steward passes through without an authorship lookup", async () => {
    const { nextCalled, authLookups } = await run(
      { id: 1, email: "steward@example.com" },
      { steward: true, isAuthor: false },
    );
    assert.equal(nextCalled, true);
    assert.equal(authLookups, 0);
  });

  test("the story's author passes through", async () => {
    const { nextCalled, authLookups } = await run(
      { id: 2, email: "author@example.com" },
      { steward: false, isAuthor: true },
    );
    assert.equal(nextCalled, true);
    assert.equal(authLookups, 1);
  });

  test("a non-author non-steward is rejected with 403", async () => {
    const { res, nextCalled } = await run(
      { id: 3, email: "stranger@example.com" },
      { steward: false, isAuthor: false },
    );
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
  });
});
