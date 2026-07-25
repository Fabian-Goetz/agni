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
| **"C" blueprint** (this doc) — Roboto, light/dark, per-screen root-class tokens | `login`, `home`, `games`, `select`, `geraetehaus`, `katalog`, `fahrzeugkatalog`, `editor`, `play`, `activity-setup`, `activity-play` | **target** |
| **Firetruck** — dark-only spartan/shadcn tokens in `src/styles.css` (`bg-background`, `text-primary`, `hlmBtn`, …) | `signup`, the app-shell offline banner (`app.ts`) | **legacy, to migrate** |

Every *screen* except `signup` now speaks "C". `signup` was listed as migrated here
before it was — it still has no root class and still uses `hlmBtn`; it is the last
one left.

The interactive schematics (`fk-lf-sketch`, `fk-metadata-sketch`) keep the
firetruck instrument palette on purpose — see the **schematic stage** in §6.

The token block is still copied per screen, with one exception: the two Activity
screens share `features/activity/_blueprint.scss`, which exposes the tokens, page
background, buttons and theme toggle as mixins. That is the shape a repo-wide
extraction should take when someone does it.

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
- **Reference card** (`.ref-card` / `.soon-card`) — the **secondary** row-card:
  `--surface-2` inset, `--line` hairline, `icon | body | (→)`, `h3` + one quiet
  line. It is the counterweight to the full `.card`: use it for anything a screen
  offers but does not want the user to reach for first — the Gerätehaus's
  Katalog/Fahrzeugkatalog strip, the games launcher's roadmap. Two rules earn their
  keep: the trailing `→` appears **only when the card is a link** (§7a.4), and an
  inert card carries **no status badge** when a section label above it already says
  the same thing (§7a.2). Reach for this before inventing a "smaller card" —
  a dimmed or hatched copy of the primary card still reads as primary.
- **Hub chrome rhythm** (`.topbar` → chip row → `.page-head`) — the three rows every
  *browsed* screen opens with, in that order, with identical shell padding
  (`clamp(20px, 3.2vw, 44px)` block) and gap (`clamp(24px, 2.8vw, 40px)`). The chip
  row is a **fixed 38px slot**: on a sub-screen it holds the `.back` chip; on Home,
  which has nowhere to go back to, it holds a `.utilbar` — the forward `.navchip`
  (`Gerätehaus →`, the mirror of `‹ Startseite`) opposite `Abmelden`. Reserving it
  is not cosmetic: the H1 lands on the same pixel on both sides of a navigation, so
  the page doesn't jump when you move between hub screens. A screen that omits the
  row must still reserve its height. The H1 clamp (`34→52px`, `line-height: 1`) is
  part of the same contract.
- **Workbench split** (`.split` = `1fr 420px`, list left / sticky panel right,
  one column below 900px) — the shape for *editing a relation between two lists*.
  The Geräte-Katalog uses it read-only (list → detail); the Beladung editor uses it
  live: **Geräte list left, vehicle schematic right, no mode switch**, each side
  highlighting into the other. On phones the schematic takes `order: -1` and leads,
  because tapping a Fach is what gives the list its context.
- **Schematic stage** (`.stage` / `.figure`) — the sodium-topped panel that frames
  an interactive schematic. `.figure` stays a **dark inset in both themes**: the
  sketch renderers carry the firetruck instrument palette internally (green/amber/
  red zone states), so on paper-light they read as a dashboard display rather than
  clashing half-lit artwork. A `.legend` (colour key) and one mono `.hint` line
  spell out what a tap does — the interaction is not self-evident.
- **Write-check row** (`.row` = `.r-check` + `.r-pick`) — a list row with **two
  affordances**: a leading check button that writes (green + filled when the fact
  holds, `aria-pressed`, disabled with a `title` when there is nothing to write
  into), and the row body that only *selects*. Use it when a list is both a
  picker and an editing surface — the pair keeps "look at this" from ever
  silently meaning "change this". Nest no buttons: they are siblings in a flex
  `div`, each ≥44px.
