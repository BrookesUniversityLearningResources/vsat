# M-authoring-2d — 2D as a first-class, authorable story mode

**Status:** COMPLETE (2026-07-11) — HEAD → DOCUMENT in one day; see
checkpoints below.

## HEAD

- **Operator-voice anchor:** "Authoring in 2D as a warm-up" for
  authoring in 3D (Joe, 2026-07-11). Earlier framing (June 2026): a
  "worse-is-better VSAT" — click-through vacation photos, casual
  co-creation, no headset or WebGL required. Eric was independently
  excited about "a 2D version of VSAT."
- **What's already felt to be true:** The June 2026 spike proved the
  data model is medium-agnostic — the 360°-ness of a scene is
  essentially one rendering decision (`<a-sky>` vs a flat `<img>`).
  The `/story2d/[storyId]` demo viewer reuses the real published-story
  data, `changePage` navigation, and block helpers; only the rendering
  is new. The draggable nav panel already demonstrated the
  direct-manipulation feel this mission extends into authoring.
- **Anti-glibness discipline:** The trap is shipping a *viewer* tweak
  and calling it *authoring*. The mission is only real when an author
  can (a) choose 2D mode for a story without touching a URL, and
  (b) place a link hotspot by clicking on the photo — something the
  wikitext editor cannot express. Both must survive a round-trip
  through the database and appear correctly in the published view.
- **Working-economy position:** Underwrites M-authoring-3d (the
  point-and-place gesture ports from flat photo → photosphere →
  planetarium) and widens VSAT's audience to authors without 360°
  cameras. Underwritten by the settled mode-not-fork decision and the
  existing domain mutation layer (`saveSceneContent`, `createScene`,
  …).
- **Clarity-gap / carried-forward tensions:**
  - Where do hotspot coordinates live? (Page content markup vs a new
    column/table — a DERIVE decision with migration consequences.)
  - Per-scene 360° override inside a 2D story: in scope or stretch?
  - Audio in 2D mode is explicitly not yet handled.
  - Equirect photos shown flat have a panoramic curve; fine for
    genuinely flat photos, awkward for existing 360° content.
- **Provenance:** Roadmap conversation Joe ↔ Claude, 2026-07-11,
  building on the June 2026 2D-viewer session (commits `fff0a71`,
  `cf4d090` on `consolidated`).

## 1. IDENTIFY

- **Motivation:** VSAT can *display* stories flat (`/story2d/` demo
  route) but authors cannot *choose* 2D — the mode lives in a URL, not
  the story record. And the most natural 2D authoring act, placing a
  link where you clicked on the photo ("make-your-own-Myst"), is
  inexpressible in the wikitext editor. The gap between "demo viewer
  exists" and "2D is a mode an author selects and exploits" is this
  mission.
- **Theoretical anchoring:** Worse-is-better; mode-not-fork (settled
  June 2026 — rejected the site-fork because it would duplicate every
  surface and wall off 360/2D mixing); WYSIWYG-where-wikitext-can't
  (text+links can be authored in wikitext; positioned hotspots
  cannot, so hotspots are the forcing function for direct
  manipulation).
- **Scope in:**
  1. Persist `story.mode` (`'360'` default | `'2d'`) — schema
     migration + domain plumbing.
  2. Author-facing mode toggle in the story editor.
  3. `/story/[storyId]` renders flat when `mode = '2d'`; retire the
     separate `/story2d/` route.
  4. Positioned hotspots: click on the photo in an edit view → drop a
     link hotspot; hotspots render as clickable regions in the
     published 2D view.
