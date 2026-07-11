# M-authoring-3d — VR-native authoring ("Miro in 3D")

**Status:** HEAD + IDENTIFY drafted (2026-07-11); MAP pending.
**Blocked-by (partial):** M-authoring-2d (gesture + mode plumbing),
M-relay-authoring (voice / paired-keyboard input path). The
constellation-authoring core can begin against dev auth before either
lands, but the full demo consumes both.

## HEAD

- **Operator-voice anchor:** "Work with a VR headset and audio
  controls (though keyboard controls could also work for a touch
  typist). What would MS Word look like if it had been authored as VR
  native? I don't think it would look much like MS Word — it might
  look more like 'Miro in 3D'." (Joe, 2026-07-11.)
- **What's already felt to be true:** A VR-native writing tool
  wouldn't be a document; the page is an artifact of paper. What
  survives translation into space is blocks of text with spatial
  relationships — spatial hypertext — and that is already VSAT's data
  model: stories are scenes, scenes are titled pages with typed
  links, and the planetarium already renders the whole graph as a
  constellation you stand inside. So "Miro in 3D" is not a new
  product; it is the observation that **vsatlatarium is the read-only
  view of the thing, and VR authoring means making it writable.**
  Supporting evidence in the tree: the planetarium works and is the
  flagship; `/story/text3d` de-risked three.js addons (TextGeometry
  etc.) under COEP; the relay gives paired second-surface input
  (phone/laptop) for free, which sidesteps VR's worst input problem —
  headset does spatial gestures and voice, the paired keyboard does
  touch-typing.
- **Anti-glibness discipline:** Two traps. (1) A fly-through that
  *looks* like authoring but writes nothing — every demo interaction
  must round-trip to the database and be visible on reload. (2)
  Over-promising in-headset voice: Web Speech API support in Quest
  Browser is historically unreliable; the claim must be spiked on real
  hardware before it appears in any demo script, with the
  relay-carried phone-microphone path as the stated fallback.
- **Working-economy position:** This is the "fairly big idea" of the
  Eric roadmap — the flagship demo that justifies the month. It is
  underwritten by M-authoring-2d (the point-and-place gesture,
  built once at low dimensionality), M-relay-authoring (trusted input
  from paired surfaces), the planetarium itself, and the existing
  interpretive-layer API (link propose/vote/accept). It underwrites
  the future-VSAT story: voice authoring, SimLab, collaborative
  multi-user spaces.
- **Clarity-gap / carried-forward tensions:**
  - Two tiers with different sizes: **in-scene** authoring (inside a
    photosphere: look at a spot, place a hotspot, attach text) vs
    **constellation** authoring (inside the planetarium: grab nodes,
    draw arcs between stories, dictate rationale). Which is the
    primary demo? Current lean: constellation, because it is the more
    novel demo and turns the interpretive layer from forms into a
    spatial act — but Eric's reaction should settle it.
  - The planetarium's turntable/drag control scheme is mouse-native;
    what survives entry into immersive mode is unknown.
  - Hardware access: which headset, when, for spikes?
  - Text *display* in-scene is de-risked (troika, text3d); text
    *entry* is not — voice, paired keyboard, or both.
- **Provenance:** Roadmap conversation Joe ↔ Claude, 2026-07-11
  (operator wording preserved above); prior planetarium vision notes
  (memory: `feedback_vsatlatarium_vision` — immersive planetarium,
  camera inside, not an external model viewer).

## 1. IDENTIFY

- **Motivation:** Authoring VSAT today means desktop forms and
  wikitext; the 3D experience is read-only. The discrepancy: the
  platform's most distinctive surface (the planetarium, the
  photosphere) is exactly where authors *cannot* work. Meanwhile the
  interpretive layer's link-proposal workflow — VSAT's conceptual
  heart — lives in 2D admin pages, invisible from the space it
  describes.
