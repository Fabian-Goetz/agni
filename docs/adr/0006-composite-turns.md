# ADR-0006: Composite turns — chaining atomic Challenges in the Session driver

## Status
Accepted

## Context
Every game shipped so far asks **one** question per interaction: Fach-Finder deals
a `LocateChallenge`, the player taps, the verdict lands. Activity does not. One Zug
runs up to three questions in sequence over the *same* subject:

1. **Raten** — perform the term (Beschreiben / Zeichnen / Pantomime) until the team
   guesses it. Human-verified.
2. **Verorten** — point at the Fach it lives in, on the chosen Vehicle. Auto-verified.
3. **Holen** — physically fetch the item, against a clock. Human-verified.

Points accumulate per cleared Stufe, and a failed Stufe ends the Zug while keeping
what was already banked. `CONTEXT.md` had already scoped this shape into the roadmap
("multi-step challenges … points per step") with a constraint attached: implement it
as **Session drivers + scoring, never in the Challenge engine** (ADR-0004).

That constraint settles the scoring but not the composition. Two readings were open:

1. **A composite `Challenge` in the engine** — `ActivityChallenge { perform, locate,
   fetch }`, generated as one object. Reads tidily and puts the whole Zug in one
   place, but bakes a specific game's rules into the layer that is supposed to be
   game-agnostic: the engine would have to know that Stufe 2 is optional, that
   failing Stufe 1 makes Stufe 2 unreachable, and that Fetch has no verdict. Every
   future composite game would add another shape beside it.
2. **Atomic Challenges chained by the driver** — chosen.

A third question fell out of the same design: `LocateChallenge` has a computable
verdict (`isCorrect`), and Perform and Fetch do not. A moderator calls those.

## Decision
**Challenges stay atomic and pure. The Session driver composes them.**

- `core/challenge/perform.ts` adds one new atomic type — `PerformChallenge` +
  `generatePerform` + `PerformPicker` — beside the existing `LocateChallenge`.
  It generates; it does not sequence.
- `core/activity/activity-game.ts` owns the chain: which Stufen are enabled, what
  each one banks, that a failure ends the Zug, board movement, turn order, and the
  win condition. It calls `generateLocate()` **unchanged** for Stufe 2.
- **Human-verified challenges carry no verdict.** A `Challenge` may be unverifiable
  in code; the driver records the moderator's call (`resolvePerform(guessed)`,
  `resolveFetch(fetched)`) exactly as it records a computed one. ADR-0004's
  `Challenge` shape is read as "verdict where a verdict exists".
- ADR-0004 describes the Session driver as the **per-mode** layer. Refine that to
  **per game loop**: mode (In-Person / Learning / Online-PvP) is one axis, the game
  is another. Fach-Finder and Activity are both In-Person and have separate drivers.
- The rules core is a **plain class** with constructor-injected dependencies, wrapped
  by a thin Angular store that owns DI and the clocks. Composition is where the
  complexity moved, so composition is what has to be cheap to test.

## Consequences
- **+** The engine stays reusable: Stufe 2 is the shipped Locate generator, byte for
  byte. A future composite game chains the same atoms in a different order without
  touching layer 2.
- **+** Scoring, optional Stufen and the strict-chain rule are all in one testable
  file. `ActivityGame` is covered without TestBed; the timers, the one thing that
  needs faked time, sit outside it in the store and carry no rules.
- **+** Online-PvP can later replay the same chain over a networked driver — the
  chain is driver code, which is the layer that is *supposed* to differ per mode.
- **−** Two drivers now interpret "a round", and they share nothing but the engine.
  Accepted: `InPersonSessionStore` is a flat queue with no teams, turns or board, and
  generalising the two into one abstraction before a third exists would be guesswork.
- **−** The moderator is now part of the correctness path for two of three Stufen.
  Unavoidable — no app can see whether someone mimed well or carried a Motorsäge
  across the bay — but it means Activity cannot become a solo self-paced game
  without dropping those Stufen.
