import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  loginPathForReturnTo,
  safeReturnTo,
} from "@authentication/returnTo.js";

describe("safeReturnTo", () => {
  test("given a relative path returns the path", () => {
    assert.equal(
      safeReturnTo("/author/story/12/links#propose"),
      "/author/story/12/links#propose",
    );
  });

  test("given an encoded relative path returns the decoded path", () => {
    assert.equal(
      safeReturnTo("%2Fauthor%2Fstory%2F12%2Flinks%3FtoStoryId%3D14%23propose"),
      "/author/story/12/links?toStoryId=14#propose",
    );
  });

  test("given a blank value returns the default author dashboard path", () => {
    assert.equal(safeReturnTo(null), "/author/story");
  });

  test("given an absolute URL returns the default author dashboard path", () => {
    assert.equal(safeReturnTo("https://example.com/steal"), "/author/story");
  });

  test("given a protocol-relative URL returns the default author dashboard path", () => {
    assert.equal(safeReturnTo("//example.com/steal"), "/author/story");
  });

  test("given malformed URI encoding returns the default author dashboard path", () => {
    assert.equal(safeReturnTo("%"), "/author/story");
  });
});

describe("loginPathForReturnTo", () => {
  test("encodes the safe return path into the login URL", () => {
    assert.equal(
      loginPathForReturnTo("/author/story/12/links?toStoryId=14#propose"),
      "/login?returnTo=%2Fauthor%2Fstory%2F12%2Flinks%3FtoStoryId%3D14%23propose",
    );
  });
});