- **Scope out / deferred:** per-scene 360°-inside-2D override (design
  for it, don't build it); audio in 2D; hotspots in the 360° viewer
  (that's M-authoring-3d's in-scene tier); any relay/voice input
  (M-relay-authoring).
- **Completion criteria:**
  1. A migration adds `mode` to the story table; existing stories
     read back as `'360'` with no behavior change (e2e regression
     passes untouched).
  2. Toggling a story to 2D in the editor and reloading
     `/story/[storyId]` shows the flat rendering — no A-Frame loaded.
  3. `/story2d/` route removed; its `?layout=`, deep-link
     (`?scene=&page=`), and remote-host behaviors demonstrably
     preserved in the folded-in mode.
  4. An author clicks a point on a scene photo, picks a link target,
     saves; the published story shows a hotspot at that point that
     navigates on click. Round-trips through the database.
  5. Playwright e2e with screenshots covering criteria 2–4.
- **Relationship to other missions:** Enables M-authoring-3d (gesture
  + mode plumbing). Independent of M-relay-authoring (2D authoring
  happens in an ordinarily-authenticated browser session). The 2D
  viewer already hosts remote sessions via `remoteHost.ts` — parity
  must survive the route fold-in.
- **Source material:** `src/pages/story2d/[storyId].astro` (demo
  viewer); `src/components/story/` PublishedStory/PrepareStory (the
  `<a-sky>` line); `src/database/schema.ts` +
  `src/database/migrate/migrations/`; `src/domain/story/`
  (save/create mutations); `src/components/story/remote/remoteHost.ts`;
  June 2026 session notes (memory: `project_2d_viewer`).
- **Owner and dependencies:** Joe drives; single repo (vsat); deploy
  target vsat-dev on Heroku for Eric to try with flat photos.

**Exit criterion:** Joe (and ideally Eric) agree the scope is right —
in particular the in/out call on per-scene overrides — before MAP.

## 2. MAP (complete 2026-07-11)

- **Q1 — schema + migration pattern:** `TableStory` in
  `src/database/schema.ts` is minimal: `{ id, title }`. Kysely
  migrations live in `src/database/migrate/migrations/`, named
  `YYYYMMDDHHMM-<slug>.ts`, exporting `up`/`down` built on
  `db.schema.alterTable(...)` (exemplar:
  `202511031443-remove-featured-stories.ts`; camelCase table names in
  code map to snake_case in Postgres). Adding `mode` is one
  `addColumn("mode", ...)` migration with `notNull().defaultTo('360')`.
  Heroku runs migrate-on-boot, so deploy is automatic.
- **Q2 — 360° branch points:** exactly two, confirming the June
  hypothesis: `PublishedStory.astro:20` (`<a-sky
  src={openingScene.image?.url}>`) and `PrepareStory.astro:154`
  (`querySelector("a-sky")` for scene transitions). Plus the route
  shell `src/pages/story/[storyId]/index.astro` imports
  `ImportAFrameScripts` unconditionally. A `mode` branch = skip the
  A-Frame scripts and render a flat component instead of
  `PublishedStory`; the interpretive-layer endcaps in the route shell
  are mode-agnostic and stay put.
- **Q3 — story2d reuse inventory:** `/story2d/[storyId].astro` is one
  self-contained 367-line file. It *reuses* `getPublishedStory`,
  `changePage` navigation, and `startRemoteHost`; the only new
  material is flat HTML/CSS + inline script. Behaviors that must
  survive fold-in: `?layout=overlay|doc`, the draggable nav panel
  (offset persists across jumps), deep links (`?scene=&page=` written
  on nav + honoured on load), and remote hosting (same lobby parity).
  Fold-in shape: extract into a flat-rendering component selected by
  `story.mode` in the route shell; the 367 lines port almost intact.
- **Q4 — where hotspot coordinates live:** Blocks are a closed union
  `blockHeading | blockPlaintext | blockLink`
  (`src/domain/story/publish/types.ts:38-55`), produced at publish
  time by parsing scene wikitext (`parseLink.ts`: `[text](target)`,
  target charset `[a-zA-Z0-9 -]`). Three options surveyed:
  (a) **extend the markup** with a positioned form — e.g.
  `[text](target @ 43,62)` (percent coordinates; `@` is outside the
  target charset so parsing is unambiguous) → new `blockHotspot`
  kind flowing through the existing parse → validate → publish
  pipeline and the existing content save path. Wikitext stays the
  single source of truth; the WYSIWYG surface just writes the
  string; hand-editing remains possible.
  (b) new `scene_hotspot` table — parallel save + publish paths,
  breaks the "content is the story" model.
  (c) JSON column on scene — same drawback as (b).
  Leaning strongly (a); formal decision in DERIVE. Note (a) matches
  Joe's stated intuition: "simple UI features that cause the editor
  backend to populate when the WYSIWYG front end works."
- **Q5 — save path:** editor React (`EditStory.tsx` via
  `ClientContext`) → `client/saveSceneContent.ts` → `PUT
  /api/story/:storyId/scene/:sceneId/content` (plain-text body) →
  `routeSaveSceneContent` (requires `req.user`, zod-validated) →
  `saveSceneContentInDatabase`. If coordinates live in markup
  (option a), hotspot placement writes through this path with **zero
  changes**. Publishing remains a separate explicit step — hotspots
  appear in the published view after republish, same as any content
  edit.
- **Q6 — e2e coverage:** none for `/story2d/` (tests cover
  vsatlatarium, auth bypass, link-toggle, pages polish). A new spec is
  needed; `dev-auth-bypass.spec.ts` shows the authenticated-flow
  pattern to copy.

**Ready vs missing:**

| Ready (no new code) | Missing (the actual work) |
|---|---|
| Migration infra + naming pattern | `story.mode` column + editor toggle UI |
| Publish parse pipeline (extensible block union) | `blockHotspot` parse + validate + type |
| Content save path incl. auth | WYSIWYG click-to-place edit surface |
| Flat viewer (layouts, drag, deep links) | Flat-component extraction; retire `/story2d/` |
| Remote hosting via `remoteHost.ts` | Hotspot rendering in flat view |
| `changePage` navigation | Playwright spec for 2D mode + hotspots |

**Surprises:** (1) `story_published` is a snapshot (`{id, title,
content json, image_url}`) with no reference back to live story
fields — so DERIVE must decide whether `mode` is read live from
`story` at render (toggle affects already-published stories
immediately, no republish) or snapshotted at publish. Live-read is
simpler and friendlier for the demo. (2) The route shell's
interpretive endcap/link-card code is entirely outside the A-Frame
part, so the fold-in is cleaner than feared. (3) No surprises in the
save path — it is exactly the "editor backend populates from the
front end" shape the operator assumed.

## 3. DERIVE (2026-07-11)

- **D1 — `story.mode`, read live.** New column `story.mode`
  (`varchar`, `notNull`, default `'360'`, values `'360' | '2d'`).
  IF published rendering reads the `story_published` snapshot,
  HOWEVER mode is *presentation*, not content, THEN `mode` is read
  live from `story` (join in `getPublishedStory`) rather than
  snapshotted at publish, BECAUSE toggling should affect
  already-published stories immediately — no republish friction, and
  no stale-mode drift between draft and published views.
- **D2 — view resolution + route retirement.** On `/story/[storyId]`:
  `?view=flat|poster|360` overrides; otherwise `mode` picks the
  default (`2d → flat`, `360 → 360`). `/story2d/[storyId]` becomes a
  redirect to `/story/[storyId]?view=flat` preserving all query
  params, BECAUSE existing URLs (including QR-coded `?room=` links)
  must keep working, and an explicit `view` param lets any story be
  previewed in any presentation without touching data.
- **D3 — the poster view (operator idea, 2026-07-11).** The "2D"
  badge on the flat panel becomes a toggle button: flat ↔ **poster**
  — the same photo on an `<a-image>` plane hanging in dark 3D space,
  with the same DOM panel floating over it. IF a flat photo could be
  "toggled to 3D" by stretching onto the photosphere, HOWEVER
  non-equirect images look wrong on a sphere, THEN a 2D image in 3D
  renders as a 2D-in-3D poster, BECAUSE it is honest to the medium
  AND it is the bridge artifact toward M-authoring-3d: percent-of-
  image hotspot coordinates are invariant across flat DOM, poster
  UV, and (with projection) photosphere renderings. Scene/page/room
  query params survive the toggle, so reading position and remote
  session are preserved across a swap.
- **D4 — hotspot markup (next increment).** Positioned links extend
  the wikitext: `[text](target @ x,y)` with x,y as percent-of-image
  coordinates; parsed to a new `blockHotspot` kind flowing through
  the existing parse → validate → publish pipeline and the unchanged
  content save path. Chosen over a hotspot table / JSON column
  BECAUSE wikitext remains the single source of truth, hand-editing
  stays possible, and the WYSIWYG editor reduces to "click writes a
  line of markup."
- **Component shape:** the 367-line `/story2d/` page becomes
  `src/components/story/published/flat/FlatStory.astro` (props:
  `story`, `view`, `layout`), rendered by the route shell instead of
  `PublishedStory` when the resolved view is flat/poster; A-Frame
  scripts load only for 360/poster views; `hostController` (the 360°
  host) is skipped when the flat component (which self-hosts via
  `remoteHost.ts`) is present.

## INSTANTIATE — increment 1 (2026-07-11): mode + fold-in + poster

Scope: D1–D3 (D4 hotspots follow as increment 2). Checkpoint appended
below when built.

### Checkpoint — increment 1 built and verified (2026-07-11)

**Built (uncommitted as of this checkpoint):**
- `202607111030-story-mode.ts` migration: `story.mode` varchar,
  not-null, default `'360'` (applied locally; Heroku applies on boot).
- `TableStory.mode` + `StoryMode` type; `PublishedStory.mode` read
  live via a `story` join in `getPublishedStoryInDatabase`.
  `ParsedStory` and the publish write explicitly exclude `mode`
  (presentation, not content).
- `src/components/story/published/flat/FlatStory.astro` — the 2D
  viewer folded in from `/story2d/` (layouts, drag panel, deep links,
  remote hosting preserved) **plus the poster view**: the 2D badge is
  now a button toggling flat ↔ 2D-in-3D poster (photo on an
  `<a-image>` with a frame plane, hanging in dark A-Frame space,
  panel docked right). Scene/page/room params survive the toggle.
- `/story/[storyId]` resolves `?view=flat|poster|360` → falls back to
  `story.mode`; A-Frame scripts load only when needed; the 360° host
  controller is skipped when the flat component (which self-hosts) is
  present.
- `/story2d/[storyId]` retired to a 301 redirect preserving params
  (adds `view=flat`).

**Verified:** interactive CDP-Chrome run + `tests/e2e/flat-mode.spec.ts`
(4 tests, all passing, screenshots in `test-results/`): flat-by-default
with no A-Frame for a `mode='2d'` story; badge toggle both directions
with scene preserved; legacy-URL redirect with `room`/`layout` kept;
360° regression (a-sky loads). Full-suite note: 10 pre-existing e2e
failures (all vsatlatarium specs + link-toggle + one dev-auth case)
fail identically on the pre-change tree — confirmed via `git stash`
baseline; likely fallout of the anthology auto-redirect
(`/story/vsatlatarium` now 302s to `?anthology=N`) and dev-DB fixture
drift. Not caused by, or fixed in, this increment.

**Decision log:** poster docks the panel right (`justify-content:
flex-end`) because the centered panel fully occluded the poster.
Poster width fixed at 4 m, height from the photo's aspect (clamped
1–4.5 m).

