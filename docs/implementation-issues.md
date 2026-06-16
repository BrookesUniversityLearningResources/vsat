# VSATLAS PoC Implementation Issues (Local)

Legend:
- P0 = required for PoC
- P1 = important, follow-on
- P2 = optional / future

## P0 — Minimal Linking Loop + Pilot Engine

ISSUE-001: Add relational schema for links + pilots
- Scope: create tables for `story_link`, `link_vote`, `pilot`, `pilot_story`, `interpretive_note`
- Acceptance:
  - migrations create tables with FK constraints
  - rows can be inserted for links and pilots
- Touchpoints: `src/database/schema.ts`, new migration in `src/database/migrations/`

ISSUE-002: API to propose + list links
- Scope: POST `/api/story/:id/links`, GET `/api/story/:id/links`
- Acceptance:
  - proposing link stores `status=proposed`, `rationale`, `link_type`
  - list returns links (from/to, status, counts)
- Touchpoints: new route under `src/domain/story/route/`, repository functions

ISSUE-003: API to vote/accept/reject/retire links
- Scope: POST `/api/links/:id/vote`, POST `/api/links/:id/retire`
- Acceptance:
  - vote creates `link_vote` row
  - link auto-accepts after threshold (config) or via steward action
- Touchpoints: new route file(s), stewardship checks

ISSUE-004: Pilot setup + story assignment
- Scope: create pilot, assign stories, list pilot stories
- Acceptance:
  - POST `/api/pilot`, POST `/api/pilot/:id/stories`, GET `/api/pilot/:id`
- Touchpoints: new routes + repository methods

ISSUE-005: Interpretive notes (per pilot) — DONE (API + UI)
- Scope: POST `/api/pilot/:id/notes`, GET `/api/pilot/:id/notes`
- Acceptance:
  - notes stored with author + story
  - notes visible in pilot view

ISSUE-006: Pilot report export (JSON first) — DONE (API + UI link)
- Scope: GET `/api/pilot/:id/report`
- Acceptance:
  - includes stories, links, accept/reject ratio, notes, top rationales

## P0 — UI Surfaces

ISSUE-007: Story page “Interpretive” tab — DONE (links page)
- Scope: tab for links + notes distinct from canonical content
- Acceptance:
  - “Interpretive layer” warning copy
  - show links (to/from) + status

ISSUE-008: Propose link UI — DONE (links page)
- Scope: modal or panel to propose a link
- Acceptance:
  - choose target story, link type, rationale
  - submit to API, optimistic update

ISSUE-009: Link review view (stewards) — DONE (all links page; role gating TBD)
- Scope: list proposed links, accept/reject/retire
- Acceptance:
  - only visible to steward role

ISSUE-010: Pilot overview page — DONE (index + detail)
- Scope: show pilot question, assigned stories, link stats, notes
- Acceptance:
  - navigable from `/pilot/:id`

## P1 — Governance + Roles

ISSUE-011: Steward role + config
- Scope: simple role assignment (env or DB)
- Acceptance:
  - only stewards can retire links
  - steward console page for text-first review

ISSUE-012: Stewardship compact page — DONE (static page)
- Scope: static page with compact text
- Acceptance:
  - `/stewardship` rendered with markdown content

## P1 — Manifold View

ISSUE-013: Manifold (adjacency) gallery — DONE (public view + pilot filter)
- Scope: `/story/manifold` view of stories + adjacency links
- Acceptance:
  - filter by pilot
  - show adjacency edges as list or simple graph

## P2 — Learning Scaffolds + Future Layers

ISSUE-014: Onboarding prompts — DONE (links + pilot hints)
- Scope: add prompt cards for “propose a link” + “add note”

ISSUE-015: Economic resonance layer (deferred)
- Scope: resource map / mutual aid links (no build now)

ISSUE-019: In-text inter-story links (deferred)
- Scope: surface interpretive links inside story text flow without rewriting canon
- Acceptance:
  - clear visual distinction between canon text and interpretive overlay

## P1 — Demo Showcase

ISSUE-016: VSATLATARIUM (3D constellation) — DONE (A-Frame prototype)
- Scope: public 3D constellation of stories + interactive link proposals
- Acceptance:
  - click two nodes to propose a link
  - shows existing links in 3D view

## P1 — Classic UI Link Surfacing

ISSUE-017: Reading UI interpretive drawer + endcap — DONE (public story overlay)
- Scope: public story view shows accepted inter-story links
- Acceptance:
  - collapsed “Interpretive links” drawer (inbound/outbound)
  - endcap cards for 3–5 accepted linked stories
  - supports scene/page targets when present

ISSUE-018: Authoring UI link side-panel + scene/page badges — DONE (editor panel + scene badges)
- Scope: authoring view surfaces link context while editing
- Acceptance:
  - side-panel listing links for the story with status chips
  - badges on scenes/pages indicating linked targets
  - “Propose link from here” pre-fills scene/page
