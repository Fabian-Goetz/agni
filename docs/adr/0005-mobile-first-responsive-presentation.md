# ADR-0005: Mobile-first, responsive presentation

## Status
Accepted

## Context
The game is played primarily on hand-held and portable devices — smartphone,
iPad, and laptop — across the whole range, not one fixed form factor. In-Person
mode in particular runs on the Author's device held at the truck (a tablet is
the reference, but a phone is realistic). Nothing is desktop-first: there is no
"install on a workstation" scenario.

The presentation layer (ADR-0004) already ships as a centered single-column
layout (`max-w-md`/`max-w-lg`), an offline-capable PWA with iOS standalone
metadata and `viewport-fit=cover`. Read literally, `max-w-*` on every screen
looks like desktop was forgotten. It was not — but the intent needs recording
so a future reader doesn't "fix" it, and so a few real gaps (touch targets,
keyboard operability, notch safe-areas) get closed deliberately.

## Decision
Treat **smartphone portrait as the design baseline** and let every screen scale
*up* to iPad and laptop. Concretely:

1. **Baseline = narrowest.** Design and verify each screen at phone width first
   (iPhone SE, 375 px). It must never assume horizontal space.
2. **Single column by default; two-pane as a scale-up.** The centered column is
   correct on phones and acceptable everywhere. On wide viewports (`lg:`,
   ≥1024 px) screens *may* go two-pane — the portrait truck schematic beside its
   prompt/controls — but this is an enhancement, not a v1 requirement. No screen
   depends on the wide layout to function.
3. **Touch-first, ≥44 px targets.** Primary interactive elements meet a 44 px
   minimum. The SVG compartments already exceed this at all supported widths;
   button and checkbox-row sizing is held to the same bar.
4. **Support mouse + keyboard too.** State is never conveyed by hover alone.
   Interactive SVG regions (schematic compartments) are keyboard-focusable and
   operable, so the laptop case and assistive tech both work. (Full SVG
   keyboard-nav may land as a fast-follow; touch is the v1 priority.)
5. **No orientation lock.** Portrait and landscape are both first-class;
   landscape on iPad/laptop is where the optional two-pane layout pays off.
6. **Respect safe-area insets.** With `viewport-fit=cover`, root layout padding
   uses `env(safe-area-inset-*)` so headers/footers clear the notch and home
   indicator in standalone PWA mode.
7. **Reference QA breakpoints:** iPhone SE (375) · iPad portrait (768) &
   landscape (1024) · laptop (1280).

## Consequences
- **+** One codebase serves phone → tablet → laptop with no per-device fork;
  the baseline-narrowest rule keeps the hardest case honest.
- **+** Touch-target and keyboard rules make In-Person (tablet, gloved/quick
  taps) and laptop authoring both usable, and improve accessibility for free.
- **+** The wide-screen two-pane layout is deferrable — v1 ships single-column,
  and adding panes later touches only Presentation (ADR-0004), no data changes.
- **−** Every new screen carries a small responsive/touch/safe-area checklist,
  not just "make it look right on my machine."
- **−** Keyboard-operable SVG is extra work the pure touch path wouldn't need;
  scoped as fast-follow to avoid blocking v1.
