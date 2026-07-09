/**
 * Astronomical Time Calculations
 *
 * Implements:
 *  - Julian Date (JD) and Modified Julian Date (MJD)
 *  - Julian Century (TT) for IAU 2006 precession
 *  - Greenwich Mean Sidereal Time (GMST) — IAU 1982 / 2006 consistent
 *  - Greenwich Apparent Sidereal Time (GAST) — via equation of equinoxes
 *  - Local Sidereal Time (LST)
 *  - Delta T (TT - UT1) approximation (Espenak-Meeus 2006 polynomial)
 *
 * References:
 *  - IAU 1982 GMST formula (re-expressed in terms of UT1)
 *  - Meeus, "Astronomical Algorithms", 2nd ed.
 *  - USNO Circular 179
 *
 * All angles internally in radians unless noted.
 */

export interface JulianDate {
  jd: number;       // Julian Date (UT1 scale; the day count)
  jdUt1: number;    // JD on UT1 scale
  jdTt: number;     // JD on TT scale
  jdTai: number;    // JD on TAI scale
  mjd: number;      // Modified Julian Date (JD - 2400000.5)
  deltaT: number;   // TT - UT1 in seconds
}

/** Convert a JavaScript Date (UTC) to Julian Date on multiple time scales. */
export function toJulianDate(date: Date): JulianDate {
  const jdUt1 = dateToJD(date);
  const deltaT = deltaTSeconds(date);
  const jdTt = jdUt1 + deltaT / 86400.0;
  const jdTai = jdTt - 32.184 / 86400.0;
  const mjd = jdUt1 - 2400000.5;

  return { jd: jdUt1, jdUt1, jdTt, jdTai, mjd, deltaT };
}

/** Standard conversion: Gregorian calendar (UTC) -> Julian Date. */
export function dateToJD(date: Date): number {
  const year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const fraction =
    (date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600 +
      date.getUTCMilliseconds() / 3.6e6) /
    24;

  let Y = year;
  let M = month;
  if (M <= 2) {
    Y = year - 1;
    M = month + 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);

  const jd =
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    day +
    B -
    1524.5 +
    fraction;

  return jd;
}

/** Inverse: JD (UT1) -> JavaScript Date (UTC). */
export function jdToDate(jd: number): Date {
  const jd0 = jd + 0.5;
  const Z = Math.floor(jd0);
  const F = jd0 - Z;
  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  const dayFloor = Math.floor(day);
  const dayFrac = day - dayFloor;
  const totalHours = dayFrac * 24;
  const h = Math.floor(totalHours);
  const m = Math.floor((totalHours - h) * 60);
  const s = (totalHours - h - m / 60) * 60;

  return new Date(
    Date.UTC(year, month - 1, dayFloor, h, m, Math.floor(s), Math.floor((s - Math.floor(s)) * 1000))
  );
}

/** Julian centuries since J2000.0 on the TT scale. T = (JD_TT - 2451545.0) / 36525 */
export function julianCenturyTT(jdTt: number): number {
  return (jdTt - 2451545.0) / 36525.0;
}

/** Julian centuries since J2000.0 on the UT1 scale. */
export function julianCenturyUT1(jdUt1: number): number {
  return (jdUt1 - 2451545.0) / 36525.0;
}

/**
 * Greenwich Mean Sidereal Time (radians) using IAU 1982 formula
 * re-expressed via UT1. Accurate to ~1 mas.
 */
export function gmst(jdUt1: number): number {
  const Tu = julianCenturyUT1(jdUt1);
  let gmstSec =
    67310.54841 +
    (876600.0 * 3600.0 + 8640184.812866) * Tu +
    0.093104 * Tu * Tu -
    6.2e-6 * Tu * Tu * Tu;

  let gmstRad = (gmstSec % 86400.0) * (Math.PI / 43200.0);
  if (gmstRad < 0) gmstRad += 2 * Math.PI;
  return gmstRad;
}

/** Equation of the equinoxes (radians): apparent - mean sidereal time. */
export function equationOfEquinoxes(nutationLon: number, obliquity: number): number {
  return nutationLon * Math.cos(obliquity);
}

/** Greenwich Apparent Sidereal Time (radians). */
export function gast(gmstRad: number, eqEq: number): number {
  let v = gmstRad + eqEq;
  v = v % (2 * Math.PI);
  if (v < 0) v += 2 * Math.PI;
  return v;
}

/** Local Sidereal Time (radians) = GAST + observer longitude (east positive). */
export function lst(gastRad: number, longitudeEast: number): number {
  let v = gastRad + longitudeEast;
  v = v % (2 * Math.PI);
  if (v < 0) v += 2 * Math.PI;
  return v;
}

