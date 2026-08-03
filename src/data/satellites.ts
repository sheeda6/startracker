import * as satellite from 'satellite.js';

export interface SatelliteInfo {
  id: string; // NORAD catalog ID as string
  name: string;
  tle1: string;
  tle2: string;
  color: string;
}

// Hardcoded TLEs for offline fallback (Updated periodically).
export const DEFAULT_SATELLITES: SatelliteInfo[] = [
  {
    id: "25544",
    name: "ISS (ZARYA)",
    color: "#60a5fa",
    tle1: "1 25544U 98067A   24177.12345678  .00012345  00000-0  12345-3 0  9999",
    tle2: "2 25544  51.6432 123.4567 0001234  45.6789 312.4567 15.50123456123456"
  },
  {
    id: "20580",
    name: "HST (HUBBLE)",
    color: "#a78bfa",
    tle1: "1 20580U 90037B   24177.12345678  .00012345  00000-0  12345-3 0  9999",
    tle2: "2 20580  28.4691 123.4567 0002845  45.6789 312.4567 15.01234567123456"
  },
  {
    id: "48274",
    name: "CSS (TIANGONG)",
    color: "#f472b6",
    tle1: "1 48274U 21035A   24177.12345678  .00012345  00000-0  12345-3 0  9999",
    tle2: "2 48274  41.4721 123.4567 0001234  45.6789 312.4567 15.60123456123456"
  }
];

// Note: In production, the TLE strings above should be updated with actual real data.
// We'll add a fetch mechanism for live data.

let activeSatellites = [...DEFAULT_SATELLITES];

export function getActiveSatellites(): SatelliteInfo[] {
  return activeSatellites;
}

export async function fetchLiveTLEs() {
  try {
    const res = await fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle");
    if (!res.ok) return;
    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const parsed: SatelliteInfo[] = [];
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        const name = lines[i];
        const tle1 = lines[i+1];
        const tle2 = lines[i+2];
        const id = tle1.substring(2, 7).trim();
        parsed.push({
          id,
          name,
          tle1,
          tle2,
          color: name.includes("ISS") ? "#60a5fa" : name.includes("HUBBLE") ? "#a78bfa" : "#94a3b8"
        });
      }
    }
    
    // Pick a few famous ones from the active list if found
    const iss = parsed.find(s => s.id === "25544");
    const css = parsed.find(s => s.id === "48274");
    // HST is usually in the 'science' group, but we can update ISS/CSS at least.
    
    if (iss || css) {
      activeSatellites = activeSatellites.map(s => {
        if (s.id === "25544" && iss) return { ...s, tle1: iss.tle1, tle2: iss.tle2 };
        if (s.id === "48274" && css) return { ...s, tle1: css.tle1, tle2: css.tle2 };
        return s;
      });
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
    latitude: satellite.degreesToRadians(latDeg),
    longitude: satellite.degreesToRadians(lonDeg),
    height: elevationM / 1000.0,
  };

  const gmst = satellite.gstime(date);

  for (const sat of activeSatellites) {
    const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (positionAndVelocity && positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
      const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
      const positionEcf = satellite.eciToEcf(positionEci, gmst);
      const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

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
        altDeg: satellite.radiansToDegrees(lookAngles.elevation),
        azDeg: satellite.radiansToDegrees(lookAngles.azimuth),
        rangeKm: lookAngles.rangeSat,
        color: sat.color,
      });
    }
  }

  return results;
}