**Deferred to increment 2+:** author-facing mode toggle in the editor
(mode currently set via SQL); `blockHotspot` markup + WYSIWYG
placement (D4); a "no photo" treatment inside the 3D poster space
(currently the DOM overlay message); poster camera is stock A-Frame
look-controls (no orbit affordance).

**Decision-log addition (2026-07-11, operator feedback):** the badge's
"3D" target resolves from `story.mode` — a photosphere story
(mode `'360'`) viewed flat pops back into the **standard 360° viewer**
(`?view=360`), and only a genuinely-flat story (mode `'2d'`) hangs its
photo on the poster. `mode` is thereby the record of what the photos
*are*, not just how to show them by default. Dev-DB fixtures: 1137 is
the `mode='2d'` test story; 1209 restored to `'360'`.
`tests/e2e/flat-mode.spec.ts` now covers both toggle targets (5 tests
passing).

**Decision-log addition (2026-07-11, operator request):** a sneaky
keyboard way back from the photosphere. Operator suggested Ctrl+2;
browsers reserve Ctrl+digit for tab switching, so the binding is the
**bare digit** (with Ctrl tolerated where the browser lets it
through): `2` → flat view from any view, `3` → the story's 3D form
(photosphere for mode `'360'`, poster for `'2d'`) from flat. The
photosphere side reads live `window.current.scene/page` so the hop
lands on the same scene; input/textarea/contentEditable targets are
ignored. Covered by two more e2e tests (7 total passing).

