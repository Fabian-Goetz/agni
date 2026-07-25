# Agni (Fahrzeugkunde) — Context & Ubiquitous Language

A web game for learning German fire-brigade (Feuerwehr) vehicles and where their
standardized equipment is stored. Players train vehicle recognition and loadout
knowledge; admins configure the vehicles and their equipment placement.

> Status: **design in progress** (grilling session). Terms below are settled unless
> marked _(open)_.

## Glossary

### Vehicle (Fahrzeug)
A fire-brigade vehicle **instance** — a specific, real truck, e.g. "FF Konstanz
LF 20". Always has a **Vehicle Type** and a self-contained loadout. Not to be
confused with Vehicle Type. Multiple instances of the same type may exist.

### Vehicle Type (Fahrzeugtyp)
The DIN classification of a vehicle: LF 10, LF 20, HLF 20, TLF 3000, DLK 23/12,
RW, MTF, ELW 1, GW, etc. **Owns** the fixed DIN compartment layout and a default
DIN loadout. Ships as seed content (authored by us, not by end users). The unit
an Author picks when creating a Vehicle.

### Seed Content (DIN)
Ships from **v1**: Vehicle Types + their fixed compartment layouts + the standard
DIN loadout (default Placements) + the shared Equipment catalog. Creating a
Vehicle **clones the type's default loadout** into the new instance
(**clone-on-create**); the instance is then independent and editable. Editing
seed content never retroactively changes existing instances (ADR-0001).

### Compartment (Geräteraum / Fach)
A physical storage location **owned by a Vehicle Type** with a **fixed DIN
layout** — the Author does not edit compartments or their arrangement in v1, only
which Equipment sits in them. Handles structurally different types: LF →
G1–G6/Dach/Mannschaftsraum; DLK → Leiterpark, Korb, seitliche Geräteräume; MTF →
seats; etc. Each compartment carries layout metadata (`side`:
left/right/rear/roof/cabin, plus an order index) driving the schematic.
Rendering fidelity (generic metadata vs. hand-crafted per-type) — see ADR-0003.

### Equipment (Gerät)
A **canonical catalog entry** (Motorsäge, Stromerzeuger, Flutlichtstrahler,
Rettungsschere…), with name, category, optional image, and (roadmap) **educational
detail** — what it is and how it's used. Shared across all vehicles so
cross-vehicle questions are reliable. Placed into Compartments via Placements —
never free text. Managed in the **Geräte-Katalog**.
_(Note: "Beladung" is **not** a synonym for Equipment — see Beladung.)_

### Placement
The association **Equipment → Compartment → Vehicle**, with optional **quantity**.
The core fact the game tests. One catalog item may have **many** placements: on
many vehicles, and in more than one compartment of the same vehicle (e.g. axes
on the Dach *and* in G1). Instance placements are seeded from the Vehicle Type's
default DIN loadout, then edited by the Author. Editing is **bidirectional**:
open a compartment and tick its tools, or pick a tool and assign its compartment.

### Beladung (loadout)
A single Vehicle's **set of Placements** — what it carries and where. Also the
editing surface where an Author **combines** Vehicles (from the Fuhrpark) with
Equipment (from the Geräte-Katalog) by working a vehicle's compartments over its
schematic. Seeded from the Vehicle Type's DIN default, then edited. Distinct from
a single **Gerät** (Equipment) — Beladung is the *loading*, not the tool.

### Round Mode
The game supports **mixed** round types drawn from one dataset:
- **Locate** — given Equipment + Vehicle, pick the correct Compartment.
- **Perform (Darstellen)** — given Equipment, act it out (Beschreiben / Zeichnen /
  Pantomime) until your team names it. No computable verdict — a moderator calls it.
- **Identify** — given a photo/silhouette or loadout, name the Vehicle Type.
- **Name loadout** — given a Vehicle + open Compartment, select which Equipment belongs.
- **True/False** — "Is Equipment X carried on Vehicle Y?" / "in Compartment Z?".

### Activity Card
**Rule data** decorating a catalog Equipment entry for the Activity game: a
**difficulty** (Leicht / Mittel / Schwer), optional **Tabu-Wörter**, and an
optional list of modes the term can't be performed in. Deliberately *not* folded
into Equipment — `beschreibung`/`verwendung` are facts about a Gerät, a difficulty
rating is a rule about a game, and layer 1 stays mode-agnostic (ADR-0004). Keyed by
`equipmentId`, so the item's Fach comes from the chosen Vehicle's live Placements
rather than being baked into the card. Equipment with no card is simply not playable
in Activity. Ships as generated seed content like the rest.

