import assert from "node:assert/strict";
import { describe, test } from "node:test";

import toStoryId from "@domain/story/toStoryId.js";

describe("toStoryId", () => {
  test("given undefined returns null", () => {
    assert.equal(toStoryId(undefined), null);
  });

  test("given the NaN value 'ten' returns null", () => {
    assert.equal(toStoryId("ten"), null);
  });

  test("given the NaN value '' returns null", () => {
    assert.equal(toStoryId(""), null);
  });

  test("given the NaN value ' ' returns null", () => {
    assert.equal(toStoryId(" "), null);
  });

  test("given the zero value '0' returns null", () => {
    assert.equal(toStoryId("0"), null);
  });

  test("given the negative value '-1' returns null", () => {
    assert.equal(toStoryId("-1"), null);
  });

  test("given the kosher value '1' returns 1", () => {
    assert.equal(toStoryId("1"), 1);
  });
});
