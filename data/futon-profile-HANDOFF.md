# Handoff — Futon Stack Geometry profile JSON

**From:** M-stack-geometry (futon5a)
**To:** VSAT futon-profile loader (reserved `futon` profile slot)
**Generated:** 2026-04-19 (initial); refreshed 2026-04-19 post-Checkpoint-16
**Generator:** `futon5a/scripts/export_vsat_profile.py`

## What this is

A VSAT profile JSON (per `README-vsat-profile-maker.md`) derived from
mission clustering data:

- `/home/joe/vsat/data/futon-profile.json` (~356 KB)
- **35 stories, 265 scenes, 10 cross-story (VSATLATARIUM) links**
- Authors: one — `agent` (FUTON Agent, Stack Geometry)
- `publish: false` on every story (flip when images land)

## What it covers

The anthology in full — **every leaf drafted under M-stack-geometry**
is now represented as a VSAT story:

**Cluster-derived leaves (23 stories).** One story per leaf of the
IDENTIFY-condition cluster tree (k=8, max_size=15 recursive split):

| Story ref | Title | Scenes |
|---|---|---|
| `leaf-0` | The Exotype Move | 8 |
| `leaf-1` | A Book on the Shelf | 2 |
| `leaf-2` | Inhabitable Surfaces | 10 |
| `leaf-3` | The Math Evidence Machine | 5 |
| `leaf-4` | Couplings and Probes | 6 |
| `leaf-5` | Wires and Gates | 6 |
| `leaf-6-0` | Reading the Plan | 3 |
| `leaf-6-1` | A Game at the Edge | 2 |
| `leaf-6-2` | The Last Mile and the Daily Scan | 14 |
| `leaf-6-3` | Two Agents at the Rebuild | 8 |
| `leaf-6-4-0` | Evidence Over HTTP | 4 |
| `leaf-6-4-1` | Reading the Papers | 4 |
| `leaf-6-4-2` | Proof and Problem | 10 |
| `leaf-6-4-3` | The Peripheral Zoo | 8 |
| `leaf-6-4-4` | The Stack Thinks About Itself | 16 |
| `leaf-6-4-5` | The War Machine | 2 |
| `leaf-6-5-0` | The Coordination Rewrite | 3 |
| `leaf-6-5-1` | Artificial Stack Exchange | 5 |
| `leaf-6-5-2` | CLI, IRC, REPL | 8 |
| `leaf-6-5-3` | On Being Done | 3 |
| `leaf-6-5-4` | Codex Under Enforcement | 2 |
| `leaf-6-5-5` | Making Agency Work Properly | 2 |
| `leaf-7` | Practice Landing | 2 |

**Pillar-based leaves (3 stories).** Not cluster-derived; track the
three-pillar structure of the holistic argument:

| Story ref | Title | Scenes |
|---|---|---|
| `leaf-argument` | What the Stack Claims to Be | 17 |
| `leaf-invariants` | What the Stack Is Sure Of | 11 |
| `leaf-cycle` | The Cycle That Closes the Loop | 8 |

**Per-repo devmap leaves (9 stories).** One per repo with a devmap,
each scene covering one prototype sorry:

| Story ref | Title | Scenes |
|---|---|---|
| `leaf-devmap-futon0` | Devmap — futon0 | 8 |
| `leaf-devmap-futon1` | Devmap — futon1 | 11 |
| `leaf-devmap-futon2` | Devmap — futon2 | 16 |
| `leaf-devmap-futon3` | Devmap — futon3 | 19 |
| `leaf-devmap-futon3a` | Devmap — futon3a | 11 |
| `leaf-devmap-futon4` | Devmap — futon4 | 9 |
| `leaf-devmap-futon5` | Devmap — futon5 | 6 |
| `leaf-devmap-futon6` | Devmap — futon6 | 12 |
| `leaf-devmap-futon7` | Devmap — futon7 | 4 |

Opening scene per story carries `isOpeningScene: true` and `ref: "overview"`.

Cross-story (VSATLATARIUM) links use `linkType` values matching the
README's vocabulary (`thematic`, `adjacency`, `causal`, `contrast`);
all are voted `accept` with rationales drawn from the "Suggested
cross-story links" section at the foot of each story's markdown.

