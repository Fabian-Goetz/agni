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

**v1:** ships both paths. The author's LF keeps the hand-crafted `LfSketch`
reused from the sibling `feuerwehr-activity`; every other type with a compartment
layout — HLF 20, TLF 3000, TSF-W — is drawn by the metadata renderer
(`MetadataSketch`), a top-down CSS grid derived from `side` + `order`. Screens
embed neither directly: `VehicleSchematic` dispatches on the type's
`hasCustomSketch`, so a truck can be promoted to bespoke artwork later without
touching a caller.

`order` is a **front→rear rank within a side**, not a global sequence — the
renderer lays each flank out by it, so encoding source order draws the truck
backwards. The seed generator derives it from the DIN Geräteraum number
(G1/G2 front … G5/G6 rear).

Types without any compartments — the Fahrzeugkatalog master-data stubs — have
nothing to draw and stay gated (`LibraryService.typeHasSchematic`): creatable as
Vehicles, but not loadable or playable until a layout is authored.

## Consequences
- **+** High fidelity where it matters (the LF) without committing to draw every
  future type; generic boxes cover the long tail.
- **+** Uniform renderer contract keeps modes and the engine decoupled from
  rendering.
- **+** Layout edits (future) reflect immediately for metadata-driven types.
- **−** Hand-crafted types need an SVG whose regions are kept in sync with the
  type's compartment ids.
- **−** Generic boxes are schematic, not photographic: they convey *which side,
  how far back*, not what the Geräteraum looks like. Acceptable for drilling the
  DIN numbering; a type whose spatial layout is the teaching point (DLK, RW)
  still earns bespoke artwork.
- Photo+hotspot mode remains a compatible future add-on over the same zone
  contract.
