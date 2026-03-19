# VSATLAS QA Checklist

Test each item and mark with ✅ or ❌.

## Planetarium View (`/story/vsatlatarium`)

### Navigation
- [ ] Page loads with planetarium mode by default
- [ ] Left-click drag rotates the view (looking around the dome)
- [ ] Scroll wheel moves camera toward/away from dome
- [ ] "Reset view" button returns to initial position
- [ ] Clicking a story name in sidebar rotates that cluster into view and zooms
- [ ] GeomView/Planetarium toggle buttons switch between modes (page reload)

### Nodes & Labels
- [ ] Story titles are large, bright text with dark outlines
- [ ] Scene labels are slightly smaller, also outlined
- [ ] All labels stay readable at any rotation angle (stabilcam)
- [ ] Labels render on top of nodes and arcs (not occluded)
- [ ] Gold opening scene nodes are visually distinct from teal scene nodes
- [ ] Gray story hub nodes sit above each constellation
- [ ] Every node connects to at least one arc (no orphans)

### Arcs
- [ ] Orange narrative arcs connect scenes within each story
- [ ] Inter-story arcs are colored by type (purple=thematic, red=causal, green=adjacency, pink=contrast)
- [ ] Arcs are near-geodesic when zoomed in (not excessively curved)
- [ ] Arcs connect to the story hub node (not empty space)
- [ ] All arc colors match a legend entry

### Hover & Click
- [ ] Hovering near a node shows info panel in sidebar (story title, scene name, links)
- [ ] Hovering near text labels also triggers the info panel
- [ ] Gold torus ring appears around the hovered node
- [ ] Ring disappears when mouse moves away
- [ ] Ring disappears when starting a drag
- [ ] Ring tracks correctly when zooming (scroll while hovering)
- [ ] Cursor changes to pointer when hovering a node/text
- [ ] Clicking a node navigates to `/story/{id}` (same tab)

### Fullscreen
- [ ] Expanding to fullscreen (bottom-right button) works
- [ ] Hover/click interaction works in fullscreen
- [ ] Gold ring appears in fullscreen
- [ ] Exiting fullscreen returns to normal view

### Legend & Filtering
- [ ] Legend shows: Story, Opening scene, Scene, Narrative arc, Thematic, Causal, Adjacency, Contrast
- [ ] Clicking a legend arc type toggles those arcs off (greyed out, strikethrough)
- [ ] Clicking again brings them back
- [ ] Multiple types can be toggled independently

### Vapor Slider
- [ ] Vapor slider appears in sidebar above legend
- [ ] Slider track fills pink to the left of the thumb
- [ ] Increasing vapor: dome glows pink
- [ ] Increasing vapor: scene background shifts toward magenta
- [ ] Increasing vapor: arcs get brighter and thicker (bloom)
- [ ] Increasing vapor: particle dust becomes visible (slowly drifting motes)
- [ ] Increasing vapor: hover ring gets brighter golden glow
- [ ] Hovering a node at high vapor: golden orb glows around the constellation
- [ ] Orb doesn't occlude nodes/arcs/text inside it
- [ ] Setting vapor to 0: everything returns to baseline

### Wireframes Toggle
- [ ] "Wireframes" button in toolbar toggles cluster boundary spheres + dome grid
- [ ] Hidden by default
- [ ] Toggle highlights button when active

### Content
- [ ] "High Res Panorama" renders without box characters
- [ ] Pitt Rivers Adventure shows 8 scenes with complex arc web
- [ ] Linear Story shows 3 scenes in a chain
- [ ] Busted Story handles dangling links gracefully (orphan nodes connect to hub)

## GeomView Mode (`/story/vsatlatarium?view=geomview`)

- [ ] Turntable rotation works (drag to rotate model)
- [ ] Scroll to zoom (scale model)
- [ ] All nodes, arcs, labels visible from outside
- [ ] Reset view returns to default

## Manifold Gallery (`/story/manifold`)

- [ ] Story cards display with title and connection count
- [ ] "View story" pill buttons navigate to stories
- [ ] Pilot filter chips work (filtering by pilot)
- [ ] Adjacency list shows links with status coloring
- [ ] Cards have hover effects (border + shadow)

## Author Links (`/author/links`)

- [ ] Link cards show type, status, from→to stories, rationale
- [ ] Cards color-coded by status (blue=accepted, yellow=proposed, pink=rejected)
- [ ] Accept/Reject buttons work and update card status
- [ ] Steward retire button visible (if steward)
- [ ] Cards have hover effects

## Pilot Dashboard (`/author/pilot`)

- [ ] Creation form has styled container, bold labels, pill submit button
- [ ] Existing pilots show with status badge pills
- [ ] "Open" link navigates to pilot detail

## Steward Console (`/author/steward`)

- [ ] Table shows all links with status, type, rationale
- [ ] Rows have hover highlight and alternating backgrounds
- [ ] Retire/Unretire button works

## Stewardship Compact (`/stewardship`)

- [ ] Sections have blue left-border accents
- [ ] Headings are blue
- [ ] Roles and principles clearly listed

## Per-Story Links (`/author/story/{id}/links`)

- [ ] Existing links displayed with status coloring
- [ ] Propose link form has styled container and pill submit
- [ ] Vote buttons work