## INSTANTIATE — increment 2 (2026-07-11): hotspots + WYSIWYG placement

**Built:** D4 end to end.
- Parse layer: `parseHotspot.ts` — `[text](target @ x,y)` (percent
  coordinates, 0–100, decimals allowed) → new `hotspot` parse kind →
  `blockHotspot` published block. Registered BEFORE `parseLink`, whose
  malformed-link recovery would otherwise reject the `@` suffix.
  Hotspot targets validated by `validateLinks` like any link. 7 new
  unit tests (140 total passing).
- Slate editor round-trip: `toSlateModel` renders hotspot lines as
  link chips carrying the full markup text, so `getContent`
  (`Node.string`) serializes them back verbatim — the wikitext editor
  can coexist with WYSIWYG-placed hotspots.
- Flat viewer: hotspot markers (pulsing ring + hover label) positioned
  by object-fit-cover geometry (image-space percent → screen-space,
  markers in the cropped-away region hidden; repositioned on resize
  and image load). Click navigates via the ordinary `changePage` path;
  hotspot links are included in the remote-control state.
- WYSIWYG placement: ✎ pill (flat view) toggles `?edit=hotspots` —
  crosshair cursor, click the photo → floating form (label + target
  with a datalist of every known link target) → the markup line is
  inserted into the current page's section of the DRAFT content via
  GET scene → PUT content → POST publish → reload. 401/403 surface as
  form errors. Verified end to end via CDP Chrome + 2 more e2e tests
  (9 total passing, incl. marker navigation using the
  `[secret passage](a-heading @ 25.1,40.7)` fixture in story 1137).

