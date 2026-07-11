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
