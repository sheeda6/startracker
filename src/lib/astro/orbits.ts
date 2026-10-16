/**
 * Orbit trajectory calculation helper for sky map rendering.
 *
 * Samples positional points along an object's orbital sky path over time offsets
 * to generate smooth 2D/3D trajectory arcs across the celestial sphere.
 *
 * Designed to render orbits & daily paths exclusively for the currently selected object
 * (solar system body or star).
 */

import { planetPositions, sunPosition, moonPosition } from "./solarSystem";
import { computeAsteroidPositions } from "@/data/asteroids";
import { computeCometPositions } from "@/data/comets";
import { computeSatellitePositions } from "@/data/satellites";
import { STARS_BY_HIP } from "@/data/stars";

export interface OrbitPoint {
  ra: number;  // radians
  dec: number; // radians
  alt?: number; // radians (topocentric observed altitude for near-Earth satellites)
  az?: number;  // radians (topocentric observed azimuth for near-Earth satellites)
}

export interface OrbitTrack {
  id: string;
  name: string;
  color: string;
  points: OrbitPoint[];
}

/**
 * Generate orbit track specifically for the currently selected object.
 * If no object is selected, returns an empty array.
 */
export function getOrbitTracks(
  date: Date,
  latDeg: number,
  lonDeg: number,
  elevationM: number,
  selectedBodyId?: string | null,
  selectedStarHip?: number | null
): OrbitTrack[] {
  if (!selectedBodyId && !selectedStarHip) return [];

  const tracks: OrbitTrack[] = [];
  const baseTime = date.getTime();

  // 0. Selected Star (Diurnal 24-hour daily path across the sky)
  if (selectedStarHip != null) {
    const star = STARS_BY_HIP.get(selectedStarHip);
    if (star) {
      const points: OrbitPoint[] = [];
      const steps = 72;
      for (let i = 0; i <= steps; i++) {
        const ra = (i / steps) * 2 * Math.PI;
        points.push({ ra, dec: star.dec });
      }
      return [{
        id: `star_${star.hip}`,
        name: `${star.name || star.bayer || 'HIP ' + star.hip} Daily Path`,
        color: "#fbbf24",
        points,
      }];
    }
  }

  if (!selectedBodyId) return [];
  const targetId = selectedBodyId.toLowerCase();

  // 1. Planets — orbital periods (days) for full-path coverage
  // Using sidereal periods so we sample the complete ecliptic arc.
  const planetConfig: Record<string, { color: string; periodDays: number }> = {
    Mercury: { color: "#b5b5b5", periodDays: 88 },
    Venus:   { color: "#f5e6c8", periodDays: 225 },
    Mars:    { color: "#e07b4a", periodDays: 687 },
    Jupiter: { color: "#e8c89a", periodDays: 1461 },  // ~4 years — full path still visible
    Saturn:  { color: "#dcc39a", periodDays: 1825 },  // ~5 years — sample enough of the ring
  };

  for (const [pName, cfg] of Object.entries(planetConfig)) {
    const id = `planet_${pName.toLowerCase()}`;
    if (targetId === id) {
      const points: OrbitPoint[] = [];
      // 90 steps spread over the full orbital period → smooth closed curve
      const numSteps = 90;
      const stepMs = (cfg.periodDays * 24 * 3600 * 1000) / numSteps;
      // Start half a period before current time so the current position sits near the middle
      const startMs = baseTime - (cfg.periodDays / 2) * 24 * 3600 * 1000;
      for (let i = 0; i <= numSteps; i++) {
        const t = new Date(startMs + i * stepMs);
        const planets = planetPositions(t);
        const target = planets.find((p) => p.name === pName);
        if (target) {
          points.push({ ra: target.ra, dec: target.dec });
        }
      }
      if (points.length > 1) {
        tracks.push({
          id,
          name: `${pName} Orbit`,
          color: cfg.color,
          points,
        });
      }
      return tracks;
    }
  }


  // 2. Moon
  if (targetId === "moon") {
    const moonPoints: OrbitPoint[] = [];
    for (let i = -12; i <= 12; i++) {
      const t = new Date(baseTime + i * 3600 * 1000);
      const m = moonPosition(t);
      moonPoints.push({ ra: m.ra, dec: m.dec });
    }
    if (moonPoints.length > 1) {
      tracks.push({
        id: "moon",
        name: "Moon Orbit",
        color: "#cbd5e1",
        points: moonPoints,
      });
    }
    return tracks;
  }

  // 3. Sun
  if (targetId === "sun") {
    const sunPoints: OrbitPoint[] = [];
    for (let i = -15; i <= 15; i += 2) {
      const t = new Date(baseTime + i * 24 * 3600 * 1000);
      const s = sunPosition(t);
      sunPoints.push({ ra: s.ra, dec: s.dec });
    }
    if (sunPoints.length > 1) {
      tracks.push({
        id: "sun",
        name: "Sun Path",
        color: "#fde047",
        points: sunPoints,
      });
    }
    return tracks;
  }

  // 4. Asteroids
  if (targetId.startsWith("asteroid_")) {
    const asteroidsSample = computeAsteroidPositions(date);
    for (const ast of asteroidsSample) {
      const id = `asteroid_${ast.name.toLowerCase()}`;
      if (targetId === id) {
        const points: OrbitPoint[] = [];
        for (let i = -10; i <= 10; i += 2) {
          const t = new Date(baseTime + i * 24 * 3600 * 1000);
          const astList = computeAsteroidPositions(t);
          const found = astList.find((a) => a.designation === ast.designation);
          if (found) points.push({ ra: found.ra, dec: found.dec });
        }
        if (points.length > 1) {
          tracks.push({
            id,
            name: `${ast.name} Orbit`,
            color: ast.color || "#a0aab4",
            points,
          });
        }
        return tracks;
      }
    }
  }

  // 5. Comets
  if (targetId.startsWith("comet_")) {
    const cometsSample = computeCometPositions(date);
    for (const c of cometsSample) {
      const id = `comet_${c.id.toLowerCase()}`;
      if (targetId === id) {
        const points: OrbitPoint[] = [];
        for (let i = -15; i <= 15; i += 3) {
          const t = new Date(baseTime + i * 24 * 3600 * 1000);
          const cList = computeCometPositions(t);
          const found = cList.find((item) => item.id === c.id);
          if (found) points.push({ ra: found.ra, dec: found.dec });
        }
        if (points.length > 1) {
          tracks.push({
            id,
            name: `${c.name} Orbit`,
            color: c.color || "#38bdf8",
            points,
          });
        }
        return tracks;
      }
    }
  }

  // 6. Satellites
  if (targetId.startsWith("satellite_")) {
    const targetNorm = targetId.toLowerCase();
    const satSample = computeSatellitePositions(date, latDeg, lonDeg, elevationM);
    for (const sat of satSample) {
      const id = `satellite_${sat.id.toLowerCase()}`;
      if (targetNorm === id) {
        const points: OrbitPoint[] = [];
        // Orbit period is ~90 minutes. Sample from -45 to +45 minutes in 1-minute increments:
        for (let i = -45; i <= 45; i += 1) {
          const t = new Date(baseTime + i * 60 * 1000);
          const satList = computeSatellitePositions(t, latDeg, lonDeg, elevationM);
          const found = satList.find((item) => item.id.toLowerCase() === sat.id.toLowerCase());
          if (found) {
            points.push({
              ra: found.ra,
              dec: found.dec,
              alt: (found.altDeg * Math.PI) / 180,
              az: (found.azDeg * Math.PI) / 180,
            });
          }
        }
        if (points.length > 1) {
          tracks.push({
            id,
            name: `${sat.name} Orbit`,
            color: sat.color || "#38bdf8",
            points,
          });
        }
        return tracks;
      }
    }
  }

  return tracks;
}
