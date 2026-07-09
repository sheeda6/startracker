/**
 * Coordinate transformations.
 *
 * Provides conversions between:
 *  - ICRS / J2000 equatorial (RA, Dec)
 *  - Apparent (date) equatorial (with precession + nutation)
 *  - Horizontal (Altitude, Azimuth)
 *  - Galactic (l, b)
 *  - Ecliptic (λ, β)
 *  - Cartesian (x, y, z) unit vector
 *  - Airmass and zenith angle
 *
 * All angles in radians unless otherwise noted. RA in [0, 2π), Dec in [-π/2, π/2].
 */

import {
  precessionMatrixIAU2006,
  nutationMatrix,
  meanObliquity,
  nutationIAU2000B,
  trueObliquity,
  matVec,
  rotX,
  rotZ,
  matMul,
} from "./precession";

export interface Equatorial {
  ra: number; // radians
  dec: number; // radians
}

export interface Horizontal {
  alt: number; // radians (geometric, not refracted)
  az: number; // radians [0, 2π), measured from North through East
  zenithAngle: number; // radians (90° - alt)
  airmass: number; // relative airmass
}

export interface Galactic {
  l: number; // radians [0, 2π)
  b: number; // radians [-π/2, π/2]
}

export interface Ecliptic {
  lon: number; // radians [0, 2π)
  lat: number; // radians [-π/2, π/2]
}

export interface Cartesian {
  x: number;
  y: number;
  z: number;
}

// ---------- Unit vector conversions ----------

export function equatorialToCartesian(ra: number, dec: number): Cartesian {
  const cd = Math.cos(dec);
  return {
    x: Math.cos(ra) * cd,
    y: Math.sin(ra) * cd,
    z: Math.sin(dec),
  };
}

export function cartesianToEquatorial(v: Cartesian): Equatorial {
  const r = Math.hypot(v.x, v.y, v.z) || 1;
  const dec = Math.asin(v.z / r);
  let ra = Math.atan2(v.y, v.x);
  if (ra < 0) ra += 2 * Math.PI;
  return { ra, dec };
}

// ---------- Apparent place (precession + nutation, no aberration) ----------

/**
 * Apply IAU 2006 precession and IAU 2000B nutation to a J2000 (RA, Dec).
 * Aberration of light is omitted for speed (max ~20" error, below our visual target).
 */
export function j2000ToApparent(raJ2000: number, decJ2000: number, jdTt: number): Equatorial {
  const P = precessionMatrixIAU2006(jdTt);
  // First apply precession (mean-of-date)
  let v = equatorialToCartesian(raJ2000, decJ2000);
  v = { x: matVec(P, [v.x, v.y, v.z])[0], y: matVec(P, [v.x, v.y, v.z])[1], z: matVec(P, [v.x, v.y, v.z])[2] };

  // Apply nutation
  const nut = nutationIAU2000B(jdTt);
  const epsMean = meanObliquity(jdTt);
  const epsTrue = trueObliquity(jdTt, nut.dEps);
  const N = nutationMatrix(nut.dPsi, nut.dEps, epsTrue, epsMean);
  const vn = matVec(N, [v.x, v.y, v.z]);
  return cartesianToEquatorial({ x: vn[0], y: vn[1], z: vn[2] });
}

// ---------- Equatorial -> Horizontal ----------

/**
 * Convert apparent (RA, Dec) to horizontal (Alt, Az).
 *
 * Uses the standard hour-angle formulation:
 *   sin(alt) = sin(phi) sin(dec) + cos(phi) cos(dec) cos(H)
 *   cos(az)  = (sin(dec) - sin(phi) sin(alt)) / (cos(phi) cos(alt))
 *   sin(az)  = -sin(H) cos(dec) / cos(alt)
 *
 * @param ra apparent RA in radians
 * @param dec apparent Dec in radians
 * @param lstRad local apparent sidereal time in radians
 * @param latRad observer latitude in radians
 */
