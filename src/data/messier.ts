/**
 * Messier Catalog — curated subset of ~30 of the most famous deep-sky objects
 * from Charles Messier's 18th-century catalog. J2000 coordinates.
 *
 * Each entry stores:
 *  - number       — Messier number (e.g. 31 for M31)
 *  - name         — common name (e.g. "Andromeda Galaxy")
 *  - type         — object classification
 *  - ra           — J2000 Right Ascension in radians (RA hours × π/12)
 *  - dec          — J2000 Declination in radians (Dec degrees × π/180)
 *  - magnitude    — apparent visual magnitude (integrated)
 *  - size         — angular size in arcminutes (largest dimension)
 *  - distance     — distance in light-years (0 if unknown)
 *  - constellation — IAU 3-letter constellation abbreviation
 *
 * Sources: SIMBAD, SEDS Messier database, NED. Coordinates are ICRS/J2000 to ~1".
 */

export type MessierType =
  | "galaxy"
  | "nebula"
  | "planetary"
  | "open"
  | "globular"
  | "supernova";

export interface MessierObject {
  number: number;
  name: string;
  type: MessierType;
  ra: number;        // J2000 RA in radians
  dec: number;       // J2000 Dec in radians
  magnitude: number; // apparent visual magnitude
  size: number;      // angular size in arcminutes (largest dimension)
  distance: number;  // light-years (0 if unknown)
  constellation: string; // IAU abbr
}

// Conversion helpers — multiply decimal hours/degrees to radians.
const H = Math.PI / 12;  // 1 hour RA → radians
const D = Math.PI / 180; // 1 degree → radians

/**
 * The 30 most-observed Messier objects. Ordered by Messier number.
 * RA/Dec values are J2000 mean equator/equinox from SIMBAD.
 */