- **Theoretical anchoring:** Spatial hypertext (the data model is
  already scene-blocks-with-typed-links); direct manipulation
  (author = view + edit-in-place, continuous with the 2D hotspot
  editor); VR-native design as *rethinking the artifact*, not porting
  the desktop metaphor (the operator's MS Word thought experiment);
  division of input labor (headset for spatial acts + voice, paired
  surface for text — enabled by the relay).
- **Scope in:**
  1. **Immersive-mode entry**: the planetarium enters WebXR cleanly
     (controls remapped from mouse-turntable to
     controller/gaze-appropriate equivalents).
  2. **Constellation authoring (primary demo):** in the planetarium,
     select two story nodes and draw an arc between them → creates a
     real link *proposal* (typed, with rationale) via the existing
     interpretive-layer API; the new arc renders immediately and
     persists on reload.
  3. **Rationale input** via at least one working path: paired
     keyboard/phone over the relay (depends on M-relay-authoring),
     with in-headset voice as a spiked stretch goal.
  4. **In-scene authoring (secondary/stretch):** inside a 360° scene,
     place a link hotspot at gaze/controller direction — the 3D
     sibling of M-authoring-2d's flat hotspot editor.
  5. Desktop fallback: every authoring interaction also operable with
     mouse/keyboard in the normal browser (a demo Eric can try
     without a headset).
- **Scope out / deferred:** full text-document editing in VR (the
  thought experiment informs the design; we are not building a word
  processor); multi-user simultaneous authoring; SimLab projection;
  surround audio; link *voting/acceptance* flows in 3D (propose
  only); meta-planetarium.
- **Completion criteria:**
  1. From the planetarium, a steward-authenticated user creates a
     typed inter-story link with rationale entirely from within the
     3D view (desktop controls acceptable); the proposal appears in
     the existing links-review page and the arc persists on reload.
  2. The same flow demonstrated in immersive WebXR on at least one
     real headset, with rationale text entered via a relay-paired
     surface or voice.
  3. In-scene hotspot placement demonstrated in the 360° viewer
     (stretch — explicitly deferrable to a follow-on mission without
     failing this one).
  4. Spike reports recorded in this doc for: WebXR entry +
     control remapping; Quest Browser speech recognition
     (works / doesn't / fallback engaged).
  5. Playwright e2e with screenshots for the desktop-controls path
     (headless WebXR is out of reach; the desktop fallback is the
     regression surface).
- **Relationship to other missions:** Consumes M-authoring-2d
  (gesture pattern) and M-relay-authoring (paired input). Extends the
  planetarium and the interpretive layer. Enables future voice
  authoring, SimLab, and collaborative missions.
- **Source material:** `src/pages/story/vsatlatarium.astro` (~1500
  lines — hover detection, arc rendering, vapor, turntable);
  `src/domain/story/link/` (link CRUD + proposal API);
  `src/pages/story/text3d.astro` + `public/scripts/three/` (addons
  under COEP); `src/components/story/remote/` + `src/server/relay/`;
  A-Frame WebXR docs; CLAUDE.md planetarium architecture notes.
- **Owner and dependencies:** Joe drives; single repo; needs headset
  hardware for criteria 2 and the spikes; steward auth for link
  proposals (env or dev toggle).

**Exit criterion:** Joe and Eric agree constellation-first is the
right primary demo (vs in-scene-first), and the completion criteria
match what Eric wants to be able to show.

## 2. MAP (pending)

- **Q1:** What happens today when the planetarium enters VR (A-Frame
  `enter-vr`)? Which of the custom controls (turntable drag, scroll
  zoom, window-level mousemove hover, vapor slider) break in
  immersive mode, and what are the A-Frame-idiomatic replacements
  (raycaster + controller events, gaze cursor)?
- **Q2:** What input do we actually get in Quest Browser: controller
  ray events, hand tracking, and — spike, on hardware — does
  `SpeechRecognition` exist/function in-headset?
- **Q3:** What is the minimal API call sequence to create a link
  proposal (route, payload, auth requirements), and is it callable
  from the planetarium page as-authenticated today?
- **Q4:** How are inter-story arcs currently built (geometry,
  `data-arc-type` tagging), and what does "render the new arc
  immediately" require — full re-layout or incremental insertion?
- **Q5:** Node selection in 3D: can the existing screen-space hover
  scheme extend to a controller raycaster, or do immersive mode and
  desktop mode need separate pickers?
- **Q6:** What does the relay need to carry for "rationale typed on
  paired surface appears in headset flow" — is it just another intent
  message under M-relay-authoring's model?
- **Q7:** COEP interactions: any additional headers/asset constraints
  for WebXR sessions beyond what text3d already solved?

## MAP addendum — reassessment after M-authoring-2d + M-gaze-mirror (2026-07-11)

Both sibling missions shipped today and materially changed this
mission's ready-vs-missing table:

**Newly ready:**
- **The coordinate bridge.** M-gaze-mirror empirically calibrated the
  direction↔equirect mapping (`u = (0.8125 − yaw/360) mod 1`,
  `v = 0.5 − pitch/180`). Run toward the image it converts "operator
  is looking here" into M-authoring-2d's `[label](target @ x,y)`
  percent coordinates; run toward the sphere it places a hotspot
  marker at the right spot in the photosphere. In-scene 3D authoring
  is therefore the 2D WYSIWYG editor with gaze as the mouse — same
  markup, same draft-insert → save → republish loop, same validation.
- **The write path.** Increment 2 of M-authoring-2d built the whole
  place → persist → republish flow, author-gated upstream.
- **The audience view.** The gaze mirror doubles as the feedback loop
  for voice authoring: a watcher sees the operator's card redrawn
  row-by-row, so a newly placed hotspot/row is visible to the coach
  the moment it lands.
- **A proven lightweight relay channel** (gaze packets) to model
  intent messages on.

**Strategy decision (Joe, 2026-07-11): M-relay-authoring is the input
strategy for this mission** — e.g. voice-authored commands. The
decisive observation: in VR authoring the authenticated author IS the
person in the headset, and the headset browser holds their session.
So the remote is a dumb input peripheral relaying *intents*
(commands or dictation); the host applies them under its own session,
exactly as it applies `navigate` today. This resolves the deferred
mission's ambition-level question in favour of **host-applies**, with
one addition: an explicit **arming toggle** on the host ("accept
authoring intents from this room"), because a room code that could
only steer must not silently start to write.

**Revised increments (each independently demoable):**
1. **A — hotspots in 3D** (no relay, no headset): render
   `blockHotspot` in the 360° viewer (inverse mapping → sphere
   marker, `data-raycastable`), plus place-at-gaze from the viewer
   itself (keypress while looking). Desktop-testable via Playwright;
   proves 2D- and 3D-authored hotspots are one data model.
2. **B — voice / paired-input authoring** (re-opens M-relay-authoring,
   scoped down to: `intent` + `dictation` message kinds, arming
   toggle, host-side fixed-grammar command parser, host-applies
   execution). Phone mic does speech capture —
   the in-headset Quest SpeechRecognition spike is demoted from
   dependency to curiosity.
3. **C — constellation authoring** (flagship; needs headset spikes):
   planetarium joins the relay as a host, node selection by
   gaze/controller, draw-an-arc → link proposal via the existing
   interpretive API, rationale dictated over the relay.

Open MAP questions Q1/Q2/Q5/Q7 (WebXR entry, controller input, 3D
picking, COEP-in-XR) remain and gate increment C only.

**Hardware plan (Joe, 2026-07-11):** desktop monitor first (increment
A needs no headset). For headset increments: a proper headset from the
library, or a phone in a cardboard rig — the lobby QR is the natural
way to land the phone/headset on the right page. Expectation: the
feature will be MUCH nicer on the Steam Frame, which hasn't launched —
design for it, don't wait for it.

## INSTANTIATE — increment A (2026-07-11): hotspots in the photosphere

Scope: render `blockHotspot` markers inside the 360° viewer via the
inverse calibrated mapping; place-at-gaze from the viewer (keypress
while looking + the same draft-insert → save → republish loop as the
flat editor). Desktop controls; checkpoint appended when built.

### Increment A checkpoint (2026-07-11) — built + verified

**Built** (desktop monitor, per hardware plan — no headset needed):
- `placeHotspot.ts` — shared authoring write path extracted from the
  flat editor: `EQUIRECT_U0` (the calibrated constant),
  `gazeToImagePercent` / `imagePercentToGaze`, `insertHotspotLine`,
  `placeHotspot` (draft → insert → save → republish), `allTargetsIn`.
  FlatStory refactored onto it — the 2D and 3D editors now share one
  write path by construction.
- `scene-hotspot` A-Frame component + `#hotspots` container: each
  `blockHotspot` renders inside the photosphere at its
  percent-of-image coordinates (inverse calibrated mapping → point at
  r=9 facing the viewer): pulsing ring, troika label, enlarged
  raycastable click target; click emits `linkactivated` (same
  navigation path as fiction buttons). Skipped on the synthetic title
  card.
- **Place-at-gaze**: press `h` in the 360° viewer while looking at a
  spot → form (label + target datalist of the story's anchors) →
  persists via the shared write path → reload shows the marker.
  Author-gated upstream as ever.

**Verified:** CDP run — the "secret passage" hotspot placed by
CLICKING THE FLAT PHOTO this morning renders at the calibrated spot
inside the photosphere and navigates on click (scene 1307 → 1388);
placement form opens with computed percent coords. e2e:
`tests/e2e/authoring-3d.spec.ts` (3 tests: marker positions within
0.05 of the calibrated direction at r=9; click navigation; h-form).
Full flat-mode + gaze-mirror regression green; 140 unit tests; no new
type errors. One first-run flake of the h-form test (compile-latency
suspected) — passed clean on rerun; harden if it recurs.

**Next:** increment B (voice/paired intents over the relay — the
folded-in M-relay-authoring) then C (planetarium/WebXR, needs
headset).

## HEAD/DERIVE addendum — the spatial model (2026-07-11, operator framing)

Joe: the 2D and photosphere work are "warm-ups for the full-on
'editing in 3D' which, if we are thinking about something like Miro in
3D, needs a spatial model more like what's in the planetarium, rather
than the 2D surface of the photosphere (where the placement of
hotspots is about all we can do)."

Sharpened: a photosphere is a **2-DOF surface** — every authorable
thing on it reduces to a direction (u,v), so hotspots + panel
placement roughly exhaust it. It supports *annotation*, not
*arrangement*. The planetarium is the true canvas because it already
has Miro's ontology, derived rather than authored:

| Miro | VSATLATARIUM |
|---|---|
| sticky note | scene/story node (spring-layout position in R³) |
| connector | typed arc (with rationale — richer than Miro) |
| board / frame | anthology (already filters the planetarium) |
| boards-within-boards | meta-planetarium (future direction) |

**The missing primitive — the thing that makes Miro Miro: a dragged
sticky STAYS.** Planetarium positions are computed (server-side,
deterministic, seeded); nobody owns one. Miro-in-3D therefore needs
**pinned positions**: drag a node → its coordinates persist; the
spring layout demotes to "auto-arrange," acting only on unpinned
nodes.

DERIVE question this raises (for increment C): where do pinned
positions live? Leading shape: **per-anthology** (anthology_id,
story_id [, scene_id] → x,y,z) — the same stories arrangeable
differently in different curatorial contexts, exactly like one sticky
on two boards. Falls back to spring layout when unpinned; "unpin" =
delete the row. Alternative (global per-story position) rejected
provisionally BECAUSE anthologies are the planetarium's existing
"board" concept and arrangements are interpretive acts, which are
anthology-scoped throughout VSATLAS.

What the warm-ups contribute, restated: the gestures (point-place-
label, drag-and-it-stays, edit-in-place, voice intents), the write
paths, the arming/trust model, and the audience view (gaze mirror) —
all substrate-independent. Increment C swaps the substrate from (u,v)
to R³ and adds the pinning persistence.

Increment C scope accordingly grows one item: **node drag-to-pin**
alongside arc-drawing and dictated rationale — arrange, connect,
annotate: the full Miro verb set.