### Stufe
One step of an Activity Zug: **1 Raten** (perform & guess) → **2 Verorten** (tap the
Fach) → **3 Holen** (fetch the item). Stufe 1 is the game's identity and is always
on; 2 and 3 are toggled at setup. Each cleared Stufe banks points. A failed Stufe
ends the Zug but keeps what came before it — you cannot locate a word nobody
guessed, yet a team that guessed and then misplaced still earned the guess. The
chain lives in the Session driver, never in the Challenge engine (ADR-0006).

### Zug
One team's turn in Activity: gamble on a difficulty, take the card, run the Stufen,
advance by the points earned. The board field a team stands on decides which mode
they must perform — which is why the board is not optional.

### Team
An Activity roster entry (1–4). Teams alternate Züge in a shuffled order and race a
36-field board; **first to Ziel wins**. One team is solo, scored in **Zügen bis
Ziel**. Nothing is persisted between games (see Game Session).

### Author
Any registered user. Owns a private **Library** of their own Vehicles,
Compartments, Equipment, and Placements. Replaces the old "admin" concept
entirely — there is no privileged global editor. DIN seed templates are a
shared read-only starter catalog any Author can clone into their Library
(clone-on-create still applies, ADR-0001).

### Library
The full set of an Author's own content (Vehicles + Compartments + Equipment +
Placements). Mode-agnostic. The unit an Author builds and later plays from. Its
user-facing home is the **Gerätehaus**.

### Gerätehaus
The Author's **content home** — the front door to their Library, named for the
real fire station where a brigade keeps its trucks and kit. Organises content
into three **peer** areas, one per editable entity:
- **Fuhrpark** — the Author's **Vehicles**: which trucks are in the Gerätehaus;
  add one from a Vehicle Type (clone-on-create), rename, remove.
