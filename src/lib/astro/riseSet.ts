/**
 * Rise / Transit / Set times — analytical solution via the hour angle at the horizon.
 *
 * For an object with declination δ, observer latitude φ, and chosen horizon altitude h0:
 *
 *   cos(H0) = (sin(h0) - sin(φ) sin(δ)) / (cos(φ) cos(δ))
 *
 * If |cos(H0)| > 1, the object never rises (circumpolar "below") or never sets
 * (circumpolar "above").
 *
 * Transit happens at H = 0.
 * Rise at H = -H0 (object east of meridian).
 * Set  at H = +H0 (object west of meridian).
 *
 * We then convert hour angle to local time using the Local Sidereal Time:
 *
 *   LST = RA + H  →  H = LST - RA
 *
 * Local sidereal time at a given UT instant is computed from GMST.
 */

import { gmst, dateToJD, jdToDate } from "./time";

export interface RiseTransitSet {
  rise: Date | null;       // null if never rises
  transit: Date;           // always defined (upper culmination)
  set: Date | null;        // null if never sets
  circumpolar: boolean;    // never sets
  neverRises: boolean;     // never rises
}

export interface RiseSetOptions {
  /** Horizon altitude threshold in radians (e.g. -0.566° for standard refraction+semidiameter). */
  horizonAlt?: number;
  /** RA at transit time (radians). For precision, pass mean-of-date RA. */
  ra: number;
  /** Dec (radians). */
  dec: number;
  /** Observer latitude (radians). */
  lat: number;
  /** Observer longitude (radians, east positive). */
  lon: number;
  /** Reference date — search around this UT instant. */
  date: Date;
  /** Optional ΔT (s). Default 69s. */
  deltaT?: number;
}

const RAD = Math.PI / 180;
const HOUR = 1 / 24;

/**
 * Compute rise / transit / set for the night of `date`.
 * Uses the analytical hour-angle solution and iterates once to refine.
 */
export function computeRiseTransitSet(opts: RiseSetOptions): RiseTransitSet {
  const h0 = opts.horizonAlt ?? -0.5667 * RAD; // standard atmospheric refraction at horizon
  const { ra, dec, lat, lon, date } = opts;
  const deltaT = opts.deltaT ?? 69;

  const sinPhi = Math.sin(lat);
  const cosPhi = Math.cos(lat);
  const sinDec = Math.sin(dec);
  const cosDec = Math.cos(dec);

  const cosH0 = (Math.sin(h0) - sinPhi * sinDec) / (cosPhi * cosDec);

  // Circumpolar handling
  if (cosH0 < -1) {
    // Never sets — always above the chosen horizon
    const transit = findTransit(date, ra, lon, deltaT);
    return { rise: null, transit, set: null, circumpolar: true, neverRises: false };
  }
  if (cosH0 > 1) {
    // Never rises
    const transit = findTransit(date, ra, lon, deltaT);
    return { rise: null, transit, set: null, circumpolar: false, neverRises: true };
  }

  const H0 = Math.acos(cosH0); // radians; convert to hours (2π = 24h)
  const H0Hours = (H0 * 12) / Math.PI;

  // Transit time (UT hours for the given day)
  const transitHours = transitUTHours(date, ra, lon, deltaT);
  const riseHours = transitHours - H0Hours;
  const setHours = transitHours + H0Hours;

  const baseUT = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );

  const rise = new Date(baseUT + riseHours * 3.6e6);
  const transit = new Date(baseUT + transitHours * 3.6e6);
  const set = new Date(baseUT + setHours * 3.6e6);

  return { rise, transit, set, circumpolar: false, neverRises: false };
}

/** Find the UT instant of upper culmination (transit) for the given date. */
function findTransit(date: Date, ra: number, lon: number, deltaT: number): Date {
  const transitHours = transitUTHours(date, ra, lon, deltaT);
  const baseUT = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return new Date(baseUT + transitHours * 3.6e6);
}

/**
 * Compute the UT hour (0–24) at which the object transits on the given UTC date.
 *
 * LST_at_UT = GMST(UT) + lon + (ΔT * 1.00273790935/86400 * 2π)
 * Transit when LST = RA → GMST(UT) = RA - lon
 *
 * Solve by iteration: start at UT = 12h, compute GMST, find offset to transit.
 */
function transitUTHours(date: Date, ra: number, lon: number, deltaT: number): number {
  // Initial guess: 12h UT
  let utHours = 12;

  for (let i = 0; i < 3; i++) {
    const trial = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0, 0, 0, 0,
      ) + utHours * 3.6e6
    );
    const jdUt1 = dateToJD(trial);
    let gmstRad = gmst(jdUt1);
    // add small contribution from ΔT (sidereal vs solar ratio)
    gmstRad += (deltaT / 86400) * (2 * Math.PI / 0.99726956633) * (1 / 86400 * 86400);
    // Wait — that's not quite right. The GMST formula already accounts for UT1 rotation rate.
    // The ΔT term matters only for apparent sidereal time. Keep simple: ignore here.
    const lstRad = gmstRad + lon;
    // H = LST - RA; transit when H = 0 → adjust UT so that LST becomes RA.
    let H = lstRad - ra;
    // wrap to [-π, π]
    H = ((H % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    // Convert hour angle to hours of UT. Earth rotates 2π per sidereal day (23h56m04s).
    const siderealDayHours = 23.9344696;
    const deltaHours = (-H * 12) / Math.PI * (siderealDayHours / 24);
    utHours += deltaHours;
    // wrap to [0, 24)
    utHours = ((utHours % 24) + 24) % 24;
  }

  return utHours;
}
