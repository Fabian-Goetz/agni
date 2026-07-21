# ADR-0003: Generic schematic rendering for vehicles (no per-truck artwork)

## Status
Accepted

## Context
The "Locate" round mode shows a vehicle and asks the player to tap the correct
compartment. The sibling `feuerwehr-activity` hand-drew a single SVG (`LfSketch`)
for one specific truck. This does not scale: compartments here are per-instance
editable data (ADR-0001) and the fleet spans structurally different types
(LF, HLF, TLF, DLK, MTF, RW…). Hand-authoring an SVG per truck is infeasible.

Options considered:
1. **Generic schematic from layout data** — chosen.
2. **Photo + hotspots** — admin uploads a photo per vehicle and maps tappable
   regions. Most immersive, but heavy authoring, image hosting, and awkward
   responsive behavior. Deferred as a possible later enhancement.
3. **Plain list/buttons** — trivial but loses the spatial "where on the truck"
   feel that is the point of the mode. Rejected as the primary rendering.

## Decision
Fix the renderer **contract**, not the artwork: a schematic is a set of
**tappable zones addressed by compartment id**. A Vehicle Type supplies its zones
one of two ways, interchangeably:
- **(a) Hand-crafted SVG** (e.g. the reused `LfSketch`) whose regions map to
  compartment ids — used when a type deserves a bespoke, high-fidelity sketch.
- **(b) Auto-generated metadata boxes** from each compartment's `side` + `order`
  — the zero-artwork fallback for types not yet hand-drawn.

The Challenge engine and Session driver only ever see zone ids; they are blind to
which source produced them (upholds ADR-0004 layering).

**v1:** ships one Vehicle Type — the author's LF — rendered with the hand-crafted
`LfSketch` reused from the sibling `feuerwehr-activity`. The metadata-box path is
built as the documented fallback for future types.

## Consequences
- **+** High fidelity where it matters (the LF) without committing to draw every
  future type; generic boxes cover the long tail.
- **+** Uniform renderer contract keeps modes and the engine decoupled from
  rendering.
- **+** Layout edits (future) reflect immediately for metadata-driven types.
- **−** Hand-crafted types need an SVG whose regions are kept in sync with the
  type's compartment ids.
- Photo+hotspot mode remains a compatible future add-on over the same zone
  contract.
