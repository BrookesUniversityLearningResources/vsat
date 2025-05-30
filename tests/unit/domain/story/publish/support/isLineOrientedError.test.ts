import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ErrorCodes } from "@domain/error/errorCode";
import isLineOrientedError from "@domain/story/publish/support/isLineOrientedError.js";

describe("isLineOrientedError", () => {
  test(
    "given a parse error with line number state" +
      " then the error is correctly identified as a line-oriented error",
    () => {
      const actual = isLineOrientedError({
        errorCode: ErrorCodes.UnableToParseStory,
        reason: "Unable to parse story",
        line: {
          number: 34,
          text: "#Foo|",
        },
      });

      assert.equal(actual, true);
    },
  );

  test(
    "given a parse error with no line number state" +
      " then the error is correctly not identified as a line-oriented error",
    () => {
      const actual = isLineOrientedError({
        errorCode: ErrorCodes.UnableToParseStory,
        reason: "Unable to parse story",
        // no line number state
      });

      assert.equal(actual, false);
    },
  );
});
