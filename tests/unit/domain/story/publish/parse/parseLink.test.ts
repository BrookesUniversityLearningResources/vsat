import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ErrorCodes } from "@domain/error/errorCode";
import parseLink from "@domain/story/publish/parse/parseLink";

describe("parseLink", () => {
  test("given '[Stomp](introduction)' then the text is parsed successfully as a link", () => {
    const input = "[Stomp](introduction)";

    const result = parseLink()(input, 1);

    assert.equal(result.kind, "link");
    assert.equal(result.text, "Stomp");
    assert.equal(result.link, "introduction");
  });

  test("given '[Stomp]   (introduction)' then the text is parsed successfully as a link", () => {
    const input = "[Stomp]   (introduction)";

    const result = parseLink()(input, 1);

    assert.equal(result.kind, "link");
    assert.equal(result.text, "Stomp");
    assert.equal(result.link, "introduction");
  });

  test(
    "given '[Stomp](introduction' then this is an error" +
      " because a well-formed link must end with a closing )",
    () => {
      const input = "[Stomp](introduction";
      const lineNumber = 99;

      const result = parseLink()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(result.message, "Link is missing closing )");
      assert.equal(result.errorCode, ErrorCodes.ParseErrorLinkNotClosed);
      assert.deepStrictEqual(result.line, {
        text: "[Stomp](introduction",
        number: lineNumber,
      });
    },
  );

  test(
    "given '(Stomp)[introduction]' then this is an error" +
      " because the link delimiters are swapped",
    () => {
      const input = "(Stomp)[introduction]";
      const lineNumber = 99;

      const result = parseLink()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(
        result.message,
        "Link delimiters are swapped; it's []() not ()[]",
      );
      assert.equal(
        result.errorCode,
        ErrorCodes.ParseErrorLinkDelimetersSwapped,
      );
      assert.deepStrictEqual(result.line, {
        text: "(Stomp)[introduction]",
        number: lineNumber,
      });
    },
  );

  test(
    "given '[]()' then this is an error" +
      " because both parts of a well-formed link are missing",
    () => {
      const input = "[]()";
      const lineNumber = 99;

      const result = parseLink()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(
        result.message,
        "A well-formed link needs both some text and a target that it links to",
      );
      assert.equal(result.errorCode, ErrorCodes.ParseErrorLinkEmpty);
      assert.deepStrictEqual(result.line, {
        text: "[]()",
        number: lineNumber,
      });
    },
  );

  test(
    "given '[   ](   )' then this is an error" +
      " because both parts of a well-formed link are missing" +
      " and whitespace is not significant",
    () => {
      const input = "[   ](   )";
      const lineNumber = 99;

      const result = parseLink()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(
        result.message,
        "A well-formed link needs both some text and a target that it links to",
      );
      assert.equal(result.errorCode, ErrorCodes.ParseErrorLinkEmpty);
      assert.deepStrictEqual(result.line, {
        text: "[   ](   )",
        number: lineNumber,
      });
    },
  );

  test(
    "given '[   ](introduction)' then this is an error" +
      " because the link is missing text",
    () => {
      const input = "[   ](introduction)";
      const lineNumber = 99;

      const result = parseLink()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(result.message, "Link doesn't have any text");
      assert.equal(result.errorCode, ErrorCodes.MalformedLink);
      assert.deepStrictEqual(result.line, {
        text: "[   ](introduction)",
        number: lineNumber,
      });
    },
  );

  test(
    "given '[Introduction]()' then this is an error" +
      " because the link is missing it's target",
    () => {
      const input = "[Introduction]()";
      const lineNumber = 99;

      const result = parseLink()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(result.message, "Link doesn't have a target");
      assert.equal(result.errorCode, ErrorCodes.MalformedLink);
      assert.deepStrictEqual(result.line, {
        text: "[Introduction]()",
        number: lineNumber,
      });
    },
  );

  test(
    "given '[Introduction]()' then this is an error" +
      " because the link is missing it's target" +
      " and whitespace is not significant",
    () => {
      const input = "[Introduction](   )";
      const lineNumber = 99;

      const result = parseLink()(input, lineNumber);

      assert.equal(result.kind, "error");
      assert.equal(result.message, "Link doesn't have a target");
      assert.equal(result.errorCode, ErrorCodes.MalformedLink);
      assert.deepStrictEqual(result.line, {
        text: "[Introduction](   )",
        number: lineNumber,
      });
    },
  );

  test("given '[Stomp](the-2nd-link)' then the text is parsed successfully as a link", () => {
    const input = "[Stomp](the-2nd-link)";

    const result = parseLink()(input, 1);

    assert.equal(result.kind, "link");
    assert.equal(result.text, "Stomp");
    assert.equal(result.link, "the-2nd-link");
  });
});