**Decision log:**
- The placement form lives OUTSIDE `.flat-hero` (position: fixed,
  viewport coords): the hero's z-index:0 stacking context trapped it
  under the floating panel.
- Mutations are correctly author-gated upstream
  (`assertIsAuthorOfTheStoryHandler` → 403): local testing required
  making `dev@localhost` a co-author of fixture story 1137.
- Caveat noted: the placement flow republishes the WHOLE story, so
  unpublished draft edits ship along with the hotspot. Acceptable for
  the demo; a per-scene publish would be the finer tool.
- Caveat noted: the dev API server (`tsx`, no watch) must be
  restarted after domain changes — a stale parser silently dropped
  the first hotspot publish.

**Remaining for this mission:** the author-facing `story.mode` toggle
in the React editor (completion criterion 2; mode is set via SQL
meanwhile) + a Heroku deploy pass. Hotspot *display* in poster/360
views belongs to M-authoring-3d.

## INSTANTIATE — increment 3 (2026-07-11): editor mode toggle

**Built:** the full `saveStoryMode` chain cloned from `saveStoryTitle`:
`story.mode` on `PersistentStory` (optional; `getStory`/`mapStory`
always provide it) → `saveStoryModeInDatabase` → author-gated
`PUT /api/story/:id/mode` (zod-validated enum) → client function →
`ClientContext` → a "Mode: 360° / 2D" button in the story editor's
action bar. Verified live (toggle both ways, DB persisted) + e2e test
(10 total passing).

## 7. DOCUMENT (2026-07-11)

VSAT has no docbook; the living documentation is `CLAUDE.md`, which now
has a "2D mode (flat stories + hotspots)" section covering mode/views,
the badge and digit-key toggles, hotspot markup, and the WYSIWYG
editor, with a pointer back to this mission record. Memory
(`project_authoring_missions`) updated for future sessions.

**Deferred-item tickets** (for follow-on missions):
- Per-scene 360°-override inside a 2D story (designed for, not built).
- Audio in 2D mode.
- Hotspot display in poster/360 views + gaze placement →
  `M-authoring-3d`.
- Per-scene publish (placement currently republishes the whole story).
- Repair the 10 pre-existing e2e failures (anthology redirect +
  fixture drift) — predates this mission.

**Status: COMPLETE** (pending Heroku deploy verification, appended
below).

