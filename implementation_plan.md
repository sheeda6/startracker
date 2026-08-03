# Feature Plan: Sun/Moon Click, Asteroids, DSOs, Light Pollution, Weather & Visibility

## Overview

Five major features added to the StarTracker app. Each is isolated to its own component/data layer to keep changes surgical.

---

## Feature 1 — Sun & Moon Clickable/Observable

**What**: The Sun and Moon are already _drawn_ on the canvas (`drawSolarSystem`). This feature makes them **selectable** (click → detail panel), just like stars.

### Changes

#### [MODIFY] [store.ts](file:///home/bat22/sta/src/lib/store.ts)
- Add `selectedBody: "sun" | "moon" | null` state field + setter alongside `selectedHip`.

#### [MODIFY] [SkyMap.tsx](file:///home/bat22/sta/src/components/startracker/SkyMap.tsx)
- Track rendered positions of Sun & Moon (`renderedBodiesRef`).
- On canvas click: hit-test Sun and Moon positions before falling through to stars.
- On hover: change cursor to pointer when near Sun/Moon.

#### [NEW] [SolarBodyDetails.tsx](file:///home/bat22/sta/src/components/startracker/SolarBodyDetails.tsx)
- Panel showing details for the selected body (Sun or Moon).
- **Sun**: current altitude/azimuth, rise/transit/set times, angular diameter, distance (AU), solar noon time.
- **Moon**: altitude/az, phase name + icon, illumination %, distance (km), rise/set, angular diameter, next full/new moon.

#### [MODIFY] [page.tsx](file:///home/bat22/sta/src/app/page.tsx)
- Show `SolarBodyDetails` in the right panel when `selectedBody != null` (instead of `StarDetails`).

---

## Feature 2 — Asteroids + Extended Deep-Sky Objects (DSOs)

**What**: Add a curated catalog of ~30 notable asteroids + expand the deep-sky catalog with NGC objects (adding ~50 well-known galaxies, nebulae, clusters).

### Changes

#### [NEW] [asteroids.ts](file:///home/bat22/sta/src/data/asteroids.ts)
- Static catalog of ~25 bright/notable asteroids with hardcoded J2000 orbital elements (a, e, i, Ω, ω, M₀).
- Include function `computeAsteroidPosition(asteroid, date)` using simple two-body Keplerian mechanics (same pattern as planet code).
- Fields: name, designation, type (minor-planet/comet), orbital elements, visual magnitude estimate, color.

#### [NEW] [ngc.ts](file:///home/bat22/sta/src/data/ngc.ts)
- ~60 famous NGC/IC objects: Horsehead Nebula, Pillars of Creation, Virgo Cluster key objects, Perseus Double Cluster, etc.
- Same `MessierObject`-like interface, extended with `catalog: "NGC" | "IC"` and `number` fields.
- Types: galaxy, nebula, planetary, open, globular, supernova.

#### [MODIFY] [store.ts](file:///home/bat22/sta/src/lib/store.ts)
- Add `asteroids: boolean` and `ngcObjects: boolean` to `ViewLayers`.

#### [MODIFY] [SkyMap.tsx](file:///home/bat22/sta/src/components/startracker/SkyMap.tsx)
- Add `drawAsteroids()` and `drawNGC()` helper functions — same glyph style as Messier but distinct icons.
- Asteroids: rendered as small diamond (◇) with faint trail tick.
- NGC: rendered as Messier-style symbols using the existing `MESSIER_TYPE_COLORS` palette.

#### [MODIFY] [LayersPanel.tsx](file:///home/bat22/sta/src/components/startracker/LayersPanel.tsx)
- Add toggles for "Asteroids" and "NGC/IC Objects".

---

## Feature 3 — Light Pollution Map

**What**: Fetch the Bortle sky quality for the observer's location from the [Light Pollution Map API](https://www.lightpollutionmap.info/) (free, CORS-friendly) and display it visually on the app. Also applies a sky brightness overlay on the canvas.

**API used**: `https://www.lightpollutionmap.info/QueryRaster/?ql=wa_2015&qt=point&qd=<lon>,<lat>` — returns SQM (Sky Quality Meter) value in mag/arcsec².

### Changes

#### [NEW] [useLightPollution.ts](file:///home/bat22/sta/src/hooks/useLightPollution.ts)
- Custom hook that fetches the SQM value for `observer.latDeg / lonDeg`.
- Caches result in localStorage (30-day TTL).
- Converts SQM → Bortle class (1–9) using standard table.
- Returns `{ sqm, bortle, label, color, loading, error }`.

#### [NEW] [LightPollutionPanel.tsx](file:///home/bat22/sta/src/components/startracker/LightPollutionPanel.tsx)
- Full panel UI:
  - Bortle scale gradient bar (1=black to 9=inner city white).
  - Current position marker on the bar.
  - Bortle class label + description.
  - Limiting magnitude estimate (naked eye).
  - Recommendation text ("Ideal for deep-sky" / "Binoculars recommended" etc.).

#### [MODIFY] [SkyMap.tsx](file:///home/bat22/sta/src/components/startracker/SkyMap.tsx)
- Apply a semi-transparent radial sky-glow overlay proportional to light pollution severity (Bortle 1 = none, Bortle 9 = heavy amber/white glow from horizon).

