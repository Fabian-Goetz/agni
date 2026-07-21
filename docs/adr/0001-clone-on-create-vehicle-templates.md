# ADR-0001: Clone-on-create for vehicle templates (no live inheritance)

## Status
Accepted

## Context
Vehicles come in DIN-standardized types (LF 20, HLF 20, …) with a normative
loadout, but real trucks of a given Wehr deviate from the norm. Admins need to
configure specific real trucks without retyping a full DIN loadout each time.

Three models were considered:
1. **DIN type only (normative)** — one canonical build per type. Rejected: loses
   per-Wehr reality and local flavor.
2. **Live template + instance inheritance** — instances stay linked to a type
   template; overrides layer on top; template edits propagate. Rejected for v1:
   forces override-resolution logic on every read, a template-drift policy
   (orphaned/shadowed items when templates change), and instance-context on all
   scoring. High complexity for a learning game.
3. **Clone-on-create** — chosen.

## Decision
A **Seed Template** (DIN loadout per Vehicle Type) is used **only** to pre-fill a
new Vehicle instance at creation time. The loadout is copied into the instance,
which is thereafter fully independent and self-contained. Editing a seed template
does **not** affect existing instances. There is no override layer and no live
inheritance.

## Consequences
- **+** No merge/override resolution; every instance read is a direct read.
- **+** No template-drift policy needed; instances never change under an admin.
- **+** Scoring always operates on a concrete instance's own loadout.
- **−** Fixing a DIN error in a template does not propagate; each affected
  instance must be re-edited (acceptable at this scale).
- Seed templates may themselves be authored/edited by admins, but function purely
  as starting points, not as a source of truth for instances.

## Amendment (grilling, later in session)
Refined during design: the seed is **rich DIN content shipped in v1**, not an
optional/blank starter. Compartment **layout is a Vehicle Type property** (fixed,
DIN, not author-editable in v1); only the **loadout (Placements)** is cloned into
the instance and edited. Clone-on-create still governs the loadout: an instance
copies the type's default DIN placements at creation and diverges independently.

