# VSAT + VSATLAS

## What this project is

VSAT is an interactive storytelling platform where authors create 360° photosphere stories with scenes, pages, and navigation links. It's built with Astro, A-Frame (WebGL/VR), React, Express, PostgreSQL, and TypeScript.

VSATLAS extends VSAT with three layers:
1. **Interpretive layer** — propose, vote, accept/reject/retire links between stories (thematic, causal, adjacency, contrast)
2. **Stewardship layer** — steward role gates link retirement; stewardship compact defines principles
3. **Pilot layer** — structured experiments grouping stories with interpretive notes and JSON reports

## VSATLATARIUM (the 3D planetarium)

`/story/vsatlatarium` — the flagship feature. A-Frame 3D visualization with two modes:

- **Planetarium** (default): Camera at origin, stories projected on inner dome surface. Drag to look around, scroll to zoom toward/away from dome.
- **GeomView** (`?view=geomview`): External turntable view of the constellation.

Architecture:
- **Two-level constellations**: Each story is a cluster of scene nodes. Internal narrative arcs (orange) connect scenes within a story. Inter-story links (colored by type) connect story hub nodes.
- **Spring-based force-directed layout** for scene positions within clusters (server-side, deterministic seeded random)
- **Dome projection**: All nodes projected onto sphere surface in planetarium mode
- **Stabilcam**: A-Frame component that billboards text to camera and scales by distance
- **Troika-text**: Used for outlined text labels (dark outline for readability)
- **Three.js hover ring**: Torus geometry at hovered node position, depthTest disabled
- **Screen-space hover detection**: Projects all node + text positions to screen coordinates, 100px proximity radius
- **Vapor slider**: Controls pink dome glow, arc bloom (tube fattening), particle dust, background color shift, constellation glow orbs on hover

Key technical decisions:
- Turntable pattern (rotate world, not camera) to avoid A-Frame camera fights
- `onBeforeRender` hook for depth override (troika recreates materials)
- Window-level mousemove for hover (A-Frame canvas swallows events)
- Dynamic dome radius: `10 + 4 * sqrt(totalScenes)`
- Arc segments tagged with `data-arc-type` for legend filtering

## Running locally

```bash
npm run dev:hot    # Astro dev + API server (reads .env)
npm run db:seed:local  # Reseed database (build first: npx tsc --project tsconfig.server.json)
PLAYWRIGHT=1 npx playwright test  # E2e tests
```

## Testing approach

Use Playwright e2e with screenshots for any A-Frame/3D changes. The headless browser catches rendering bugs that DOM inspection misses.

## Key files

- `src/pages/story/vsatlatarium.astro` — the planetarium (large file, ~1500 lines)
- `src/database/seed/seedDevelopment.ts` — demo content (9 stories including stress tests)
- `src/domain/story/link/` — story link CRUD
- `src/domain/pilot/` — pilot system
- `src/authentication/isStewardUser.ts` — steward role detection
- `tests/e2e/` — Playwright tests

## Data model for importing external content

To add new content to the planetarium:
- **Story** = a named collection (has scenes)
- **Scene** = a unit within a story (has title, content with `# Heading`, `[link text](target)` blockLinks)
- **Story link** = typed connection between stories (thematic/causal/adjacency/contrast with rationale)
- **Pilot** = groups stories for a focused experiment

Scenes with `[text](scene-link-target)` in their content create internal narrative arcs. Scene link targets are derived from scene titles via `parseLinkTarget`: trim, replace whitespace with `-`, lowercase.

## Future directions

- Import flexiarg pattern library as cosmos (pilot-filtered)
- Import Arxana hypergraphs (EDN format → stories/scenes/links)
- Surround audio (A-Frame positional audio from story assets)
- Arc hover interaction (show link rationale on arc mouseover)
- Meta-planetarium (cosmoses as nodes, click to enter)
