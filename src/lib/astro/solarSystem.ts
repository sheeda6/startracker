/**
 * Solar System — Sun and Moon position calculations.
 *
 * Sun:
 *  - Position via simplified VSOP87 (truncated to the dominant periodic terms).
 *  - Apparent RA/Dec including aberration (approximate).
 *
 * Moon:
 *  - Position via truncated ELP-2000 / Brown's theory (dominant terms only).
 *  - Phase angle and illumination percentage.
 *
 * Accuracy: ~0.1° for the Sun, ~0.3° for the Moon — sufficient for a visual
 * sky map. For higher precision, use a full ephemeris (JPL DE440).
 *
 * All angles in radians. Time argument T = Julian centuries since J2000 (TT).
 */

import { toJulianDate } from "./time";
import { meanObliquity } from "./precession";

export interface SolarBody {
  name: string;
  ra: number;   // apparent geocentric RA (radians)
  dec: number;  // apparent geocentric Dec (radians)
  distance: number; // AU for Sun, km for Moon
  alt?: number; // filled by caller
  az?: number;
}

/** Sun position (apparent geocentric equatorial J2000→date). */
export function sunPosition(date: Date): SolarBody {
  const jd = toJulianDate(date).jdTt;
  const T = (jd - 2451545.0) / 36525.0;

  // Geometric mean longitude of the Sun (degrees)
  const L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360;
  // Mean anomaly of the Sun (degrees)
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360;
  // Eccentricity of Earth's orbit
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  // Sun's equation of the center (degrees)
  const Mrad = M * Math.PI / 180;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);

  // True longitude and true anomaly
  const trueLong = L0 + C;
  const trueAnom = M + C;

  // Heliocentric distance (AU) and geocentric distance
  const R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(trueAnom * Math.PI / 180));

  // Apparent geocentric longitude (corrected for nutation + aberration ≈ -0.00569° - 0.00478°sin(Ω))
  const omega = (125.04 - 1934.136 * T) * Math.PI / 180;
  const lambda = (trueLong - 0.00569 - 0.00478 * Math.sin(omega)) * Math.PI / 180;

  // Obliquity
  const eps = meanObliquity(jd);

  // To equatorial
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));

  return {
    name: "Sun",
    ra: ra < 0 ? ra + 2 * Math.PI : ra,
    dec,
    distance: R,
  };
}

/** Moon position (apparent geocentric equatorial). Truncated Brown's theory. */
export function moonPosition(date: Date): SolarBody {
  const jd = toJulianDate(date).jdTt;
  const T = (jd - 2451545.0) / 36525.0;

  // Time in Julian days from J2000 (simpler for the Moon)
  const D = jd - 2451545.0;

  // Mean longitudes (degrees)
  const Lp = (218.316 + 13.176396 * D) % 360;   // Moon's mean longitude
  const Mm = (134.963 + 13.064993 * D) % 360;   // Moon's mean anomaly
  const M = (357.529 + 0.985608 * D) % 360;     // Sun's mean anomaly
  const Dm = (297.850 + 12.190749 * D) % 360;   // Mean elongation Moon-Sun
  const F = (93.272 + 13.229350 * D) % 360;     // Moon's argument of latitude
  const Om = (125.045 - 0.052954 * D) % 360;    // Longitude of ascending node

  const toR = Math.PI / 180;

  // Major periodic terms (degrees) for longitude and latitude
  // (Truncated table — dominant terms only, accuracy ~0.2°)
  const terms = [
    // [D multiplier, M multiplier, Mm multiplier, F multiplier, Om multiplier, longitude coeff, latitude coeff]
    [0, 0, 0, 0, 1, 0, -1.274],
    [2, 0, 0, -2, 0, 0, 0],
    [2, 0, 0, 0, 0, -0.186, 0],
    [0, 0, 0, 2, 0, 0, -0.173],
    [0, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0.109, 0.055],
    [0, 0, 0, 0, 2, 0, -0.055],
    [0, -1, 0, 0, 0, 0, 0],
    [2, 0, -1, 0, 0, 0, 0],
    [0, 0, 1, -2, 0, 0, 0.046],
    [2, -1, 0, -2, 0, 0, 0],
    [0, 1, 0, -2, 0, 0, 0],
    [0, 0, -1, 0, 0, 0, 0],
    [0, -1, 0, 0, 2, 0, 0],
    [2, 0, 0, -2, 2, 0, 0],
  ];

  let dLong = 0;
  let dLat = 0;
  for (const t of terms) {
    const arg =
      (t[0] / 2) * Dm +
      t[1] * M +
      t[2] * Mm +
      (t[3] / 2) * F +
      t[4] * Om;
    dLong += t[5] * Math.sin(arg * toR);
    dLat += t[6] * Math.sin(arg * toR);
  }

  const longitude = Lp + dLong;
  const latitude = 5.128 * Math.sin(F * toR) + dLat;

  // Distance (km)
  const dist = 385000 -
    20905 * Math.cos(Mm * toR) -
    3699 * Math.cos((2 * Dm - Mm) * toR) -
    2956 * Math.cos((2 * Dm) * toR) -
    570 * Math.cos((2 * Mm) * toR) +
    246 * Math.cos((2 * M - 2 * Dm - Mm) * toR) -
    205 * Math.cos((2 * Dm - M - Mm) * toR);

  // To equatorial
  const eps = meanObliquity(jd);
  const lonR = longitude * toR;
  const latR = latitude * toR;

  const ra = Math.atan2(
    Math.sin(lonR) * Math.cos(eps) - Math.tan(latR) * Math.sin(eps),
    Math.cos(lonR)
  );
  const dec = Math.asin(
    Math.sin(latR) * Math.cos(eps) + Math.cos(latR) * Math.sin(eps) * Math.sin(lonR)
  );

  return {
    name: "Moon",
    ra: ra < 0 ? ra + 2 * Math.PI : ra,
    dec,
    distance: dist,
  };
}