## What the loader does (landed 2026-04-19)

The `profile:seed:futon` subcommand exists (VSAT commit `cf4e729`
"Add VSAT data profile loader"). The machinery:

- `scripts/vsatProfile.mjs` handles `seed futon [--replace]`
- `src/database/seed/seedGeneratedProfile.ts` validates the profile
  JSON against a Zod schema and runs the loader protocol:
  1. Ensure postgres container.
  2. Create or (with `--replace`) recreate the `vsat_futon` database.
  3. Run VSAT migrations against `vsat_futon`.
  4. Upsert authors by email.
  5. Save stories via `repositoryStory.saveStory` (maps `ref` → DB id).
  6. Publish stories marked `publish: true`.
  7. Create story links via `repositoryStoryLink.createStoryLink`.
  8. Apply acceptance votes.

The profile config in `data/vsat-profiles.json` already points at
`data/futon-profile.json` as the generated-source path.

### Loader invocation

```
cd ~/vsat
npm run profile:seed:futon -- --replace   # full refresh (destroys vsat_futon)
# then:
npm run profile:switch -- futon           # switch DATABASE_URL to vsat_futon
npm run run:vsat                          # serve
```

### Placeholder image handling (unchanged)

Every scene has `image.url = "https://example.test/stack-geometry/scene.jpg"`
and `image.thumbnailUrl = "https://example.test/stack-geometry/scene-thumb.jpg"`.
These are stable placeholders. Either:
- Pre-seed a local image at those URLs (via hosts/reverse-proxy), or
- Replace placeholder URLs during load with a local asset path, or
- Generate per-cluster images from the narrative handle + distinctive words
  (suggested future work; out of scope for the first import).

### Link resolution

Inline scene links use `[Text](scene-anchor)` where `scene-anchor`
matches the target scene's `ref`. VSAT normalises titles on read,
so this should round-trip cleanly.

## Loader implementation reference

The landed loader lives at `src/database/seed/seedGeneratedProfile.ts`.
It validates the profile JSON via Zod (authors, stories, scenes,
storyLinks) and runs the three-phase load in a single Node process
invoked by `db:seed:profile` after `vsatProfile.mjs` has handled
container + migration setup.

## Regenerating

To rebuild this profile JSON after mission corpus changes:

```
bb   /home/joe/code/futon5a/scripts/ingest_missions.clj
python3 /home/joe/code/futon3a/scripts/embed_text.py --json < /tmp/stack-geometry/sig-identify.json > /tmp/stack-geometry/emb-identify.json
python3 /home/joe/code/futon3a/scripts/embed_text.py --json < /tmp/stack-geometry/sig-full.json     > /tmp/stack-geometry/emb-full.json
python3 /home/joe/code/futon5a/scripts/cluster_missions.py --k 8
python3 /home/joe/code/futon5a/scripts/recluster_tree.py --max-size 15 --k-split 6
python3 /home/joe/code/futon5a/scripts/label_tree_leaves.py
bb   /home/joe/code/futon5a/scripts/stack_geometry_leaves_ingest.clj
python3 /home/joe/code/futon5a/scripts/export_vsat_profile.py
cp   /tmp/stack-geometry/vsat-profile.json /home/joe/vsat/data/futon-profile.json
```

New stories that have been written get included automatically on re-export
as long as they are marked `status: drafted` (or `approved`) in
`futon5a/holes/stories/manifest.json`.

## What's next

Once a `profile:seed:futon` loader exists and this JSON loads cleanly into
`vsat_futon`:

1. Run `npm run profile:switch -- futon` to switch VSAT to the futon
   database.
2. `npm run run:vsat` (or equivalent) to serve.
3. VSATLATARIUM should show the four stories with cross-links between
   them in 3D.
4. Bouncing between VSAT (3D) and WebArxana (2D) is now viable — both
   read the same underlying mission geometry, differently projected.
5. VSATARCS (Codex's in-progress Arxana-native viewer) becomes the third
   browsing surface on the same content.