export function equatorialToHorizontal(
  ra: number,
  dec: number,
  lstRad: number,
  latRad: number,
): Horizontal {
  const H = lstRad - ra; // hour angle
  const sinPhi = Math.sin(latRad);
  const cosPhi = Math.cos(latRad);
  const sinDec = Math.sin(dec);
  const cosDec = Math.cos(dec);

  const sinAlt = sinPhi * sinDec + cosPhi * cosDec * Math.cos(H);
  const alt = Math.asin(clamp(sinAlt, -1, 1));

  const cosAlt = Math.cos(alt);
  let az = 0;
  if (Math.abs(cosAlt) > 1e-12) {
    const cosAz = (sinDec - sinPhi * sinAlt) / (cosPhi * cosAlt);
    const sinAz = -Math.sin(H) * cosDec / cosAlt;
    az = Math.atan2(sinAz, cosAz);
  }
  if (az < 0) az += 2 * Math.PI;

  const zenithAngle = Math.PI / 2 - alt;
  const airmass = computeAirmass(alt);

  return { alt, az, zenithAngle, airmass };
}

// ---------- Horizontal -> Equatorial (inverse) ----------

export function horizontalToEquatorial(
  alt: number,
  az: number,
  lstRad: number,
  latRad: number,
): Equatorial {
  const sinPhi = Math.sin(latRad);
  const cosPhi = Math.cos(latRad);
  const sinAlt = Math.sin(alt);
  const cosAlt = Math.cos(alt);
  const sinAz = Math.sin(az);
  const cosAz = Math.cos(az);

  const sinDec = sinPhi * sinAlt + cosPhi * cosAlt * cosAz;
  const dec = Math.asin(clamp(sinDec, -1, 1));
  const cosDec = Math.cos(dec);
  const H = Math.abs(cosDec) > 1e-12
    ? Math.acos(clamp((sinAlt - sinPhi * sinDec) / (cosPhi * cosDec), -1, 1))
    : 0;
  let ra = lstRad - H;
  if (ra < 0) ra += 2 * Math.PI;
  // The sign of sinAz determines which side of the meridian
  if (sinAz > 0) {
    ra = lstRad + H;
    if (ra > 2 * Math.PI) ra -= 2 * Math.PI;
  }
  return { ra, dec };
}

// ---------- Equatorial -> Ecliptic (date) ----------

export function equatorialToEcliptic(ra: number, dec: number, obliquity: number): Ecliptic {
  const sinEps = Math.sin(obliquity);
  const cosEps = Math.cos(obliquity);
  const sinDec = Math.sin(dec);
  const cosDec = Math.cos(dec);
  const sinRa = Math.sin(ra);
  const cosRa = Math.cos(ra);

  const sinLat = sinDec * cosEps - cosDec * sinEps * sinRa;
  const lat = Math.asin(clamp(sinLat, -1, 1));
  const lon = Math.atan2(sinRa * cosEps + (sinDec / cosDec) * sinEps, cosRa);
  return { lat, lon: ((lon % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) };
}

// ---------- Equatorial -> Galactic (J2000) ----------

// Galactic frame rotation matrix (J2000 → Galactic), Hipparcos convention.
const GAL_R: number[][] = [
  [-0.054875539, -0.87343709, -0.48383499],
  [0.494109453, -0.44482963, 0.74698224],
  [-0.867666136, -0.19807639, 0.45598377],
];

export function equatorialToGalactic(ra: number, dec: number): Galactic {
  const v = equatorialToCartesian(ra, dec);
  const g = matVec(GAL_R, [v.x, v.y, v.z]);
  const b = Math.asin(clamp(g[2], -1, 1));
  let l = Math.atan2(g[1], g[0]);
  if (l < 0) l += 2 * Math.PI;
  return { l, b };
}

// ---------- Airmass ----------

/** Relative airmass using Kasten & Young (1989) formula. */
export function computeAirmass(altRad: number): number {
  if (altRad <= 0) return Infinity;
  const z = Math.PI / 2 - altRad; // zenith angle in radians
  const zd = (z * 180) / Math.PI;
  return 1 / (Math.cos(z) + 0.50572 * Math.pow(96.07995 - zd, -1.6364));
}

// ---------- Helpers ----------

export function clamp(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

/** Degree <-> radian helpers. */
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
export const HRS2RAD = Math.PI / 12;
export const RAD2HRS = 12 / Math.PI;
