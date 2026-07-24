# Agni — Design Guidelines ("C" blueprint language)

> **Living document.** The visual language for Agni's screens, extracted from the
> HTML mockups in [`screens/`](./screens/) and the shipped implementation in
> `src/app/features/auth/login.*`. Use it as the reference when building or
> restyling any screen: reuse these tokens, type roles, and component patterns
> instead of inventing per-screen styling. Extend it in the same PR when a screen
> needs something genuinely new.
>
> Companions: the [UI/UX brief](./ui-ux-brief.md) (what each screen *is*), the
> [screen-flow map](./screen-flow.md) (how they connect), and the [ADRs](../adr/).

---

## 0. Adoption status (read this first)

Two visual systems exist in the repo right now — this is a deliberate,
in-progress migration, not an accident (tracked in [screen-flow §5.5](./screen-flow.md#55-resolve-the-design-language-split--cross-cutting-track-it)):

| System | Where | Status |
|--------|-------|--------|
| **"C" blueprint** (this doc) — Roboto, light/dark, per-screen root-class tokens | `login`, `home` (shipped); mockups `01`–`03` | **target** |
| **Firetruck** — dark-only spartan/shadcn tokens in `src/styles.css` (`bg-background`, `text-primary`, …) | `select`, `play`, `editor` | **legacy, to migrate** |

New screens use the "C" language. When you touch a legacy screen for visual work,
migrate it rather than deepening the firetruck styling. The firetruck palette in
the [brief §"Design system"](./ui-ux-brief.md) predates this language; where they
disagree, **this document wins**.

---

## 1. Tone

Technical, utilitarian, a little bold — an **engineering dossier / vehicle
blueprint**, not a consumer quiz app. Think emergency-services equipment: precise
mono labels, DIN plates, a schematic drawing, one decisive signal-red accent.
Calm surfaces, confident type, no decoration that doesn't carry meaning.

---

## 2. Theming

- **Dual light/dark.** Light ("Tageslicht") is the default; dark is an
  "apparatus-bay" graphite. Both are first-class.
- **Mechanism.** A `data-theme="light|dark"` attribute on the screen root
  (`.auth-screen`) selects the token set. Default from the OS
  (`prefers-color-scheme`); a topbar toggle flips it. Today the toggle is
  **local to the screen** (a component signal) — see screen-flow §5.5 for the
  open question of promoting it app-wide.
- **All color goes through CSS custom properties** (below). Never hard-code a hex
  in a component except the immutable brand asset (e.g. the Google "G" logo).

---

## 3. Color tokens

Canonical values live in `src/app/features/auth/login.scss`. Semantic names, not
raw colors, are what components reference.

| Token | Role | Light | Dark |
|-------|------|-------|------|
| `--paper-bg` | page background | `#f6f4f0` | `#0e1116` |
| `--surface-2` | inset panels (blueprint, inputs) | `#fbfaf7` | `#1b2029` |
| `--card-bg` | card surface | `#ffffff` | gradient `#161a21→#12161d` |
| `--ink` | primary text | `#191a1c` | `#e8eaed` |
| `--ink-2` | secondary text | `#4b4e54` | `#8a94a3` |
| `--faint` | tertiary / mono labels | `#9aa0a8` | `#5a6473` |
| `--line` / `--line-2` | hairlines / borders | `#e4e0d9` / `#d6d1c8` | `#1e242d` / `#262e3a` |
| `--signal` | **the** accent (fire red), primary action | `#e5352b` | `#e5352b` |
| `--signal-hi` | accent hover | `#c82820` | `#ff574c` |
| `--sodium` | amber highlight / active tag / dark links | `#b8791c` | `#f4b860` |
| `--go` | correct / online / "offline-ready" dot | `#2fa35f` | `#46d07e` |
| `--link` | inline links | `--signal` | `--sodium` |

Plus derived tokens: `--card-shadow`, `--focus-ring`, `--btn-shadow`,
`--input-bg`/`--input-focus-bg`/`--input-border`, `--ghost-bg`/`--ghost-hover-bg`,
and the blueprint set (`--blue`, `--blue-lo`, `--bp-*`). Copy the token block from
`login.scss` when starting a new "C" screen.

**Semantic usage rules**
- **One accent.** `--signal` is used sparingly: the primary button, the card's
  top rule, focus/active. Don't paint large areas red.
- Correctness is **never color-only**: pair `--go`/`--signal` with an icon +
  label (✅/❌), for color-blind users (ADR-0005).

---

## 4. Typography — Roboto superfamily

Loaded in `index.html`. Three roles:

| Token | Family | Used for |
|-------|--------|----------|
| `--font-display` | **Roboto Condensed** 600/700 | headlines, brand mark, card `h1`, button labels (uppercase, tight tracking) |
| `--font-body` | **Roboto** 400–600 | body copy, `lede`, hints, inputs |
| `--font-mono` | **Roboto Mono** 400/500 | eyebrows, field labels, plates, captions, footer — anything "instrument label" (uppercase, wide `letter-spacing` 0.1–0.26em) |

Scale is fluid: headline `clamp(38px, 5.2vw, 64px)`, card title `27px`, body
`15–17px`, mono labels `11–13px`. Mono labels are the signature move — use them
for metadata, not for reading copy.

---

## 5. Foundations

- **Radius:** `--radius: 5px` (tighter than the legacy `0.5rem` — deliberately
  more "drawn/technical").
- **Container:** `--maxw: 1240px`, centered, fluid padding
  `clamp(20px, 4vw, 56px)`.
- **Background:** paper/graphite radial gradient **plus a faint 34px technical
  grid** (`--bg-image`). It's what makes surfaces read as drafting paper.
- **Rhythm:** vertical stacks use `clamp()` gaps (`24–44px` at shell level);
  fields `16px` apart.

---

## 6. Component catalog

Class names are the shared vocabulary; canonical CSS is `login.scss`.

- **Topbar** (`.topbar`) — `.brand` = `.mark` (Condensed, a rotated `--signal`
  diamond via `::before`) + `.sub` (mono). `.tools` = `.plate` (mono DIN badge)
  + `.theme-toggle` (38px icon button, sun/moon swap by theme).
- **Eyebrow** (`.eyebrow`) — mono, `--signal`, uppercase, trailing gradient rule.
  The section kicker above a headline.
- **Headline / lede** (`.headline` / `.lede`) — Condensed display + Roboto body;
  `.headline em` recolors a phrase in `--sodium` (non-italic).
- **Blueprint figure** (`.blueprint`) — inset `--surface-2` panel holding the
  vehicle schematic SVG with a mono `.cap`. Schematic primitives:
  `.bp-line`/`.bp-fill`/`.bp-rib`/`.bp-glass`/`.bp-wheel`/`.bp-hub`/`.bp-lead`
  (dashed leader), `.bp-tag`/`.bp-tag-sm` (mono labels). **States** on a zone:
  default, `.bp-active` (sodium stroke + pulse), `.beacon` (signal, pulse). This
  is the "C"-language cousin of the interactive `LfSketch` — see ADR-0003 for the
  renderer contract (zones addressed by compartment id; highlighted / selected /
  correct / incorrect / disabled).
- **Metadata schematic** (`fk-metadata-sketch`) — the zero-artwork schematic for
  vehicle types with no hand-drawn SVG: a top-down CSS grid built from each
  compartment's `side` + `order` (cabin bands the front, flanks run down the
  outer columns front→rear, roof fills the centre, rear bands the back). Zones
  are ≥44px `<button>`s, so unlike the SVG sketches it is keyboard-operable.
  Same state vocabulary as the blueprint figure. Screens never choose a renderer
  themselves — they embed `fk-vehicle-schematic`, which dispatches on the type.
- **Card** (`.card`) — the primary surface. `--card-bg`, `--card-shadow`, a
  full-width `--signal` **top rule** (`::before`, 3px) that reads as a brand edge
  — *not* a progress/tab indicator (that ambiguity was explicitly removed).
  `h1` (Condensed) + `.hint` (body).
- **Field** (`.field`) — mono uppercase `label` above the input; input uses
  `--input-bg`, `--radius`, and a `--signal` border + `--focus-ring` on focus.
  `.row-between` puts a `.link` (e.g. "Vergessen?") opposite the label.
- **Buttons** (`.btn`) — Condensed, uppercase, `13px` block padding, `--radius`.
  `.btn-primary` = `--signal` fill + `--btn-shadow`; `.btn-ghost` = bordered
  neutral (used for OAuth/secondary). `:active` nudges 1px; `:disabled` = 0.5
  opacity.
- **Separator** (`.sep`) — centered mono word ("oder") between two hairlines.
- **Offline badge** (`.offline`) — `--go` dot + mono label. Signals local-first.
- **Foot-note / footer** (`.foot-note`, `.footer`) — hairline-topped mono strips
  for secondary links and status/version metadata.

---

## 7. States

- **Focus:** always visible — `box-shadow: var(--focus-ring)`, never
  `outline: none` without a replacement. Keyboard operability is required
  (ADR-0005).
- **Disabled:** 0.5 opacity + `cursor: not-allowed`; drive it off real state
  (e.g. `busy()` / empty inputs).
- **Error:** `.error` — `--signal`, 13px, above the submit button.
- **Correct / incorrect** (game reveal): icon + label + color (`--go` / `--signal`).
- **Loading / empty:** every data screen shows an explicit "Lädt…" and an empty
  state; don't render a blank frame.

---

## 7a. Layout & hierarchy principles

The rules that keep a screen calm and scannable. When a screen feels "cluttered"
or "you don't know where to look", it's almost always one of these being broken.

1. **One focal action per context.** `--signal` red marks the *single* primary
   action a user is most likely to take here — nothing else competes for it.
   Everything secondary is a `.btn-ghost` (bordered neutral). Two red buttons on
   one screen is a bug: the eye can't choose. On the Gerätehaus, red = **Beladen**
   (the recurring task); "+ Fahrzeug" is secondary → ghost.
2. **Say a thing once.** Never repeat the page's identity in both an eyebrow and
   the H1 (`GERÄTEHAUS` + "Dein Gerätehaus." is one label too many). One title per
   screen; drop possessives ("Dein") and decorative kickers when the H1 already
   names the place.
3. **Content over chrome.** A section doesn't need a labelled header if its
   content is self-evident. A list of vehicles with an "+ Fahrzeug" button and
   "Beladen" actions announces itself — no `DEIN ARBEITSBEREICH · …` eyebrow
   needed. Reserve mono section-labels for genuinely ambiguous groupings, and keep
   them quiet (`--faint`, no red gradient rule). Aim for **at most one** loud label
   before the user hits real content.
4. **No two controls with the same effect.** If a link and a button go to the same
   place, delete one. Distinct affordance ⇒ distinct outcome.
5. **Navigation must look tappable.** Back/return is a real, bordered control
   (`.btn-ghost` sized ≥44px with an arrow), not 11px mono text lost against the
   background.
6. **Scannable rows = identity + one primary action; bury the rest.** A list row
   shows what it is and its one main verb (Beladen). Secondary per-item actions
   (rename, delete) live behind a `⋯` menu, revealed on demand — present but not
   adding weight. Never print the same value twice in a row (show the type only
   when it differs from the name).
7. **Establish a clear reading order top-to-bottom:** title → primary work
   (your vehicles) → secondary/reference (catalogs). Visual weight (size, contrast,
   color) must descend in that same order.

---

## 8. Accessibility & responsive

- **Touch targets ≥44px**; controls usable one-handed and with gloves.
- **No hover-only** state; all state has a non-hover cue.
- **`prefers-reduced-motion`:** blueprint pulse/beacon animations and theme
  transitions are disabled.
- **Baseline is phone portrait** (ADR-0005). The split layout collapses to one
  column at `≤860px` (blueprint drops below, `.plate` hides). Design narrowest
  first; wide screens are the enhancement.
- **Safe-area insets** respected in standalone PWA mode.

---

## 9. Using this in Angular

- Components are split `ts` / `html` / `scss` (see [CONTEXT.md](../../CONTEXT.md)).
- "C"-language screens set `ViewEncapsulation.None` and scope every rule under a
  root class (`.auth-screen`) so the generic names here (`.card`, `.btn`, …)
  don't leak globally. Follow that pattern for new "C" screens (pick a distinct
  root class per screen family).