**Deploy verification (2026-07-11):** pushed to Heroku vsat-dev
(release v26, commits `0aa86e2` + `c8db265` on `consolidated`).
Migrate-on-boot applied `story.mode`. Verified live:
`/story2d/1264?room=VBA8` → 301 → `/story/1264?room=VBA8&view=flat`
(200; the mode join works in prod). Story modes on vsat-dev are all
`'360'` — flip a story to 2D via the new editor toggle
("Mode: 360°/2D" in the story header).

## RE-OPENED — increment 4 (2026-07-11, operator gap report)

Joe: "I think we're missing the point-and-click placement / editing /
extension of the text box." The HEAD promised view + edit-in-place;
increment 2 delivered it only for hotspots. Scope:

1. **Placement** — dragging the panel in edit mode persists: a new
   per-page markup directive `@panel x,y` (percent of viewport,
   panel centre) through the parse → publish pipeline; the flat
   viewer honours it on render. IF panel position could live in a DB
   column, HOWEVER content-as-single-source-of-truth is the settled
   pattern (hotspots), THEN it is a markup line, BECAUSE it
   round-trips the wikitext editor for free and can later position
   the fiction panel in 3D too.
2. **Editing** — in edit mode the heading and body are editable in
   place (contenteditable, saved on blur); the heading's anchor
   (`| name`) is preserved so links never break.
3. **Extension** — a "+ link" affordance appends an ordinary
   `[label](target)` row to the page.
Position/text saves do NOT reload (the view already shows the
result); only hotspot placement still reloads (needs a marker
render).

### Increment 4 checkpoint (2026-07-11) — built + verified

**Built:** the full edit-in-place promise for the text box.
- `@panel x,y` per-page directive (`parsePanel` before `parsePlaintext`;
  `blockPanel` through publish; verbatim Slate round-trip). The flat
  viewer anchors the panel at the directive's viewport-percents;
  dragging the panel in edit mode persists the drop position as the
  directive (no reload — the view already shows it).
- In-place text editing: heading + body are `contenteditable`
  (plaintext-only) in edit mode; blur rewrites the page's draft
  section via `replaceSectionText` — heading anchor (`| name`), links,
  hotspots, and the panel directive all preserved. No reload.
- "+ link" row: appends an ordinary `[label](target)` line through the
  same form as hotspots (which now distinguishes plain-link vs
  positioned placements).
- Shared write path extended: `mutateDraftContent`, `upsertPanelLine`,
  `replaceSectionText` in `placeHotspot.ts`; `placeHotspot` refactored
  onto `mutateDraftContent`.
- Protocol robustness found by the regression suite: gaze packets are
  now re-sent when a remote says hello (`onRemoteJoined` hook) instead
  of the newcomer waiting out a keepalive.

**Verified:** 10 new unit tests (parsePanel, upsertPanelLine,
replaceSectionText — 150 total passing); live CDP loop (edit body →
draft updated with anchor/links/hotspots preserved; drag → `@panel
72.8,27.7` persisted and honoured after reload; "+ link" → row
appears); 2 new e2e tests (editable text + add-link affordance;
persisted directive placement) — 15 feature e2e green; gaze spec 2×
green. The dev-API-restart gotcha bit again (stale parser published
`@panel` as plaintext) — same remedy, restart after domain changes.

**Round-trip verification with the traditional editor (2026-07-11):**
Joe asked whether the "one markup file underneath" is still editable in
the classic Slate scene editor. Verified live: the editor displays
hotspot lines (`[text](target @ x,y)`) as link chips and `@panel x,y`
as a plaintext chip; a save round-trips them verbatim (`Node.string`
serialization). Both markup forms are therefore hand-editable there —
and hand-breakable, like any wikitext: a stray edit inside a hotspot
chip malforms the line and surfaces as the editor's usual parse error
on publish. Two pre-existing editor normalizations observed (heading
anchors expand to normalized form; blank lines drop) — unrelated to
the new block kinds.

**Increment 4 amendment (2026-07-11, same day):** `@panel x,y`
semantics unified to **percent-of-image** (was percent-of-viewport)
when the directive gained its photosphere interpretation — one
coordinate system for hotspots and the card across flat, poster-era
maths, and 360°. See M-authoring-3d increment A2.
