# VSAT branch audit — 2026-06-21

## TL;DR

There is now **one canonical line of work: the `consolidated` branch.** Every
other branch in the repo is either already merged into that line, an older
prototype that has since been superseded, or leftover integration scaffolding.
**No valuable work is stranded on any branch.** The repo only *looked* tangled
because an earlier PR integration was squashed/linearized (see "Why it looked
messy" below), which makes Git's own duplicate-detection blind to the fact that
the same work exists in several places.

Recommended action: treat `consolidated` as the trunk, and delete (or archive)
the stale branches listed below.

## The canonical line: `consolidated`

```
13a048b  Allow host-locked dev auth bypass for QA            (= upstream/main, the integrated base)
da7213b  Improve public story memory behavior                (was only on Heroku)
4e0fa15  Add phone/laptop remote control for live sessions   (new)
27ebab4  Improve VSATLATARIUM reachability and pilot layout   (new; merges the memory caps from da7213b)
6d2c759  returnTo auth flow + interpretive-link voting + docs (new)
```

`improve-vsatlatarium-reachability` (`07a1cbf`) is the pre-linearization version
of this same work, kept as a backup. Once `consolidated` is pushed and trusted,
it can be deleted too.

## Branch-by-branch

| Branch | What it is | Status | Evidence | Recommendation |
|---|---|---|---|---|
| **consolidated** | The current trunk (table above) | **KEEP** | — | Make this the working branch; push to `origin`. |
| improve-vsatlatarium-reachability | Pre-linearization copy of the trunk | Superseded | Same commits as consolidated minus the da7213b fold-in | Keep as backup short-term, then delete |
| improve-memory-performance-issues | The single Heroku commit `da7213b` | **Folded in** | `da7213b` is now in consolidated | Delete after pushing consolidated |
| feat/vr-quest2 | Planetarium + VR + hypergraph dev branch | **Fully integrated** | Tip `320965b` is identical to `pr-270`, which was merged via "Integrate PRs 268 and 270". Every feature token (arc hover `showArcInfo`, two-click propose `proposeBtn`/`proposeHref`, hot-add arcs `addArcLive`/`refreshArcs`) is present in consolidated, with no unique lines remaining. | Delete/archive |
| feat/planetarium-arcball | Earlier planetarium branch | **Fully integrated** | It is an *ancestor* of `feat/vr-quest2`, so it is a strict subset of the above. | Delete/archive |
| feature/story-overview | The "interactive story overview" feature (Nov 2025) | **Integrated & superseded** | `StoryOverview.tsx/.css` exist in consolidated and are newer/further-developed than the branch's version. | Delete/archive (spot-check first if you want any specific old behavior back) |
| pr-268-upstream, pr-270-upstream | The PR snapshots that were integrated | Integration scaffolding | Merged via "Integrate PRs 268 and 270" | Delete/archive |
| integrate-prs-268-270, …-linear | The merge + its linearized form (= our base) | Integration scaffolding | `…-linear` is the base `13a048b` | Keep `…-linear` reference if useful; delete the rest |
| pr/* (dev-auth-bypass, dx-dev-workflow, feature-vsatlas, ops-runtime-hardening, fix-i18n, …) | Per-PR worktree branches from the earlier upstream submission | Integration scaffolding | These were the slices submitted upstream; their content is in the base | Delete/archive |
| local/main-before-upstream-sync | Snapshot of old `main` before the upstream sync | Historical | — | Keep as a tag if you want the marker; otherwise delete |

## Why it looked messy

The earlier upstream submission was integrated as **squashed / linearized**
commits (our base branch is literally named `integrate-prs-268-270-linear`).
That means the same logical work now exists under *different commit hashes and
different patch content* in several places. As a result:

- `git branch --no-merged` lists those branches as unmerged,
- `git cherry` reports their commits as "unique,"

…even though the work is demonstrably already in the trunk. **Neither tool can
be trusted here** — the only reliable check is comparing actual file content,
which is what this audit did. That is also why a mechanical "replay every branch
in date order" would be wrong: it would re-apply already-present work as a storm
of conflicts.

## Suggested cleanup (safe order)

1. `git push -u origin consolidated` (push to the **fork**, not Brookes upstream).
2. Verify it deploys / others can see it.
3. Delete the integration scaffolding and integrated feature branches:
   `feat/vr-quest2`, `feat/planetarium-arcball`, `feature/story-overview`,
   `improve-memory-performance-issues`, `pr-268-upstream`, `pr-270-upstream`,
   the `pr/*` set, and `integrate-prs-268-270`.
4. Keep `improve-vsatlatarium-reachability` and `local/main-before-upstream-sync`
   as backups until you're confident, then drop them.

## Going forward (to avoid re-tangling)

- One active working branch at a time; branch off `consolidated`/`main`.
- Delete branches once their work is merged.
- Push feature work to `origin` (the fork); only deliberate releases go to
  `upstream` (Brookes).
