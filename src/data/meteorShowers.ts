/**
 * Major meteor showers — approximate radiant positions and activity windows.
 *
 * Data is approximate (peak dates vary by a day or two year-to-year). Radiant
 * positions are given in J2000 RA/Dec. ZHR = Zenithal Hourly Rate at peak.
 *
 * Sources: IMO (International Meteor Organization), AMS.
 */

export interface MeteorShower {
  id: string;
  name: string;
  // Activity window (month, day) — start and end
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
  peakMonth: number;
  peakDay: number;
  // Radiant position (J2000)
  radiantRa: number;  // radians
  radiantDec: number; // radians
  zhr: number;        // Zenithal Hourly Rate at peak
  speed: number;      // km/s entry velocity
  parentBody: string; // comet or asteroid
  constellation: string;
}

const H = Math.PI / 12;   // RA hours → radians
const D = Math.PI / 180;  // Dec degrees → radians

export const METEOR_SHOWERS: MeteorShower[] = [
  {
    id: "qua",
    name: "Quadrantids",
    startMonth: 12, startDay: 28,
    endMonth: 1, endDay: 12,
    peakMonth: 1, peakDay: 4,
    radiantRa: 15.5 * H, radiantDec: 49.5 * D,
    zhr: 110, speed: 41, parentBody: "2003 EH1 (asteroid)",
    constellation: "Boo",
  },
  {
    id: "lyr",
    name: "Lyrids",
    startMonth: 4, startDay: 16,
    endMonth: 4, endDay: 25,
    peakMonth: 4, peakDay: 22,
    radiantRa: 18.17 * H, radiantDec: 33.9 * D,
    zhr: 18, speed: 49, parentBody: "C/1861 G1 Thatcher",
    constellation: "Lyr",
  },
  {
    id: "eta-aqr",
    name: "Eta Aquariids",
    startMonth: 4, startDay: 19,
    endMonth: 5, endDay: 28,
    peakMonth: 5, peakDay: 6,
    radiantRa: 22.5 * H, radiantDec: -1.0 * D,
    zhr: 50, speed: 66, parentBody: "1P/Halley",
    constellation: "Aqr",
  },
  {
    id: "delta-aqr",
    name: "Delta Aquariids",
    startMonth: 7, startDay: 12,
    endMonth: 8, endDay: 23,
    peakMonth: 7, peakDay: 30,
    radiantRa: 22.6 * H, radiantDec: -16.5 * D,
    zhr: 20, speed: 41, parentBody: "96P/Machholz",
    constellation: "Aqr",
  },
  {
    id: "per",
    name: "Perseids",
    startMonth: 7, startDay: 17,
    endMonth: 8, endDay: 24,
    peakMonth: 8, peakDay: 12,
    radiantRa: 3.2 * H, radiantDec: 58.1 * D,
    zhr: 100, speed: 59, parentBody: "109P/Swift-Tuttle",
    constellation: "Per",
  },
  {
    id: "ori",
    name: "Orionids",
    startMonth: 10, startDay: 2,
    endMonth: 11, endDay: 7,
    peakMonth: 10, peakDay: 21,
    radiantRa: 6.3 * H, radiantDec: 15.8 * D,
    zhr: 20, speed: 66, parentBody: "1P/Halley",
    constellation: "Ori",
  },
  {
    id: "leo",
    name: "Leonids",
    startMonth: 11, startDay: 6,
    endMonth: 11, endDay: 30,
    peakMonth: 11, peakDay: 17,
    radiantRa: 10.17 * H, radiantDec: 21.6 * D,
    zhr: 15, speed: 71, parentBody: "55P/Tempel-Tuttle",
    constellation: "Leo",
  },
  {
    id: "gem",
    name: "Geminids",
    startMonth: 12, startDay: 4,
    endMonth: 12, endDay: 20,
    peakMonth: 12, peakDay: 14,
    radiantRa: 7.5 * H, radiantDec: 32.5 * D,
    zhr: 120, speed: 35, parentBody: "3200 Phaethon (asteroid)",
    constellation: "Gem",
  },
  {
    id: "urs",
    name: "Ursids",
    startMonth: 12, startDay: 17,
    endMonth: 12, endDay: 26,
    peakMonth: 12, peakDay: 22,
    radiantRa: 14.4 * H, radiantDec: 76.0 * D,
    zhr: 10, speed: 33, parentBody: "8P/Tuttle",
    constellation: "UMi",
  },
];

/**
 * Check if a given date falls within a shower's activity window.
 * Handles year-wrap (e.g. Quadrantids spans Dec 28 – Jan 12).
 */
export function isShowerActive(shower: MeteorShower, date: Date): boolean {
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const md = m * 100 + d;
  const start = shower.startMonth * 100 + shower.startDay;
  const end = shower.endMonth * 100 + shower.endDay;
  if (start <= end) {
    return md >= start && md <= end;
  }
  // wraps year boundary
  return md >= start || md <= end;
}

/**
 * Get the number of days until the next peak for a shower.
 * Returns 0 if today is the peak (±1 day).
 */
export function daysToPeak(shower: MeteorShower, date: Date): number {
  const now = date.getTime();
  const year = date.getUTCFullYear();
  // Try this year's peak
  let peak = Date.UTC(year, shower.peakMonth - 1, shower.peakDay);
  let diff = Math.round((peak - now) / 86400000);
  if (diff < -1) {
    // Try next year
    peak = Date.UTC(year + 1, shower.peakMonth - 1, shower.peakDay);
    diff = Math.round((peak - now) / 86400000);
  }
  return diff;
}

/** Get currently active meteor showers for a given date. */
export function getActiveShowers(date: Date): MeteorShower[] {
  return METEOR_SHOWERS.filter((s) => isShowerActive(s, date));
}

/** Get the next upcoming shower (active or not) sorted by days to peak. */
export function getNextShower(date: Date): MeteorShower | null {
  const sorted = [...METEOR_SHOWERS]
    .map((s) => ({ s, d: daysToPeak(s, date) }))
    .sort((a, b) => a.d - b.d);
  return sorted.length > 0 ? sorted[0].s : null;
}
