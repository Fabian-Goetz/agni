# ADR-0004: Mode-agnostic layered architecture

## Status
Accepted

## Context
The game is envisioned with several Game Modes — In-Person (single tablet, group
at the truck), Learning (solo, self-paced), and Online PvP (Kahoot-style, many
devices, realtime). The risk is committing to one mode's assumptions and being
unable to add the others without a rewrite. v1 focuses on In-Person, but the
foundation must not preclude the rest.

## Decision
Separate the system into four layers with a strict dependency direction
(each layer knows only about those below it):

1. **Content layer (Library)** — Vehicles, Compartments, Equipment, Placements.
   Mode-agnostic domain data. Persisted via a `ContentStore` interface (Supabase
   impl + offline cache; a pure-local impl remains possible).
2. **Challenge engine** — a pure module that, given a Library slice and a
   challenge type, returns a `Challenge`:
   `{ prompt, subject, correctAnswer, candidateDistractors, verdict }`.
   No UI, no players, no scoring, no persistence.
3. **Session driver** — the only per-mode layer for game logic: device count,
   pacing (author-paced / self-paced / host-synced), and where answers and
   scores are recorded. In-Person and Learning drivers are local and
   single-device; Online PvP adds realtime coordination.
4. **Presentation** — renders a Challenge per mode (tap-a-compartment schematic,
   1-of-4 buttons, explanation-after, etc.). The answer *interaction* is a
   presentation concern, not encoded in the Challenge.

## Consequences
- **+** Adding or switching a mode = new Session driver + view; layers 1–2 are
  untouched. This is the explicit hedge against lock-in.
- **+** The interaction style (tap vs. multiple-choice) is decoupled from the
  data, so the same Challenge serves every mode.
- **+** Realtime/session complexity is quarantined in the Online PvP driver and
  can be deferred entirely for v1.
- **−** More upfront structure than a single-mode app would need; justified by
  the multi-mode roadmap.
- The Challenge engine must be designed pure/testable from the start, or the
  benefit collapses.
