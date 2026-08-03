/**
 * Asteroid catalog — curated list of bright / famous minor planets and comets.
 *
 * Orbital elements are osculating elements for epoch J2000 (JD 2451545.0).
 * Elements source: JPL Small-Body Database (public domain).
 *
 * Computed positions are heliocentric ecliptic → geocentric equatorial using
 * the same pattern as the planet code in solarSystem.ts.
 *
 * Accuracy: ~0.5°–2° (two-body Keplerian, no perturbations) — fine for plotting.
 */

import { toJulianDate } from "@/lib/astro/time";
import { meanObliquity } from "@/lib/astro/precession";
import { sunPosition } from "@/lib/astro/solarSystem";

export interface AsteroidElements {
  /** Catalog designation, e.g. "1 Ceres" */
  designation: string;
  /** Common / IAU name */
  name: string;
  /** Semi-major axis (AU) */
  a: number;
  /** Eccentricity */
  e: number;
  /** Inclination (degrees) */
  i: number;
  /** Longitude of ascending node Ω (degrees) */
  bigOmega: number;
  /** Argument of perihelion ω (degrees) */
  omega: number;
  /** Mean anomaly at epoch (degrees, epoch = J2000) */
  M0: number;
  /** Absolute magnitude H */
  H: number;
  /** Approximate peak visual magnitude (opposition) */
  peakMag: number;
  /** Display color */
  color: string;
  /** Type */
  type: "minor-planet" | "dwarf-planet" | "trojan" | "near-earth";
}