- **Geräte-Katalog** — the shared **Equipment** catalog plus **educational
  detail** (what a Gerät is and how it's used; vehicle-type reference too).
- **Beladung** — the **Placements**: combine Fuhrpark + Katalog to load each
  vehicle's compartments.

Game/app **Einstellungen** (preferences, defaults, account) sit **outside** the
Gerätehaus — content management and app settings are kept apart. _(open: exact
navigation/connection between the three areas — grilling.)_

### Game Mode
The top-layer experience an Author picks when starting to play. All modes share
the Content layer and Challenge engine (ADR-0004); they differ only in the
**Session driver** and presentation:
- **In-Person** _(v1 focus)_ — single device (the Author's phone or tablet,
  tablet is the reference), author-paced. Group stands at the real truck, taps
  compartments, app reveals correct/incorrect, they physically inspect the item.
  No accounts for the group, no network needed.
- **Learning** — single user, self-paced, tracks own progress.
- **Online PvP** — many devices join a Session via code; realtime lobby +
  synchronized questions + live scoreboard (Kahoot-style). Deferred past v1.

### Challenge
A single generated question, produced by the **Challenge engine** from a Library
slice: `{ prompt, subject, correct answer, candidate distractors, verdict }`.
Carries no UI, no players, no scoring. The reusable core shared by every mode.
Challenge types map to the Round Modes (Locate, Perform, Identify, Name-loadout, T/F).
Challenges are **atomic**: a game that asks several questions in one turn chains
them in its Session driver, it does not get a composite Challenge type (ADR-0006).
Where no verdict is computable — Perform, Holen — the driver records the
moderator's call instead.

### Game Session
One run of a Game Mode: a chosen slice of a Library, a stream of Challenges, and
the participants. In-Person and Learning sessions are single-device and local;
Online PvP sessions are multi-device and server-coordinated.

A session keeps a **Round Answer** log — per answered Challenge, the subject, the
Compartment(s) that were right and the one that was tapped. It lives in the Session
driver, never in the Challenge engine (ADR-0004), and is what lets a round end on
"these are the Geräte to go over again" rather than a bare tally. It is *not*
scoring or progress: the log dies with the round and nothing is persisted (real
progression is the deferred Learning-mode question).

### Participant
Someone taking part in a Session. In-Person participants are an anonymous group
sharing one screen (no accounts). Online PvP participants join with just a
nickname + code (no account required). Only Authors need accounts.

## Architecture
Layered so Game Modes are a swappable top layer, not a fork (ADR-0004):
1. **Content layer (Library)** — mode-agnostic domain data.
2. **Challenge engine** — pure Challenge generation from a Library slice.
3. **Session driver** — per-mode: device count, pacing, where answers/score go.
4. **Presentation** — per-mode rendering of the same Challenge.

- **Frontend:** Angular 22 (standalone + signals), Tailwind 4, vitest — same
  stack family as `feuerwehr-activity`. Offline-capable PWA. Static-hosted.
- **Devices:** mobile-first and responsive across the whole range —
  **smartphone → iPad → laptop**, no desktop-first path. Smartphone portrait is
  the design baseline; screens scale *up* (optional two-pane on wide viewports).
  Touch-first with ≥44 px targets, but mouse + keyboard also supported (no
  hover-only state; interactive schematic regions are keyboard-operable). No
  orientation lock; safe-area insets respected in standalone PWA mode (ADR-0005).
- **Persistence:** all data access goes through a **`ContentStore` port**.
  - **v1:** local adapter (IndexedDB/localStorage), offline-first, no network.
  - **Supabase adapter** (Postgres + Auth + RLS "write your own Library") swaps
    in underneath with zero domain changes — written in v1 (parallel) or as an
    immediate fast-follow, toggled by config (ADR-0002).
  - **No realtime/session infra in v1** — built when Online PvP arrives.

## Frontend conventions
- **Component files split three ways.** Every component lives as `name.ts` +
  `name.html` + `name.scss`, wired with `templateUrl` / `styleUrl` — never inline
  `template`/`styles`. Keep the existing no-suffix naming (`login.ts`, not
  `login.component.ts`). Most screens carry their layout as Tailwind utility
  classes in the template and a near-empty `.scss`; that is fine — the file
  exists for consistency and as the home for the occasional component-scoped rule.
- **Design first.** When building or restyling a screen, work from the design
  system, not ad-hoc styling: the screen mockups in `docs/design/screens/`, the
  visual language in [`docs/design/design-guidelines.md`](docs/design/design-guidelines.md),
  and the screen/flow map in [`docs/design/screen-flow.md`](docs/design/screen-flow.md).
  Reuse the documented tokens, typography, and component patterns; if a screen
  needs something new, add it to the guidelines in the same PR.

## Scope
- **v1:**
  - In-Person mode, single device, offline-capable.
  - **Locate and Perform challenge types.** Locate ships as Fach-Finder (item → tap
    its compartment → reveal); Perform ships inside **Activity**, which chains
    Perform → Locate → Fetch in one Zug with per-Stufe points, 1–4 teams and a
    36-field board (ADR-0006). Activity cards cover the equipment reachable on the
    four playable Vehicle Types.
  - **Four playable Vehicle Types.** The author's LF uses the hand-crafted
    `LfSketch` reused from `feuerwehr-activity`; HLF 20, TLF 3000 and TSF-W use
    the generic metadata-box renderer built from their compartment `side`+`order`
    (ADR-0003). The rest of the Fahrzeugkatalog is master data without a
    compartment layout — creatable as Vehicles, not loadable or playable.
  - **DIN seed content** ships for those four: fixed layouts + standard loadouts +
    the shared Equipment catalog (authored by us).
  - **Author content-editor**: pick a Vehicle Type, then edit Placements
    (bidirectional) over the type's fixed schematic. No layout/compartment
    editing, no equipment-image upload in v1.
  - Scoring: none in Fach-Finder; Activity scores per Stufe onto its own board.
    Nothing is persisted between games either way.
- **Later / roadmap:**
  - Rich competition modes — player-vs-player, cross-session leaderboards.
    Team-vs-team and multi-step scored challenges **shipped as Activity**; they
    live in a **Session driver + scoring**, never in the Challenge engine
    (ADR-0004, ADR-0006).
  - Activity card editor (Tabu-Wörter, difficulty) — cards are read-only seed today.
  - Fold `Gerät holen` into Activity's fetch harness, or give it the relay loop it
    still lacks — today it is Fach-Finder with a different tagline.
  - Additional challenge types (Identify, Name-loadout, T/F).
  - Learning mode, Online PvP (realtime), photo+hotspot rendering.
  - Shared DIN seed catalog for cloning (convenience once multiple Authors).

## Open questions (deferred, not v1-blocking)
- Learning-mode progression model — also gates a persisted Activity Bestenliste
  ("Zügen bis Ziel" is shown at game end but never stored).
- Growing the Activity card set past the equipment reachable on the four playable
  types, and who authors Tabu-Wörter for the rest of the 319-item catalog.
- Online PvP session/realtime design (lobby, PIN, scoreboard, participant model).
- Roadmap scoring/competition variants (team-vs-team, PvP, timed multi-step).
- Which of the remaining Fahrzeugkatalog types get a verified DIN loadout next,
  and which of them earn hand-crafted artwork over the metadata boxes (the
  spatially-unusual ones — DLK, RW — are the candidates).
- Equipment images (deferred from v1).
- Supabase RLS policy details + auth flow (when the Supabase adapter lands).
