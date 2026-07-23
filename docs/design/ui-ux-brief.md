# Agni — UI/UX Design Brief

> A prompt to hand to Claude to design the game's screens (documentation now,
> implementation reference later). Covers both the shipped v1 and the endgame vision.

---

## Your task

You are designing the UI/UX for **Agni**, a mobile-first web game for German
fire-brigade (Feuerwehr) training. Produce **high-fidelity screen designs** as
**self-contained HTML artifacts** (inline CSS, no external assets) so they double
as documentation *and* a faithful implementation reference.

Design **every screen listed below** — both the shipped v1 screens and the
roadmap/endgame screens. For each screen deliver:

1. A **smartphone-portrait** frame (the design baseline, ~390px wide).
2. Notes on how it **scales up** to tablet/laptop (e.g. optional two-pane).
3. A one-paragraph **rationale**: the user's goal on this screen and the key
   interaction.

Group the screens into logical flows. Prioritise clarity and touch-first
ergonomics over decoration. Where a screen has states (empty / loading /
correct / incorrect / error), show the important ones.

---

## What the game is

Players learn **which standardized equipment (Beladung) is stored in which
compartment** of a fire-brigade vehicle. The core loop: the app shows an item,
the player taps the compartment on a **truck schematic** where it belongs, the
app reveals correct/incorrect — then, in person, they pull the real tool off the
truck. It's a vehicle-knowledge (*Fahrzeugkunde*) trainer.

**Audience:** German volunteer/professional firefighters, training in groups at a
real truck or solo. **UI language is German.** Age range is wide; readability and
big touch targets matter. Often used one-handed on a phone, or on a tablet
propped at the vehicle, sometimes with gloves.

## Ubiquitous language (use these terms in the UI)

- **Fahrzeug (Vehicle)** — a specific real truck (e.g. "FF Konstanz LF 20").
- **Fahrzeugtyp (Vehicle Type)** — DIN classification (LF 10, LF 20, HLF 20,
  TLF 3000, DLK 23/12, RW, MTF, ELW 1 …). Owns the fixed compartment layout.
- **Geräteraum / Fach (Compartment)** — a physical storage location on the
  vehicle (LF: G1–G6, Dach, Mannschaftsraum; DLK: Leiterpark, Korb …).
- **Beladung / Gerät (Equipment)** — a catalog item (Motorsäge, Stromerzeuger,
  Flutlichtstrahler, Rettungsschere …), optionally with an image.
- **Placement** — Equipment → Compartment → Vehicle, with optional quantity.
  The fact the game tests.
- **Author** — a registered user who owns a private **Library** of vehicles and
  edits their loadout. (There is no separate admin.)
- **Library** — all of one Author's content.
- **Game Mode** — In-Person / Learning / Online PvP.
- **Challenge** — one generated question. Types: **Locate**, **Identify**,
  **Name-loadout (Beladung benennen)**, **True/False (Richtig/Falsch)**.

## Design system (match this — the app already uses it)

- **Stack:** Angular 22 + Tailwind 4 + spartan-ng (shadcn-style) components.
  Design should translate cleanly to Tailwind utility classes and card/button
  primitives.
- **Theme: dark "firetruck" palette.** Use these exact tokens:
  - Background `#0a0e15`, elevated `#111823`, card `#131b27`, input `#1c2634`,
    border/edge `#263243`.
  - Foreground `#f1f5f9`, muted text `#94a3b8`, subtle `#64748b`.
  - Primary / ember (fire red) `#ef4444`, ember-bright `#f87171`,
    flame (orange) `#fb923c`.
  - **Semantic:** go/correct green `#22c55e`, warn/amber `#eab308`,
    sky/info blue `#3b82f6`, destructive `#dc2626`.
  - Radius `0.5rem`.
- **Layout:** mobile-first, responsive smartphone → iPad → laptop. **No
  desktop-first path.** Screens scale *up*; wide viewports may use an optional
  two-pane layout. Respect PWA **safe-area insets**.
