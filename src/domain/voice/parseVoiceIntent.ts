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
  | { kind: "edit-card"; transcript: string }
  | { kind: "done"; transcript: string }
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
const EDIT_CARD = /^edit (?:this|the|that) (?:card|car|cart)$/;
// NB patterns run on normalize()d text, where apostrophes are spaces:
// "I'm done" → "i m done", "that's it" → "that s it"
const DONE = /^(?:done|i ?m done|that ?s (?:it|all)|finished?)$/;
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
  if (EDIT_CARD.test(text)) return { kind: "edit-card", transcript };
  if (DONE.test(text)) return { kind: "done", transcript };
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

/**
 * A spoken turn often carries several commands ("New card. Connect this
 * card to…") and whisper's decoder can loop, repeating trailing sentences.
 * Split on sentence boundaries, parse each, and collapse consecutive
 * duplicate intents (the loop artifact folds away; a human genuinely
 * repeating a command back-to-back within one utterance is not a case we
 * need — they can breathe).
 */
export function parseVoiceUtterance(rawTranscript: string): VoiceIntent[] {
  // commas count as boundaries: whisper comma-joins short commands
  // ("Confirm, cancel." — live demo transcript). Tradeoff: a comma inside
  // a spoken create-title splits the title; titles survive via re-dictation.
  const sentences = rawTranscript
    .split(/[.?!;,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!sentences.length) {
    return [parseVoiceIntent(rawTranscript)];
  }
  // decoder loops repeat exact sentences (observed live: a trailing pair
  // repeated 3×) — keep each exact sentence's FIRST occurrence. Tradeoff:
  // deliberately saying the same command twice within ONE utterance is not
  // supported; say it in a new breath.
  const seen = new Set<string>();
  const unique = sentences.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.map(parseVoiceIntent);
}

/**
 * Collapse whisper's decoder-loop repetitions in DICTATED PROSE: drop
 * consecutive exact-duplicate sentences (punctuation preserved). Unlike the
 * command path's first-occurrence dedupe, prose may legitimately repeat a
 * sentence later — only back-to-back repeats are loop artifacts.
 */
export function collapseLoopedSentences(text: string): string {
  const parts = text.match(/[^.?!;]+[.?!;]*\s*/g);
  if (!parts) return text.trim();
  const key = (s: string) => s.trim().toLowerCase().replace(/[.?!;\s]+$/, "");
  const out: string[] = [];
  for (const part of parts) {
    const prev = out[out.length - 1];
    if (prev !== undefined && key(prev) === key(part)) continue;
    out.push(part);
  }
  return out.join("").trim();
}

export type TitleMatch =
  | { kind: "match"; title: string }
  | { kind: "ambiguous"; candidates: string[] }
  | { kind: "none" };

/**
 * Resolve a spoken TITLE argument against the focused story's scene titles.
 * Never guesses: ambiguity and no-match are refusals with candidates shown.
 */
// Whisper spells what it hears ("Physica 2" for "fisica two"): fold
// transliteration and numeral variants before comparing.
const NUMERALS: Record<string, string> = {
  one: "1", um: "1", i: "1",
  two: "2", to: "2", dois: "2", ii: "2",
  three: "3", tres: "3", iii: "3",
  four: "4", quatro: "4", iv: "4",
  five: "5", cinco: "5", v: "5",
  six: "6", seis: "6", vi: "6",
};

const foldForMatch = (text: string): Set<string> =>
  new Set(
    normalize(text)
      .replace(/[-_/]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w) => w.replace(/ph/g, "f").replace(/y/g, "i"))
      .map((w) => NUMERALS[w] ?? w),
  );

export function matchSceneTitle(
  phrase: string,
  titles: string[],
): TitleMatch {
  const p = normalize(phrase);
  if (!p) return { kind: "none" };
  const pw = foldForMatch(phrase);

  const scored = titles.map((title) => {
    const t = normalize(title);
    if (t === p) return { title, score: 1 };
    if (t.includes(p) || p.includes(t)) return { title, score: 0.8 };
    const tw = foldForMatch(title);
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
    "Remove this link. Remove this card. Edit this card. Done. " +
    "Confirm. Cancel.";
  return sceneTitles.length
    ? `${verbs} ${sceneTitles.join(". ")}.`
    : verbs;
}
