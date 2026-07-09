/**
 * IAU 88 constellations: abbreviations, full names, and genitive forms.
 *
 * Also includes the bright-star stick-figure line definitions for the most
 * recognizable constellations. Lines reference HIP numbers that must exist
 * in the bright star catalog (src/data/stars.ts).
 */

export interface ConstellationInfo {
  abbr: string;   // IAU 3-letter abbreviation, e.g. "UMa"
  name: string;   // nominative, e.g. "Ursa Major"
  genitive: string; // genitive, e.g. "Ursae Majoris"
  meaning: string;
  hemisphere: "N" | "S" | "E"; // Northern, Southern, Equatorial
}

export const CONSTELLATIONS: ConstellationInfo[] = [
  { abbr: "And", name: "Andromeda", genitive: "Andromedae", meaning: "The Princess", hemisphere: "N" },
  { abbr: "Ant", name: "Antlia", genitive: "Antliae", meaning: "The Air Pump", hemisphere: "S" },
  { abbr: "Aps", name: "Apus", genitive: "Apodis", meaning: "The Bird of Paradise", hemisphere: "S" },
  { abbr: "Aqr", name: "Aquarius", genitive: "Aquarii", meaning: "The Water Bearer", hemisphere: "E" },
  { abbr: "Aql", name: "Aquila", genitive: "Aquilae", meaning: "The Eagle", hemisphere: "E" },
  { abbr: "Ara", name: "Ara", genitive: "Arae", meaning: "The Altar", hemisphere: "S" },
  { abbr: "Ari", name: "Aries", genitive: "Arietis", meaning: "The Ram", hemisphere: "N" },
  { abbr: "Aur", name: "Auriga", genitive: "Aurigae", meaning: "The Charioteer", hemisphere: "N" },
  { abbr: "Boo", name: "Boötes", genitive: "Boötis", meaning: "The Herdsman", hemisphere: "N" },
  { abbr: "Cae", name: "Caelum", genitive: "Caeli", meaning: "The Chisel", hemisphere: "S" },
  { abbr: "Cam", name: "Camelopardalis", genitive: "Camelopardalis", meaning: "The Giraffe", hemisphere: "N" },
  { abbr: "Cnc", name: "Cancer", genitive: "Cancri", meaning: "The Crab", hemisphere: "E" },
  { abbr: "CVn", name: "Canes Venatici", genitive: "Canum Venaticorum", meaning: "The Hunting Dogs", hemisphere: "N" },
  { abbr: "CMa", name: "Canis Major", genitive: "Canis Majoris", meaning: "The Greater Dog", hemisphere: "S" },
  { abbr: "CMi", name: "Canis Minor", genitive: "Canis Minoris", meaning: "The Lesser Dog", hemisphere: "E" },
  { abbr: "Cap", name: "Capricornus", genitive: "Capricorni", meaning: "The Sea Goat", hemisphere: "E" },
  { abbr: "Car", name: "Carina", genitive: "Carinae", meaning: "The Keel", hemisphere: "S" },
  { abbr: "Cas", name: "Cassiopeia", genitive: "Cassiopeiae", meaning: "The Queen", hemisphere: "N" },
  { abbr: "Cen", name: "Centaurus", genitive: "Centauri", meaning: "The Centaur", hemisphere: "S" },
  { abbr: "Cep", name: "Cepheus", genitive: "Cephei", meaning: "The King", hemisphere: "N" },
  { abbr: "Cet", name: "Cetus", genitive: "Ceti", meaning: "The Whale", hemisphere: "E" },
  { abbr: "Cha", name: "Chamaeleon", genitive: "Chamaeleontis", meaning: "The Chameleon", hemisphere: "S" },
  { abbr: "Cir", name: "Circinus", genitive: "Circini", meaning: "The Compass", hemisphere: "S" },
  { abbr: "Col", name: "Columba", genitive: "Columbae", meaning: "The Dove", hemisphere: "S" },
  { abbr: "Com", name: "Coma Berenices", genitive: "Comae Berenices", meaning: "Berenice's Hair", hemisphere: "N" },
  { abbr: "CrA", name: "Corona Australis", genitive: "Coronae Australis", meaning: "The Southern Crown", hemisphere: "S" },
  { abbr: "CrB", name: "Corona Borealis", genitive: "Coronae Borealis", meaning: "The Northern Crown", hemisphere: "N" },
  { abbr: "Crv", name: "Corvus", genitive: "Corvi", meaning: "The Crow", hemisphere: "E" },
  { abbr: "Crt", name: "Crater", genitive: "Crateris", meaning: "The Cup", hemisphere: "E" },
  { abbr: "Cru", name: "Crux", genitive: "Crucis", meaning: "The Southern Cross", hemisphere: "S" },
  { abbr: "Cyg", name: "Cygnus", genitive: "Cygni", meaning: "The Swan", hemisphere: "N" },
  { abbr: "Del", name: "Delphinus", genitive: "Delphini", meaning: "The Dolphin", hemisphere: "E" },
  { abbr: "Dor", name: "Dorado", genitive: "Doradus", meaning: "The Goldfish", hemisphere: "S" },
  { abbr: "Dra", name: "Draco", genitive: "Draconis", meaning: "The Dragon", hemisphere: "N" },
  { abbr: "Equ", name: "Equuleus", genitive: "Equulei", meaning: "The Foal", hemisphere: "E" },
  { abbr: "Eri", name: "Eridanus", genitive: "Eridani", meaning: "The River", hemisphere: "E" },
  { abbr: "For", name: "Fornax", genitive: "Fornacis", meaning: "The Furnace", hemisphere: "S" },
  { abbr: "Gem", name: "Gemini", genitive: "Geminorum", meaning: "The Twins", hemisphere: "N" },
  { abbr: "Gru", name: "Grus", genitive: "Gruis", meaning: "The Crane", hemisphere: "S" },
  { abbr: "Her", name: "Hercules", genitive: "Herculis", meaning: "Hercules", hemisphere: "N" },
  { abbr: "Hor", name: "Horologium", genitive: "Horologii", meaning: "The Clock", hemisphere: "S" },
  { abbr: "Hya", name: "Hydra", genitive: "Hydrae", meaning: "The Water Snake", hemisphere: "E" },
  { abbr: "Hyi", name: "Hydrus", genitive: "Hydri", meaning: "The Lesser Water Snake", hemisphere: "S" },
  { abbr: "Ind", name: "Indus", genitive: "Indi", meaning: "The Indian", hemisphere: "S" },
  { abbr: "Lac", name: "Lacerta", genitive: "Lacertae", meaning: "The Lizard", hemisphere: "N" },
  { abbr: "Leo", name: "Leo", genitive: "Leonis", meaning: "The Lion", hemisphere: "E" },
  { abbr: "LMi", name: "Leo Minor", genitive: "Leonis Minoris", meaning: "The Lesser Lion", hemisphere: "N" },
  { abbr: "Lep", name: "Lepus", genitive: "Leporis", meaning: "The Hare", hemisphere: "E" },
  { abbr: "Lib", name: "Libra", genitive: "Librae", meaning: "The Scales", hemisphere: "E" },
  { abbr: "Lup", name: "Lupus", genitive: "Lupi", meaning: "The Wolf", hemisphere: "S" },
  { abbr: "Lyn", name: "Lynx", genitive: "Lyncis", meaning: "The Lynx", hemisphere: "N" },
  { abbr: "Lyr", name: "Lyra", genitive: "Lyrae", meaning: "The Lyre", hemisphere: "N" },
  { abbr: "Men", name: "Mensa", genitive: "Mensae", meaning: "The Table Mountain", hemisphere: "S" },
  { abbr: "Mic", name: "Microscopium", genitive: "Microscopii", meaning: "The Microscope", hemisphere: "S" },
  { abbr: "Mon", name: "Monoceros", genitive: "Monocerotis", meaning: "The Unicorn", hemisphere: "E" },
  { abbr: "Mus", name: "Musca", genitive: "Muscae", meaning: "The Fly", hemisphere: "S" },
  { abbr: "Nor", name: "Norma", genitive: "Normae", meaning: "The Square", hemisphere: "S" },
  { abbr: "Oct", name: "Octans", genitive: "Octantis", meaning: "The Octant", hemisphere: "S" },
  { abbr: "Oph", name: "Ophiuchus", genitive: "Ophiuchi", meaning: "The Serpent Bearer", hemisphere: "E" },
  { abbr: "Ori", name: "Orion", genitive: "Orionis", meaning: "The Hunter", hemisphere: "E" },
  { abbr: "Pav", name: "Pavo", genitive: "Pavonis", meaning: "The Peacock", hemisphere: "S" },
  { abbr: "Peg", name: "Pegasus", genitive: "Pegasi", meaning: "The Winged Horse", hemisphere: "N" },
  { abbr: "Per", name: "Perseus", genitive: "Persei", meaning: "Perseus", hemisphere: "N" },
  { abbr: "Phe", name: "Phoenix", genitive: "Phoenicis", meaning: "The Phoenix", hemisphere: "S" },
  { abbr: "Pic", name: "Pictor", genitive: "Pictoris", meaning: "The Painter's Easel", hemisphere: "S" },
  { abbr: "Psc", name: "Pisces", genitive: "Piscium", meaning: "The Fishes", hemisphere: "E" },
  { abbr: "PsA", name: "Piscis Austrinus", genitive: "Piscis Austrini", meaning: "The Southern Fish", hemisphere: "S" },
  { abbr: "Pup", name: "Puppis", genitive: "Puppis", meaning: "The Stern", hemisphere: "E" },
  { abbr: "Pyx", name: "Pyxis", genitive: "Pyxidis", meaning: "The Compass", hemisphere: "E" },
  { abbr: "Ret", name: "Reticulum", genitive: "Reticuli", meaning: "The Net", hemisphere: "S" },
  { abbr: "Sge", name: "Sagitta", genitive: "Sagittae", meaning: "The Arrow", hemisphere: "N" },
  { abbr: "Sgr", name: "Sagittarius", genitive: "Sagittarii", meaning: "The Archer", hemisphere: "E" },
  { abbr: "Sco", name: "Scorpius", genitive: "Scorpii", meaning: "The Scorpion", hemisphere: "E" },
  { abbr: "Scl", name: "Sculptor", genitive: "Sculptoris", meaning: "The Sculptor", hemisphere: "S" },
  { abbr: "Sct", name: "Scutum", genitive: "Scuti", meaning: "The Shield", hemisphere: "E" },
  { abbr: "Ser", name: "Serpens", genitive: "Serpentis", meaning: "The Serpent", hemisphere: "E" },
  { abbr: "Sex", name: "Sextans", genitive: "Sextantis", meaning: "The Sextant", hemisphere: "E" },
  { abbr: "Tau", name: "Taurus", genitive: "Tauri", meaning: "The Bull", hemisphere: "N" },
  { abbr: "Tel", name: "Telescopium", genitive: "Telescopii", meaning: "The Telescope", hemisphere: "S" },
  { abbr: "Tri", name: "Triangulum", genitive: "Trianguli", meaning: "The Triangle", hemisphere: "N" },
  { abbr: "TrA", name: "Triangulum Australe", genitive: "Trianguli Australis", meaning: "The Southern Triangle", hemisphere: "S" },
  { abbr: "Tuc", name: "Tucana", genitive: "Tucanae", meaning: "The Toucan", hemisphere: "S" },
  { abbr: "UMa", name: "Ursa Major", genitive: "Ursae Majoris", meaning: "The Great Bear", hemisphere: "N" },
  { abbr: "UMi", name: "Ursa Minor", genitive: "Ursae Minoris", meaning: "The Little Bear", hemisphere: "N" },
  { abbr: "Vel", name: "Vela", genitive: "Velorum", meaning: "The Sails", hemisphere: "S" },
  { abbr: "Vir", name: "Virgo", genitive: "Virginis", meaning: "The Maiden", hemisphere: "E" },
  { abbr: "Vol", name: "Volans", genitive: "Volantis", meaning: "The Flying Fish", hemisphere: "S" },
  { abbr: "Vul", name: "Vulpecula", genitive: "Vulpeculae", meaning: "The Fox", hemisphere: "N" },
];

