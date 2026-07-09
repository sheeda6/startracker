/**
 * High-level engine: precompute observer+time-dependent quantities once,
 * then rapidly transform many stars.
 *
 * Design follows the optimization philosophy from the spec:
 *  - Precompute rotation matrices, LST, sin/cos(latitude) once per frame
 *  - Per-star cost is O(1) with no trig beyond sin/cos of star RA/Dec
 */

import {
  toJulianDate,
  gmst,
  equationOfEquinoxes,
  gast,
  lst,
  type JulianDate,
} from "./time";
import {
  precessionMatrixIAU2006,
  nutationIAU2000B,
  meanObliquity,
  trueObliquity,
  nutationMatrix,
  matVec,
  matMul,
  type Nutation,
} from "./precession";
import {
  equatorialToHorizontal,
  equatorialToGalactic,
  equatorialToEcliptic,
  type Horizontal,
  type Galactic,
  type Ecliptic,
  type Equatorial,
} from "./coordinates";
import {
  refractionBennett,
  refractionBennettInverse,
} from "./refraction";

export interface ObserverState {
  date: Date;
  lat: number; // radians
  lon: number; // radians (east positive)
  elevationM: number;
}

export interface FrameContext {
  jd: JulianDate;
  T: number;                // Julian centuries (TT)
  precessionMatrix: number[][];
  nutation: Nutation;
  epsMean: number;
  epsTrue: number;
  nutationMatrix: number[][];
  combinedMatrix: number[][]; // P then N applied
  gmst: number;
  eqEq: number;
  gast: number;
  lst: number;
  sinLat: number;
  cosLat: number;
}

/**
 * Build a frame context for the given observer + time. This bundles all the
 * time- and location-dependent invariants so per-star transforms are cheap.
 */
export function buildFrame(observer: ObserverState): FrameContext {
  const jd = toJulianDate(observer.date);
  const T = (jd.jdTt - 2451545.0) / 36525.0;
  const P = precessionMatrixIAU2006(jd.jdTt);
  const nut = nutationIAU2000B(jd.jdTt);
  const epsMean = meanObliquity(jd.jdTt);
  const epsTrue = trueObliquity(jd.jdTt, nut.dEps);
  const N = nutationMatrix(nut.dPsi, nut.dEps, epsTrue, epsMean);
  const combined = matMul(N, P);

  const gmstRad = gmst(jd.jdUt1);
  const eqEq = equationOfEquinoxes(nut.dPsi, epsTrue);
  const gastRad = gast(gmstRad, eqEq);
  const lstRad = lst(gastRad, observer.lon);

  return {
    jd,
    T,
    precessionMatrix: P,
    nutation: nut,
    epsMean,
    epsTrue,
    nutationMatrix: N,
    combinedMatrix: combined,
    gmst: gmstRad,
    eqEq,
    gast: gastRad,
    lst: lstRad,
    sinLat: Math.sin(observer.lat),
    cosLat: Math.cos(observer.lat),
  };
}

/**
 * Apply proper motion to a star's J2000 position over a given number of years.
 *
 * @param ra J2000 RA in radians
 * @param dec J2000 Dec in radians
 * @param pmRa proper motion in RA (mas/yr, includes cos(δ) factor)
 * @param pmDec proper motion in Dec (mas/yr)
 * @param years years from J2000 (can be negative for past)
 * @returns adjusted { ra, dec } in radians
 */
export function applyProperMotion(
  ra: number,
  dec: number,
  pmRa: number,
  pmDec: number,
  years: number,
): { ra: number; dec: number } {
  if (years === 0 || (pmRa === 0 && pmDec === 0)) {
    return { ra, dec };
  }
  // Convert mas/yr to radians/yr
  const MAS2RAD = Math.PI / (180 * 3600 * 1000);
  const dra = pmRa * MAS2RAD * years;
  const ddec = pmDec * MAS2RAD * years;
  // pmRa already includes cos(δ), so divide to get true RA motion
  const cosDec = Math.cos(dec);
  let newRa = ra + (Math.abs(cosDec) > 1e-10 ? dra / cosDec : 0);
  let newDec = dec + ddec;
  // Clamp dec
  if (newDec > Math.PI / 2) newDec = Math.PI / 2;
  if (newDec < -Math.PI / 2) newDec = -Math.PI / 2;
  // Wrap RA
  newRa = ((newRa % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return { ra: newRa, dec: newDec };
}

/**
 * Transform a single J2000 (RA, Dec) into horizontal coordinates using the
 * precomputed frame context. Precession + nutation are folded into a single
 * 3×3 matrix application.
 */
export function transformStar(
  raJ2000: number,
  decJ2000: number,
  frame: FrameContext,
  lat: number,
): {
  apparent: Equatorial;
  horizontal: Horizontal;
  galactic: Galactic;
  ecliptic: Ecliptic;
} {
  // Cartesian unit vector on J2000
  const cd = Math.cos(decJ2000);
  const v0 = [Math.cos(raJ2000) * cd, Math.sin(raJ2000) * cd, Math.sin(decJ2000)];

  // Apply combined precession + nutation matrix → apparent (date) Cartesian
  const v1 = matVec(frame.combinedMatrix, v0);

  // Apparent equatorial (RA, Dec) of date
  const sinDecApp = v1[2];
  const decApp = Math.asin(sinDecApp > 1 ? 1 : sinDecApp < -1 ? -1 : sinDecApp);
  let raApp = Math.atan2(v1[1], v1[0]);
  if (raApp < 0) raApp += 2 * Math.PI;

  // Horizontal coordinates
  const H = frame.lst - raApp;
  const sinAlt = frame.sinLat * sinDecApp + frame.cosLat * Math.cos(decApp) * Math.cos(H);
  const alt = Math.asin(sinAlt > 1 ? 1 : sinAlt < -1 ? -1 : sinAlt);
  const cosAlt = Math.cos(alt);
  let az = 0;
  if (Math.abs(cosAlt) > 1e-12) {
    const cosAz = (sinDecApp - frame.sinLat * sinAlt) / (frame.cosLat * cosAlt);
    const sinAz = (-Math.sin(H) * Math.cos(decApp)) / cosAlt;
    az = Math.atan2(sinAz, cosAz);
  }
  if (az < 0) az += 2 * Math.PI;

  const airmass =
    alt <= 0 ? Infinity : 1 / (Math.cos(Math.PI / 2 - alt) + 0.50572 * Math.pow(96.07995 - (Math.PI / 2 - alt) * 180 / Math.PI, -1.6364));

  // Galactic (use J2000 RA/Dec)
  const gal = equatorialToGalactic(raJ2000, decJ2000);

  // Ecliptic of date (use apparent place + true obliquity)
  const ecl = equatorialToEcliptic(raApp, decApp, frame.epsTrue);

  return {
    apparent: { ra: raApp, dec: decApp },
    horizontal: {
      alt,
      az,
      zenithAngle: Math.PI / 2 - alt,
      airmass,
    },
    galactic: gal,
    ecliptic: ecl,
  };
}

/** Apply atmospheric refraction to a geometric altitude → observed altitude. */
export function refract(trueAlt: number): number {
  return refractionBennettInverse(trueAlt);
}

/** Inverse: observed altitude → true geometric altitude. */
export function unrefract(apparentAlt: number): number {
  return refractionBennett(apparentAlt);
}

export {
  toJulianDate,
  gmst,
  equationOfEquinoxes,
  gast,
  lst,
  precessionMatrixIAU2006,
  nutationIAU2000B,
  meanObliquity,
  trueObliquity,
};
export type { JulianDate, Nutation };