/** ~25 notable asteroids with J2000 osculating elements. */
export const ASTEROIDS: AsteroidElements[] = [
  { designation: "1 Ceres", name: "Ceres", a: 2.7671, e: 0.0758, i: 10.593, bigOmega: 80.33, omega: 73.60, M0: 77.37, H: 3.34, peakMag: 6.7, color: "#b5c4d0", type: "dwarf-planet" },
  { designation: "2 Pallas", name: "Pallas", a: 2.7720, e: 0.2306, i: 34.84, bigOmega: 173.09, omega: 309.93, M0: 78.23, H: 4.13, peakMag: 7.9, color: "#a0aab4", type: "minor-planet" },
  { designation: "3 Juno", name: "Juno", a: 2.6686, e: 0.2558, i: 12.99, bigOmega: 169.86, omega: 248.41, M0: 214.77, H: 5.33, peakMag: 8.7, color: "#9ab0a0", type: "minor-planet" },
  { designation: "4 Vesta", name: "Vesta", a: 2.3615, e: 0.0887, i: 7.14, bigOmega: 103.85, omega: 151.20, M0: 20.86, H: 3.20, peakMag: 5.1, color: "#d0cdb5", type: "minor-planet" },
  { designation: "5 Astraea", name: "Astraea", a: 2.5742, e: 0.1900, i: 5.37, bigOmega: 141.58, omega: 358.92, M0: 111.38, H: 6.85, peakMag: 9.9, color: "#b8b0a0", type: "minor-planet" },
  { designation: "6 Hebe", name: "Hebe", a: 2.4252, e: 0.2018, i: 14.75, bigOmega: 138.65, omega: 239.40, M0: 170.97, H: 5.71, peakMag: 8.3, color: "#c8c0a8", type: "minor-planet" },
  { designation: "7 Iris", name: "Iris", a: 2.3861, e: 0.2298, i: 5.51, bigOmega: 259.57, omega: 145.37, M0: 311.58, H: 5.51, peakMag: 8.0, color: "#c0a8b0", type: "minor-planet" },
  { designation: "8 Flora", name: "Flora", a: 2.2014, e: 0.1564, i: 5.88, bigOmega: 111.00, omega: 285.12, M0: 287.80, H: 6.49, peakMag: 8.9, color: "#b0c0a8", type: "minor-planet" },
  { designation: "10 Hygiea", name: "Hygiea", a: 3.1415, e: 0.1130, i: 3.84, bigOmega: 283.63, omega: 312.32, M0: 217.11, H: 5.43, peakMag: 9.1, color: "#a8b8c0", type: "minor-planet" },
  { designation: "15 Eunomia", name: "Eunomia", a: 2.6431, e: 0.1868, i: 11.74, bigOmega: 292.95, omega: 96.87, M0: 96.49, H: 5.28, peakMag: 8.5, color: "#c0b8a0", type: "minor-planet" },
  { designation: "16 Psyche", name: "Psyche", a: 2.9234, e: 0.1340, i: 3.10, bigOmega: 150.30, omega: 229.03, M0: 150.75, H: 5.90, peakMag: 9.1, color: "#d0c0a0", type: "minor-planet" },
  { designation: "20 Massalia", name: "Massalia", a: 2.4085, e: 0.1423, i: 0.71, bigOmega: 206.32, omega: 257.64, M0: 354.06, H: 6.50, peakMag: 9.0, color: "#b8c8b8", type: "minor-planet" },
  { designation: "29 Amphitrite", name: "Amphitrite", a: 2.5548, e: 0.0724, i: 6.09, bigOmega: 356.28, omega: 61.67, M0: 53.37, H: 5.85, peakMag: 8.7, color: "#a8c0b8", type: "minor-planet" },
  { designation: "433 Eros", name: "Eros", a: 1.4582, e: 0.2228, i: 10.83, bigOmega: 304.43, omega: 178.82, M0: 208.78, H: 10.83, peakMag: 8.9, color: "#c8b0a0", type: "near-earth" },
  { designation: "951 Gaspra", name: "Gaspra", a: 2.2096, e: 0.1739, i: 4.10, bigOmega: 253.24, omega: 129.26, M0: 184.85, H: 11.46, peakMag: 12.5, color: "#b0b8c0", type: "minor-planet" },
  { designation: "243 Ida", name: "Ida", a: 2.8617, e: 0.0451, i: 1.14, bigOmega: 324.69, omega: 113.81, M0: 299.95, H: 9.94, peakMag: 11.5, color: "#b8b0b0", type: "minor-planet" },
  { designation: "624 Hektor", name: "Hektor", a: 5.2378, e: 0.0240, i: 18.23, bigOmega: 342.34, omega: 179.10, M0: 238.96, H: 7.49, peakMag: 13.0, color: "#a0b0c0", type: "trojan" },
  { designation: "588 Achilles", name: "Achilles", a: 5.2028, e: 0.1479, i: 10.32, bigOmega: 316.47, omega: 327.47, M0: 329.47, H: 8.67, peakMag: 14.0, color: "#98a8b8", type: "trojan" },
  { designation: "2 Phaethon", name: "Phaethon", a: 1.2713, e: 0.8899, i: 22.26, bigOmega: 265.22, omega: 322.16, M0: 52.00, H: 14.46, peakMag: 11.0, color: "#d0b8a0", type: "near-earth" },
  { designation: "99942 Apophis", name: "Apophis", a: 0.9225, e: 0.1913, i: 3.34, bigOmega: 204.46, omega: 126.41, M0: 201.50, H: 19.70, peakMag: 16.0, color: "#c0a8b8", type: "near-earth" },
  { designation: "25143 Itokawa", name: "Itokawa", a: 1.3241, e: 0.2801, i: 1.62, bigOmega: 69.08, omega: 162.82, M0: 34.40, H: 18.95, peakMag: 16.0, color: "#b8b0a8", type: "near-earth" },
  { designation: "101955 Bennu", name: "Bennu", a: 1.1264, e: 0.2037, i: 6.04, bigOmega: 2.06, omega: 66.22, M0: 101.70, H: 20.20, peakMag: 17.0, color: "#a8b0b8", type: "near-earth" },
];

