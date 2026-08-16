import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildVoicePrompt,
  matchSceneTitle,
  parseVoiceIntent,
} from "../../../../src/domain/voice/parseVoiceIntent.js";

describe("parseVoiceIntent", () => {
  it("parses the canonical verbs", () => {
    assert.equal(parseVoiceIntent("new card").kind, "create");
    assert.equal(parseVoiceIntent("Connect this card to physics two").kind, "connect");
    assert.equal(parseVoiceIntent("remove this link").kind, "remove-link");
    assert.equal(parseVoiceIntent("remove this card").kind, "remove-card");
    assert.equal(parseVoiceIntent("Confirm.").kind, "confirm");
    assert.equal(parseVoiceIntent("cancel").kind, "cancel");
  });

  it("captures the create title when spoken", () => {
    const intent = parseVoiceIntent("new card called night market");
    assert.equal(intent.kind, "create");
    assert.equal(intent.kind === "create" && intent.title, "night market");
    const untitled = parseVoiceIntent("new card");
    assert.equal(untitled.kind === "create" && untitled.title, null);
  });

  it("captures the connect target phrase", () => {
    const intent = parseVoiceIntent("connect this card to Amor em Movimento");
    assert.equal(intent.kind, "connect");
    assert.equal(
      intent.kind === "connect" && intent.targetPhrase,
      "amor em movimento",
    );
  });

  it("accepts shipped mishearing variants", () => {
    assert.equal(parseVoiceIntent("new car").kind, "create");
    assert.equal(parseVoiceIntent("connected the card too physics").kind, "connect");
    assert.equal(parseVoiceIntent("removes this link").kind, "remove-link");
    assert.equal(parseVoiceIntent("remove the cart").kind, "remove-card");
    assert.equal(parseVoiceIntent("confirmed").kind, "confirm");
    assert.equal(parseVoiceIntent("cancelled").kind, "cancel");
  });

  it("drops whisper's near-silence fillers", () => {
    for (const filler of ["you", "Thank you.", "thanks for watching"]) {
      const intent = parseVoiceIntent(filler);
      assert.equal(intent.kind, "not-a-command");
      assert.equal(intent.kind === "not-a-command" && intent.reason, "filler");
    }
  });

  it("short non-matching utterances are noise, long ones are no-match", () => {
    const short = parseVoiceIntent("blue mango");
    assert.equal(short.kind === "not-a-command" && short.reason, "too-short");
    const long = parseVoiceIntent("please make the sky a bit more purple");
    assert.equal(long.kind === "not-a-command" && long.reason, "no-match");
  });

  it("never lets the filler/short rules eat a legitimate verb", () => {
    assert.equal(parseVoiceIntent("confirm").kind, "confirm");
    assert.equal(parseVoiceIntent("new card").kind, "create");
  });
});

describe("matchSceneTitle", () => {
  const titles = ["I-fisica-I", "I-fisica-II", "Amor em Movimento", "This is a place"];

  it("exact and containment matches", () => {
    assert.deepEqual(matchSceneTitle("amor em movimento", titles), {
      kind: "match",
      title: "Amor em Movimento",
    });
    assert.deepEqual(matchSceneTitle("this is a place", titles), {
      kind: "match",
      title: "This is a place",
    });
  });

  it("refuses ambiguity with candidates rather than guessing", () => {
    const result = matchSceneTitle("fisica", titles);
    assert.equal(result.kind, "ambiguous");
    assert.ok(
      result.kind === "ambiguous" && result.candidates.length >= 2,
    );
  });

  it("refuses nonsense", () => {
    assert.deepEqual(matchSceneTitle("the moon landing", titles), {
      kind: "none",
    });
  });
});

describe("buildVoicePrompt", () => {
  it("states verbs in position and appends titles", () => {
    const prompt = buildVoicePrompt(["I-fisica-I", "Amor em Movimento"]);
    assert.ok(prompt.startsWith("New card."));
    assert.ok(prompt.includes("Connect this card to."));
    assert.ok(prompt.includes("Amor em Movimento."));
  });
});