export const CONSTELLATION_MAP: Record<string, ConstellationInfo> = Object.fromEntries(
  CONSTELLATIONS.map((c) => [c.abbr, c])
);

/**
 * Constellation stick-figure lines. Each line is a pair of HIP numbers.
 * Stars referenced here MUST exist in the bright star catalog.
 */
export const CONSTELLATION_LINES: Record<string, [number, number][]> = {
  // Ursa Major — Big Dipper
  UMa: [
    [54061, 58001], [58001, 59774], [59774, 62956],
    [62956, 65378], [65378, 67301], [67301, 68756],
    [54061, 62956],
  ],
  // Ursa Minor — Little Dipper
  UMi: [
    [85822, 82080], [82080, 77055], [77055, 75097],
    [75097, 72622], [72622, 79822], [79822, 85822],
  ],
  // Cassiopeia — W shape
  Cas: [
    [3092, 3179], [3179, 4427], [4427, 5421], [5421, 6686],
  ],
  // Orion
  Ori: [
    [27989, 25930], [25930, 26727],  // belt: Alnitak–Alnilam–Mintaka
    [27989, 26311],  // Alnitak–Saiph
    [26727, 24305],  // Mintaka–Rigel
    [24305, 25336],  // Rigel–Betelgeuse (diagonal)
    [25336, 24436],  // Betelgeuse–Bellatrix (shoulders)
    [24436, 26727],  // Bellatrix–Mintaka
    [26311, 24305],  // Saiph–Rigel (feet)
    [25930, 21421],  // Alnilam–Meissa (head)
  ],
  // Lyra — small parallelogram + Vega
  Lyr: [
    [91262, 92420], [92420, 93194], [93194, 93825], [93825, 91262],
  ],
  // Cygnus — Northern Cross
  Cyg: [
    [102098, 100453], [100453, 97165],  // long axis: Deneb–Sadr–Albireo
    [100453, 95853],  [100453, 104732], // wings: Sadr–Gienah, Sadr–Rukh
  ],
  // Leo
  Leo: [
    [49583, 50583], [50583, 54879], [54879, 54872], [54872, 49583], // body
    [54879, 57632], [57632, 54872], // hind quarter
  ],
  // Scorpius
  Sco: [
    [64553, 64065], [64065, 63922], [63922, 64553], // head triangle
    [64553, 65075], [65075, 70650], [70650, 71860], // body curve to tail
    [71860, 73552],
  ],
  // Crux — Southern Cross
  Cru: [
    [60718, 61084], [61084, 59747], [59747, 60718], [59512, 61317],
  ],
  // Taurus — Hyades V + horns
  Tau: [
    [21421, 20889], [20889, 21281], [21281, 26451], // Aldebaran -> Ain -> Hyadum -> Tianguan (horn)
    [20889, 20867], // Ain -> Theta Tau (Hyades side)
  ],
  // Canis Major
  CMa: [
    [32349, 31416], [31416, 30324], [30324, 31681], [31681, 32349], [32349, 28910],
  ],
  // Boötes — kite
  Boo: [
    [69673, 70783], [70783, 72105], [72105, 73555], [73555, 71075], [71075, 69673], [72105, 71075],
  ],
  // Pegasus — great square
  Peg: [
    [677, 1067], [1067, 8775], [8775, 8308], [8308, 677], [8775, 113963],
  ],
  // Andromeda — chain from Peg to Per
  And: [
    [677, 9640], [9640, 15863], [15863, 15835],
  ],
  // Perseus
  Per: [
    [15863, 18532], [18532, 18614], [18614, 17140], [17140, 14328],
  ],
  // Auriga — pentagon
  Aur: [
    [24608, 28380], [28380, 25428], [25428, 23015], [23015, 24608], [24608, 28360],
  ],
  // Gemini
  Gem: [
    [36850, 34088], [34088, 29655], [29655, 30343], [30343, 42911], [42911, 36850],
  ],
  // Virgo
  Vir: [
    [65474, 61941], [61941, 57757], [57757, 63608], [63608, 65474], [61941, 63090],
  ],
  // Sagittarius — teapot
  Sgr: [
    [79242, 80112], [80112, 85116], [85116, 86228], [86228, 89341], [89341, 85288], [85288, 83081], [83081, 80112],
  ],
  // Aquila
  Aql: [
    [98036, 97804], [97804, 97278], [97804, 98036],
  ],
  // Cetus
  Cet: [
    [5364, 3419], [3419, 14135], [14135, 1562], [1562, 5364],
  ],
};

/** Lookup full constellation name by abbreviation. */
export function constellationName(abbr: string): string {
  return CONSTELLATION_MAP[abbr]?.name ?? abbr;
}
