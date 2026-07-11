import assert from "node:assert/strict";
import { describe, test } from "node:test";

import parse from "@domain/story/publish/parse/parse";
import parsePanel from "@domain/story/publish/parse/parsePanel";
import {
  insertHotspotLine,
  replaceSectionText,
  upsertPanelLine,
} from "@components/story/published/placeHotspot";

describe("parsePanel", () => {
  test("given '@panel 72,30' then it parses as a panel directive", () => {
    const result = parsePanel()("@panel 72,30", 1);

    assert.equal(result.kind, "panel");
    assert.equal(result.x, 72);
    assert.equal(result.y, 30);
  });

  test("given decimals and spaces then they parse exactly", () => {
    const result = parsePanel()("@panel 72.5 , 30.1", 1);

    assert.equal(result.kind, "panel");
    assert.equal(result.x, 72.5);
    assert.equal(result.y, 30.1);
  });

  test("given out-of-range coordinates then this is an error", () => {
    const result = parsePanel()("@panel 172,30", 3);

    assert.equal(result.kind, "error");
  });

  test("given ordinary prose it is nothing (parsePlaintext's job)", () => {
    const result = parsePanel()("we walked along the river", 1);

    assert.equal(result.kind, "nothing");
  });

  test("the full pipeline parses the directive before plaintext", () => {
    const result = parse("@panel 72,30", 1);

    assert.equal(result.kind, "panel");
  });
});

const CONTENT = [
  "# Groundworks | River run",
  "Here we are in the jungle!",
  "[Open the Book](open-page)",
  "",
  "# River ran",
  "To the end...",
  "",
  "[River Crossing](river-crossing)",
].join("\n");

describe("upsertPanelLine", () => {
  test("inserts a panel directive at the end of the page's section", () => {
    const result = upsertPanelLine(CONTENT, 0, 72, 30);

    const lines = result.split("\n");
    const at = lines.indexOf("@panel 72,30");
    assert.ok(at > 0 && at < lines.indexOf("# River ran"));
  });

  test("replaces an existing panel directive rather than stacking", () => {
    const once = upsertPanelLine(CONTENT, 0, 72, 30);
    const twice = upsertPanelLine(once, 0, 10, 90);

    assert.equal((twice.match(/@panel/g) ?? []).length, 1);
    assert.ok(twice.includes("@panel 10,90"));
  });
});

describe("replaceSectionText", () => {
  test("rewrites heading text but preserves its anchor", () => {
    const result = replaceSectionText(CONTENT, 0, "Foundations", "New words.");

    assert.ok(result.includes("# Foundations | River run"));
    assert.ok(result.includes("New words."));
    assert.ok(!result.includes("Here we are in the jungle!"));
  });

  test("keeps links, hotspots, and the other page intact", () => {
    const withExtras = insertHotspotLine(
      upsertPanelLine(CONTENT, 0, 72, 30),
      0,
      "[peek](river-ran @ 10,20)",
    );
    const result = replaceSectionText(withExtras, 0, "Foundations", "Words.");

    assert.ok(result.includes("[Open the Book](open-page)"));
    assert.ok(result.includes("[peek](river-ran @ 10,20)"));
    assert.ok(result.includes("@panel 72,30"));
    assert.ok(result.includes("# River ran"));
    assert.ok(result.includes("To the end..."));
  });

  test("a second page's text edits in place", () => {
    const result = replaceSectionText(CONTENT, 1, "River ran", "Onward!");

    assert.ok(result.includes("# River ran"));
    assert.ok(result.includes("Onward!"));
    assert.ok(!result.includes("To the end..."));
    assert.ok(result.includes("Here we are in the jungle!"));
  });
});
