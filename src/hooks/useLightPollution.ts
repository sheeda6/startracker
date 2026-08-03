"use client";

/**
 * useLightPollution — fetches the Bortle sky quality for the observer's location.
 *
 * Strategy (in order):
 *  1. Try the lightpollutionmap.info QueryRaster API (returns SQM value).
 *  2. If blocked (CORS/error), fall back to a local SQM estimation based on
 *     the observer's geographic coordinates using a population-density heuristic.
 *
 * The SQM → Bortle conversion uses the standard Schaefer (2001) table.
 * Results are cached in localStorage with a 7-day TTL.
 */

import { useEffect, useState } from "react";
import type { ObserverLocation } from "@/lib/store";

export interface LightPollutionData {
  sqm: number;          // mag/arcsec² (higher = darker)
  bortle: number;       // 1 (darkest) to 9 (inner city)
  label: string;        // "Class 1 — Truly dark sky"
  description: string;
  limitingMagnitude: number;  // naked-eye limiting magnitude
  color: string;        // hex color for Bortle scale visualization
  loading: boolean;
  error: string | null;
  source: "api" | "estimate" | null;
}

/** Convert SQM value to Bortle class. */
export function sqmToBortle(sqm: number): number {
  if (sqm >= 21.99) return 1;
  if (sqm >= 21.89) return 2;
  if (sqm >= 21.69) return 3;
  if (sqm >= 21.25) return 4;
  if (sqm >= 20.49) return 5;
  if (sqm >= 19.50) return 6;
  if (sqm >= 18.94) return 7;
  if (sqm >= 18.38) return 8;
  return 9;
}

/** Estimate limiting naked-eye magnitude from SQM. */
function sqmToLimitingMagnitude(sqm: number): number {
  // Approximation: lm ≈ sqm - 1.5 (Naked Eye)
  return Math.max(2.0, Math.min(7.5, sqm - 1.5));
}

const BORTLE_INFO: Record<number, { label: string; description: string; color: string }> = {
  1: { label: "Class 1 — Zodiacal light", description: "Truly dark sky. Gegenschein visible. Zodiacal band spans the sky.", color: "#0a0a2e" },
  2: { label: "Class 2 — Truly dark sky", description: "M33 direct vision. Milky Way structure distinct. Limiting mag ~7.1+.", color: "#0d1040" },
  3: { label: "Class 3 — Rural sky",      description: "Rural sky. Some light pollution on horizon. Limiting mag ~6.6+.", color: "#1a1a60" },
  4: { label: "Class 4 — Rural/suburban", description: "Rural/suburban transition. Milky Way visible but washed near horizon.", color: "#2d2d80" },
  5: { label: "Class 5 — Suburban sky",   description: "Suburban sky. Milky Way faint. Light pollution glow on horizon.", color: "#4a3a90" },
  6: { label: "Class 6 — Bright suburban",description: "Bright suburban sky. Milky Way barely visible. Limiting mag ~5.1.", color: "#7a4a80" },
  7: { label: "Class 7 — Suburban/urban", description: "Suburban/urban transition. Sky is grey, not black. Limiting mag ~4.5.", color: "#a05050" },
  8: { label: "Class 8 — City sky",       description: "City sky. M31 hard to find. Only bright clusters visible. Limiting mag ~4.0.", color: "#c06030" },
  9: { label: "Class 9 — Inner city",     description: "Inner city. Only stars and moon visible. Limiting mag ~3.0.", color: "#d08020" },
};

/**
 * Local fallback: estimate Bortle class from lat/lon heuristic.
 * Uses a simple geographic distance-to-city-center proxy based on known
 * light-pollution patterns. Returns SQM and Bortle class.
 */
