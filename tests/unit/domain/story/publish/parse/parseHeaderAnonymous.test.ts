import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ErrorCodes } from "@domain/error/errorCode";
import parseHeaderAnonymous from "@domain/story/publish/parse/parseHeaderAnonymous.js";

describe("parseHeaderAnonymous", () => {
  test("given '#Introduction' then the header is 'Introduction'", () => {
    const input = "#Introduction";

    const result = parseHeaderAnonymous()(input, 1);

    assert.equal(result.kind, "headerAnonymous");
    assert.equal(result.text, "Introduction");
  });

  test(
    "given '#Introduction|' then this is an error" +
      " because a heading can't end with a | that has no following target",
    () => {
      const input = "#Introduction|";
      const lineNumber = 99;

      const result = parseHeaderAnonymous()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(result.message, "An anonymous header must not end with a |");
      assert.deepStrictEqual(result.line, {
        text: "#Introduction|",
        number: lineNumber,
      });
    },
  );

  test(
    "given '#Introduction|  ' (trailing whitespace) then this is an error" +
      " because a heading can't end with a | that has no following target",
    () => {
      const input = "#Introduction|  ";
      const lineNumber = 99;

      const result = parseHeaderAnonymous()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(result.message, "An anonymous header must not end with a |");
      assert.equal(result.errorCode, ErrorCodes.ParseErrorHeaderNeedsName);
      assert.deepStrictEqual(result.line, {
        text: "#Introduction|  ",
        number: lineNumber,
      });
    },
  );

  test(
    "given '#' only on a line then this is an error" +
      " because a heading must have some associated text",
    () => {
      const input = "#";
      const lineNumber = 99;

      const result = parseHeaderAnonymous()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(
        result.message,
        "A header must have some text; add some text after the #",
      );
      assert.equal(result.errorCode, ErrorCodes.ParseErrorHeaderNeedsText);
      assert.deepStrictEqual(result.line, {
        text: "#",
        number: lineNumber,
      });
    },
  );

  test(
    "given '#   ' then this is an error" +
      " because a heading must have some associated (non-whitespace-only) text",
    () => {
      const input = "#   ";
      const lineNumber = 99;

      const result = parseHeaderAnonymous()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(
        result.message,
        "A header must have some text; add some text after the #",
      );
      assert.equal(result.errorCode, ErrorCodes.ParseErrorHeaderNeedsText);
      assert.deepStrictEqual(result.line, {
        text: "#   ",
        number: lineNumber,
      });
    },
  );
});
