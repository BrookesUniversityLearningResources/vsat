# M-edit-changelog — Who changed what (audit trail for story edits)

**Status:** IDENTIFY drafted (2026-07-11); deferred. Blocks (must land
before/with) the author-OR-steward widening in
[[M-anthology-auth]] decision 1.

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