- **Accessibility:** touch targets ≥44px; no hover-only state; interactive
  schematic regions must be keyboard-operable and clearly focus-ringed
  (`--ring` = ember). Correct/incorrect must be conveyed by more than colour
  (icon + label), for colour-blind users.
- **Tone:** confident, utilitarian, a little bold — think emergency-services
  equipment, not a consumer quiz app. Emoji accents are acceptable (the app
  currently uses 🚒 🧰).

## The truck schematic (central UI element)

The heart of the game is an **interactive vehicle schematic**: a top/side
representation of the truck with **tappable compartments**. For the v1 LF it's a
hand-crafted SVG sketch; future vehicle types may use a generic "metadata-box"
renderer (compartments laid out from `side` = left/right/rear/roof/cabin + an
order index). Design the schematic interaction generically: a compartment can be
**highlighted, selected, correct, incorrect, or disabled**, and the layout must
survive different vehicle types (LF vs. ladder truck vs. crew transport).

---

## Screens to design

### A. Shipped today (v1 — In-Person Locate)

1. **Auth — Login & Sign-up.** Email/password + "Mit Google anmelden". Sign-up
   may need email confirmation (show that state). Only Authors need accounts.
2. **Home / Mode select.** Landing screen. Pick a Game Mode — v1 ships
   **In-Person**; Learning and Online PvP shown as upcoming/locked. Account bar
   (email + Abmelden). Entry points: "In-Person Spiel starten", "Beladung
   bearbeiten".
3. **Select.** Choose what to play: pick the Vehicle / Library slice, and (later)
   the challenge types and count.
4. **Play — In-Person Locate.** The core loop on one shared device, author-paced:
   the current Equipment item, the interactive truck schematic, tap a
   compartment, then a **reveal** state (correct/incorrect, which compartment was
   right), and a "next" advance. Show progress through the round.
5. **Editor — content editor.** Bidirectional Placement editing over the fixed
   schematic: (a) open a compartment → tick which Equipment sits there; (b) pick
   an Equipment item → assign its compartment(s), with optional quantity. No
   compartment/layout editing in v1.

### B. Endgame / roadmap (design the vision, mark as "future")

6. **Library management.** List the Author's Vehicles; create a new Vehicle from
   a Vehicle Type (clone-on-create: cloning the DIN default loadout); manage the
   Equipment catalog.
7. **Other challenge types (presentation for each):**
   - **Identify** — photo/silhouette or loadout → name the Vehicle Type.
   - **Name-loadout** — a Vehicle + open Compartment → select which Equipment belongs.
   - **True/False** — "Wird Gerät X auf Fahrzeug Y mitgeführt?"
8. **Learning mode.** Single user, self-paced, with **progress tracking** — a
   dashboard of mastery per vehicle/compartment/category, streaks, and
   spaced-repetition "what to review next".
9. **Online PvP (Kahoot-style, multi-device):**
   - **Host setup + lobby** — create a session, show a big join **code/PIN**.
   - **Join** — participant enters nickname + code (no account).
   - **Waiting room** — list of joined participants.
   - **Live synchronized question** — same Challenge on all devices, countdown timer.
   - **Live scoreboard** — between questions and final results.
10. **Team-vs-team / competition & scoring.** Session setup for team play and
    point scoring; a scored round view; end-of-session results/summary.
11. **Multi-step timed challenge.** e.g. describe tool → select its location →
    physically fetch within a time limit, points awarded per step. Show the step
    progression and the timer/scoring.

---

## Deliverable format

- One self-contained **HTML artifact per screen** (or a small set of related
  screens per artifact), using the palette/tokens above, framed at phone width
  with responsive notes.
- Keep copy in **German** for user-facing strings; annotations/rationale in
  English are fine.
- Clearly label each screen **v1 (shipped)** vs **future (roadmap)**.
- Favour realistic content (real LF compartments G1–G6/Dach, real equipment
  names) over lorem ipsum.

Start by proposing the **information architecture / screen flow** (how the
screens connect), then design the screens.
