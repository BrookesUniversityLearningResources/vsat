# M-gaze-mirror — Transmit the live 360° view so a watcher sees where the operator is looking

**Status:** HEAD + IDENTIFY drafted (2026-07-11); needs verification
with Eric, then MAP.

## HEAD

- **Operator-voice anchor:** Joe's recollection of Eric's ask
  (2026-07-11): "he did want to have the live 3D / 360° view
  transmitted (if the remote is attached to a 360° story) so that he
  can see where the operator is looking. However, I'm not sure I
  remember him ever asking for actions (even 'click through')."
- **What's already felt to be true:** This is the *observer* half of
  the remote-control work, and most of it exists. The host already
  broadcasts scene state (image, heading, links) into a relay room on
  every change, and the remote already renders a "headset window" —
  the scene's panorama shown flat. What's missing is exactly one
  signal: the operator's camera orientation. The 360° viewer has the
  camera quaternion locally; it just never leaves the headset.
- **Anti-glibness discipline:** Two traps. (1) Building more
  *control* when the ask was *visibility* — this mission adds NO new
  remote actions; it is read-only by scope. (2) A gaze indicator that
  is technically correct but unreadable — the deliverable is that a
  watcher can glance at the remote and *know where the operator is
  looking*, which is a legibility claim to be judged on a real phone
  screen, not just a coordinates-arrive claim.
- **Working-economy position:** Directly serves a remembered client
  ask (pending verification with Eric — see tensions). Underwritten by
  the existing relay + state-broadcast machinery; requires none of the
  deferred M-relay-authoring trust work, because gaze data flows
  host → watchers over the already-trusted read path. Enables the
  SimLab/classroom picture: instructor watches where a student is
  looking mid-story.
- **Clarity-gap / carried-forward tensions:**
  - **Verify the ask with Eric** before building: is "see where the
    operator is looking" the feature, and is click-through navigation
    actually wanted or just something we built?
  - Representation choice (DERIVE): a viewport outline moving across
    the flat panorama in the remote's headset window (cheap, legible,
    works on a phone) vs. a live synced mini-360 view (prettier,
    heavier). Lean: viewport-on-panorama first.
  - Update cadence vs. relay chatter: orientation changes continuously
    while state messages are currently event-driven. Throttling
    (~5–10 Hz, delta-gated) is a DERIVE decision.
  - Multi-watcher rooms: presumably free (relay broadcasts), confirm.
- **Provenance:** Roadmap conversation Joe ↔ Claude, 2026-07-11 —
  the provenance correction that deferred
  [M-relay-authoring](M-relay-authoring.md). Joe's wording preserved
  above; Eric's own words not yet captured.

## 1. IDENTIFY

- **Motivation:** When one person drives a 360° story (screen or
  headset) and another watches via `/remote`, the watcher sees *which
  scene* the operator is in but not *where they are looking* — and in
  a photosphere, look direction is most of the experience. Eric's
  remembered ask is precisely this gap.
- **Theoretical anchoring:** The June framing — SimLab projection, 2D
  publish, phone remote are all "additional clients onto one VSAT
  experience" — with this mission as the pure-observer client.
  Read-only mirroring rides the existing capability model (join by
  room code) without touching the deferred trust question.
- **Scope in:**
  1. Host (360° viewer) broadcasts camera orientation into its relay
     room, throttled and delta-gated.
  2. The remote's headset window shows a live gaze indicator on the
     scene panorama (viewport outline or equivalent), updating
     smoothly as the operator looks around.
  3. Works for multiple watchers in one room; degrades gracefully for
     2D-mode stories (no orientation — indicator hidden).
- **Scope out / deferred:** any new remote → host actions (this
  mission adds zero); planetarium camera mirroring (different view
  math; note for later); recording/playback of gaze logs (the relay
  log idea makes it nearly free later); SimLab projection surface.
- **Completion criteria:**
  1. Phone/laptop remote joined to a 360° story's room shows where the
     operator is looking, live, with latency low enough to feel
     synchronous on the same network.
  2. Judged legible by Joe (ideally Eric) on a real phone.
  3. No new mutation paths: inspection confirms the remote still sends
     only the existing message kinds.
  4. Playwright e2e: host camera rotation → gaze indicator moves
     (screenshot pair).
- **Relationship to other missions:** Sibling of the deferred
  [M-relay-authoring](M-relay-authoring.md) (shares transport, needs
  none of its trust work). Independent of M-authoring-2d/3d, though
  the 3D-authoring demo gets more persuasive with an audience view.
- **Source material:** `src/components/story/remote/hostController.ts`
  + `remoteHost.ts` (state broadcast); `src/pages/remote/index.astro`
  (headset window with flat panorama); `src/server/relay/attachRelay.ts`;
  A-Frame camera (`el.object3D.quaternion` / look-controls) in
  `PrepareStory.astro`.
- **Owner and dependencies:** Joe drives; single repo; a phone for the
  legibility check. Estimated small: hours, not days.

**Exit criterion:** Eric (via Joe) confirms this matches his ask, and
the viewport-on-panorama representation is accepted as the v1 target.
