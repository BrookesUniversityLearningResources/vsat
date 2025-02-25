import assert from "node:assert/strict";
import { describe, test } from "node:test";

import parseLinkTarget from "@domain/story/publish/parse/parseLinkTarget.js";

describe("parseTarget", () => {
  test("given 'introduction' then the target is 'introduction'", () => {
    const input = "introduction";

    const result = parseLinkTarget(input);

    assert.equal(result.kind, "link");
    assert.equal(result.link, "introduction");
  });

  test("given 'intro scene' then the target is 'intro-scene'", () => {
    const input = "intro scene";

    const result = parseLinkTarget(input);

    assert.equal(result.kind, "link");
    assert.equal(result.link, "intro-scene");
  });

  test("given '   intro scene' then the target is 'intro-scene'", () => {
    const input = "   intro scene";

    const result = parseLinkTarget(input);

    assert.equal(result.kind, "link");
    assert.equal(result.link, "intro-scene");
  });

  test("given '   intro scene   ' then the target is 'intro-scene'", () => {
    const input = "   intro scene   ";

    const result = parseLinkTarget(input);

    assert.equal(result.kind, "link");
    assert.equal(result.link, "intro-scene");
  });

  test("given 'intro scene   ' then the target is 'intro-scene'", () => {
    const input = "intro scene   ";

    const result = parseLinkTarget(input);

    assert.equal(result.kind, "link");
    assert.equal(result.link, "intro-scene");
  });

  test("given ' intro to the-scene ' then the target is 'intro-to-the-scene'", () => {
    const input = " intro to the-scene ";

    const result = parseLinkTarget(input);

    assert.equal(result.kind, "link");
    assert.equal(result.link, "intro-to-the-scene");
  });

  test("given '' then the result is an error about the empty string", () => {
    const input = "";

    const result = parseLinkTarget(input);

    assert.equal(result.kind, "failure");
    assert.equal(result.reason, "The empty string is not a valid link target");
  });

  test("given ' ' (whitespace only) then the result is an error about the empty string", () => {
    const input = "";

    const result = parseLinkTarget(input);

    assert.equal(result.kind, "failure");
    assert.equal(result.reason, "The empty string is not a valid link target");
  });

  test("given '\n   \t\n ' (whitespace only) then the result is an error about the empty string", () => {
    const input = "\n   \t\n ";

    const result = parseLinkTarget(input);

    assert.equal(result.kind, "failure");
    assert.equal(result.reason, "The empty string is not a valid link target");
  });

  test("given '\n' (whitespace only) then the result is an error about the empty string", () => {
    const input = "\n";

    const result = parseLinkTarget(input);

    assert.equal(result.kind, "failure");
    assert.equal(result.reason, "The empty string is not a valid link target");
  });
});
