import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ErrorCodes } from "@domain/error/errorCode";
import parse from "@domain/story/publish/parse/parse";
import parseAudioHotspot from "@domain/story/publish/parse/parseAudioHotspot";

describe("parseAudioHotspot", () => {
  test("parses the scene audio keyword case-insensitively", () => {
    const result = parseAudioHotspot()("![Waves](AuDiO @ 43,62)", 1);

    assert.deepStrictEqual(result, {
      kind: "audioHotspot",
      text: "Waves",
      src: null,
      x: 43,
      y: 62,
    });
  });

  test("parses and trims an explicit URL", () => {
    const result = parseAudioHotspot()(
      "![Birdsong](  https://media.example/birds.mp3   @ 10,20)",
      1,
    );

    assert.equal(result.kind, "audioHotspot");
    assert.equal(result.src, "https://media.example/birds.mp3");
  });

  test("preserves decimal coordinates", () => {
    const result = parseAudioHotspot()("![Waves](audio @ 43.5, 61.25)", 1);

    assert.equal(result.kind, "audioHotspot");
    assert.equal(result.x, 43.5);
    assert.equal(result.y, 61.25);
  });

  for (const input of [
    "![Waves](audio @ 101,50)",
    "![Waves](audio @ 50,100.1)",
    "![Waves](audio @ -1,50)",
    "![Waves](audio @ 50,-0.1)",
  ]) {
    test(`rejects out-of-range coordinates in ${input}`, () => {
      const result = parseAudioHotspot()(input, 7);

      assert.equal(result.kind, "error");
      assert.equal(result.errorCode, ErrorCodes.MalformedLink);
      assert.deepStrictEqual(result.line, { text: input, number: 7 });
    });
  }

  test("the full pipeline claims audio hotspots before other parsers", () => {
    const result = parse(
      "![Waves](https://media.example/waves.mp3 @ 43,62)",
      1,
    );

    assert.equal(result.kind, "audioHotspot");
  });
});
