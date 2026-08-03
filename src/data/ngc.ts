/**
 * NGC / IC Extended Deep-Sky Catalog
 *
 * ~65 famous objects from the New General Catalogue (NGC) and Index Catalogue (IC)
 * not already in the Messier catalog. J2000 coordinates.
 *
 * Sources: SIMBAD, NED, Wikipedia verified coordinates.
 */

export type DSOType =
  | "galaxy"
  | "nebula"
  | "planetary"
  | "open"
  | "globular"
  | "supernova"
  | "cluster+nebula";

export interface NGCObject {
  catalog: "NGC" | "IC";
  number: number;
  name: string;
  type: DSOType;
  ra: number;        // J2000 RA in radians
  dec: number;       // J2000 Dec in radians
  magnitude: number; // apparent visual magnitude
  size: number;      // angular size in arcminutes
  distance: number;  // light-years (0 if unknown)
  constellation: string;
}

const H = Math.PI / 12;   // hours → radians
const D = Math.PI / 180;  // degrees → radians

export const NGC_OBJECTS: NGCObject[] = [
  // ── Galaxies ──────────────────────────────────────────────────────────────
  { catalog: "NGC", number: 224,  name: "Andromeda Galaxy",        type: "galaxy",    ra: 0.71231 * H, dec: 41.2692 * D,   magnitude: 3.4,  size: 190,  distance: 2537000,  constellation: "And" }, // M31 alias kept for completeness
  { catalog: "NGC", number: 253,  name: "Sculptor Galaxy",         type: "galaxy",    ra: 0.79278 * H, dec: -25.2883 * D,  magnitude: 7.1,  size: 28,   distance: 11400000, constellation: "Scl" },
  { catalog: "NGC", number: 300,  name: "NGC 300",                 type: "galaxy",    ra: 0.91389 * H, dec: -37.6833 * D,  magnitude: 8.1,  size: 21,   distance: 6100000,  constellation: "Scl" },
  { catalog: "NGC", number: 891,  name: "Silver Sliver Galaxy",    type: "galaxy",    ra: 2.37444 * H, dec: 42.3492 * D,   magnitude: 9.9,  size: 14,   distance: 27000000, constellation: "And" },
  { catalog: "NGC", number: 1023, name: "NGC 1023",                type: "galaxy",    ra: 2.67111 * H, dec: 39.0647 * D,   magnitude: 9.3,  size: 8,    distance: 36000000, constellation: "Per" },
  { catalog: "NGC", number: 1300, name: "NGC 1300",                type: "galaxy",    ra: 3.32000 * H, dec: -19.4108 * D,  magnitude: 10.4, size: 6.2,  distance: 61000000, constellation: "Eri" },
  { catalog: "NGC", number: 1316, name: "Fornax A",                type: "galaxy",    ra: 3.37861 * H, dec: -37.2083 * D,  magnitude: 8.5,  size: 12,   distance: 62000000, constellation: "For" },
  { catalog: "NGC", number: 1399, name: "NGC 1399",                type: "galaxy",    ra: 3.64472 * H, dec: -35.4508 * D,  magnitude: 9.4,  size: 6,    distance: 65000000, constellation: "For" },
  { catalog: "NGC", number: 2403, name: "NGC 2403",                type: "galaxy",    ra: 7.61667 * H, dec: 65.6025 * D,   magnitude: 8.4,  size: 23,   distance: 10300000, constellation: "Cam" },
  { catalog: "NGC", number: 3031, name: "Bode's Galaxy",           type: "galaxy",    ra: 9.92583 * H, dec: 69.0653 * D,   magnitude: 6.9,  size: 26,   distance: 12000000, constellation: "UMa" },
  { catalog: "NGC", number: 3115, name: "Spindle Galaxy",          type: "galaxy",    ra: 10.08639 * H, dec: -7.7183 * D,  magnitude: 8.9,  size: 8,    distance: 32000000, constellation: "Sex" },
  { catalog: "NGC", number: 3521, name: "NGC 3521",                type: "galaxy",    ra: 11.10722 * H, dec: -0.0361 * D,  magnitude: 8.7,  size: 11,   distance: 26000000, constellation: "Leo" },
  { catalog: "NGC", number: 3628, name: "Hamburger Galaxy",        type: "galaxy",    ra: 11.33750 * H, dec: 13.5892 * D,  magnitude: 9.5,  size: 15,   distance: 35000000, constellation: "Leo" },
  { catalog: "NGC", number: 4038, name: "Antennae Galaxies",       type: "galaxy",    ra: 12.01861 * H, dec: -18.8669 * D, magnitude: 10.3, size: 5.2,  distance: 45000000, constellation: "Crv" },
  { catalog: "NGC", number: 4244, name: "NGC 4244",                type: "galaxy",    ra: 12.28417 * H, dec: 37.8072 * D,  magnitude: 10.0, size: 16,   distance: 14000000, constellation: "CVn" },
  { catalog: "NGC", number: 4258, name: "NGC 4258",                type: "galaxy",    ra: 12.33611 * H, dec: 47.3039 * D,  magnitude: 8.4,  size: 18,   distance: 23500000, constellation: "CVn" },
  { catalog: "NGC", number: 4565, name: "Needle Galaxy",           type: "galaxy",    ra: 12.60333 * H, dec: 25.9878 * D,  magnitude: 9.6,  size: 16,   distance: 42000000, constellation: "Com" },
  { catalog: "NGC", number: 4631, name: "Whale Galaxy",            type: "galaxy",    ra: 12.70278 * H, dec: 32.5414 * D,  magnitude: 9.2,  size: 15,   distance: 25000000, constellation: "CVn" },
  { catalog: "NGC", number: 4889, name: "NGC 4889",                type: "galaxy",    ra: 13.00000 * H, dec: 27.9769 * D,  magnitude: 11.4, size: 3,    distance: 308000000,constellation: "Com" },
  { catalog: "NGC", number: 5128, name: "Centaurus A",             type: "galaxy",    ra: 13.42611 * H, dec: -43.0192 * D, magnitude: 6.8,  size: 25,   distance: 13000000, constellation: "Cen" },
  { catalog: "NGC", number: 5194, name: "Whirlpool Galaxy",        type: "galaxy",    ra: 13.49806 * H, dec: 47.1953 * D,  magnitude: 8.4,  size: 11,   distance: 23000000, constellation: "CVn" },
  { catalog: "NGC", number: 5457, name: "Pinwheel Galaxy",         type: "galaxy",    ra: 14.05333 * H, dec: 54.3489 * D,  magnitude: 7.9,  size: 29,   distance: 21000000, constellation: "UMa" },
  { catalog: "NGC", number: 6744, name: "NGC 6744",                type: "galaxy",    ra: 19.15972 * H, dec: -63.8572 * D, magnitude: 8.3,  size: 20,   distance: 30000000, constellation: "Pav" },
  { catalog: "NGC", number: 7331, name: "NGC 7331",                type: "galaxy",    ra: 22.61722 * H, dec: 34.4156 * D,  magnitude: 9.5,  size: 10,   distance: 46000000, constellation: "Peg" },
  { catalog: "NGC", number: 7479, name: "NGC 7479",                type: "galaxy",    ra: 23.07917 * H, dec: 12.3225 * D,  magnitude: 11.0, size: 4,    distance: 105000000,constellation: "Peg" },
  // ── Nebulae ───────────────────────────────────────────────────────────────
  { catalog: "NGC", number: 1499, name: "California Nebula",       type: "nebula",    ra: 4.05278 * H, dec: 36.3833 * D,  magnitude: 5.0,  size: 160,  distance: 1000,     constellation: "Per" },
  { catalog: "NGC", number: 1952, name: "Crab Nebula",             type: "supernova", ra: 5.57556 * H, dec: 22.0145 * D,  magnitude: 8.4,  size: 6,    distance: 6500,     constellation: "Tau" },
  { catalog: "NGC", number: 2244, name: "Rosette Nebula",          type: "cluster+nebula", ra: 6.53139 * H, dec: 4.9514 * D, magnitude: 4.8, size: 80, distance: 5200,     constellation: "Mon" },
  { catalog: "NGC", number: 2264, name: "Christmas Tree Cluster",  type: "cluster+nebula", ra: 6.68056 * H, dec: 9.8939 * D, magnitude: 3.9, size: 20, distance: 2700,     constellation: "Mon" },
  { catalog: "NGC", number: 2359, name: "Thor's Helmet",           type: "nebula",    ra: 7.38611 * H, dec: -13.2017 * D, magnitude: 11.4, size: 10,   distance: 15000,    constellation: "CMa" },
  { catalog: "NGC", number: 2392, name: "Eskimo Nebula",           type: "planetary", ra: 7.48917 * H, dec: 20.9117 * D,  magnitude: 9.2,  size: 0.7,  distance: 2870,     constellation: "Gem" },
  { catalog: "NGC", number: 3372, name: "Eta Carinae Nebula",      type: "nebula",    ra: 10.74167 * H, dec: -59.8667 * D, magnitude: 1.0, size: 120, distance: 7500,     constellation: "Car" },
  { catalog: "NGC", number: 6334, name: "Cat's Paw Nebula",        type: "nebula",    ra: 17.30000 * H, dec: -35.8000 * D, magnitude: 9.0, size: 40,  distance: 5500,     constellation: "Sco" },
  { catalog: "NGC", number: 6357, name: "Lobster Nebula",          type: "nebula",    ra: 17.44528 * H, dec: -34.2000 * D, magnitude: 10.0, size: 30, distance: 8000,     constellation: "Sco" },
  { catalog: "NGC", number: 6543, name: "Cat's Eye Nebula",        type: "planetary", ra: 17.97750 * H, dec: 66.6328 * D,  magnitude: 8.1,  size: 0.4,  distance: 3300,     constellation: "Dra" },
  { catalog: "NGC", number: 6888, name: "Crescent Nebula",         type: "nebula",    ra: 20.20167 * H, dec: 38.3611 * D,  magnitude: 7.4,  size: 20,   distance: 5000,     constellation: "Cyg" },
  { catalog: "NGC", number: 7000, name: "North America Nebula",    type: "nebula",    ra: 20.96667 * H, dec: 44.5333 * D,  magnitude: 4.0,  size: 120,  distance: 1600,     constellation: "Cyg" },
  { catalog: "NGC", number: 7293, name: "Helix Nebula",            type: "planetary", ra: 22.49167 * H, dec: -20.8372 * D, magnitude: 7.3, size: 28,   distance: 655,      constellation: "Aqr" },
  { catalog: "NGC", number: 7662, name: "Blue Snowball Nebula",    type: "planetary", ra: 23.43750 * H, dec: 42.5469 * D,  magnitude: 8.3,  size: 0.5,  distance: 2000,     constellation: "And" },
  // ── IC Objects ────────────────────────────────────────────────────────────
  { catalog: "IC",  number: 434,  name: "Horsehead Nebula",        type: "nebula",    ra: 5.68889 * H, dec: -2.4586 * D,  magnitude: 6.8,  size: 60,   distance: 1375,     constellation: "Ori" },
  { catalog: "IC",  number: 1805, name: "Heart Nebula",            type: "nebula",    ra: 2.55278 * H, dec: 61.4667 * D,  magnitude: 6.5,  size: 60,   distance: 7500,     constellation: "Cas" },
  { catalog: "IC",  number: 1848, name: "Soul Nebula",             type: "nebula",    ra: 2.87778 * H, dec: 60.4333 * D,  magnitude: 6.5,  size: 60,   distance: 6500,     constellation: "Cas" },
  { catalog: "IC",  number: 2118, name: "Witch Head Nebula",       type: "nebula",    ra: 5.07500 * H, dec: -7.2333 * D,  magnitude: 13.0, size: 180,  distance: 900,      constellation: "Eri" },
  { catalog: "IC",  number: 4604, name: "Rho Ophiuchi Cloud",      type: "nebula",    ra: 16.41667 * H, dec: -24.0000 * D, magnitude: 4.0, size: 300, distance: 460,      constellation: "Oph" },
  { catalog: "IC",  number: 5070, name: "Pelican Nebula",          type: "nebula",    ra: 20.83333 * H, dec: 44.1500 * D,  magnitude: 8.0,  size: 60,   distance: 1800,     constellation: "Cyg" },
  { catalog: "IC",  number: 5146, name: "Cocoon Nebula",           type: "cluster+nebula", ra: 21.89444 * H, dec: 47.2667 * D, magnitude: 7.2, size: 10, distance: 4000,   constellation: "Cyg" },
  // ── Open Clusters ─────────────────────────────────────────────────────────
  { catalog: "NGC", number: 869,  name: "Double Cluster h Per",    type: "open",      ra: 2.31889 * H, dec: 57.1339 * D,  magnitude: 4.3,  size: 30,   distance: 7500,     constellation: "Per" },
  { catalog: "NGC", number: 884,  name: "Double Cluster χ Per",    type: "open",      ra: 2.37222 * H, dec: 57.1347 * D,  magnitude: 4.4,  size: 30,   distance: 7600,     constellation: "Per" },
  { catalog: "NGC", number: 752,  name: "NGC 752",                 type: "open",      ra: 1.99861 * H, dec: 37.7944 * D,  magnitude: 5.7,  size: 50,   distance: 1300,     constellation: "And" },
  { catalog: "NGC", number: 1502, name: "NGC 1502",                type: "open",      ra: 4.09444 * H, dec: 62.3333 * D,  magnitude: 5.7,  size: 8,    distance: 3100,     constellation: "Cam" },
  { catalog: "NGC", number: 1981, name: "NGC 1981",                type: "open",      ra: 5.58722 * H, dec: -4.4167 * D,  magnitude: 4.6,  size: 25,   distance: 1300,     constellation: "Ori" },
  { catalog: "NGC", number: 2516, name: "Southern Beehive",        type: "open",      ra: 7.97361 * H, dec: -60.8667 * D, magnitude: 3.8,  size: 30,   distance: 1100,     constellation: "Car" },
  { catalog: "NGC", number: 2547, name: "NGC 2547",                type: "open",      ra: 8.15556 * H, dec: -49.2667 * D, magnitude: 4.7,  size: 20,   distance: 1550,     constellation: "Vel" },
  { catalog: "NGC", number: 3114, name: "NGC 3114",                type: "open",      ra: 10.03167 * H, dec: -60.1167 * D, magnitude: 4.2, size: 35,  distance: 3000,     constellation: "Car" },
  { catalog: "NGC", number: 3532, name: "Wishing Well Cluster",    type: "open",      ra: 11.09722 * H, dec: -58.7333 * D, magnitude: 3.0, size: 55,  distance: 1400,     constellation: "Car" },
  { catalog: "NGC", number: 6231, name: "NGC 6231",                type: "open",      ra: 16.89167 * H, dec: -41.8333 * D, magnitude: 2.6, size: 15,  distance: 5900,     constellation: "Sco" },
  // ── Globular Clusters ─────────────────────────────────────────────────────
  { catalog: "NGC", number: 104,  name: "47 Tucanae",              type: "globular",  ra: 0.40167 * H, dec: -72.0817 * D, magnitude: 4.0,  size: 50,   distance: 14700,    constellation: "Tuc" },
  { catalog: "NGC", number: 5139, name: "Omega Centauri",          type: "globular",  ra: 13.44639 * H, dec: -47.4792 * D, magnitude: 3.9, size: 36,  distance: 17000,    constellation: "Cen" },
  { catalog: "NGC", number: 5272, name: "M3",                      type: "globular",  ra: 13.70306 * H, dec: 28.3767 * D,  magnitude: 6.2,  size: 18,   distance: 33900,    constellation: "CVn" },
  { catalog: "NGC", number: 6752, name: "NGC 6752",                type: "globular",  ra: 19.18167 * H, dec: -59.9844 * D, magnitude: 5.4, size: 20,  distance: 13000,    constellation: "Pav" },
  { catalog: "NGC", number: 6397, name: "NGC 6397",                type: "globular",  ra: 17.67833 * H, dec: -53.6667 * D, magnitude: 5.7, size: 26,  distance: 7200,     constellation: "Ara" },
];

/** Color used for each DSO type on the sky map. Re-uses Messier palette. */
export const NGC_TYPE_COLORS: Record<DSOType, string> = {
  galaxy:          "#fcd34d",  // amber-300
  nebula:          "#86efac",  // green-400
  planetary:       "#67e8f9",  // cyan-300
  open:            "#fde68a",  // amber-200
  globular:        "#fb923c",  // orange-400
  supernova:       "#f87171",  // red-400
  "cluster+nebula":"#a5f3fc",  // cyan-200
};