- **Round chrome** (`.roundbar` + `.rail`) — the shell for a *running drill*, in
  place of the brand topbar + footer. A slim sticky bar carries only what a round
  needs: the **exit** (bordered ghost chip, ≥44px), the game name with
  `Frage n/total` beneath it, and the theme toggle; under it a 3px `--sodium`
  **progress rail**. No brand mark, no footer metadata, no `--maxw: 1240px` — the
  shell narrows to `780px`. Rationale: authoring screens are browsed, a round is
  *performed*, and during it the question and the schematic are the only things
  that may carry weight (§7a.3). Use it for any future in-round screen.
  **Exception — planning phases widen.** A game loop may contain moments that are
  *read* rather than performed (Activity's board: whose Zug, where everyone stands,
  which difficulty to gamble on). Those get `1040px` and may go two-pane; every
  phase the group watches stays at `780px`. Drive it off a class on `.shell`, not a
  second route, so the round bar never jumps.
- **Prompt card** (`.prompt`) — the question itself: `.eyebrow` ("Wohin gehört"),
  the subject as a Condensed `h1` at `clamp(28px, 6.4vw, 44px)` — the largest type
  in the app, readable across a bay — then quiet mono metadata (`.plate`
  Kurzzeichen + category). Carries the single `--signal` top rule on screen. It
  drops to `opacity: 0.62` once answered (`.done`), handing the eye to the reveal
  instead of competing with it.
- **Verdict** (`.verdict.hit` / `.verdict.miss`) — the reveal strip: a 3px left
  border in `--go`/`--signal`, a tinted wash, an **icon plus a sentence that names
  the correct Fach**, and the `Weiter →` primary. Never color-only (§3); the
  compartment is spelled out because "which one was it" is the thing being taught.
- **Round summary** (`.result`) — score as a `--go` Condensed numeral over a mono
  `/ total`, a `.quota` bar, then the **`.review` list: every missed Gerät with the
  Fach it belonged in** (`--go`) and the one that was tapped (mono `--faint`). A
  drill summary that only prints a tally teaches nothing — the misses are the
  content. Clean round shows an explicit "alles getroffen" line instead.
- **Onboarding wizard** (`.wiz-rail` / `.step-panel` / `.wizard-nav`) — a setup
  form paced as consecutive screens, app-onboarding style. **One question per
  step, and the question is the `h1`** ("Wer spielt?", "Woran wird gespielt?"),
  with a one-line `.lede` under it; the screen's own noun moves up into the
  `.eyebrow` alongside the counter (`Activity · Schritt 2 von 3`). Progress is a
  three-segment `.wiz-rail` and it is **inert** — the flow is sequential, so
  `Weiter` / `Zurück` are the only ways through. `Zurück` renders only once there
  is somewhere to go back to; the forward button is the full-width primary on
  phones (`order` flips it above `Zurück` while the DOM keeps reading
  back-then-forward), and a right-aligned capped button from 620px. Each step
  animates in via `@keyframes`, replayed for free because `@switch` recreates the
  node.
  Two rules that are not optional: **`Weiter` is never disabled**, and **the final
  commit is the only gated control**. Steps are usually interdependent — Activity's
  Stufe 2 toggle (step 3) decides whether the vehicle on step 2 needs a
  Fach-Layout — so a gate can strand someone on a step whose fix lives further on.
  State each problem inline next to the control that causes it, with an inline
  remedy where one exists ("… oder *Stufe 2 abschalten*"), and reserve the
  summary-plus-blocking-hint for the last step, where the configuration is
  gathered back together before starting.
  Use this only when every step has a **valid default**; a form that can't be
  skipped wants a plain page, and one short enough to fit a screen wants no wizard
  at all.