function estimateBortleLocally(lat: number, lon: number): { sqm: number; bortle: number } {
  // Very rough heuristic based on regional light pollution data.
  // Real implementation would use a pre-downloaded tile or a lookup table.
  // We approximate based on absolute latitude and longitude bands.
  
  // Known dark-sky reserves / very remote locations
  const darkZones = [
    { lat: -29.0, lon: 70.0, r: 3, bortle: 1 },    // Cerro Pachón, Chile
    { lat: 19.82, lon: -155.47, r: 2, bortle: 1 },  // Mauna Kea
    { lat: -23.5, lon: 133.0, r: 5, bortle: 2 },    // Central Australia
    { lat: 36.0, lon: -112.0, r: 3, bortle: 2 },    // Grand Canyon
    { lat: -22.5, lon: 17.0, r: 8, bortle: 2 },     // Namib Desert
  ];
  
  // Known very bright cities
  const brightZones = [
    { lat: 40.71, lon: -74.01, r: 1.5, bortle: 9 }, // New York
    { lat: 34.05, lon: -118.24, r: 1.5, bortle: 9 },// Los Angeles
    { lat: 51.51, lon: -0.13, r: 1.5, bortle: 8 },  // London
    { lat: 35.68, lon: 139.69, r: 1.5, bortle: 9 }, // Tokyo
    { lat: 19.08, lon: 72.88, r: 1.5, bortle: 9 },  // Mumbai
    { lat: 31.23, lon: 121.47, r: 1.5, bortle: 9 }, // Shanghai
    { lat: 31.55, lon: 74.34, r: 1.0, bortle: 8 },  // Lahore
    { lat: 24.86, lon: 67.01, r: 1.0, bortle: 8 },  // Karachi
    { lat: 28.61, lon: 77.21, r: 1.0, bortle: 8 },  // New Delhi
    { lat: -33.87, lon: 151.21, r: 1.0, bortle: 7 },// Sydney
    { lat: 48.86, lon: 2.35, r: 1.0, bortle: 8 },   // Paris
    { lat: 41.90, lon: 12.50, r: 1.0, bortle: 8 },  // Rome
    { lat: 55.75, lon: 37.62, r: 1.0, bortle: 8 },  // Moscow
  ];

  const dist2D = (a: {lat:number;lon:number}, b: {lat:number;lon:number}) =>
    Math.sqrt((a.lat - b.lat) ** 2 + (a.lon - b.lon) ** 2);

  // Check dark zones
  for (const z of darkZones) {
    if (dist2D({ lat, lon }, z) < z.r) {
      const sqm = 22.0 - (z.bortle - 1) * 0.2;
      return { sqm, bortle: z.bortle };
    }
  }

  // Check bright zones
  let minDist = Infinity;
  let closestBright = { bortle: 5 };
  for (const z of brightZones) {
    const d = dist2D({ lat, lon }, z);
    if (d < minDist) { minDist = d; closestBright = z; }
    if (d < z.r) {
      const sqm = 22.0 - (z.bortle - 1) * 0.35;
      return { sqm, bortle: z.bortle };
    }
  }

  // Scale by distance from nearest bright city
  const influence = Math.max(0, 1 - minDist / 12);
  const baseBortle = closestBright.bortle;
  const bortle = Math.round(Math.max(3, Math.min(9, 3 + influence * (baseBortle - 3))));
  const sqm = 22.0 - (bortle - 1) * 0.35;
  return { sqm, bortle };
}

const CACHE_KEY = "startracker-light-pollution-v2";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  lat: number;
  lon: number;
  sqm: number;
  bortle: number;
  source: "api" | "estimate";
  ts: number;
}

function loadCache(lat: number, lon: number): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    const stale = Date.now() - entry.ts > CACHE_TTL_MS;
    const far = Math.abs(entry.lat - lat) > 0.2 || Math.abs(entry.lon - lon) > 0.2;
    if (stale || far) return null;
    return entry;
  } catch { return null; }
}

function saveCache(entry: CacheEntry) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(entry)); } catch {}
}

export function useLightPollution(observer: ObserverLocation): LightPollutionData {
  const [data, setData] = useState<Omit<LightPollutionData, "loading" | "error">>(() => {
    const b = 5;
    const info = BORTLE_INFO[b];
    return { sqm: 20.49, bortle: b, ...info, limitingMagnitude: 5.5, source: null };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { latDeg: lat, lonDeg: lon } = observer;

    async function fetch_() {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = loadCache(lat, lon);
      if (cached) {
        if (!cancelled) {
          const sqm = cached.sqm;
          const bortle = cached.bortle;
          const info = BORTLE_INFO[bortle] ?? BORTLE_INFO[5];
          setData({ sqm, bortle, ...info, limitingMagnitude: sqmToLimitingMagnitude(sqm), source: cached.source });
          setLoading(false);
        }
        return;
      }

      let sqm: number;
      let bortle: number;
      let source: "api" | "estimate" = "estimate";

      // 1. Try live API
      try {
        const url = `https://www.lightpollutionmap.info/QueryRaster/?ql=wa_2015&qt=point&qd=${lon.toFixed(4)},${lat.toFixed(4)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
          const text = await res.text();
          // Response is a plain number (SQM value) or JSON with a value field
          const parsed = parseFloat(text.trim());
          if (!isNaN(parsed) && parsed > 0) {
            sqm = parsed;
            bortle = sqmToBortle(sqm);
            source = "api";
          } else {
            throw new Error("Invalid API response");
          }
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch {
        // 2. Fall back to local estimation
        const est = estimateBortleLocally(lat, lon);
        sqm = est.sqm;
        bortle = est.bortle;
        source = "estimate";
      }

      if (cancelled) return;

      const info = BORTLE_INFO[bortle] ?? BORTLE_INFO[5];
      const limitingMagnitude = sqmToLimitingMagnitude(sqm);
      setData({ sqm, bortle, ...info, limitingMagnitude, source });
      setLoading(false);

      saveCache({ lat, lon, sqm, bortle, source, ts: Date.now() });
    }

    fetch_();
    return () => { cancelled = true; };
  }, [observer.latDeg, observer.lonDeg]);

  return { ...data, loading, error };
}