#### [MODIFY] [page.tsx](file:///home/bat22/sta/src/app/page.tsx)
- Add "Sky Quality" toolbar button (Cloud icon) → popover with `LightPollutionPanel`.

---

## Feature 4 — Real-Time Weather

**What**: Fetch real-time weather for the observer's location from the **Open-Meteo API** (completely free, no API key needed). Display current cloud cover, humidity, visibility, temperature, wind, and dew point.

**API**: `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m,relative_humidity_2m,cloud_cover,visibility,wind_speed_10m,dew_point_2m`

### Changes

#### [NEW] [useWeather.ts](file:///home/bat22/sta/src/hooks/useWeather.ts)
- Fetches weather from Open-Meteo on mount + when observer changes.
- Refreshes every 15 minutes.
- Returns `{ temp, humidity, cloudCover, visibility, windSpeed, dewPoint, loading, error }`.

#### [NEW] [WeatherPanel.tsx](file:///home/bat22/sta/src/components/startracker/WeatherPanel.tsx)
- Weather dashboard UI:
  - Cloud cover % with icon and bar (clear/partly/overcast).
  - Temperature + dew point (calculates if optics might dew up).
  - Visibility (km).
  - Humidity %.
  - Wind speed.
  - Atmospheric transparency estimate (from humidity + cloud cover).
  - **Seeing estimate** (crude: based on wind speed + humidity).

#### [MODIFY] [page.tsx](file:///home/bat22/sta/src/app/page.tsx)
- Add "Weather" toolbar button (CloudSun icon) → popover with `WeatherPanel`.

---

## Feature 5 — Visibility Classifier (Weather + Light Pollution)

**What**: A smart panel that combines weather conditions + light pollution data to tell the user what objects are currently visible with naked eye, binoculars, or telescope — and which are not.

### Logic

The limiting magnitude for naked eye observation is computed as:

```
lm_base = 7.93 - 5 * log10(1 + 10^(4.316 - SQM/5))   // from Bortle/SQM
lm_adjusted = lm_base - cloud_penalty - humidity_penalty
```

Where:
- `cloud_penalty = cloudCover / 100 * 3.0` (0–3 mag loss)
- `humidity_penalty = max(0, (humidity - 70) / 30 * 1.0)` (0–1 mag loss)

Then each class of objects is tagged:
- **Naked eye**: limiting_mag ≥ object.magnitude
- **Binoculars** (+2 mag boost): limiting_mag + 2 ≥ object.magnitude
- **Telescope** (+5 mag boost): limiting_mag + 5 ≥ object.magnitude

### Changes

#### [NEW] [VisibilityPanel.tsx](file:///home/bat22/sta/src/components/startracker/VisibilityPanel.tsx)
- Combines `useLightPollution` + `useWeather` hooks.
- Shows:
  - Current limiting magnitude (with breakdown).
  - Tonight's sky quality score (A/B/C/D/F style).
  - List of "What you can see tonight":
    - Naked eye objects above horizon (bright stars, planets, Pleiades, M45, M31 etc.)
    - Binocular objects (globular clusters, bright nebulae)
    - Telescope objects (faint galaxies, planetary nebulae)
  - Warning section: objects that are currently **not** visible due to light pollution or clouds.
  - Best window tonight (when cloud cover is lowest + moon below horizon).

#### [MODIFY] [page.tsx](file:///home/bat22/sta/src/app/page.tsx)
- Add "Tonight's Visibility" toolbar button (Eye icon) → popover with `VisibilityPanel`.

#### [MODIFY] [SkySummaryPanel.tsx](file:///home/bat22/sta/src/components/startracker/SkySummaryPanel.tsx)
- Add a compact "sky quality badge" at the top (e.g., "Bortle 4 · 74% cloud" → "Fair seeing").

---

## Open Questions

> [!IMPORTANT]
> **Light Pollution API**: The `lightpollutionmap.info` QueryRaster endpoint may have CORS restrictions. If so, I'll fall back to computing Bortle class from a local SQM estimation table based on the user's geographic region (rural/suburban/urban classification by population density via Open-Meteo geocoding). No external API key needed.

> [!NOTE]
> **Asteroid positions**: Computing asteroid positions client-side using Keplerian elements is accurate to ~0.5° which is fine for visual plotting. For exact positions (e.g., Ceres, Pallas, Vesta, Juno) the elements are well-known. The catalog will include ~20–25 objects.

> [!NOTE]
> **Open-Meteo**: Completely free, no API key, no rate limits for reasonable use. This is the ideal choice.

---

## Verification Plan

### Automated Tests
- `bun run lint` — check for type errors in all new files.
- `curl http://localhost:3001` — server health check.

### Manual Verification
1. Click the Sun on the sky map → Solar body details panel opens.
2. Click the Moon → Moon phase + rise/set details shown.
3. Enable "Asteroids" layer → asteroid glyphs appear on sky map.
4. Enable "NGC/IC" layer → additional deep-sky objects appear.
5. Open Weather panel → real cloud/temp/humidity data loads for current location.
6. Open Sky Quality panel → Bortle class shown with gradient.
7. Open Visibility panel → object list divided by naked eye / binoculars / telescope.
8. Change observer location → weather + light pollution data refreshes.
