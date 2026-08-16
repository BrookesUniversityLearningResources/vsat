/**
 * M-voice-board slice 1: transcript → intent, pure and audio-free.
 *
 * The grammar is deliberately shallow (see docs/missions/M-voice-board.md):
 * a handful of verbs, each shipping its own mishearing variants, because
 * short utterances are exactly where whisper hallucinates. Variants grow
 * from the refusal journal, not from guesswork.
 */

export type VoiceIntent =
  | { kind: "create"; title: string | null; transcript: string }
  | { kind: "connect"; targetPhrase: string; transcript: string }
  | { kind: "remove-link"; transcript: string }
  | { kind: "remove-card"; transcript: string }
  | { kind: "confirm"; transcript: string }
  | { kind: "cancel"; transcript: string }
  | {
      kind: "not-a-command";
      transcript: string;
      reason: "filler" | "too-short" | "no-match";
    };

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[.,!?;:'"()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// whisper's stock hallucinations on near-silence (voxterm/WYSIWYG seam rule)
const FILLERS = new Set([
  "you",
  "thank you",
  "thanks",
  "thanks for watching",
  "bye",
]);

// Verb patterns over NORMALIZED text. Each alternation is a shipped
// mishearing variant, not decoration.
const CREATE =
  /^(?:new|knew|a new) (?:card|car|cart|guard)(?: (?:called|named|titled|cold) (.+))?$/;
const CONNECT =
  /^connect(?:ed|s)? (?:this|the|that|his) (?:card|car|cart) (?:to|with|too|two|2) (.+)$/;
const REMOVE_LINK = /^remove[sd]? (?:this|the|that) link$/;
const REMOVE_CARD = /^remove[sd]? (?:this|the|that) (?:card|car|cart)$/;
const CONFIRM = /^confirm(?:ed)?$/;
const CANCEL = /^cancel(?:led|ed)?$/;

export function parseVoiceIntent(rawTranscript: string): VoiceIntent {
  const transcript = rawTranscript.trim();
  const text = normalize(transcript);

  if (!text || FILLERS.has(text)) {
    return { kind: "not-a-command", transcript, reason: "filler" };
  }

  const create = CREATE.exec(text);
  if (create) {
    return { kind: "create", title: create[1]?.trim() || null, transcript };
  }
  const connect = CONNECT.exec(text);
  if (connect) {
    return { kind: "connect", targetPhrase: connect[1].trim(), transcript };
  }
  if (REMOVE_LINK.test(text)) return { kind: "remove-link", transcript };
  if (REMOVE_CARD.test(text)) return { kind: "remove-card", transcript };
  if (CONFIRM.test(text)) return { kind: "confirm", transcript };
  if (CANCEL.test(text)) return { kind: "cancel", transcript };

  // grammar-aware short-utterance rule: verbs above may be 1-2 words, but
  // short non-matching utterances are noise (the WYSIWYG two-word drop,
  // scoped so it can never eat a legitimate verb)
  const words = text.split(" ").length;
  return {
    kind: "not-a-command",
    transcript,
    reason: words <= 2 ? "too-short" : "no-match",
  };
}

export type TitleMatch =
  | { kind: "match"; title: string }
  | { kind: "ambiguous"; candidates: string[] }
  | { kind: "none" };

/**
 * Resolve a spoken TITLE argument against the focused story's scene titles.
 * Never guesses: ambiguity and no-match are refusals with candidates shown.
 */
export function matchSceneTitle(
  phrase: string,
  titles: string[],
): TitleMatch {
  const p = normalize(phrase);
  if (!p) return { kind: "none" };

  const scored = titles.map((title) => {
    const t = normalize(title);
    if (t === p) return { title, score: 1 };
    if (t.includes(p) || p.includes(t)) return { title, score: 0.8 };
    const tw = new Set(t.split(" "));
    const pw = new Set(p.split(" "));
    let common = 0;
    for (const w of pw) if (tw.has(w)) common += 1;
    const union = new Set([...tw, ...pw]).size;
    return { title, score: union ? common / union : 0 };
  });

  scored.sort((a, b) => b.score - a.score);
  const [best, second] = scored;
  if (!best || best.score < 0.4) return { kind: "none" };
  if (second && best.score - second.score < 0.1) {
    return {
      kind: "ambiguous",
      candidates: scored
        .filter((s) => best.score - s.score < 0.1)
        .map((s) => s.title),
    };
  }
  return { kind: "match", title: best.title };
}

/**
 * The whisper prompt IS the grammar, stated in position (voxterm's measured
 * result: bare word lists hurt; words shown in position help), plus the
 * focused story's scene titles so TITLE args decode toward real names.
 */
export function buildVoicePrompt(sceneTitles: string[]): string {
  const verbs =
    "New card. New card called night market. Connect this card to. " +
    "Remove this link. Remove this card. Confirm. Cancel.";
  return sceneTitles.length
    ? `${verbs} ${sceneTitles.join(". ")}.`
    : verbs;
}
