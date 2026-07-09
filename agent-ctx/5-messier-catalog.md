# Task 5 — Messier catalog + SkyMap rendering

Agent: subagent (Messier catalog builder)
Task ID: 5
Parent worklog: `/home/z/my-project/worklog.md`

## What I did

1. **Created `src/data/messier.ts`** — `MessierObject` interface (number, name, type, ra, dec, magnitude, size, distance, constellation), `MessierType` union (galaxy | nebula | planetary | open | globular | supernova), the `MESSIER` array of 30 famous objects (M1, M3, M5, M8, M10, M11, M12, M13, M15, M16, M17, M20, M22, M27, M31, M33, M42, M43, M44, M45, M51, M56, M57, M71, M78, M81, M82, M97, M101, M104), a `MESSIER_BY_NUMBER` lookup map, and a `MESSIER_TYPE_COLORS` palette table (amber for galaxy, green for nebula, cyan for planetary, amber-200 for open, orange for globular, red for supernova). RA/Dec are J2000 mean equator/equinox from SIMBAD, converted to radians via inline `* Math.PI/12` and `* Math.PI/180` using module-level `H`/`D` constants.

2. **Updated `src/lib/store.ts`** — added `messier: boolean` to the `ViewLayers` interface and `messier: true` to the default `layers` object (so the layer is on by default).

3. **Updated `src/components/startracker/LayersPanel.tsx`** — imported `Telescope` from `lucide-react` and added `{ key: "messier", label: "Messier objects", icon: Telescope }` immediately after the `solarSystem` entry in `LAYER_DEFS`.

4. **Updated `src/components/startracker/SkyMap.tsx`**:
   - Imported `MESSIER`, `MESSIER_TYPE_COLORS`, and the `MessierObject` type from `@/data/messier`.
   - Added a new `// 9c. Messier deep-sky objects` block right after `// 9b. Solar system bodies`, calling `drawMessier(...)` when `layers.messier` is true.
   - Implemented the `drawMessier(ctx, cx, cy, radius, frame, rotation, refraction, dpr, _date, latRad)` function — signature matches `drawSolarSystem` (the `date` param is unused for Messier because positions are J2000-fixed and only the time-varying frame context is needed; renamed to `_date` to make that explicit). For each object: transforms RA/Dec via `transformStar`, applies refraction when enabled, skips below-horizon (`alt <= 0`), projects via `projectStereographic`, computes a size-scaled glyph (clamped 3–14 dpr px from the catalog `size` arcminutes), dispatches to `drawMessierGlyph`, and writes a small `M{number}` label color-coded by type.
   - Implemented `drawMessierGlyph(ctx, m, x, y, size, dpr)` with type-specific rendering:
     - **galaxy** → faint amber tilted ellipse (`ctx.ellipse` with `m.number`-derived rotation) + faint core glow.
     - **nebula** → dashed green circle with very faint fill.
     - **planetary** → cyan ring (filled annulus with dark inner hole punched out).
     - **open cluster** → 7 tiny yellow dots arranged in a ring + central dot.
     - **globular** → orange fuzzy circle via radial gradient + thin outer ring.
     - **supernova** → red radial-gradient dot with cross spikes.

## Verification

- `bun run lint` → 0 errors, 1 pre-existing warning in `StarTable.tsx` (the TanStack Table `incompatible-library` note, explicitly out of scope). No new errors or warnings in any of my files.
- Dev server (`dev.log`) recompiles cleanly and `GET / 200` after the changes — no SSR/runtime errors.
- SkyMap render flow unchanged: Messier objects draw between the solar-system layer (9b) and the hover/select highlight rings (10/11), so they sit beneath the selection crosshair and above constellation lines.

## Files touched

- `src/data/messier.ts` (new)
- `src/lib/store.ts` (+2 lines: `messier` field + default)
- `src/components/startracker/LayersPanel.tsx` (+2 lines: import + LAYER_DEFS entry)
- `src/components/startracker/SkyMap.tsx` (+1 import line, +5-line render block, +drawMessier/drawMessierGlyph helpers)
