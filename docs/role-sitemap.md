# VSAT Role × Page × Action Sitemap

Purpose: audit that every intended interaction is reachable for the role it is meant for, and that no action leaks to a role it should not have. Three roles in this system:

- **reader** — unauthenticated, or authenticated but not an author of the story in question
- **author** — logged in; can edit stories they authored
- **steward** — authenticated user whose email is listed in `STEWARD_EMAILS` (or who has flipped the `vsat_steward` dev cookie when `DEV_STEWARD_TOGGLE=1`)

"Author" is not a separate account type — any logged-in user has author powers on stories they own. Ownership is checked per-story by `assertAuthorMiddleware` on `/author/story/:storyId/...` (except the `/links` sub-route, which is open to logged-in link work). Stewards do not bypass content ownership checks; their additional powers are link stewardship actions.

## Access gates at a glance

| Gate | Enforced by | Applies to |
| --- | --- | --- |
| Login required | `authenticationRequired` middleware (config `authentication.pathsRequiringAuthentication`) | `/author/*`, `/api/*` |
| Story ownership | `assertAuthorMiddleware` (Astro) | `/author/story/:storyId/...` except `.../links` |
| Steward role | `isStewardUser(user, cookie)` | retire/unretire link actions; steward console |

Unauthenticated hits to guarded paths redirect to `/login`. A logged-in non-owner reaching `/author/story/:storyId` is redirected back to `/author/story` with an `Unauthorized` error code.

## Public pages

### `/` — landing
- reader / author / steward: view, navigate to login or `/author/story`.

### `/login`, `/login/callback`
- reader: magic-link login; callback completes auth and redirects to `/author/story`.
- already-logged-in users just pass through.

### `/stewardship` — stewardship compact
- all roles: read-only. Public statement of principles, roles, and procedures.

### `/story/` — story index
- all roles: browse published stories, link to VSATLATARIUM.

### `/story/:storyId` — read a story
- all roles: same view. A-Frame scene viewer; "Interpretive" sidebar (press `I`) showing **accepted** links only; endcap cards to adjacent stories.
- all roles: can view retired links touching the story in the read-only "Stewardship history" section when such links exist.
- readers: can follow "Propose an interpretive link" to login; after login, the user returns to `/author/story/:storyId/links#propose`.

### `/story/manifold` — adjacency grid / link list
- all roles: view all links and their statuses (proposed / accepted / rejected / retired), filter by pilot, click through to stories.

### `/story/vsatlatarium` — 3D planetarium
- all roles: navigate scene and story nodes for a selected anthology, switch planetarium ↔ geomview, hover / click into story detail.
- logged-in users: can propose a link by choosing a source node, target node, type, and rationale in the planetarium panel.
- readers: can start the proposal flow; if authentication is required, login returns them to the prefilled `/author/story/:storyId/links#propose` fallback.

## Authenticated pages (`/author/*`)

### `/author/story/` — author dashboard
- author: list own published + unpublished stories, rename self, create new story, log out.
- steward: same, plus a banner linking to the steward console and (if `DEV_STEWARD_TOGGLE=1`) a toggle for steward mode.

### `/author/story/:storyId` — story editor
- author (owner only): edit title, CRUD scenes, edit scene content, upload images + audio, publish / unpublish, delete story, **propose link from a scene** (opens propose-link modal), navigate to preview or links.
- author / steward (non-owner): redirected away with `Unauthorized`.

### `/author/story/:storyId/preview` — preview as reader
- author (owner): read-only preview of the published shape of the story.
- author / steward (non-owner): redirected away.

### `/author/story/:storyId/links` — links involving this story
- any logged-in user (ownership **not** required on this sub-route): view inbound + outbound links; propose a new link.
- author of a linked story: accept / reject (vote).
- steward: accept / reject, plus retire / unretire. UI exposes the retire/unretire buttons only when `isStewardUser` is true; help text on the page says "Retire/unretire actions are visible to stewards only."

### `/author/links` — global link dashboard
- any logged-in non-steward user: review links touching stories they authored, accept / reject.
- steward: review all links site-wide, accept / reject.
- steward: additionally retire / unretire.

### `/author/steward` — steward console
- non-steward logged-in user: page loads with a message "You are not marked as a steward for this environment." No adjudication UI.
- steward: text-first table of all links; retire / unretire inline.

### `/author/pilot/`, `/author/pilot/:pilotId` — pilots
- any logged-in user: create pilot, assign stories to pilot, add interpretive notes, fetch JSON report.
- No steward-specific controls here.

## API surface (all under `/api/*`, login required unless noted)

