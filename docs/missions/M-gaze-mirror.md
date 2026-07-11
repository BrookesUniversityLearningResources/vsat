# M-gaze-mirror — Transmit the live 360° view so a watcher sees where the operator is looking

**Status:** built + verified + deployed (2026-07-11); COMPLETE
pending the phone legibility check (criterion 2, on
~/docs/INTERACTIVE-QA.md).

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

## 2. MAP (2026-07-11)

- **Host broadcast path:** `remoteHost.ts` owns the socket; `sendState`
  serializes `hooks.getState()` on open/hello/`notifyChange`. There is
  no generic send — the returned `RemoteHost` API must grow a
  `send(message)` for lightweight gaze packets (state messages are
  event-driven and carry the full payload; gaze must not).
- **Camera orientation:** the 360° viewer's `<a-camera>` (look-controls)
  exposes yaw/pitch via `getAttribute("rotation")` (degrees; look-controls
  writes through to object3D). FOV: vertical `fov` (default 80) on the
  camera component; horizontal derives from aspect.
- **Remote headset window:** `.headset-pano` (position: relative) holds
  the raw equirect in an `object-fit: cover` img — so indicator math
  needs the same cover-crop geometry as FlatStory's hotspots
  (image-space fraction → on-screen px, hidden when cropped out).
- **Relay:** dumb forwarder; only `state` messages are peeked at by the
  session registry. New message kinds pass through untouched. Multiple
  watchers per room are free (broadcast).
- **2D host:** `FlatStory` has no orientation; it simply never sends
  gaze, and the indicator stays hidden.

## 3. DERIVE (2026-07-11)

- **Message:** `{type:"gaze", yaw, pitch, fov, aspect}` (degrees),
  host → room. IF orientation changes continuously, HOWEVER state
  messages carry the full story payload, THEN gaze is its own tiny
  message kind, throttled (≥100 ms) and delta-gated (≥0.5°), BECAUSE
  re-broadcasting full state at 10 Hz would be waste and the relay is
  a dumb pipe that doesn't care about new kinds.
- **Equirect mapping:** image-fraction u from yaw with the sphere-seam
  offset — hypothesis `u = (0.25 − yaw/360) mod 1`, `v = 0.5 −
  pitch/180` — to be verified EMPIRICALLY against the rendered canvas
  (a-sky's inside-out sphere makes analytic sign-chasing error-prone;
  one landmark comparison settles it). Viewport box size:
  `h = fov/180`, `w = hfov/360` with `hfov = 2·atan(tan(fov/2)·aspect)`.
- **Representation:** outlined viewport rectangle on the flat panorama
  (v1), with a ghost twin drawn ±imageWidth for the seam-wrap case;
  container clips. Hidden until the first gaze packet, and on scenes
  without a photosphere.
- **No new remote→host messages** — completion criterion 3 is
  enforced by scope.

## 5. VERIFY — mapping calibration (2026-07-11)

The DERIVE hypothesis (`u = 0.25 − yaw/360`) was WRONG in both offset
and sign-anchor. Method: painted the a-sky with a synthetic equirect of
8 labeled color bands (canvas → material src), drove look-controls to
yaw 0/90/180/−90, screenshotted the view center:

| yaw | band at view center | u_center |
|---|---|---|
| 0 | G | 0.8125 |
| 90 | E | 0.5625 |
| 180 | C | 0.3125 |
| −90 | A | 0.0625 |

→ **`u = (0.8125 − yaw/360) mod 1`** (empirical constant; ±0.01),
`v = 0.5 − pitch/180`. Letters render unmirrored and neighbor bands
appear in texture order, so the flat pano's left-right matches the
operator's experience, and turning left moves the indicator left.
Also fixed during verification: a still camera never re-sent, so
late-joining watchers saw nothing — added a ~2 s keepalive resend.
Caveat: background-tab timer throttling drops gaze to ~1 Hz when the
host tab is hidden (irrelevant for a real operator, matters for
side-by-side testing).

## 6. INSTANTIATE — checkpoint (2026-07-11)

**Built:** `remoteHost.ts` gained a generic `send()` (drop-if-closed —
gaze is ephemeral, the next packet supersedes). `hostController.ts`
(360° host only) sends `{type:"gaze", yaw, pitch, fov, aspect}` every
100 ms when orientation moves ≥0.5°, plus a ~2 s keepalive for
late-joining watchers. `remote/index.astro` renders a gold viewport
outline on the headset panorama via object-fit-cover geometry, with a
ghost twin one image-width away for the seam wrap; hidden for scenes
without a photosphere; the 2D host never sends gaze so the indicator
simply stays hidden. No new remote→host message kinds (completion
criterion 3 — by construction; the remote's send sites are unchanged:
hello/navigate/restart).

**Verified:** live CDP run (three yaws land within a pixel of the
calibrated prediction; seam-wrap ghost visible) +
`tests/e2e/gaze-mirror.spec.ts` (numeric: back-computed u within 0.02
of expected at yaw 0/90/−90, screenshot artifact). Full flat-mode
regression still 10/10.

**Remaining:** completion criterion 2 — legibility judged on a real
phone (Joe; ideally Eric) — parked on ~/docs/INTERACTIVE-QA.md.
Deploy verification appended after push.

**Deploy verification (2026-07-11):** Heroku vsat-dev (commit
`ea8b0d5`); `/remote` serves the gaze-indicator markup. Live demo:
open a 360° story with `?room=CODE`, open `/remote?room=CODE`
elsewhere, look around.
