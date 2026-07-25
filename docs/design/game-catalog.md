# Agni — Game Catalog

> **Living document.** The brainstormed universe of *games* Agni can offer, and
> the small set of *engines* they reduce to. It exists so the Game-mode overview
> screen and the roadmap are designed around reusable mechanics, not a pile of
> one-off games. This is a catalog and a design aid — nothing here is committed
> until it appears in [screen-flow](./screen-flow.md) and the [route map](./screen-flow.md#2-route-map)
> and has an ADR if it needs one.
>
> Companions: the [UI/UX brief](./ui-ux-brief.md) (what each screen *is*), the
> [screen-flow map](./screen-flow.md) (how they connect), the [design
> guidelines](./design-guidelines.md) (how they look), and the [ADRs](../adr/)
> (esp. ADR-0003 generic schematic renderer, ADR-0004 modes as peers).

---

## 0. The core insight

Agni is **not** building N independent games. Almost every game reduces to one of
a few **engines** plus a *content set* and a *rule config* (timed? scored? solo vs
group? reveal-and-explain vs buzzer?). The three top-level **modes**
(Game / Learning / Online-Duell) are largely the *same content and engines* wrapped
in a different loop:

- **Game** — timed, scored, competitive: "do you know it cold?"
- **Learning** — same content, untimed, explained, spaced repetition, the "why".
- **Online-Duell** — any quiz/schematic/calc game wrapped in the Kahoot loop
  (shared code, countdown, live ranking).

So the work is: build **~4 engines + a physical/timer harness**, then express each
game as content + config. Design the overview screen around that.

### Legend
- 🚒 in-person at the vehicle · 📱 solo iPad · 👥 multiplayer
- **Status:** `shipped` · `v1-shortlist` · `roadmap` · `idea`

---

## 1. Engines

| Engine | What it does | Backs families | Notes |
|--------|--------------|----------------|-------|
| **Schematic** | Render a vehicle, address zones by compartment id, tap/highlight/verdict | Family 1 | Exists (Locate). Generic per ADR-0003. |
| **Perform** | Draw a card by (mode × difficulty), show it privately, moderator calls the guess | Family 6 | Exists (Activity). Cards are mode-agnostic; the board assigns the mode. |
| **Quiz** | Multiple-choice / drag-to-match, graded | Family 3 | Cheapest to build; largest content surface. |
| **Calc** | Numeric/slider input, graded against a formula with tolerance | Family 2 | New. Needs a units/formula layer. |
| **Sequence** | Drag-to-order steps, graded on order | Family 4 | New, small. |
| **Physical/Timer harness** | App randomizes a prompt, times & scores a real-world drill | Family 5 | Exists inside Activity (Stufe 3). Not a simulator — a stopwatch + scoreboard + prompt generator. |

### Composite games
Most games are one engine + content + config. **Activity is the first that chains
several engines inside a single turn** — Perform → Schematic → Physical harness,
with points per step. The chaining, the scoring and the board live in the Session
driver; the engines stay atomic and reusable (ADR-0006). Expect more of these:
"engine + content + config" scales to composites without new engine types.

---

## 2. Family 1 — Schematic / "where is it"
*Engine: Schematic. Reuses the vehicle schematic + tap-a-compartment interaction.*

| Game | Modes | Trains | Status |
|------|-------|--------|--------|
| **Fach-Finder (Locate)** — tool shown → tap correct compartment | 🚒📱 | Fahrzeug-/Gerätekunde | shipped |
| **Gerät holen (Bring it / Staffellauf)** — driver names a tool, trainee physically fetches it; timed relay | 🚒👥 | Beladung, speed | shipped-as-Locate ⚠ |
| **Umgekehrt / Was ist im Fach?** — compartment highlighted → name/pick what's inside (inverse of Locate) | 📱 | Beladung recall | roadmap |
| **Beladungs-Blitz** — 60 s speed round, max correct tool→fach matches, leaderboard | 📱👥 | Beladung, speed | roadmap |
| **Vollständigkeits-Check** — "is compartment G3 complete per DIN?" spot the missing/wrong item | 🚒 | Beladekontrolle | idea |

## 3. Family 2 — Calculation
*Engine: Calc. Numeric input / slider, graded against a formula with tolerance.*

| Game | Modes | Trains | Status |
|------|-------|--------|--------|
| **Wasserförderung / Druckrechnen** — friction loss, head lift (±0.1 bar/m Höhenunterschied), nozzle pressure, pump output; scales up to **Relaisbetrieb** planning | 📱 | Löschtechnik/Hydraulik | v1-shortlist |
| **Atemschutz-Rechnen** — cylinder pressure/volume → available time, Rückzugsdruck, consumption rate | 📱 | Atemschutz | roadmap |
| **Förderstrecke aufbauen** — given terrain/distance, pick hose count + pump placement to keep nozzle pressure in spec | 📱 | Wasserförderung | idea |

## 4. Family 3 — Quiz / recognition / matching
*Engine: Quiz. Multiple-choice or drag-to-match. Cheapest engine, huge content surface.*

| Game | Modes | Trains | Status |
|------|-------|--------|--------|
| **Löschmittel-Match** — material/scenario → fire class (A/B/C/D/F) + correct agent (never water on F/D) | 📱 | Brennen & Löschen (safety reflex) | v1-shortlist (Family-3 seed) |
| **Armaturen & Strahlrohre** — identify Verteiler, Sammelstück, Standrohr, Stützkrümmer, Übergangsstück, Hohl-/Mehrzweckstrahlrohr + function | 📱 | Gerätekunde | roadmap |
| **Fahrzeug-ABC** — silhouette/photo → type (LF 20, HLF 20, TLF, DLK 23-12, RW, ELW, GW-G) + crew (Trupp/Staffel/Gruppe) | 📱 | Fahrzeugkunde | roadmap |
| **Gefahrgut / ADR** — decode Warntafel (Kemler + UN-Nummer), match Gefahrzettel, pick safe distance/action | 📱 | Gefahrgut | roadmap |
| **Dienstgrade** — rank insignia → name (content per Bundesland) | 📱 | Organisation | idea |
| **Gerätekunde-Memory** — image↔name pair-matching | 📱👥 | Gerätekunde | idea |

## 5. Family 4 — Sequence / procedure ordering
*Engine: Sequence. Drag-to-order steps, graded on order. Trains procedural memory.*

| Game | Modes | Trains | Status |
|------|-------|--------|--------|
| **Angriffsbefehl** — order the parts of a standard command / "Wasser marsch" | 🚒📱 | Einsatztaktik | roadmap |
| **Saugbetrieb / Löschaufbau** — order steps to draft from open water or set up an attack line | 📱 | Löschtechnik | idea |
| **Einsatzablauf** — first-arriving-unit priority ordering (Menschenrettung first, then water supply, …) | 📱 | Einsatztaktik | idea |

## 5a. Family 6 — Perform / act it out
*Engine: Perform (+ Schematic + Physical harness when composed). One card, up to
three Stufen, points per Stufe.*

| Game | Modes | Trains | Status |
|------|-------|--------|--------|
| **Activity** — Beschreiben / Zeichnen / Pantomime a Gerät → tap its Fach → fetch it; 1–4 teams race a 36-field board | 🚒👥 | Gerätekunde, Beladung, Teamsprache | shipped |
| **Nur Raten** — Activity with Stufen 2+3 off; pure word game away from the truck | 📱👥 | Gerätekunde vocabulary | shipped (a config) |
| **Tabu-Duell** — two teams alternate on the same card, first correct guess scores | 👥 | speed recall | idea |

Activity is the port of the standalone `feuerwehr-activity` app, with the one change
that mattered: **the Fach comes from the Vehicle's live Placements**, not from
locations baked into each card against one specific truck. The same card therefore
plays correctly on every Vehicle that carries the item.

## 6. Family 5 — Skill / physical (in-person; app scores/times/randomizes)
*Engine: Physical/Timer harness. The app never simulates the skill — it prompts, times, and scores a real drill.*

| Game | Modes | Trains | Status |
|------|-------|--------|--------|
| **Knotenkunde** — app shows a knot name (Mastwurf, Zimmermannsschlag, Schotstich, doppelter Ankerstich, Spierenstich) → tie it within time; 📱 identify-the-knot quiz variant | 🚒📱 | Knoten & Stiche | roadmap |
| **Funkübung** — generate a word → spell it in the phonetic alphabet (Anton, Berta, Cäsar…); or a Funkspruch procedure check | 🚒📱 | Sprechfunk | roadmap |
| **Zielspritzen / Kuppeln auf Zeit** — timer + scoreboard for a physical drill (couple hoses, hit targets) | 🚒 | motor skills | idea |

---

## 7. v1 Game-mode shortlist

Highest training value, maximal reuse of what already exists:

1. **Fach-Finder** — shipped; the Schematic engine, proven.
2. **Activity** — shipped; seeds the Perform engine *and* the Physical harness, and
   proves composites (ADR-0006).
3. **Gerät holen** (in-person relay) — ⚠ launchable but still Fach-Finder with a
   different tagline; the relay loop now exists inside Activity's Stufe 3 and should
   be shared or the game folded in.
4. **Wasserförderung / Druckrechnen** — seeds the Calc engine; high real-world value.
5. **Löschmittel-Match** — seeds the Quiz engine cheaply.

Shipping these exercises four of the six engines, which is the point: it proves the
"engine + content + config" model — and, with Activity, that composing engines needs
no new engine type.

**Where they live:** games are launched from the Game-mode launcher — mockup
[`04-spiele-uebersicht`](./screens/04-spiele-uebersicht.html), flow in
[screen-flow §5.6 / §7.5](./screen-flow.md#56-introduce-the-game-mode-launcher--p2-new).
Each game then reuses a per-engine setup template (Vorbereiten) → Play → Ergebnis.

---

## 8. Open questions

- **Game vs Learning boundary.** Same content (e.g. Löschmittel) is a scored buzzer
  quiz in Game and an explained flashcard lesson in Learning. Confirm the split is
  *intent/loop*, not *content* — and where a game's "why does this answer matter?"
  explanation lives.
- **Content sourcing.** Löschmittel, Armaturen, ADR, Dienstgrade need reference
  data (and Dienstgrade/ranks are per-Bundesland). Where does non-vehicle reference
  content live vs the vehicle Library? New store contract or extend the existing one?
- **Engine boundaries.** Is Sequence distinct enough from Quiz to be its own engine,
  or a Quiz mode? Decide before building either.
- **`Gerät holen` vs. Activity Stufe 3.** They are the same mechanic; one has a
  timer and a scoreboard, the other doesn't. Either re-point `geraet-holen` at
  Activity's fetch harness, or retire it as "Activity, Stufe 3 only".
- **Activity card coverage.** Cards exist for the equipment reachable on the four
  playable Vehicle Types. Growing past that means authoring difficulty + Tabu-Wörter
  for the rest of the 319-item catalog — and deciding whether Authors may edit them.
- **Domains deliberately not yet covered:** THL/technische Hilfeleistung, Erste
  Hilfe, Rechtsgrundlagen — parked, not rejected.

---

## Maintenance
Update this doc when you: add/cut a game or engine, move a game between statuses
(`idea → roadmap → v1-shortlist → shipped`), or resolve an open question. When a
game actually ships, it also gets a row in [screen-flow §2](./screen-flow.md#2-route-map)
and, if it introduces a new engine or store contract, an ADR.

### Changelog
| Date | Change |
|------|--------|
| 2026-07-24 | Initial brainstorm: 5 mechanic families, ~5 engines, ~20 games, v1 shortlist, open questions. |
| 2026-07-24 | `/games` launcher shipped (`features/games`, ported from mockup 04). Home In-Person CTA now lands here; Fach-Finder + Gerät holen start `/select`, roadmap games shown as "In Planung". |
| 2026-07-25 | **Activity shipped.** Adds Family 6 (Perform engine) and the first *composite* game — Perform → Schematic → Physical harness chained in one Zug (ADR-0006). Physical/Timer harness marked as existing (Stufe 3). `Gerät holen` flagged ⚠: launchable but not yet a real relay; consolidation raised as an open question. Card locations now come from live Placements, not baked into the card as in the standalone app. |
