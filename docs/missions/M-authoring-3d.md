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