- **Countdown** (`.clockbar`) — a tabular-numeral mono `m:ss` beside a draining
  `--sodium` rail. Under ten seconds **both** turn `--signal`: this is the one place
  colour may carry the message alone, because the number it recolours is already the
  message. Use it for any timed phase; never for progress through a queue (that is
  the `.rail` in round chrome, which fills rather than drains).
- **Hand-off interstitial** (`.handoff`) — a full-panel stop between drawing
  private content and showing it, on a device the whole group can see: who takes the
  tablet, what they're about to do, and a single primary to reveal. A tap-to-reveal
  affordance is not enough — one mistimed tap and the round is spoiled. Any future
  game with secret content owes the group this screen.
- **Board** (`.board` / `.cell` / `.pawn`) — the race grid: a 6-column grid of
  square cells, each naming its mode with a single mono letter, the goal tinted
  `--sodium`. Teams are `.pawn` dots coloured by roster index (`--team-0…3`, set in
  `_blueprint.scss`), and the same dot repeats in the standings and the final table
  so a colour never has to be re-learned. The board **is** the score — don't print a
  point tally beside it (§7a.2).
- **Gamble row** (`.g-list` / `.g-opt`) — three side-by-side choices whose borders
  climb `--go` → `--sodium` → `--signal` left to right, so rising risk is legible
  before the labels are read. An option the content can't back is `:disabled` with
  the reason spelled out (`keine Karte`), never silently absent.
- **Stufen log** (`.stufen-log`) — the per-turn outcome as a numbered checklist,
  one row per step attempted, `✓`/`✕` plus `--go`/`--signal` on both the mark and
  the step number. Steps that were switched off or never reached are simply absent;
  a step that failed is followed by a `.teach` sentence naming what the answer was.
  Same rule as the round summary: a screen that only prints a number teaches nothing.
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
- **Per-component style budget is `16kB` warn / `24kB` error** (`angular.json`,
  production). It was `12`/`16` and three screens had grown past the warning with
  two within 500 bytes of the hard error — at which point the budget was pushing
  toward obfuscating CSS to fit a number rather than catching real bloat. The
  underlying cause is structural: every "C" screen inlines the token block *and* a
  full copy of the shared chrome (topbar, brand, back chip, avatar, footer, focus
  rings, buttons), so the same ~6kB ships once per screen. SCSS mixins don't help —
  they deduplicate the *source*, not the emitted CSS. **The real fix is to promote
  that chrome to a global layer** (a `.c-screen` block in `styles.css`) so it is
  emitted once for all eleven screens; the budget can then come back down. Until
  someone does that, prefer grouping selectors that share a declaration over
  repeating the block — `activity-play.scss` and `activity-setup.scss` show the
  pattern (one rule for all panels, one for the mono metadata voice, one for every
  focus ring).
