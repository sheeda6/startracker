# Task 8-9 — TimeControls + ObserverPanel builder

## Scope
Built two React components for the StarTracker astronomy app:
- `src/components/startracker/TimeControls.tsx` — clock-mode toolbar + sidereal readouts
- `src/components/startracker/ObserverPanel.tsx` — observer location settings panel

## Files read (for context)
- `/home/z/my-project/worklog.md` — prior tasks (1-5) built astro lib, store, SkyMap, StarDetails
- `/home/z/my-project/src/lib/store.ts` — Zustand store shape (observer, currentTime, clockMode, timeSpeed, setClockMode, setTimeSpeed, tickTime, setCurrentTime, resetToNow, requestGeolocation, LOCATION_PRESETS)
- `/home/z/my-project/src/lib/astro/time.ts` — toJulianDate, gmst, gast, lst, formatHMS, formatDeg
- `/home/z/my-project/src/lib/astro/engine.ts` — buildFrame returns FrameContext with .lst/.gast/.gmst/.jd (jdUt1, deltaT)
- `/home/z/my-project/src/components/startracker/StarDetails.tsx` — style conventions (amber/sky accents, slate-950 bg, font-mono numerics)
- shadcn primitives: `select.tsx`, `button.tsx`, `input.tsx`, `utils.ts`

## Files written
1. `src/components/startracker/TimeControls.tsx` (named export `TimeControls`)
2. `src/components/startracker/ObserverPanel.tsx` (named export `ObserverPanel`)

No other files were modified.

## Key implementation notes
- Both use `"use client"` + strict TS + shadcn/ui + lucide-react.
- Frame derived via `useMemo(buildFrame({date, lat, lon, elevationM}), [...])` in both.
- TimeControls: live tz date/time (`Intl.DateTimeFormat` w/ `timeZone`), mode buttons (Play/Pause/FastForward/Rewind), speed toggles (×1/×60/×600/×3600), Now reset, datetime-local picker, LST/GMST/JD/ΔT readouts.
- ObserverPanel: GPS button w/ local loading state, preset Select, manual lat/lon/elev NumberFields, read-only timezone, cardinal-direction helper, live LST readout.
- Lint compliance: avoided `react-hooks/set-state-in-effect` and `react-hooks/refs` by using React's "adjust state during render" pattern (`if (value !== prevValue) { setPrevValue(value); ... }`) and a derived `dtOverride` for the datetime picker. No `useEffect` or `useRef` in either file.

## Lint status
- `TimeControls.tsx`: CLEAN
- `ObserverPanel.tsx`: CLEAN
- `SkyMap.tsx`: 1 pre-existing error (`react-hooks/immutability`, `render` useCallback self-reference) — from Task 1-5, outside this task's scope, intentionally NOT modified.

## Dev server
Running cleanly on port 3000 (Next.js 16.1.3 Turbopack).
