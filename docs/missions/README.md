# VSAT Missions

Scoped units of work, one per major feature, following the futonic
mission lifecycle (`futon4/holes/mission-lifecycle.md`): each mission
accretes through phases — HEAD → IDENTIFY → MAP → DERIVE → ARGUE →
VERIFY → INSTANTIATE → DOCUMENT — with checkpoints appended, never
overwritten. A mission doc is both the working record and (at IDENTIFY
stage) a proposal a client can read and approve.

Local adaptation: VSAT has no pattern library, so the PSR/PUR
discipline is reduced to inline IF/HOWEVER/THEN/BECAUSE justifications
in DERIVE and a decision log in VERIFY/INSTANTIATE. Evidence lands in
the mission doc itself plus Playwright screenshots under `tests/e2e/`.

## Active missions

| Mission | Feature | Status | Est. hours |
|---|---|---|---|
| [M-authoring-2d](M-authoring-2d.md) | 2D mode as a first-class, authorable story mode (WYSIWYG hotspots) | **COMPLETE** (2026-07-11) | 10–12 (actual: ~1 session) |
| [M-gaze-mirror](M-gaze-mirror.md) | Live gaze mirroring: remote shows where the 360° operator is looking (Eric's ask) | IDENTIFY drafted; verify with Eric | 3–5 |
| [M-relay-authoring](M-relay-authoring.md) | Authoring intents over the relay (host-applies + arming) | Folded into M-authoring-3d increment B | ~2–3 |
| [M-authoring-3d](M-authoring-3d.md) | VR-native authoring ("Miro in 3D") in the planetarium + photosphere | Slices 1–2 built on `authoring-3d`; slice 3 spec'd | 12–16 |
| [M-anthology-auth](M-anthology-auth.md) | Steward-gate anthology curation + the shared steward/author permission model (settled with GeomView authoring) | DERIVE; building piece 1 | ~1 (piece 1) |
| [M-edit-changelog](M-edit-changelog.md) | Audit trail for story edits — counterweight to author+steward editing | IDENTIFY drafted | 2–3 |

## Dependency shape

```
M-authoring-2d ──(hotspot gesture, mode plumbing)──▶ M-authoring-3d
M-relay-authoring ──(voice / paired-keyboard input)──▶ M-authoring-3d
M-gaze-mirror (read-only; independent — needs none of the trust work)
```

M-authoring-2d and M-relay-authoring are independent of each other and
can proceed in either order (or interleaved). M-authoring-3d consumes
both: the point-and-place authoring gesture ports from flat photo →
photosphere → planetarium, and any input surface other than the
headset's own browser session (phone voice capture, laptop keyboard)
needs the relay to carry authenticated mutations.

## Sequencing against a ~40h month

1. **M-authoring-2d** (10–12h) — shippable on its own; retires the
   `/story2d/` demo route into a real `story.mode`.
2. **M-relay-authoring** (6–8h) — unglamorous but blocking; unblocks
   voice authoring, remote authoring, and VR authoring at once.
3. **M-authoring-3d** (14–18h) — the flagship demo, landing on
   de-risked ground.
4. **Buffer / polish / recorded demo** (~5h).

Total: 35–43h. If the demos land early, the surplus goes to hardening
whichever tier Eric wants to put in front of people first (see each
mission's deferred-items section for candidates).