export interface MoonPhase {
  /** Phase angle 0..360°. 0=New, 90=First Quarter, 180=Full, 270=Last Quarter. */
  phaseAngle: number;
  /** Illuminated fraction 0..1. */
  illumination: number;
  /** Human-readable phase name. */
  name: string;
  /** 0..1 where 0 = new (waxing), 1 = full, 0 = new (waning) — for icon rendering. */
  waxing: boolean;
}

/**
 * Compute the Moon's phase. The phase angle is the Sun-Moon elongation as seen
 * from Earth.
 */
export function moonPhase(date: Date): MoonPhase {
  const sun = sunPosition(date);
  const moon = moonPosition(date);

  // Elongation angle (Sun-Moon as seen from Earth)
  const sep = separationAngle(sun.ra, sun.dec, moon.ra, moon.dec);
  const elongationDeg = (sep * 180) / Math.PI;

  // Illumination: (1 - cos(elongation)) / 2
  const illumination = (1 - Math.cos(sep)) / 2;

  // Determine waxing vs waning: the Moon's ecliptic longitude vs Sun's
  // If Moon longitude > Sun longitude (mod 360) and < Sun+180 → waxing
  const sunLon = Math.atan2(
    Math.sin(sun.ra) * Math.cos(moon.dec) - Math.tan(moon.dec) * Math.sin(0),
    Math.cos(sun.ra)
  );
  const moonLon = Math.atan2(
    Math.sin(moon.ra) * Math.cos(moon.dec) - Math.tan(moon.dec) * Math.sin(0),
    Math.cos(moon.ra)
  );
  let diff = moonLon - sunLon;
  diff = ((diff % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const waxing = diff < Math.PI;

  // Phase angle for naming
  const phaseAngle = waxing ? elongationDeg : 360 - elongationDeg;

  let name: string;
  if (elongationDeg < 22.5) name = "New Moon";
  else if (elongationDeg < 67.5) name = waxing ? "Waxing Crescent" : "Waning Crescent";
  else if (elongationDeg < 112.5) name = waxing ? "First Quarter" : "Last Quarter";
  else if (elongationDeg < 157.5) name = waxing ? "Waxing Gibbous" : "Waning Gibbous";
  else name = "Full Moon";

  return {
    phaseAngle,
    illumination,
    name,
    waxing,
  };
}

/** Angular separation between two equatorial points. */
function separationAngle(ra1: number, dec1: number, ra2: number, dec2: number): number {
  const cosD =
    Math.sin(dec1) * Math.sin(dec2) +
    Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);
  return Math.acos(Math.max(-1, Math.min(1, cosD)));
}

/** Planetary positions (truncated, approximate). */
export interface PlanetInfo extends SolarBody {
  magnitude: number;
  color: string;
  symbol: string;
}

/**
 * Compute positions of the naked-eye planets using truncated Keplerian elements.
 * Accuracy is ~1° for outer planets — sufficient for a sky map.
 */
export function planetPositions(date: Date): PlanetInfo[] {
  const jd = toJulianDate(date).jdTt;
  const T = (jd - 2451545.0) / 36525.0;
  const toR = Math.PI / 180;

  // Each planet: [a (AU), e, I (deg), L (deg), longperi (omega, deg), longnode (Omega, deg)]
  // Linear elements from J2000 with secular variations (truncated).
  const elements: Record<string, { a: number; e: number; I: number; L: string; w: string; W: string; magV: number; color: string; symbol: string }> = {
    Mercury: { a: 0.387099, e: 0.205646, I: 7.005, L: "252.251 + 149472.6746*T", w: "77.456 + 0.1606*T", W: "48.331 - 0.1254*T", magV: -0.4, color: "#b5b5b5", symbol: "☿" },
    Venus:   { a: 0.723332, e: 0.006773, I: 3.395, L: "181.980 + 58517.8156*T", w: "131.564 + 0.0529*T", W: "76.680 - 0.2769*T", magV: -4.4, color: "#f5e6c8", symbol: "♀" },
    Mars:    { a: 1.523688, e: 0.093405, I: 1.850, L: "355.433 + 19140.2993*T", w: "336.041 + 0.4445*T", W: "49.579 - 0.2920*T", magV: -2.0, color: "#e07b4a", symbol: "♂" },
    Jupiter: { a: 5.202561, e: 0.048498, I: 1.303, L: "34.351 + 3034.9057*T", w: "14.331 + 0.2156*T", W: "100.464 + 0.1767*T", magV: -2.5, color: "#e8c89a", symbol: "♃" },
    Saturn:  { a: 9.554747, e: 0.055546, I: 2.489, L: "50.078 + 1222.1138*T", w: "93.057 + 0.5665*T", W: "113.664 - 0.2566*T", magV: 0.5, color: "#dcc39a", symbol: "♄" },
  };

  const eps = meanObliquity(jd);
  const sun = sunPosition(date);

  const planets: PlanetInfo[] = [];
  for (const [name, el] of Object.entries(elements)) {
    const L = evalExpr(el.L, T) * toR;
    const w = evalExpr(el.w, T) * toR;
    const W = evalExpr(el.W, T) * toR;
    const I = el.I * toR;
    const e = el.e;
    const a = el.a;

    // Mean anomaly
    const M = L - w;
    // Solve Kepler's equation (3 iterations)
    let E = M;
    for (let i = 0; i < 5; i++) {
      E = M + e * Math.sin(E);
    }
    // True anomaly
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);
    const nu = Math.atan2(Math.sqrt(1 - e * e) * Math.sin(E), cosE - e);
    // Heliocentric distance
    const r = a * (1 - e * cosE);

    // Heliocentric ecliptic coordinates
    const xHel = r * (Math.cos(W) * Math.cos(w + nu - W) - Math.sin(W) * Math.sin(w + nu - W) * Math.cos(I));
    const yHel = r * (Math.sin(W) * Math.cos(w + nu - W) + Math.cos(W) * Math.sin(w + nu - W) * Math.cos(I));
    const zHel = r * Math.sin(w + nu - W) * Math.sin(I);

    // Convert Sun's equatorial (RA/Dec) to ecliptic Cartesian (distance from Sun ~ R_sun)
    // For simplicity, use sun.distance (AU) and sun RA/Dec → ecliptic
    const sunR = sun.distance;
    const sunLon = Math.atan2(Math.sin(sun.ra), Math.cos(sun.ra) * Math.cos(eps) + Math.tan(sun.dec) * Math.sin(eps));
    const sunLat = Math.asin(Math.sin(sun.dec) * Math.cos(eps) - Math.cos(sun.dec) * Math.sin(eps) * Math.sin(sun.ra));
    const xs = sunR * Math.cos(sunLat) * Math.cos(sunLon);
    const ys = sunR * Math.cos(sunLat) * Math.sin(sunLon);
    const zs = sunR * Math.sin(sunLat);

    // Geocentric ecliptic
    const xg = xHel - xs;
    const yg = yHel - ys;
    const zg = zHel - zs;

    // To equatorial
    const lonG = Math.atan2(yg, xg);
    const latG = Math.atan2(zg, Math.sqrt(xg * xg + yg * yg));
    const ra = Math.atan2(
      Math.sin(lonG) * Math.cos(eps) - Math.tan(latG) * Math.sin(eps),
      Math.cos(lonG)
    );
    const dec = Math.asin(
      Math.sin(latG) * Math.cos(eps) + Math.cos(latG) * Math.sin(eps) * Math.sin(lonG)
    );

    // Distance from Earth
    const dist = Math.sqrt(xg * xg + yg * yg + zg * zg);

    planets.push({
      name,
      ra: ra < 0 ? ra + 2 * Math.PI : ra,
      dec,
      distance: dist,
      magnitude: el.magV, // approximate; real mag depends on phase
      color: el.color,
      symbol: el.symbol,
    });
  }
  return planets;
}

function evalExpr(expr: string, T: number): number {
  // Simple "A + B*T" parser
  const parts = expr.split("+").map((s) => s.trim());
  let val = 0;
  for (const p of parts) {
    if (p.includes("*T")) {
      const c = parseFloat(p.split("*")[0]);
      val += c * T;
    } else {
      val += parseFloat(p);
    }
  }
  return val % 360;
}
