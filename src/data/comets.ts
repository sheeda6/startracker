import { toJulianDate } from "@/lib/astro/time";
import { meanObliquity } from "@/lib/astro/precession";
import { sunPosition } from "@/lib/astro/solarSystem";

export interface CometElements {
  id: string; // Identifier, e.g., "1P"
  name: string; // "Halley"
  type: string; // "comet"
  epoch: number; // Julian Date of epoch
  a: number; // Semi-major axis in AU
  e: number; // Eccentricity
  i: number; // Inclination in degrees
  om: number; // Longitude of ascending node in degrees
  w: number; // Argument of perihelion in degrees
  ma: number; // Mean anomaly at epoch in degrees
  H: number; // Absolute magnitude (optional, approximation for comets)
  G: number; // Slope parameter (usually not used for comets, using 0.15 as fallback)
}

export const COMETS: CometElements[] = [
  {
    // Halley's Comet (1P/Halley)
    id: "1P",
    name: "Halley's Comet",
    type: "comet",
    epoch: 2449400.5, // Epoch 1994-Feb-17.0
    a: 17.83414429,
    e: 0.96714291,
    i: 162.26269, // Retrograde
    om: 58.42015,
    w: 111.33249,
    ma: 38.38426, // M at epoch
    H: 5.5,
    G: 0.15
  },
  {
    // 67P/Churyumov-Gerasimenko
    id: "67P",
    name: "67P/Churyumov-Gerasimenko",
    type: "comet",
    epoch: 2459396.5, // 2021-07-01
    a: 3.46338,
    e: 0.64102,
    i: 7.040,
    om: 50.147,
    w: 12.796,
    ma: 351.488,
    H: 11.4,
    G: 0.15
  },
  {
    // 2P/Encke
    id: "2P",
    name: "Encke's Comet",
    type: "comet",
    epoch: 2460220.5, // 2023-10-04
    a: 2.2154,
    e: 0.848,
    i: 11.75,
    om: 334.56,
    w: 186.54,
    ma: 341.67,
    H: 14.1,
    G: 0.15
  }
];

export interface CometPosition {
  id: string;
  name: string;
  ra: number;
  dec: number;
  distance: number;
  type: string;
  color: string;
}

const DEG = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

function solveKepler(M: number, e: number, iterations = 8): number {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let i = 0; i < iterations; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  return E;
}

export function computeCometPositions(date: Date): CometPosition[] {
  const jd = toJulianDate(date).jdTt;
  const eps = meanObliquity(jd);
  const sun = sunPosition(date);

  const X_eq_sun = sun.distance * Math.cos(sun.dec) * Math.cos(sun.ra);
  const Y_eq_sun = sun.distance * Math.cos(sun.dec) * Math.sin(sun.ra);
  const Z_eq_sun = sun.distance * Math.sin(sun.dec);

  const results: CometPosition[] = [];

  for (const c of COMETS) {
    const n = 0.9856076686 / (c.a * Math.sqrt(c.a));
    const d = jd - c.epoch;
    const M = (c.ma + n * d) * DEG;
    const M_mod = M % TWO_PI;

    const E = solveKepler(M_mod, c.e);

    const x_orb = c.a * (Math.cos(E) - c.e);
    const y_orb = c.a * Math.sqrt(1 - c.e * c.e) * Math.sin(E);

    const cosOm = Math.cos(c.om * DEG);
    const sinOm = Math.sin(c.om * DEG);
    const cosw = Math.cos(c.w * DEG);
    const sinw = Math.sin(c.w * DEG);
    const cosi = Math.cos(c.i * DEG);
    const sini = Math.sin(c.i * DEG);

    const x_ecl = x_orb * (cosw * cosOm - sinw * sinOm * cosi) + y_orb * (-sinw * cosOm - cosw * sinOm * cosi);
    const y_ecl = x_orb * (cosw * sinOm + sinw * cosOm * cosi) + y_orb * (-sinw * sinOm + cosw * cosOm * cosi);
    const z_ecl = x_orb * (sinw * sini) + y_orb * (cosw * sini);

    const cosEps = Math.cos(eps);
    const sinEps = Math.sin(eps);

    const x_eq_helio = x_ecl;
    const y_eq_helio = y_ecl * cosEps - z_ecl * sinEps;
    const z_eq_helio = y_ecl * sinEps + z_ecl * cosEps;

    const X_eq = x_eq_helio + X_eq_sun;
    const Y_eq = y_eq_helio + Y_eq_sun;
    const Z_eq = z_eq_helio + Z_eq_sun;

    const distance = Math.sqrt(X_eq * X_eq + Y_eq * Y_eq + Z_eq * Z_eq);

    let ra = Math.atan2(Y_eq, X_eq);
    if (ra < 0) ra += TWO_PI;
    const dec = Math.atan2(Z_eq, Math.sqrt(X_eq * X_eq + Y_eq * Y_eq));

    results.push({
      id: c.id,
      name: c.name,
      ra,
      dec,
      distance,
      type: "comet",
      color: "#99f6e4",
    });
  }

  return results;
}
