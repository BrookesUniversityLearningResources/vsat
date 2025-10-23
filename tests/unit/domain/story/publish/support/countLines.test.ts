import assert from "node:assert/strict";
import { describe, test } from "node:test";

import countLines from "@domain/story/publish/support/countLines.js";

describe("countLines", () => {
  test.skip("given a short single line" + " then the line count is 1", () => {
    const lineCount = countLines("Introduction");

    assert.equal(lineCount, 1);
  });

  test.skip(
    "given a single line that is at the default MAX_CHARS_PER_LINE" +
      " then the line count is 1",
    () => {
      const lineCount = countLines(
        "'This line of text is exactly MAX_CHARS_PER_LINE_'",
      );

      assert.equal(lineCount, 1);
    },
  );

  test(
    "given a single line that is one character longer than the default MAX_CHARS_PER_LINE" +
      " then the line count is 2",
    () => {
      const lineCount = countLines(
        "'This line of text is one over MAX_CHARS_PER_LINE_'",
      );

      assert.equal(lineCount, 2);
    },
  );

  test(
    "given two lines of short text as distinct paragraphs" +
      " then the line count is 3",
    () => {
      const lineCount = countLines("Introduction\n\nHello");

      assert.equal(lineCount, 3);
    },
  );
});