- **Never name a class after a Tailwind utility.** Tailwind is imported globally in
  `src/styles.css` and emits a utility for any token it finds in the source, so a
  bare `class="… fixed"` in a `ViewEncapsulation.None` template silently picks up
  `.fixed { position: fixed }` — the element leaves the flow and lands on top of its
  sibling. This cost real debugging time on the Activity setup screen; the class is
  now `.always-on`. The danger is single-word state/layout adjectives — `fixed`,
  `block`, `grid`, `flex`, `hidden`, `static`, `visible`, `contents`, `table`,
  `inline`, `absolute`, `relative`, `sticky`, `isolate`, `truncate`, `uppercase`,
  `italic`, `underline`, `border`, `container`. Two defences: prefix state classes
  so they read as ours (`.always-on`, `.is-open`), and remember that a *scoped*
  rule (`.activity-setup .block`) only wins for properties it declares — anything it
  leaves unset still falls through to the global utility. Two known survivors, both
  pre-existing and believed benign — don't add more, and rename them if you're in
  the file anyway:
  - `.block` (`select`, `activity-setup`) — `display: block` on a `div` changes nothing.
  - `.filter` (`katalog`, `fahrzeugkatalog`) — Tailwind's `.filter` expands to a
    list of unset `--tw-*` vars, so the declaration is dropped as invalid. If those
    screens ever grow an absolutely-positioned child that anchors to the wrong
    ancestor, suspect this first: a *valid* `filter` value creates a containing
    block and a stacking context.
  Audit the whole app with:
  ```bash
  # every class token in a template that also exists as an emitted utility
  npm run build && python3 - <<'PY'
  import re, glob, os
  css = open(glob.glob('dist/*/browser/styles-*.css')[0]).read()
  util = set(re.findall(r'(?:^|[},])\.([a-zA-Z][\w-]*)\{', css))
  for f in glob.glob('src/app/**/*.html', recursive=True):
      for m in re.finditer(r'class="([^"]*)"', open(f).read()):
          for tok in set(m.group(1).split()) & util:
              print(f'{tok:16s} {os.path.basename(f)}')
  PY
  ```
  Hits in `signup.html` and `metadata-sketch.html` are expected — those are the
  legacy firetruck screens that use Tailwind on purpose.

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
| 2026-07-25 | **Rebuilt `home` on the hub pattern — the last screen still on the original mode-grid.** It was the odd one out: a heavier topbar (nav link + e-mail + `Abmelden`), a wider shell gap, an instructing H1, and three near-equal 290px cards of which two were hatched, dimmed roadmap placeholders carrying both a `● Bald` status *and* an `In Planung` badge. Now: topbar reduced to avatar + theme toggle like every other screen (the e-mail moved into the avatar's `title`), H1 `Wähle einen Modus.` → the bare noun **`Üben`** with a lede, In-Person promoted to a single full-width panel row (icon │ identity │ the one red CTA — the Gerätehaus vehicle-row shape), and Lernen / Online-Duell demoted to two quiet `.soon-card`s under an `In Planung` label. `--hatch` deleted (orphaned, as on `/games`); the dead `.eyebrow` block went with it. Codified the **hub chrome rhythm** (§6) that the fix turned on: Home's new `.utilbar` occupies the same 38px slot the `.back` chip occupies elsewhere — its `Gerätehaus →` chip sits on the exact pixel the next screen's `‹ Startseite` will — and the shell gap dropped from `26–44px` to the hub's `24–40px`, so the H1 no longer jumps when you navigate. `Abmelden` lives in that row, Home being the only screen that offers it. |
| 2026-07-25 | **Activity setup reworked from tab-style chips to a sequential onboarding wizard** (§6, *onboarding wizard* — supersedes the navigable-stepper entry below). The clickable step header is gone; progress is an inert three-segment rail, each step's question is the `h1` with a `.lede` under it, and `Weiter`/`Zurück` are the only way through. `Spiel starten` now appears on the last step only, so the summary line moved there as the pre-commit review. What survived the change unaltered: `Weiter` is still never disabled and only the final commit is gated — with the chips gone, paging forward is the *only* route to a fix that lives on a later step, so gating would strand rather than merely annoy. Dead chip CSS removed. |
| 2026-07-25 | **Activity setup became a three-step wizard** (Teams → Fahrzeug → Stufen), first built as a **navigable stepper** with clickable chips — superseded the same day by the entry above. Built deliberately *not* as a linear wizard: the in-person fast path is "accept the defaults and start", and a gated three-step flow would turn zero taps into three. So chips are clickable, Weiter never blocks, `Spiel starten` is reachable from every step, and a summary line keeps the configuration visible while a step hides the rest. Per-step problems are stated next to the control that causes them — step 2's missing-Fach-Layout warning carries an inline "Stufe 2 abschalten" fix, since that remedy lives on step 3. Also: **raised the per-component style budget to 16/24kB** (§9) and recorded the structural reason — shared chrome is duplicated per screen and belongs in a global layer. Trimmed both Activity stylesheets by grouping shared declarations (panels, mono labels, focus rings) rather than repeating them. |
| 2026-07-25 | **Fixed the Stufen overlap: a class name collided with a Tailwind utility.** Stufe 1 was `class="stufe fixed"`, and Tailwind — global in `styles.css`, emitting a utility for any token it finds — gave it `.fixed { position: fixed }`. `ViewEncapsulation.None` means nothing shielded it, so the row left the flow and sat on top of Stufe 2; with `width: 100%` still on it, it had also sized against the viewport and spanned the whole page. Renamed to `.always-on`. Added the rule and an audit script to §9 — this is a standing hazard for every `ViewEncapsulation.None` screen, not a one-off. |
| 2026-07-25 | **Activity screens use the horizontal.** Setup was a single 780px column on a 1400px window; it now takes `1040px` and **two columns** from 900px — left *who and on what* (Teams, Fahrzeug), right *the rules* (Stufen, Feineinstellung) — with the start button spanning both and capped at 420px so a full-width red bar isn't the loudest thing on the page by area (§7a.1). The round screen gained the **planning-phase exception** to round chrome (§6): the board phase widens to `1040px` and goes two-pane (grid left, whose-turn + gamble right), while every performed phase stays at `780px`; driven by a class on `.shell` so the round bar never jumps. Also fixed: the Fahrzeug block rendered **empty** when the Library had no vehicle, and the start hint then blamed a missing Fächer-Layout instead of the missing vehicle — both now have their own state. `.block` gained `overflow: hidden` and `.stufen` became a grid, so a panel's contents cannot bleed across the page. |
| 2026-07-25 | Built the two **Activity** screens (`/activity`, `/activity/play`) in "C". Added four §6 patterns the game needed and future ones will reuse: **countdown** (`.clockbar`, draining rail, red under 10 s), **hand-off interstitial** (`.handoff` — a stop between drawing private content and showing it on a shared tablet), **board** (`.board`/`.cell`/`.pawn`, team colours `--team-0…3`), **gamble row** (borders climbing `--go`→`--sodium`→`--signal` so risk reads before the label), and **Stufen log** (per-turn checklist + a `.teach` line naming the answer on a miss). **First shared token partial:** `features/activity/_blueprint.scss` exposes the token block, page background, buttons and theme toggle as mixins, because Activity ships two screens in one feature — the extraction flagged as actionable in the 2026-07-24 `home` entry, done at the first point it paid for itself. Existing screens still inline their block; migrating them is a separate, mechanical change. Both Activity stylesheets exceed the 12 kB per-component **warning** budget (13.4 / 15.1 kB) as `geraetehaus.scss` already does — under the 16 kB error, but the shared partial should absorb more of the duplication before a third screen lands. |
| 2026-07-24 | Initial version: captured the "C" blueprint language from `screens/01–03` and the shipped `login` component; recorded the firetruck→C migration status. |
| 2026-07-24 | Migrated `home` (mode-select) to "C" from `screens/02-startseite`; added the mode-grid (`.modes`/`.mode`, available/locked states) and prepare-row (`.prep`/`.tile`) patterns; moved `home` to target in §0. Token block still copied per-screen — extraction to a shared partial is now actionable (two "C" screens shipped). |
| 2026-07-24 | Added §7a **Layout & hierarchy principles** (one focal action, say-it-once, content-over-chrome, no duplicate controls, tappable nav, scannable rows, descending reading order). Rebuilt the Gerätehaus hub against them: single H1 (no eyebrow), ghost back-chip, one signal action (Beladen) with "+ Fahrzeug" demoted to ghost + inline create, per-row `⋯` manage menu, quiet reference strip. |
| 2026-07-24 | Added the **metadata schematic** (§6): a compartment-metadata CSS grid that draws any vehicle type without hand-drawn artwork, behind the `fk-vehicle-schematic` dispatcher. Unlocks HLF 20 / TLF 3000 / TSF-W for Beladung and rounds. Zones are buttons — the first keyboard-operable schematic (§8). |
| 2026-07-24 | Rebuilt the **Beladung editor as a "C" workbench** (§0 → target): topbar + footer for consistency with the other screens, and a **workbench split** (§6) with the Geräte-Katalog left and the vehicle schematic right. Bidirectional Placement editing is now **simultaneous, not modal** — tap a Fach and its Geräte sort to the top with a green check; tap a Gerät and every Fach carrying it turns green on the schematic. Added the **schematic stage** and **write-check row** patterns (§6), a second schematic highlight channel (`marked` = carries the active Gerät, amber `selected` = the worked Fach), a search field over the ~370 seeded Geräte, and a legend + hint line. Schematic taps never write, so tracing a Gerät cannot place it by accident. |
| 2026-07-25 | Carried the same two hub conventions to **`/select`**: back-chip out of `.page-head` into a `.shell` child, and the H1's `Fahrzeug wählen.` / `Bereit?` pair replaced by the bare screen noun **`Vorbereiten`** (the block labels below already say `Fahrzeug` / `Anzahl Fragen`, so the title needn't instruct — §7a.2/§7a.3). Its `eyebrow` keeps carrying `In-Person · <game>`, which the H1 does not name. H1 clamp aligned to the hub's `34→52px`. |
| 2026-07-25 | Restyled the **`/games` launcher on the Gerätehaus hub pattern**, and documented the **reference card** (§6) now that it carries two screens. Roadmap demoted from six hatched near-full cards (each badged "In Planung" under a section header already saying "In Planung") to a quiet `.soon-card` strip — descending weight per §7a.7, and no tap-inviting weight on things that aren't links (§7a.4). Section labels lost their hairline rule and dropped to the hub's quiet `--faint` mono + `<em>` count (§7a.3); per-card "● Verfügbar" status dropped as a duplicate of the section label (§7a.2). H1 `Wähle ein Spiel.` → the bare noun **`Spielen`** with a one-line lede, matching `Gerätehaus`; back-chip moved out of `.page-head` to a `.shell` child as on the hub. Topbar reduced to avatar + theme toggle like every other non-Home screen — the e-mail/`Abmelden` block was the only copy outside Home, so `signOut()` and the `Router` import went with it. `--hatch` token deleted (orphaned). |
| 2026-07-25 | Migrated **`play` — the round screen — to "C"** (§0 → target), the last screen still on firetruck utilities and the only one that had never had design work: 4 lines of SCSS became a full token block. Introduced **round chrome** (§6): during a drill the brand topbar and footer are replaced by a slim sticky `.roundbar` (exit · game · `Frage n/total` · theme) over a `--sodium` progress rail, shell narrowed to `780px` — a round is performed, not browsed. Added the **prompt card** (subject as the app's largest type, receding to 0.62 opacity once answered), the **verdict** strip (icon + `--go`/`--signal` left border + the correct Fach named in words), and the **round summary** with a **`.review` list of every missed Gerät and the Fach it belonged in** — backed by a new `answers`/`missed` log on `InPersonSessionStore`, since a tally alone taught nothing. Corrected the §0 table: `signup` had been listed as migrated but never was — it is now the only legacy screen left. |
| 2026-07-24 | Rolled §7a across the app. **Shared back-chip pattern** (bordered ghost + arrow icon, ≥44px) now on games/katalog/fahrzeugkatalog/select (C: `.back` SCSS block) and play/editor (firetruck: Tailwind chip). **Dropped page-identity-repeating eyebrows** on katalog/fahrzeugkatalog (deleted) and games ("Spielen"); **quieted** select's info-carrying eyebrow to `--faint` (no red rule). **Reserved red for the one focal action:** games' 2nd game CTA → ghost (Fach-Finder keeps the red), signup brand H1 `text-primary`→`text-foreground`. **De-duped labels:** roadmap game cards dropped the `Bald` status that doubled their `In Planung` badge; footers dropped bold self-names. Home dropped the loud "Willkommen zurück" greeting + possessive. **Not done here:** the firetruck→"C" migration of select/play/editor (tracked separately, §0/§5.5) — only hierarchy tweaks applied. |
