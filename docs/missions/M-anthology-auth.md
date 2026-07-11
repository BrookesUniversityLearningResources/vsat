# M-anthology-auth — Steward-gate anthology curation

**Status:** IDENTIFY drafted (2026-07-11, late); deferred to a future
session.

## 1. IDENTIFY

- **Motivation (Joe, 2026-07-11):** "Right now, anyone can view
  anthologies and I think that means anyone can also edit them (which
  isn't quite what we want)." Verified: the anthology mutation routes
  (`routeAnthology.ts` — create/patch/delete anthology, add/remove
  stories) check only `req.user` — ANY authenticated user (any
  magic-link login on vsat-dev) can create, rename, delete, or
  re-curate any anthology. No steward gate, no ownership.
- **Design position:** anthology curation is a STEWARDSHIP act in the
  VSATLAS model (like link retirement); viewing stays public
  (published stories are public; anthologies are the planetarium's
  public shelves). Scene/story edits are already correctly
  author-gated (`assertIsAuthorOfTheStoryHandler`) — this gap is
  anthology-specific.
- **Scope in:** steward-gate the six mutating anthology routes using
  the existing `isStewardUser` (pattern: the lobby's
  `/api/sessions` 403). Keep GET routes public. e2e: steward can
  curate, plain user 403s, anonymous 401s.
- **Scope out:** per-anthology ownership/roles; anthology-scoped
  visibility; the broader relay-auth questions (M-relay-authoring).
- **Estimate:** ~1 hour including tests.
- **Related:** interpretive-link routes worth auditing in the same
  pass (voting = any user is intended; retirement should be
  steward-only — confirm it is).

## MAP / DERIVE — the permission model, settled with GeomView authoring (2026-07-11)

Prompted by Joe: "the auth for editing stories in GeomView — maybe we
could think about that along with M-anthology-auth to get two related
topics dealt with in one go." Surveyed the whole mutation surface; the
two topics share exactly one missing primitive.

**Three tiers exist in the tree today:** authenticated (`req.user`),
author-of-the-story (`assertIsAuthorOfTheStory`), steward
(`isStewardUser` — `STEWARD_EMAILS`, `*` wildcard on dev,
`DEV_STEWARD_TOGGLE` cookie override).

**Audit of the current gates:**

| Act | Route | Gate today | Verdict |
|---|---|---|---|
| Edit / add / remove scene, narrative arcs | `saveSceneContent`, `createScene`, `deleteScene`, `saveSceneTitle` | author-of-story | correct, but see widening below |
| Propose inter-story link | `POST /story/:id/links` | authenticated (open) | correct by design |
| Retire link | `POST /links/:id/retire` | **steward** | already correct — the "confirm it is" worry above is resolved |
| Vote link | `POST /links/:id/vote` | business rule + steward flag | correct |
| Create/rename/delete anthology, add/remove story, notes | `routeAnthology` (6 routes) | **authenticated only** | **the gap this mission fixes** |
| Drag-to-pin arrangement | *no route yet* (M-authoring-3d slice 3) | — | decided below, built there |

**Key realisation:** "editing stories in GeomView" is *already*
author-gated at the backend — the focus board's edit/create/remove
verbs hit the same author routes as the classic editor, and the 403
surfaces in the card. There is no backend hole there. The genuinely
shared question is that **anthology curation and spatial arrangement
are the same kind of act** (curating an anthology's shelf), and both
want a reusable steward gate that does not yet exist (steward is only
ever checked inline).

**Decisions (Joe, 2026-07-11):**

1. **Story-scoped acts → author OR steward.** Widen the story-content
   gate so a steward driving a workshop can restructure any story, not
   only their own; the owner always can. New middleware
   `assertIsAuthorOrStewardOfTheStory`, swapped in on the content
   routes. Drag-to-pin arrangement of a story's own scene cards sits on
   this same story side (it is the story's structure), NOT the
   anthology side — this is the "author arranges" half of the split.
2. **Anthology-scoped acts → steward only.** Gate the six
   `routeAnthology` mutation routes with a new reusable
   `assertIsSteward` middleware. This is the "steward curates" half.
3. **An edit changelog is the counterweight to widening the edit
   gate.** The moment a steward can edit a story they do not own,
   "who changed my scene?" is a real question. Split out as its own
   mission ([[M-edit-changelog]]); it must land before or with the
   widening (decision 1), never after.

**One reusable primitive underpins 1 and 2:** an `assertIsSteward`
Express middleware (parallel to `assertIsAuthorOfTheStory`), from which
`assertIsAuthorOrStewardOfTheStory` composes. Building it once and
mounting it on the anthology routes now + the slice-3 pin route later
is the "two topics in one go."

**Open sub-decision (gates decision 1 only, deferred):** does
`deleteStory` widen to stewards too, or stay author-only because it is
destructive? Not needed for this mission's scope (piece 1 below).

**Build order (independent, ship in this order):**
1. **`assertIsSteward` + gate the 6 anthology routes** — this mission,
   ~1h, fully decided, self-contained. **DONE (2026-07-11)** — see
   checkpoint.
2. **Widen content routes to author-OR-steward** (decision 1) — small,
   but a real behaviour change; must not precede the changelog.
3. **Edit changelog + history page** ([[M-edit-changelog]]) — new
   schema + write-through + page.

## INSTANTIATE — piece 1 checkpoint (2026-07-11): steward gate shipped

**Built:** `src/authentication/assertIsStewardHandler.ts` — a reusable
Express middleware (401 if anonymous, 403 if not a steward, else
`next()`), reusing `isStewardUser` so `STEWARD_EMAILS` / the `*` dev
wildcard / the `DEV_STEWARD_TOGGLE` cookie all behave identically to
the rest of the app. Wired through `createApp` into `routeAnthology`,
which now applies it to all six mutating routes (create / patch /
delete anthology, add / remove story, create note); the four public
GET routes (list, get, notes, report) stay ungated.

**Verified:**
- Unit: `tests/unit/authentication/assertIsStewardHandler.test.ts` —
  anonymous → 401, non-steward → 403, steward → `next()`, `*` wildcard
  → any authenticated user passes.
- Live (throwaway API instance on the new code): all six mutating
  routes return 403 with `vsat_steward=0`; a steward passes the gate
  (PATCH with a bad body → 400, not 403); all four GET routes → 200.
- Full unit suite green (154 tests); server typecheck clean.

**Not in this piece (still open):** pieces 2 (author-OR-steward content
editing) and 3 ([[M-edit-changelog]]); the `deleteStory` widening
sub-decision. Composing `assertIsAuthorOrStewardOfTheStory` from this
same middleware is the next step when piece 2 begins.