export interface AsteroidPosition {
  designation: string;
  name: string;
  ra: number;   // geocentric J2000 RA (radians)
  dec: number;  // geocentric J2000 Dec (radians)
  distance: number; // geocentric distance (AU)
  peakMag: number;
  color: string;
  type: AsteroidElements["type"];
}

const DEG = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

/** Solve Kepler's equation E - e*sin(E) = M using Newton–Raphson. */
function solveKepler(M: number, e: number, iterations = 8): number {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let i = 0; i < iterations; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  return E;
}

/** Compute geocentric equatorial positions for all asteroids at the given date. */
export function computeAsteroidPositions(date: Date): AsteroidPosition[] {
  const jd = toJulianDate(date).jdTt;
  const T = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000
  const eps = meanObliquity(jd);
  const sun = sunPosition(date);

  // Sun's ecliptic Cartesian position (geocentric)
  const sunLon = Math.atan2(
    Math.sin(sun.ra) * Math.cos(eps) + Math.tan(sun.dec) * Math.sin(eps),
    Math.cos(sun.ra)
  );
  const sunLat = Math.asin(
    Math.sin(sun.dec) * Math.cos(eps) - Math.cos(sun.dec) * Math.sin(eps) * Math.sin(sun.ra)
  );
  const sunR = sun.distance; // AU
  const xs = sunR * Math.cos(sunLat) * Math.cos(sunLon);
  const ys = sunR * Math.cos(sunLat) * Math.sin(sunLon);
  const zs = sunR * Math.sin(sunLat);

  const results: AsteroidPosition[] = [];

  for (const ast of ASTEROIDS) {
    // Mean motion (degrees/day) from Kepler's 3rd law: n = 360 / (a^1.5 * 365.25)
    const n = 360 / (Math.pow(ast.a, 1.5) * 365.25);
    // Mean anomaly at date
    const M = ((ast.M0 + n * T * 36525) % 360 + 360) % 360;
    const Mrad = M * DEG;
    const ecc = ast.e;
    const E = solveKepler(Mrad, ecc);

    // True anomaly
    const cosE = Math.cos(E);
    const nu = Math.atan2(Math.sqrt(1 - ecc * ecc) * Math.sin(E), cosE - ecc);
    // Heliocentric distance
    const r = ast.a * (1 - ecc * cosE);

    // Orbital elements in radians
    const iRad = ast.i * DEG;
    const OmRad = ast.bigOmega * DEG;
    const omRad = ast.omega * DEG;

    // Heliocentric ecliptic Cartesian
    const xHel = r * (Math.cos(OmRad) * Math.cos(omRad + nu) - Math.sin(OmRad) * Math.sin(omRad + nu) * Math.cos(iRad));
    const yHel = r * (Math.sin(OmRad) * Math.cos(omRad + nu) + Math.cos(OmRad) * Math.sin(omRad + nu) * Math.cos(iRad));
    const zHel = r * Math.sin(omRad + nu) * Math.sin(iRad);

    // Geocentric ecliptic
    const xg = xHel - xs;
    const yg = yHel - ys;
    const zg = zHel - zs;

    const dist = Math.sqrt(xg * xg + yg * yg + zg * zg);

    // Ecliptic → equatorial
    const lonG = Math.atan2(yg, xg);
    const latG = Math.atan2(zg, Math.sqrt(xg * xg + yg * yg));
    const ra = Math.atan2(
      Math.sin(lonG) * Math.cos(eps) - Math.tan(latG) * Math.sin(eps),
      Math.cos(lonG)
    );
    const dec = Math.asin(
      Math.sin(latG) * Math.cos(eps) + Math.cos(latG) * Math.sin(eps) * Math.sin(lonG)
    );

    results.push({
      designation: ast.designation,
      name: ast.name,
      ra: ((ra % TWO_PI) + TWO_PI) % TWO_PI,
      dec,
      distance: dist,
      peakMag: ast.peakMag,
      color: ast.color,
      type: ast.type,
    });
  }

  return results;
}