- Put the shared token block (`§3`/`§4`/`§5`) at the top of the screen's `.scss`,
  copied from `login.scss`, until it's promoted to a shared partial.

> **Refactor opportunity (not yet done):** the token block + component classes
> are duplicated per screen. Once a second "C" screen ships, extract them into a
> shared SCSS partial (e.g. `src/app/shared/styles/blueprint.scss`) imported by
> each screen, so tokens live in one place. Tracked here so it isn't forgotten.

---

## Maintenance
Update this doc in the same PR when you: add/rename a **token**, introduce a new
**component pattern**, change **type roles**, or migrate a screen between systems
(update §0). Keep `login.scss` and this doc in sync — the code is canonical for
values, this doc for intent and vocabulary.

### Changelog
| Date | Change |
|------|--------|
| 2026-07-24 | Initial version: captured the "C" blueprint language from `screens/01–03` and the shipped `login` component; recorded the firetruck→C migration status. |
| 2026-07-24 | Migrated `home` (mode-select) to "C" from `screens/02-startseite`; added the mode-grid (`.modes`/`.mode`, available/locked states) and prepare-row (`.prep`/`.tile`) patterns; moved `home` to target in §0. Token block still copied per-screen — extraction to a shared partial is now actionable (two "C" screens shipped). |
| 2026-07-24 | Added §7a **Layout & hierarchy principles** (one focal action, say-it-once, content-over-chrome, no duplicate controls, tappable nav, scannable rows, descending reading order). Rebuilt the Gerätehaus hub against them: single H1 (no eyebrow), ghost back-chip, one signal action (Beladen) with "+ Fahrzeug" demoted to ghost + inline create, per-row `⋯` manage menu, quiet reference strip. |
| 2026-07-24 | Added the **metadata schematic** (§6): a compartment-metadata CSS grid that draws any vehicle type without hand-drawn artwork, behind the `fk-vehicle-schematic` dispatcher. Unlocks HLF 20 / TLF 3000 / TSF-W for Beladung and rounds. Zones are buttons — the first keyboard-operable schematic (§8). |
| 2026-07-24 | Rolled §7a across the app. **Shared back-chip pattern** (bordered ghost + arrow icon, ≥44px) now on games/katalog/fahrzeugkatalog/select (C: `.back` SCSS block) and play/editor (firetruck: Tailwind chip). **Dropped page-identity-repeating eyebrows** on katalog/fahrzeugkatalog (deleted) and games ("Spielen"); **quieted** select's info-carrying eyebrow to `--faint` (no red rule). **Reserved red for the one focal action:** games' 2nd game CTA → ghost (Fach-Finder keeps the red), signup brand H1 `text-primary`→`text-foreground`. **De-duped labels:** roadmap game cards dropped the `Bald` status that doubled their `In Planung` badge; footers dropped bold self-names. Home dropped the loud "Willkommen zurück" greeting + possessive. **Not done here:** the firetruck→"C" migration of select/play/editor (tracked separately, §0/§5.5) — only hierarchy tweaks applied. |
