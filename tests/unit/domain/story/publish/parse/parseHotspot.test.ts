import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ErrorCodes } from "@domain/error/errorCode";
import parse from "@domain/story/publish/parse/parse";
import parseHotspot from "@domain/story/publish/parse/parseHotspot";

describe("parseHotspot", () => {
  test("given '[Stomp](introduction @ 43,62)' then the text is parsed as a hotspot", () => {
    const input = "[Stomp](introduction @ 43,62)";

    const result = parseHotspot()(input, 1);

    assert.equal(result.kind, "hotspot");
    assert.equal(result.text, "Stomp");
    assert.equal(result.link, "introduction");
    assert.equal(result.x, 43);
    assert.equal(result.y, 62);
  });

  test("given decimal coordinates then they are parsed exactly", () => {
    const input = "[Stomp](introduction @ 43.5, 61.25)";

    const result = parseHotspot()(input, 1);

    assert.equal(result.kind, "hotspot");
    assert.equal(result.x, 43.5);
    assert.equal(result.y, 61.25);
  });

  test("given a plain link then this is nothing (parseLink's job)", () => {
    const input = "[Stomp](introduction)";

    const result = parseHotspot()(input, 1);

    assert.equal(result.kind, "nothing");
  });

  test("given coordinates beyond 100 then this is an error", () => {
    const input = "[Stomp](introduction @ 43,162)";
    const lineNumber = 7;

    const result = parseHotspot()(input, lineNumber);

    assert.equal(result.kind, "error");
    assert.equal(result.errorCode, ErrorCodes.MalformedLink);
    assert.deepStrictEqual(result.line, {
      text: input,
      number: lineNumber,
    });
  });

  test("given a target with spaces then it normalizes like any link target", () => {
    const input = "[Stomp](The Introduction @ 10,20)";

    const result = parseHotspot()(input, 1);

    assert.equal(result.kind, "hotspot");
    assert.equal(result.link, "the-introduction");
  });

  test("the full pipeline parses hotspots before parseLink can reject them", () => {
    const result = parse("[Stomp](introduction @ 43,62)", 1);

    assert.equal(result.kind, "hotspot");
  });

  test("the full pipeline still parses plain links as links", () => {
    const result = parse("[Stomp](introduction)", 1);

    assert.equal(result.kind, "link");
  });
});
