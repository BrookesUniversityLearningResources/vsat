# M-voice-board — voice-driven board editing (WP3 design)

Status: DESIGN 2026-08-16, drafted with Joe. Re-opens M-relay-authoring
scoped to authoring intents (invoice 202506 WP3, 10.0hr). Grounded in two
working systems surveyed in `M-relay-authoring-voice-landscape.md`: voxterm
(zone-joe:~/code/voxterm — capture page + whisper.cpp serving, both built)
and the voice WYSIWYG LaTeX loop (futon5 — the interaction model that works).
Nothing here is speculative: every mechanism below exists in one of the two
systems or in the shipped board verbs; the new work is the join.

## What the user does

Standing in the focused GeomView board (or planetarium), with voice armed:

    "new card"                        → scene appears (default title)
    "new card called night market"    → scene appears, titled
    "connect this card to physics two"→ link line written from the card
                                        under the pointer/gaze to the scene
                                        whose title best matches "physics two"
    "remove this link"                → the current (hovered) arc's line is
                                        struck; arc disappears
    "remove this card"                → confirmation chip; "confirm" deletes
    "cancel"                          → abandons any pending confirmation

"this" is deixis against state the board ALREADY tracks: the hovered card
(focus3D pick), the current link (arcCurrent — the REMOVE chip machinery),
the focused story. No new selection mechanism is needed — that is the
two-stream join from the WYSIWYG loop (context stream + speech stream,
married at commit), with the board's existing hover state as the context
stream. Keep the last NON-EMPTY referent: glancing away between pointing
and speaking must not lose the target.

## Architecture (reuse-first)

    [mic: phone page or workstation]      voxterm page — BUILT (PTT +
        │  16 kHz WAV, utterance-chunked   always-listening VAD, calibration)
        ▼
    [whisper server]                      voxterm server.py — BUILT
        │  small.en, warm, single-flight,  (~550 ms / 6 s utterance)
        │  in-position prompt biasing
        ▼
    [seam filter + grammar parse]         NEW — pure function, see below
        │  intent {verb, args, transcript, provenance} | dictation | drop
        ▼
    [relay room]                          existing WebSocket relay; NEW
        │  message kinds: intent,          kinds (today's five are nav-only)
        │  dictation — text + provenance,
        │  transcriber-agnostic
        ▼
    [host page: armed? → apply]           vsat board page = relay host (NEW:
           board verbs via existing        vsatlatarium isn't a relay host
           client paths + write APIs       yet), author's own session

Decoder biasing IS the grammar, stated in position (voxterm's measured
result — bare word lists hurt): the whisper prompt becomes literally
`"New card. Connect this card to. Remove this link. Remove this card."`
plus the focused story's scene titles. Re-arm the prompt when focus changes
so titles stay current.

## The grammar (small, fuzzy, deliberately shallow)

Fixed verb set, one regex family per verb, each shipping its own mishearing
variants (the WYSIWYG lesson: short utterances are exactly where whisper
hallucinates — "rocket" matches rock-it/racket/rocked):

| intent | canonical | variants to ship (grow from refusal journal) |
|---|---|---|
| create | "new card (called TITLE)?" | "new car", "you card" |
| connect | "connect this card to TITLE" | "connect the card", "connected" |
| remove-link | "remove this link" | "remove the link", "removes" |
| remove-card | "remove this card" | "remove the card" |
| confirm / cancel | "confirm" / "cancel" | "confirmed", "cancelled" |

- TITLE args resolve against the focused story's scene titles by normalized
  fuzzy match (the same normalization as sceneLinkTarget); ambiguous or
  no-match → refusal with the candidates shown, never a guess.
- Seam filter (voxterm/WYSIWYG): drop known fillers (you/thank you/thanks…),
  drop sub-0.5 s audio — but the sub-2-word drop rule must become
  GRAMMAR-AWARE here: "new card" and "confirm" are legitimate 1–2 word
  utterances. Rule: short utterances survive only if they match the grammar;
  everything short and non-matching is noise.
- Non-matching long utterances are NOT commands. v1: journal and show them
  ("heard, not a command"); dictation-for-edit (scene text) is a later slice
  gated on the same grammar ("edit this card" enters dictation mode) — not
  in v1.

## Safety model (the WP3 provenance requirement)

- **Arming is explicit and visible** on the host: a toolbar toggle ("voice:
  armed"), default OFF, exactly like edits-disarmed-by-default in the
  WYSIWYG (its rule: the client must show the armed state BEFORE the user
  acts; a refusal after the fact is not an honest indicator).
- **A steering room code must not silently write**: intents apply only when
  the HOST (author's session) has armed voice; the relay remote never holds
  authority. Provenance field on every message ({surface:"whisper",
  captured:"phone|desk", model}) journalled with the applied edit —
  edit-changelog attribution comes free since writes go through the same
  authenticated write path as the pointer verbs.
- **Destructive verbs two-step**: remove-card requires spoken "confirm"
  while the confirmation chip shows what will be deleted (mirrors the
  board's existing confirm dialog; remove-link is already visible-first via
  the current-link chip). Everything else applies optimistically with the
  board's existing visual feedback — NO spoken echo-back (built and torn
  out of voxterm: "hyperactive parrot"); the board's chips and toasts are
  the confirmation surface.
- **Refusals are journalled with the attempted transcript** (WYSIWYG rule:
  the refused utterance is the only copy of what the author said, and the
  best data for growing the variant lists).
- **Degrade to silence**: the voice path stays out of the board's critical
  path; a dead transcriber or dropped relay never blocks pointer editing.

## Slices (small packets, one behaviour each)

1. **Grammar parser** — pure function transcript → intent|dictation|drop,
   with variants + title fuzzy-match + refusal reasons. Unit tests only; no
   audio, no relay. (This is also where the whisper prompt string is built.)
2. **Relay kinds + armed toggle** — intent/dictation kinds through the
   existing relay; vsatlatarium becomes a relay host; armed toggle + heard/
   applied/refused chip. e2e by INJECTING intents over the relay — the whole
   voice feature is testable without audio, by design.
3. **Apply layer** — intents drive the existing verb paths (create/connect/
   remove) under the host session; confirm/cancel state machine.
4. **Capture join** — point voxterm's route at the relay (config-level
   change on the voxterm side; capture and whisper are already built).
   Phone-mic via the existing tunnel trick locally; vsat-dev is TLS so
   getUserMedia works directly there.
5. **Dictation-for-edit** ("edit this card" → dictate text) — only after
   1–4 hold up in use.

## Open questions (Joe)

- Where does whisper serve from for VSAT sessions — workstation (new
  install) or zone-joe (exists; adds a network hop ~nothing vs 550 ms)?
- Phone mic or workstation mic first? (voxterm supports both already.)
- "connect this card to TITLE" (one utterance) vs deictic two-step
  ("connect this card" … look at target … "to here")? v1 assumes the
  former; the latter is a natural follow-on since the join machinery is
  identical.
