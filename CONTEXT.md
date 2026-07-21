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

### Equipment (Beladung / Gerät)
A **canonical catalog entry** (Motorsäge, Stromerzeuger, Flutlichtstrahler,
Rettungsschere…), with name, category, optional image. Shared across all
vehicles so cross-vehicle questions are reliable. Placed into Compartments via
Placements — never free text.

### Placement
The association **Equipment → Compartment → Vehicle**, with optional **quantity**.
The core fact the game tests. One catalog item may have **many** placements: on
many vehicles, and in more than one compartment of the same vehicle (e.g. axes
on the Dach *and* in G1). Instance placements are seeded from the Vehicle Type's
default DIN loadout, then edited by the Author. Editing is **bidirectional**:
open a compartment and tick its tools, or pick a tool and assign its compartment.

### Round Mode
The game supports **mixed** round types drawn from one dataset:
- **Locate** — given Equipment + Vehicle, pick the correct Compartment.
- **Identify** — given a photo/silhouette or loadout, name the Vehicle Type.
- **Name loadout** — given a Vehicle + open Compartment, select which Equipment belongs.
- **True/False** — "Is Equipment X carried on Vehicle Y?" / "in Compartment Z?".

### Author
Any registered user. Owns a private **Library** of their own Vehicles,
Compartments, Equipment, and Placements. Replaces the old "admin" concept
entirely — there is no privileged global editor. DIN seed templates are a
shared read-only starter catalog any Author can clone into their Library
(clone-on-create still applies, ADR-0001).

### Library
The full set of an Author's own content (Vehicles + Compartments + Equipment +
Placements). Mode-agnostic. The unit an Author builds and later plays from.

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
Challenge types map to the Round Modes (Locate, Identify, Name-loadout, T/F).

### Game Session
One run of a Game Mode: a chosen slice of a Library, a stream of Challenges, and
the participants. In-Person and Learning sessions are single-device and local;
Online PvP sessions are multi-device and server-coordinated.

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

## Scope
- **v1:**
  - In-Person mode, single device, offline-capable.
  - **Locate challenge type only** (item → tap its compartment → reveal).
  - **One Vehicle Type: the author's LF**, rendered with the hand-crafted
    `LfSketch` reused from `feuerwehr-activity`. Generic metadata-box renderer is
    the documented fallback for future types (ADR-0003).
  - **DIN seed content** ships for that LF: its fixed layout + standard loadout +
    the shared Equipment catalog (authored by us).
  - **Author content-editor**: pick a Vehicle Type, then edit Placements
    (bidirectional) over the type's fixed schematic. No layout/compartment
    editing, no equipment-image upload in v1.
  - Scoring: minimal/none in v1 (see roadmap).
- **Later / roadmap:**
  - Rich competition modes — team-vs-team, player-vs-player, activity-style,
    point scoring; multi-step challenges (describe tool → select location →
    fetch within a time limit, points per step). All implemented as **Session
    drivers + scoring**, never in the Challenge engine (ADR-0004).
  - Additional challenge types (Identify, Name-loadout, T/F).
  - Learning mode, Online PvP (realtime), photo+hotspot rendering.
  - Shared DIN seed catalog for cloning (convenience once multiple Authors).

## Open questions (deferred, not v1-blocking)
- Learning-mode progression model.
- Online PvP session/realtime design (lobby, PIN, scoreboard, participant model).
- Roadmap scoring/competition variants (team-vs-team, PvP, timed multi-step).
- Additional Vehicle Types beyond the LF, and whether they use hand-crafted or
  metadata-box schematics.
- Equipment images (deferred from v1).
- Supabase RLS policy details + auth flow (when the Supabase adapter lands).
