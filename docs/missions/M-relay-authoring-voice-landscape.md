# Voice-system landscape notes for WP3 (voice authoring over the relay)

Surveyed 2026-08-16 ahead of re-opening M-relay-authoring (invoice 202506
WP3). Joe runs two Whisper-backed voice systems whose measured results and
design decisions should shape WP3 rather than a greenfield design. Sources:
`futon3c/README-voxterm.md` (design + benchmarks; NB the implementation dir
`~/code/voxterm/` it references is absent on this box),
`futon5/holes/tech-notes/paper/html-build/wysiwyg/` + `futon3c/emacs/
latex-wysiwyg.el` + `~/opt/voice-typing-linux/enhanced-voice-typing.py`
(the working voice WYSIWYG loop), `futon5/.../PATTERNS.md`,
`futon3c/holes/missions/M-latex-wysiwyg.md`.

## The two systems in one paragraph each

**Update 2026-08-16 (later):** voxterm's implementation was located on
**zone-joe** at `~/code/voxterm/` (server.py 596 lines, index.html 600,
voxterm.el 273). It is ahead of its README: capture supports BOTH
hold-to-talk (button or spacebar) and an "Always listening" toggle backed by
an in-page VAD state machine (ring pre-roll buffer, calibratable threshold —
a Recalibrate control — and speech/silence hysteresis), i.e. it has already
converged toward the WYSIWYG loop's continuous-capture model. Server: single
in-flight transcription lock (whisper is CPU-bound), both small.en and
large-v3-turbo models on disk, in-position PROMPT biasing + small FIXUPS
backstop. The degrade-to-silence invariant is enforced in the page as well.
For WP3 this means the phone-capture page is largely BUILT — the reuse
question is porting/pointing it at the relay rather than writing capture.

**voxterm** (design + benchmarks): phone browser over an ssh -L tunnel
(loopback = secure context, mic works without TLS), utterance-chunked WAV
POSTs to whisper.cpp `small.en` (~550 ms for 6 s speech on CPU; large-v3-turbo
rejected at 6.7 s), text lands in Emacs via emacsclient and submits; replies
stream back with the first paragraph spoken via piper TTS (~0.5 s). Speech is
a pure duplicate of the buffer — never in the critical path; queues capped,
drop oldest-first.

**Voice WYSIWYG** (working): continuous local capture — PyAudio + webrtcvad,
1.5 s pre-roll, utterance closed by 0.8 s silence, faster-whisper `small`
int8 warmed at startup — with exactly ONE spoken command ("rocket" = commit,
matched fuzzily: rock-it/rocked/racket/…, split mid-utterance). Selection
stream and speech stream are captured independently and married at commit
(last non-empty selection wins). Edits apply by quote-verified splice
(exactly-one-match or refuse), optimistic in the browser with
revert-on-reject, journalled to JSONL including REFUSALS with the attempted
text. Undo is the editor's own. Arm/disarm state is pushed to the client
before the user acts.

## What WP3 should copy

1. Two-stream join at commit: gaze/selection context captured independently
   of speech, married when the commit verb fires; keep last NON-EMPTY context.
2. Fixed-grammar verbs need per-verb mishearing variants (fuzzy matching),
   and must not require the verb isolated in its own utterance — short lone
   utterances are Whisper's hallucination case.
3. Filter at the audio→text seam, pre-relay: drop hallucination fillers
   (you/thank you/thanks…), sub-2-word utterances, sub-0.5 s audio.
4. Utterance-chunked decode with a small warm local model beats streaming
   (0.55–1 s total; streaming complexity buys nothing at this latency).
5. Decoder biasing: words IN POSITION ("Ask Claude. Tell Claude.") measurably
   help; a bare jargon word list measurably HURTS (worse than no prompt).
6. Apply optimistically, verify by exact-quote (or equivalent), revert with a
   human-readable reason — the refusal IS the correction affordance.
7. Journal refusals with the attempted text (only copy of the author's words;
   best data for grammar gaps).
8. Armed/disarmed pushed to the client before acting + liveness heartbeat
   pill. (Maps directly onto WP3's arming-toggle/provenance requirement.)
9. Keep voice strictly off the critical path — degrade to silence.

## What WP3 should avoid

- Spoken echo-back confirmation ("hyperactive parrot" — built and removed);
  confirm on the screen the user is watching.
- Treating barge-in as a detail (voxterm: it is THE gap between "works" and
  "feels like the claude.ai app"); if replies are spoken, cap their length.
- Coupling the pointer to the actuator — steering and writing must be
  separate objects with separate kill switches (WP3's provenance rule,
  independently derived in M-smart-emacs-cursor A2).
- Assuming source positions survive macro/generated regions — have a raw
  escape hatch (WYSIWYG's F2: macro args carry no sourcepos).

## Open decision for WP3

Capture layer: the plan assumed Web Speech API on the phone remote; both
existing systems argue for utterance-chunked POSTs to a local Whisper
instead (private, controllable, proven latency). The relay message kinds
(`intent`, `dictation`) should be transcriber-agnostic — text + provenance —
so this stays swappable. NB the phone-mic secure-context trick (ssh -L
loopback tunnel) does not carry to a Heroku demo; vsat-dev is already TLS so
getUserMedia works there regardless of transcriber choice.
