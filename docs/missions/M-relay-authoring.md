# M-relay-authoring — Authenticated authoring mutations over the relay

**Status:** HEAD + IDENTIFY drafted (2026-07-11); MAP pending.

## HEAD

- **Operator-voice anchor:** From the June 2026 remote-control work:
  "the relay protocol is the backbone" — SimLab projection, 2D
  publish, phone remote, recorded playback are all "additional clients
  onto one VSAT experience." The noted next step: "real new work is
  authenticated authoring mutations, not the audio."
- **What's already felt to be true:** The relay works. Phase 0 through
  the June refactor delivered: dumb message-forwarding relay
  (`attachRelay.ts`), session registry + steward-gated lobby with QR
  pairing, host auto-arm on every story view, heartbeat reaping,
  auto-reconnect, and viewer-agnostic hosting (`remoteHost.ts` drives
  both the 360° and 2D viewers). Navigation-by-remote is verified
  end-to-end. The transport question is answered; the trust question
  is not.
- **Anti-glibness discipline:** The temptation is to demo authoring
  over the relay with the dev auth bypass and declare victory. The
  mission is only real if the trust model is written down and
  enforced: who may mutate what, via which credential, and what a
  malicious relay client *cannot* do. A demo that works because
  nothing checks anything is a NONSTARTER outcome dressed up as
  success.
- **Working-economy position:** Underwrites three roadmap items at
  once: voice authoring (phone captures speech, relays commands), VR
  authoring with paired keyboard/phone input (M-authoring-3d), and
  remote authoring generally. Underwritten by the existing relay
  infrastructure and VSAT's session auth. This is the classic
  unglamorous-but-blocking mission.
- **Clarity-gap / carried-forward tensions:**
  - The relay socket itself is unauthenticated today; joining by room
    code is capability-based. Is that capability sufficient to
    *author*, or only to *navigate*?
    Current model: discovery is steward-gated, join-by-code is open.
  - Horizontal scaling caveat (in-memory relay assumes single dyno)
    interacts with any token state we add.
  - Voice itself (SpeechRecognition) is deliberately out of scope
    here — this mission is the pipe, not the microphone.
- **Provenance:** Roadmap conversation Joe ↔ Claude, 2026-07-11;
  June 2026 remote-control sessions (memory:
  `project_remote_control`).

## 1. IDENTIFY

- **Motivation:** The relay carries read/navigate traffic only. Every
  planned authoring input surface that is not a plain authenticated
  browser tab — phone voice capture, laptop-as-keyboard beside a
  headset, future SimLab consoles — needs mutations (create scene,
  save content, propose link) to travel from a relay client to the
  database *with a defensible identity attached*. Nothing today
  provides that.
- **Theoretical anchoring:** Capability-based joining (room code = the
  capability, established in the lobby work); principle of least
  authority — a remote should hold no more power than the pairing
  ceremony granted; transport/trust separation — the relay stays a
  dumb forwarder, trust is decided at the edges.
- **Scope in:**
  1. A written trust model: roles (host, remote), credentials, and the
     mutation authorization rule.
  2. An implementation of one chosen design (see MAP Q3 for the
     candidate inventory — leading candidate: host-applies, where the
     remote sends *intents* and the host's already-authenticated
     browser session executes the API call).
  3. At least one real authoring mutation end-to-end from a remote
     client: e.g. remote sends "append page to current scene," the
     change persists, both host and remote views update.
  4. Negative tests: an uninvited socket or a navigate-only remote
     cannot mutate.
- **Scope out / deferred:** speech capture/recognition; any authoring
  UI polish on the remote surface (a minimal intent-sender suffices);
  Redis pub/sub multi-dyno relay; authenticating the relay socket for
  *navigation* (existing capability model stands).
- **Completion criteria:**
  1. Trust-model section in this doc, agreed with Joe, stating who may
     author via the relay and on whose credential.
  2. E2e demo: phone/second-browser remote performs an authoring
     mutation; the story content is changed in the database; a
     non-authorized client attempting the same is rejected (test
     asserts both).
  3. The relay remains a dumb forwarder (no domain logic added to
     `attachRelay.ts` beyond what message routing needs) — verified by
     inspection and stated in the decision log.
  4. Works with real auth, not only `DEV_STEWARD_TOGGLE` — verified
     against the normal session-cookie login flow locally.
- **Relationship to other missions:** Blocks the voice/paired-input
  half of M-authoring-3d. Independent of M-authoring-2d. Extends the
  remote-control project (PR #306 is the stale opt-in version; the
  auto-arm refactor on `consolidated` is the base).
- **Source material:** `src/server/relay/attachRelay.ts`,
  `sessionRegistry.ts`, `routeSessions.ts`;
  `src/components/story/remote/remoteHost.ts`, `hostController.ts`;
  `src/pages/remote/index.astro`; `src/authentication/` (session
  handling, `isStewardUser.ts`); `src/domain/story/` mutation
  functions and their API routes.
- **Owner and dependencies:** Joe drives; single repo; no external
  services (unless the chosen design needs signed tokens — a DERIVE
  decision).

**Exit criterion:** Joe agrees the gap is real and — critically —
agrees on the *ambition level*: is host-applies (remote as intent
source, host as executor) an acceptable v1 trust model, or must the
remote hold its own credential from day one?

## 2. MAP (pending)

- **Q1:** Exact current relay message schema (message kinds, who sends
  what) and where role (`host`/`remote`) is asserted vs verified.
- **Q2:** How does session auth reach API mutation routes today
  (cookie? middleware chain?), and which routes do scene/page/link
  mutations use?
- **Q3:** Candidate designs inventory, with what each requires:
  (a) **host-applies** — remote sends intent, host browser executes
  under its own session; relay unchanged; remote needs zero
  credentials but host must be open and authenticated.
  (b) **capability token** — host mints a short-lived authoring token
  the remote presents to the API directly; needs token
  mint/verify infrastructure.
  (c) **remote authenticates** — remote logs in itself; simplest
  trust, worst pairing UX in a headset context.
- **Q4:** What can Playwright actually exercise here? (Known caveat:
  `setOffline` doesn't sever loopback WS; the heartbeat work found the
  workaround of a paused raw `ws` socket — is the same trick needed?)
- **Q5:** Does anything in the auto-arm behavior (a session registered
  on *every* story view) change the risk picture once mutations are
  possible?