export const MESSIER: MessierObject[] = [
  {
    number: 1,
    name: "Crab Nebula",
    type: "supernova",
    ra: 5.575539 * H,
    dec: 22.0145 * D,
    magnitude: 8.4,
    size: 6,
    distance: 6500,
    constellation: "Tau",
  },
  {
    number: 3,
    name: "M3",
    type: "globular",
    ra: 13.703222 * H,
    dec: 28.38667 * D,
    magnitude: 6.2,
    size: 18,
    distance: 33900,
    constellation: "CVn",
  },
  {
    number: 5,
    name: "M5",
    type: "globular",
    ra: 15.309389 * H,
    dec: 2.08278 * D,
    magnitude: 5.7,
    size: 23,
    distance: 24500,
    constellation: "Ser",
  },
  {
    number: 8,
    name: "Lagoon Nebula",
    type: "nebula",
    ra: 18.060278 * H,
    dec: -24.38667 * D,
    magnitude: 6.0,
    size: 90,
    distance: 4100,
    constellation: "Sgr",
  },
  {
    number: 10,
    name: "M10",
    type: "globular",
    ra: 16.952472 * H,
    dec: -4.10056 * D,
    magnitude: 6.6,
    size: 20,
    distance: 14300,
    constellation: "Oph",
  },
  {
    number: 11,
    name: "Wild Duck Cluster",
    type: "open",
    ra: 18.851389 * H,
    dec: -6.27 * D,
    magnitude: 6.3,
    size: 14,
    distance: 6120,
    constellation: "Sct",
  },
  {
    number: 12,
    name: "M12",
    type: "globular",
    ra: 16.787361 * H,
    dec: -1.94778 * D,
    magnitude: 6.7,
    size: 16,
    distance: 15900,
    constellation: "Oph",
  },
  {
    number: 13,
    name: "Hercules Cluster",
    type: "globular",
    ra: 16.694833 * H,
    dec: 36.45972 * D,
    magnitude: 5.8,
    size: 20,
    distance: 22200,
    constellation: "Her",
  },
  {
    number: 15,
    name: "M15",
    type: "globular",
    ra: 21.499528 * H,
    dec: 12.16667 * D,
    magnitude: 6.2,
    size: 18,
    distance: 33600,
    constellation: "Peg",
  },
  {
    number: 16,
    name: "Eagle Nebula",
    type: "nebula",
    ra: 18.313333 * H,
    dec: -13.78333 * D,
    magnitude: 6.4,
    size: 35,
    distance: 7000,
    constellation: "Ser",
  },
  {
    number: 17,
    name: "Omega Nebula",
    type: "nebula",
    ra: 18.340556 * H,
    dec: -16.17667 * D,
    magnitude: 6.0,
    size: 11,
    distance: 5500,
    constellation: "Sgr",
  },
  {
    number: 20,
    name: "Trifid Nebula",
    type: "nebula",
    ra: 18.039722 * H,
    dec: -23.06333 * D,
    magnitude: 6.3,
    size: 28,
    distance: 5200,
    constellation: "Sgr",
  },
  {
    number: 22,
    name: "M22",
    type: "globular",
    ra: 18.606639 * H,
    dec: -23.90472 * D,
    magnitude: 5.1,
    size: 32,
    distance: 10600,
    constellation: "Sgr",
  },
  {
    number: 27,
    name: "Dumbbell Nebula",
    type: "planetary",
    ra: 19.993556 * H,
    dec: 22.72111 * D,
    magnitude: 7.5,
    size: 8,
    distance: 1360,
    constellation: "Vul",
  },
  {
    number: 31,
    name: "Andromeda Galaxy",
    type: "galaxy",
    ra: 0.712306 * H,
    dec: 41.26917 * D,
    magnitude: 3.4,
    size: 190,
    distance: 2537000,
    constellation: "And",
  },
  {
    number: 33,
    name: "Triangulum Galaxy",
    type: "galaxy",
    ra: 1.564139 * H,
    dec: 30.66056 * D,
    magnitude: 5.7,
    size: 70,
    distance: 2723000,
    constellation: "Tri",
  },
  {
    number: 42,
    name: "Orion Nebula",
    type: "nebula",
    ra: 5.588139 * H,
    dec: -5.39111 * D,
    magnitude: 4.0,
    size: 85,
    distance: 1344,
    constellation: "Ori",
  },
  {
    number: 43,
    name: "De Mairan's Nebula",
    type: "nebula",
    ra: 5.591944 * H,
    dec: -5.26972 * D,
    magnitude: 9.0,
    size: 20,
    distance: 1344,
    constellation: "Ori",
  },
  {
    number: 44,
    name: "Beehive Cluster",
    type: "open",
    ra: 8.672778 * H,
    dec: 19.66667 * D,
    magnitude: 3.7,
    size: 95,
    distance: 577,
    constellation: "Cnc",
  },
  {
    number: 45,
    name: "Pleiades",
    type: "open",
    ra: 3.79 * H,
    dec: 24.11667 * D,
    magnitude: 1.6,
    size: 110,
    distance: 444,
    constellation: "Tau",
  },
  {
    number: 51,
    name: "Whirlpool Galaxy",
    type: "galaxy",
    ra: 13.497972 * H,
    dec: 47.19528 * D,
    magnitude: 8.4,
    size: 11,
    distance: 23000000,
    constellation: "CVn",
  },
  {
    number: 56,
    name: "M56",
    type: "globular",
    ra: 19.893194 * H,
    dec: 30.18333 * D,
    magnitude: 8.3,
    size: 8.2,
    distance: 32900,
    constellation: "Lyr",
  },
  {
    number: 57,
    name: "Ring Nebula",
    type: "planetary",
    ra: 18.893083 * H,
    dec: 33.02917 * D,
    magnitude: 8.8,
    size: 1.4,
    distance: 2300,
    constellation: "Lyr",
  },
  {
    number: 71,
    name: "M71",
    type: "globular",
    ra: 19.896139 * H,
    dec: 18.77833 * D,
    magnitude: 8.2,
    size: 7.2,
    distance: 12700,
    constellation: "Sge",
  },
  {
    number: 78,
    name: "M78",
    type: "nebula",
    ra: 5.779639 * H,
    dec: 0.08167 * D,
    magnitude: 8.3,
    size: 8,
    distance: 1600,
    constellation: "Ori",
  },
  {
    number: 81,
    name: "Bode's Galaxy",
    type: "galaxy",
    ra: 9.925889 * H,
    dec: 69.06528 * D,
    magnitude: 6.9,
    size: 26,
    distance: 12000000,
    constellation: "UMa",
  },
  {
    number: 82,
    name: "Cigar Galaxy",
    type: "galaxy",
    ra: 9.931306 * H,
    dec: 69.67972 * D,
    magnitude: 8.4,
    size: 11,
    distance: 12000000,
    constellation: "UMa",
  },
  {
    number: 97,
    name: "Owl Nebula",
    type: "planetary",
    ra: 11.248056 * H,
    dec: 55.02833 * D,
    magnitude: 9.9,
    size: 3.4,
    distance: 2030,
    constellation: "UMa",
  },
  {
    number: 101,
    name: "Pinwheel Galaxy",
    type: "galaxy",
    ra: 14.053472 * H,
    dec: 54.34889 * D,
    magnitude: 7.9,
    size: 28.8,
    distance: 21000000,
    constellation: "UMa",
  },
  {
    number: 104,
    name: "Sombrero Galaxy",
    type: "galaxy",
    ra: 12.6665 * H,
    dec: -11.62306 * D,
    magnitude: 8.0,
    size: 9,
    distance: 31000000,
    constellation: "Vir",
  },
];

/** Quick lookup by Messier number. */
export const MESSIER_BY_NUMBER = new Map<number, MessierObject>(
  MESSIER.map((m) => [m.number, m])
);

/** Color used for each Messier type when rendering on the sky map. */
export const MESSIER_TYPE_COLORS: Record<MessierType, string> = {
  galaxy: "#fcd34d",      // amber-300
  nebula: "#86efac",      // green-400
  planetary: "#67e8f9",   // cyan-300
  open: "#fde68a",        // amber-200
  globular: "#fb923c",    // orange-400
  supernova: "#f87171",   // red-400
};