/**
 * ΔT (TT - UT1) in seconds. Espenak & Meeus (2006) polynomial fit.
 * Adequate for years 2005-2050 to within a few seconds.
 */
export function deltaTSeconds(date: Date): number {
  const year = date.getUTCFullYear() + (date.getUTCMonth() + 1) / 12;
  const y = year;
  if (y >= 2005 && y < 2050) {
    const t = y - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t * t;
  }
  if (y >= 2050 && y < 2150) {
    return -20.0 + 32.0 * Math.pow((y - 1820) / 100, 2) - 0.5628 * (2150 - y);
  }
  if (y >= 1986 && y < 2005) {
    const t = y - 2000;
    return (
      63.86 + 0.3345 * t - 0.060374 * t * t +
      0.0017275 * t * t * t + 0.000651814 * t * t * t * t +
      0.00002373599 * t * t * t * t * t
    );
  }
  const t = (y - 2000) / 100;
  return 102.0 + 102.0 * t + 25.3 * t * t;
}

/** Leap seconds (TAI - UTC) for a given date. */
export function leapSeconds(date: Date): number {
  const t = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
  const epochs: [number, number][] = [
    [Date.UTC(1972, 0, 1), 10],
    [Date.UTC(1972, 6, 1), 11],
    [Date.UTC(1973, 0, 1), 12],
    [Date.UTC(1974, 0, 1), 13],
    [Date.UTC(1975, 0, 1), 14],
    [Date.UTC(1976, 0, 1), 15],
    [Date.UTC(1977, 0, 1), 16],
    [Date.UTC(1978, 0, 1), 17],
    [Date.UTC(1979, 0, 1), 18],
    [Date.UTC(1980, 0, 1), 19],
    [Date.UTC(1981, 6, 1), 20],
    [Date.UTC(1982, 6, 1), 21],
    [Date.UTC(1983, 6, 1), 22],
    [Date.UTC(1985, 6, 1), 23],
    [Date.UTC(1988, 0, 1), 24],
    [Date.UTC(1990, 0, 1), 25],
    [Date.UTC(1991, 0, 1), 26],
    [Date.UTC(1992, 6, 1), 27],
    [Date.UTC(1993, 6, 1), 28],
    [Date.UTC(1994, 6, 1), 29],
    [Date.UTC(1996, 0, 1), 30],
    [Date.UTC(1997, 6, 1), 31],
    [Date.UTC(1999, 0, 1), 32],
    [Date.UTC(2006, 0, 1), 33],
    [Date.UTC(2009, 0, 1), 34],
    [Date.UTC(2012, 6, 1), 35],
    [Date.UTC(2015, 6, 1), 36],
    [Date.UTC(2017, 0, 1), 37],
  ];
  let ls = 0;
  for (const [epoch, val] of epochs) {
    if (t >= epoch) ls = val;
    else break;
  }
  return ls;
}

/** Convert radians to HH:MM:SS.sss structure (used for RA / sidereal). */
export function radToHms(rad: number): { h: number; m: number; s: number } {
  let hours = (rad * 12) / Math.PI;
  hours = ((hours % 24) + 24) % 24;
  const h = Math.floor(hours);
  const mFloat = (hours - h) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return { h, m, s };
}

/** Convert radians to ±DD:MM:SS.s structure (used for Dec). */
export function radToDms(rad: number, signed = true): { sign: string; d: number; m: number; s: number } {
  const sign = rad < 0 ? "-" : "+";
  const r = Math.abs(rad);
  const deg = (r * 180) / Math.PI;
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return { sign: signed ? sign : "", d, m, s };
}

/** Format radians as HHh MMm SS.ss s string. */
export function formatHMS(rad: number, secondsDigits = 2): string {
  const { h, m, s } = radToHms(rad);
  const sStr = s.toFixed(secondsDigits).padStart(secondsDigits + 3, "0");
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${sStr}s`;
}

/** Format radians as ±DD° MM' SS.s" string. */
export function formatDMS(rad: number, secondsDigits = 1): string {
  const { sign, d, m, s } = radToDms(rad);
  const sStr = s.toFixed(secondsDigits).padStart(secondsDigits + 2, "0");
  return `${sign}${String(d).padStart(2, "0")}° ${String(m).padStart(2, "0")}' ${sStr}"`;
}

/** Format radians as decimal degrees string with sign. */
export function formatDeg(rad: number, digits = 4): string {
  return (((rad * 180) / Math.PI).toFixed(digits)) + "°";
}