| Endpoint | Who | Notes |
| --- | --- | --- |
| `POST /api/story/:storyId/links` | any logged-in user | propose a link (status `proposed`). |
| `POST /api/links/:linkId/vote` | author of linked story or steward | `{vote: "accept"\|"reject"}`. |
| `POST /api/links/:linkId/retire` | **steward only** | 403 for non-stewards; toggles to/from `retired`. |
| `POST /api/pilot` | any logged-in user | create pilot. |
| `POST /api/pilot/:pilotId/stories` | any logged-in user | attach story to pilot. |
| `POST /api/pilot/:pilotId/notes` | any logged-in user | add interpretive note. |
| `GET  /api/pilot/:pilotId/report` | any logged-in user | JSON report; the route itself has no extra role check, but `/api/*` is login-gated by middleware. |

Every API action has a UI entry point somewhere in `/author/*`.

## Role × action summary

| Action | reader | author (of story) | author (not of story) | steward |
| --- | --- | --- | --- | --- |
| Browse published stories | ✓ | ✓ | ✓ | ✓ |
| Read a story with accepted links | ✓ | ✓ | ✓ | ✓ |
| Use VSATLATARIUM / manifold | ✓ | ✓ | ✓ | ✓ |
| Read stewardship compact | ✓ | ✓ | ✓ | ✓ |
| Log in | ✓ | — | — | — |
| Create / edit / delete own story, scenes, media | — | ✓ | — | ✓ (own stories only) |
| Publish / unpublish own story | — | ✓ | — | ✓ (own stories only) |
| Propose a link | — | ✓ | ✓ | ✓ |
| Accept / reject a link (vote) | — | ✓ (linked own story) | — | ✓ |
| Retire / unretire a link | — | — | — | ✓ |
| Create / manage pilots, notes | — | ✓ | ✓ | ✓ |
| Use steward console | — | — | — | ✓ |

## User journeys (Mermaid)

Each diagram is one question answered end-to-end. Dotted arrows are "you wish this existed" — i.e. reachability gaps.

### J1. Reader on a photosphere page: what can I do?

```mermaid
flowchart LR
  R([Reader]) --> SI["/story/ — index"]
  SI --> SR["/story/:storyId — photosphere viewer"]
  SR -->|press I| SB["Interpretive sidebar<br/>(accepted links only)"]
  SB --> AS["Adjacent story endcap"]
  AS --> SR2["/story/:otherId"]
  SR --> PL0["/author/story/:storyId/links#propose<br/>(after login if needed)"]
  SR --> VL["/story/vsatlatarium"]
  SR --> MF["/story/manifold"]
```

Reader interactions on a photosphere page = read the scene, read accepted interpretive links, jump to adjacent stories, jump to the global views, or log in to propose an interpretive link.

### J2. Reader → Propose a link (the "how do I contribute?" path)

```mermaid
flowchart LR
  R([Reader]) --> SR["/story/:storyId"]
  SR -->|Propose interpretive link| LOGIN1["/login?returnTo=..."]
  R --> VL["/story/vsatlatarium"]
  VL -->|Propose from node pair| LOGIN2["/login?returnTo=..."]
  R -->|log in via /login| A([Author])
  LOGIN1 --> ASL["/author/story/:storyId/links#propose"]
  LOGIN2 --> ASL
  A --> AE["/author/story/:myStoryId<br/>scene editor"]
  AE -->|&quot;Propose link from here&quot;| PL[[Propose-link modal]]
  A --> ASL
  ASL -->|Propose form| PL
  PL -->|POST /api/story/:storyId/links| DB[(status: proposed)]
```

Reachability note: a reader must log in before writing, but no longer needs to own a story or enter the scene editor. Public story pages and VSATLATARIUM both lead to the per-story proposal form.

### J3. Author reviews / votes on links touching their story

```mermaid
flowchart LR
  A([Author, logged in]) --> AD["/author/story/ — dashboard"]
  AD --> AE["/author/story/:storyId"]
  AE -->|Links button| ASL["/author/story/:storyId/links"]
  AD --> AL["/author/links — scoped links"]
  ASL -->|Accept / Reject| V1["POST /api/links/:id/vote"]
  AL -->|Accept / Reject| V1
  ASL -.->|Retire/unretire hidden| ST{{steward-only}}:::steward
  AL -.->|Retire/unretire hidden| ST

  classDef steward fill:#eef,stroke:#66c,color:#336;
```

Note: `/author/story/:storyId/links` is **not** ownership-gated — any logged-in user can open it for any story and propose a link. Accept/reject voting is restricted to authors of linked stories and stewards. `/author/links` scopes non-stewards to links touching their authored stories; stewards see all links.

### J4. Steward adjudicates links

```mermaid
flowchart LR
  S([Steward, logged in]) --> AD["/author/story/ — dashboard"]
  AD -->|steward banner| SC["/author/steward — console"]
  SC -->|Retire / unretire| RT["POST /api/links/:id/retire"]
  S --> ASL["/author/story/:storyId/links"]
  ASL -->|Retire / unretire<br/>(visible because isStewardUser)| RT
  S --> AL["/author/links"]
  AL -->|Retire / unretire| RT
  S -.->|"non-owned story edit"| DENY["redirect Unauthorized"]:::wide

  classDef wide fill:#ffd,stroke:#c90,color:#630;
```

