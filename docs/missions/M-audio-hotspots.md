# M-audio-hotspots — positioned audio as story markup + surround prototype

**Invoice line (202506 WP4, 8.0hr):** "Positioned audio sources as first-class
story markup (the audio sibling of the text hotspot syntax), placed with the
existing WYSIWYG click / place-at-gaze gestures; A-Frame positional audio
inside the photosphere; story audio assets positioned on the planetarium dome
for a simple surround-sound prototype — hearing stories from their directions
as you look around."

Status: DESIGN 2026-08-16. Sequenced as small packets, one commit each.

## Design

### Syntax — the audio sibling

Text hotspot (M-authoring-2d D4): `[label](target @ x,y)`, x,y percent-of-image.
Audio hotspot follows markdown's embedded-media convention (`!` prefix):

```
![label](audio @ x,y)          — place THE SCENE'S audio asset at x,y
![label](https://… @ x,y)      — place an explicit audio URL at x,y
```

- `audio` is a keyword, not a target: the `!` prefix keeps it out of
  `parseHotspot`'s namespace, so a page link legitimately named "audio" still
  works as a text hotspot.
- Same percent-of-image x,y as text hotspots — invariant across flat, poster,
  and photosphere (M-authoring-2d D4 rationale), so `imagePercentToGaze` and
  the `HOTSPOT_RADIUS` sphere math apply unchanged.
- **No schema change.** Markup stays the single source of truth
  (M-authoring-2d Q4 decision: no hotspot table); the `audio` keyword resolves
  to `scene.audio.url` at publish time, and the URL form covers multi-asset
  scenes without touching the one-`audioId`-per-scene column or the
  `{storyId}-{sceneId}` Cloudinary public_id convention.
- Defaults: `loop: true`, volume 1 — ambient-emitter semantics. No extra
  grammar until a real need shows up.

### Parse → publish

New `parseAudioHotspot` registered BEFORE `parseHotspot` (which must stay
before `parseLink` — same ordering trick, `parse.ts:10-21`). Kind
`"audioHotspot"` → `blockAudioHotspot {text, src, x, y}` in `parseStory`,
with the `audio` keyword resolved against the scene's attached audio (a scene
with no audio asset publishes the block with `src: null` and the renderer
skips it — validation warning, not error, so drafts don't wedge).

### Photosphere playback

Per `blockAudioHotspot`, a `scene-audio-hotspot` entity in `#hotspots`
(sibling of `scene-hotspot`): positioned via `imagePercentToGaze`, A-Frame
`sound="src: …; positional: true; autoplay: true; loop: true"` (native in
vendored 1.7.0; the sound component installs the camera AudioListener), plus
a subtle ♪ glyph so authors can see and re-place it.

Double-play rule: if any audio hotspot in the current scene resolves to the
scene's own asset, the legacy flat scene-level `sound` swap
(`PrepareStory.astro:167-182`) is suppressed for that scene — the positional
emitter replaces the non-positional bed, not layers over it.

### Placement gestures

- Flat `?edit=hotspots`: the existing placement form gains a link/audio
  choice; audio writes `![label](audio @ x,y)` through the same
  `insertHotspotLine` + `mutateDraftContent` path. Flat view renders a ♪
  marker (flat audio playback stays deferred, as documented).
- Photosphere: key `a` = place audio at gaze — the sibling of `h`
  (`setupGazePlacement`), same floating form minus the target picker.

### Planetarium surround prototype

In planetarium mode, a toolbar toggle (**default OFF** — seven simultaneous
loops is a hazing, not a feature): for each cluster whose story has audio
(first scene with an asset), one positional emitter at the cluster's dome
direction, low volume, loop. Look around → stories audible from their
directions. Toggle documented in the "?" usage panel (same-commit rule).

## Packets

1. Parser + publish plumbing + unit tests (no UI).
2. Photosphere positional playback + double-play rule + e2e.
3. Placement gestures (flat form + `a`-at-gaze) + e2e.
4. Planetarium surround toggle + e2e.
5. Docs: usage panel lines, this doc's checkpoint, INTERACTIVE-QA entries.

## Open questions (defaults chosen, cheap to change)

- `!`-prefix grammar OK? (3-line change if a different sigil is preferred.)
- Loop-by-default for positional emitters?
- Surround toggle default-off?

## Checkpoint 2026-08-16

WP4 is feature-complete across five packets:

1. `80c3e87` — audio-hotspot parsing, publishing, type guards, link-validation
   isolation, and unit coverage.
2. `3e03d05` — photosphere positional playback, scene-bed suppression, audio
   unlock/cleanup, and end-to-end coverage.
3. `4620100` — flat and gaze placement gestures, flat-view markers, shared
   write-path coverage, and placement end-to-end coverage.
4. `05c6338` — default-off planetarium surround toggle, per-cluster emitters,
   usage help, and data-driven end-to-end coverage.
5. This checkpoint — discoverability, operator QA, and handover documentation.

The implemented decisions are: keyword hotspots without a scene asset publish
with `src: null` and render nothing rather than failing publication; Slate
round-trips audio-hotspot source lines exactly; `replaceSectionText` keeps
audio-hotspot lines while replacing prose; a positional emitter using the
scene's own audio suppresses the flat scene-level bed; planetarium emitters
live inside the turntable, use `refDistance = clusterRadius` and
`rolloffFactor = 0.15`; and planetarium surround remains default-off.

Remaining work is sensory QA by the operator with real speakers/headphones and
seeded story audio. Flat-view audio playback remains deliberately deferred;
the flat renderer provides placement feedback with its visible ♪ marker only.

**Operator QA 2026-08-16 (first sensory pass, passed):** surround toggle in
the planetarium ("frankly pretty cool" — flagged as the Eric demo); `a`-at-gaze
placement positional and directional; two-emitter scene (437 of story 165)
spatializes correctly — keyword-form asset and external URL heard from their
distinct directions simultaneously.

**External-URL constraint (learned in QA):** WebAudio refuses cross-origin
audio without CORS, SILENTLY — an emitter for a URL whose host omits
`Access-Control-Allow-Origin` simply never sounds. Cloudinary assets are fine
(CORS on by default); self-hosted files need the header added server-side
(done for metameso.org in nginx, 2026-08-16). Polish candidates on file: red/
hollow ♪ on sound-load error, CORS preflight warning in the placement form,
move-hotspot-to-gaze key, friendlier not-published redirect (err=4).
