# M-edit-changelog — Who changed what (audit trail for story edits)

**Status:** BUILT + verified (2026-07-11). Unblocks the deploy of the
author-OR-steward widening in [[M-anthology-auth]] decision 1 (piece 2).

## INSTANTIATE checkpoint (2026-07-11): audit trail shipped

**Built** (matching the IDENTIFY scope, one deviation noted):
- Migration `202607112100-story-edit-log` — append-only `storyEditLog`
  (id, story_id, scene_id nullable, editor_id, action, summary nullable,
  created_at), FK-free by design so the log survives the deletion of the
  story/scene/editor it names (`delete-story` is itself a logged action);
  index on story_id for the history read.
- `auditStoryEdits` Express middleware, mounted app-wide after auth so
  `req.user` is present. Records on `res.finish` for 2xx only (a 403 from
  the auth gate, a 400, a 500 leave no row). Action + ids are derived
  from method+path by the pure, exported `matchStoryEdit` — the RESTful
  paths are mutually exclusive so match order is irrelevant. A failed log
  insert is swallowed with a warning: the user's edit already committed
  and must not be reversed by an audit hiccup.
- `recordStoryEdit` / `getStoryEditLog` db functions +
  `repositoryStoryEditLog`, wired through `getEnvironment` (so both the
  express middleware and the astro page reach it).
- History page `/author/story/:id/history` — newest-first table (when /
  who / what / scene), gated to author-or-steward (redirects others),
  linked from the story's `links.astro` header.
- **Deviation from IDENTIFY:** actions cover the full story-scoped route
  set (incl. image/audio + publish/unpublish), not just the six named in
  scope — the middleware sees every mutation, so covering all is free and
  more complete. Summary is left null in v1 (diffs/titles deferred as
  planned).

**Verified:** live — a steward editing a non-authored story's scene
(content written back verbatim, no data change) recorded one
`edit-content` row attributed to editor 1001; a blocked non-steward edit
(403) recorded nothing; `getStoryEditLog` resolved the editor name via
leftJoin. 175 unit tests green (17 new `matchStoryEdit` cases); server
typecheck + full astro build clean; migration applied to local DB.

**Deferred (v1 scope-out holds):** field-level diffs / revert; owner
notification on steward edits; anthology-curation audit (same pattern,
later).

## 1. IDENTIFY

- **Motivation (Joe, 2026-07-11):** raised while settling GeomView
  authoring — "I like the idea of having author + stewards, though I
  think we'd also want a changelog metadata page so we know who changed
  it." Today a story's content can only be changed by its author, so
  provenance is implicit (one owner). The moment stewards can edit
  stories they do not own (M-anthology-auth decision 1), that implicit
  answer breaks: an author needs to see who touched their scene and
  when. The changelog is the **accountability counterweight** that
  makes the widened edit gate safe to ship.
- **Design position:** edits already funnel through a small set of
  content routes (`saveSceneContent`, `createScene`, `deleteScene`,
  `saveSceneTitle`, `saveStoryTitle`, `saveStoryMode`) — all currently
  author-gated, soon author-OR-steward. That funnel is the single
  write point to instrument. Record an append-only row per mutation;
  never overwrite; surface newest-first on a per-story history page.
- **Scope in:**
  1. A `scene_edit_log` table (append-only): id, story_id, scene_id
     (nullable — story-level edits like title/mode), editor_id,
     action (enum: edit-content / create-scene / delete-scene /
     rename-scene / rename-story / set-mode / …), created_at, optional
     short summary. No diff/body storage in v1 (privacy + size); the
     draft history is out of scope.
  2. Write-through from the content routes (one call at the successful
     mutation point), carrying `req.user.id` as editor.
  3. A read-only history page (e.g. `/author/story/[storyId]/history`)
     listing edits with editor name + timestamp + action, newest
     first. Author-or-steward gated (same audience that can edit).
- **Scope out:** field-level diffs / revert; anthology-curation audit
  (could reuse the pattern later); real-time notifications; the relay
  intent log (M-authoring-3d increment B has its own arming/trust
  record).
- **Completion criteria:**
  1. Every content-route mutation writes exactly one log row with the
     acting user; verified by editing a scene as author and as steward
     and seeing both attributed correctly.
  2. The history page lists them newest-first, gated to
     author-or-steward, 403 for others.
  3. e2e: an edit → a row appears with the right editor; a non-author
     non-steward gets 403 on the history page.
- **Relationship to other missions:** counterweight to
  [[M-anthology-auth]] decision 1 (author-OR-steward content editing);
  the write-through hooks the same routes that widening touches, so the
  two are best built together (changelog first, then flip the gate).
- **Estimate:** ~2–3h (migration + write-through + page + tests).

**Open questions (MAP):** does a steward editing another author's
story also notify the owner, or is the passive history page enough for
v1 (lean: page only)? Do we log reads/views? (No — mutations only.)