Three surfaces for retire/unretire (console, per-story links, scoped/global links). Stewards do not get global story edit/delete authority.

### J5. How do I add a new steward?

```mermaid
flowchart LR
  subgraph PROD["Production"]
    OP([Operator w/ deploy access]) --> ENV["Edit STEWARD_EMAILS env var<br/>(comma-separated, lowercased)"]
    ENV --> RS["Restart / redeploy app"]
    RS --> EFF1["User with that email<br/>is now a steward on login"]
  end
  subgraph DEV["Dev / QA"]
    D([Developer]) --> FLAG["DEV_STEWARD_TOGGLE=1 in env"]
    FLAG --> COOKIE["Set cookie vsat_steward=1<br/>(via toggle on /author/story dashboard)"]
    COOKIE --> EFF2["That session is steward"]
  end
  NO(["No in-app admin UI<br/>to promote a user"]):::gap

  classDef gap fill:#fde,stroke:#c66,color:#633;
```

There is no self-service promotion flow. Adding a steward in production = editing `STEWARD_EMAILS` and redeploying. The dev toggle exists only for testing and requires the env flag to be set.

### J6. Planetarium → add a link that shows up in the planetarium?

```mermaid
flowchart LR
  V["/story/vsatlatarium"] -->|pick source node| SRC["source selected"]
  SRC -->|pick target node| TGT["target selected"]
  TGT -->|submit in panel| PL[[POST proposal]]
  TGT -->|needs login| ASL["/author/story/:sourceId/links#propose<br/>(prefilled fallback)"]
  PL --> DB[(link: proposed)]
  DB -.->|planetarium shows<br/>proposed as dim arcs| V
  DB -->|accept vote| ACC[(link: accepted)]
  ACC -->|bright arc| V
```

Round-trip now works directly for logged-in users from the planetarium panel. Unauthenticated users are sent through login and land on the prefilled per-story proposal form.

### J7. Full role × surface map (reference)

```mermaid
flowchart TB
  classDef pub fill:#efe,stroke:#6a6,color:#252;
  classDef auth fill:#eef,stroke:#66c,color:#225;
  classDef stewardOnly fill:#fef,stroke:#96c,color:#525;
  classDef api fill:#ffd,stroke:#c90,color:#630;

  R([reader]):::pub
  A([author]):::auth
  S([steward]):::stewardOnly

  subgraph Public
    H["/"]:::pub
    L["/login"]:::pub
    STW["/stewardship"]:::pub
    SI["/story/"]:::pub
    SR["/story/:storyId"]:::pub
    MF["/story/manifold"]:::pub
    VL["/story/vsatlatarium"]:::pub
  end

  subgraph Authed["/author/* (login required)"]
    AD["/author/story/"]:::auth
    AE["/author/story/:id<br/>(owner only)"]:::auth
    PRE["/author/story/:id/preview<br/>(owner only)"]:::auth
    ASL["/author/story/:id/links<br/>(any logged-in)"]:::auth
    AL["/author/links<br/>(any logged-in)"]:::auth
    PI["/author/pilot/*"]:::auth
    SCON["/author/steward"]:::stewardOnly
  end

  subgraph API["/api/*"]
    P1["POST /api/story/:id/links (propose)"]:::api
    P2["POST /api/links/:id/vote (accept/reject)"]:::api
    P3["POST /api/links/:id/retire (steward)"]:::api
    P4["pilot endpoints"]:::api
  end

  R --> H & L & STW & SI & SR & MF & VL
  A --> H & L & STW & SI & SR & MF & VL
  A --> AD & AE & PRE & ASL & AL & PI
  S --> AD & AE & PRE & ASL & AL & PI & SCON
  AE --> P1
  ASL --> P1 & P2
  AL --> P2
  SCON --> P3
  ASL --> P3
  AL --> P3
  PI --> P4
```

## Reachability gaps and questions worth auditing

- **Reader → Propose link**: addressed by the public story "Propose an interpretive link" CTA, VSATLATARIUM's source/target proposal panel, and `returnTo` login redirects into `/author/story/:storyId/links#propose`. Continue QA on the Magic-link round trip and prefilled target fields.
- **Steward global edit power**: addressed by removing steward ownership bypass from story edit/preview routes. Steward powers are now link-adjudication powers, not global content edit powers.
- **`/author/links` scope**: addressed in the UI by showing all links only to stewards and scoping non-stewards to links that touch their authored stories.
- **`/author/story/:storyId/links` vote scope**: addressed by keeping viewing/proposal open to logged-in users while restricting accept/reject votes to authors of linked stories and stewards, including direct API calls.
- **Pilot report `GET /api/pilot/:pilotId/report`**: documented as login-gated by the shared `/api/*` middleware. If public share links are desired later, that should be an explicit route/config decision.
- **No non-steward path to see retired links**: addressed by showing retired links and rationale in a read-only "Stewardship history" section on public story pages.
