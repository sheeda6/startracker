import {
  twoline2satrec,
  propagate,
  gstime,
  eciToEcf,
  ecfToLookAngles,
  degreesToRadians,
  radiansToDegrees
} from 'satellite.js';
import visualSatellitesData from './visual_satellites.json';

export interface SatelliteInfo {
  id: string; // NORAD catalog ID as string
  name: string;
  tle1: string;
  tle2: string;
  color: string;
}

export const DEFAULT_SATELLITES: SatelliteInfo[] = visualSatellitesData as SatelliteInfo[];

let activeSatellites: SatelliteInfo[] = DEFAULT_SATELLITES.map((s) => ({ ...s }));

type SatelliteListener = () => void;
const listeners = new Set<SatelliteListener>();

export function subscribeSatellites(fn: SatelliteListener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getActiveSatellites(): SatelliteInfo[] {
  return activeSatellites;
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error("Satellite listener error:", e);
    }
  });
}

function getSatelliteColor(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes("ISS")) return "#60a5fa"; // blue
  if (upper.includes("CSS") || upper.includes("TIAN")) return "#f472b6"; // pink
  if (upper.includes("HST") || upper.includes("HUBBLE")) return "#a78bfa"; // purple
  if (upper.includes("TERRA") || upper.includes("AQUA") || upper.includes("ENVISAT") || upper.includes("SEASAT")) return "#34d399"; // emerald
  if (upper.includes("COSMOS")) return "#fb923c"; // orange
  if (upper.includes("SPACEMOBILE") || upper.includes("STARLINK")) return "#38bdf8"; // sky
  if (upper.includes("XRISM") || upper.includes("OAO")) return "#c084fc"; // violet
  if (upper.includes("R/B") || upper.includes("DEB")) return "#64748b"; // muted slate for rocket bodies
  return "#94a3b8";
}

export async function fetchLiveTLEs() {
  try {
    // Fetch visual satellites group (150+ brightest visual satellites including ISS, CSS, HST, Earth observation)
    const res = await fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle");
    if (!res.ok) return;
    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const parsed: SatelliteInfo[] = [];
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        const name = lines[i];
        const tle1 = lines[i + 1];
        const tle2 = lines[i + 2];
        const id = tle1.substring(2, 7).trim();
        parsed.push({
          id,
          name,
          tle1,
          tle2,
          color: getSatelliteColor(name),
        });
      }
    }

    if (parsed.length > 0) {
      activeSatellites = parsed;
      notifyListeners();
    }
  } catch (e) {
    console.warn("Failed to fetch live TLEs:", e);
  }
}

export interface SatellitePosition {
  id: string;
  name: string;
  ra: number;
  dec: number;
  altDeg: number;
  azDeg: number;
  rangeKm: number;
  color: string;
}

export function computeSatellitePositions(
  date: Date,
  latDeg: number,
  lonDeg: number,
  elevationM: number
): SatellitePosition[] {
  const results: SatellitePosition[] = [];

  const observerGd = {
    latitude: degreesToRadians(latDeg),
    longitude: degreesToRadians(lonDeg),
    height: elevationM / 1000.0,
  };

  const gmst = gstime(date);

  for (const sat of activeSatellites) {
    try {
      const satrec = twoline2satrec(sat.tle1, sat.tle2);
      const positionAndVelocity = propagate(satrec, date);

      if (positionAndVelocity && positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
        const positionEci = positionAndVelocity.position as { x: number; y: number; z: number };
        const positionEcf = eciToEcf(positionEci, gmst);
        const lookAngles = ecfToLookAngles(observerGd, positionEcf);

        const ra = Math.atan2(positionEci.y, positionEci.x);
        const dec = Math.atan2(
          positionEci.z,
          Math.sqrt(positionEci.x * positionEci.x + positionEci.y * positionEci.y)
        );

        results.push({
          id: sat.id,
          name: sat.name,
          ra: ((ra % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
          dec,
          altDeg: radiansToDegrees(lookAngles.elevation),
          azDeg: radiansToDegrees(lookAngles.azimuth),
          rangeKm: lookAngles.rangeSat,
          color: sat.color,
        });
      }
    } catch {
      // Ignore calculation errors for individual anomalous/decayed satellites
    }
  }

  return results;
}
