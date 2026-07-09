/**
 * Constellation mythology and descriptions for the most recognizable
 * constellations. Used by the constellation info panel when a constellation
 * is highlighted.
 */

export interface ConstellationMythology {
  abbr: string;
  mythology: string;     // brief mythological story
  bestMonth: string;     // best month for viewing
  brightStars: number;   // count of stars mag < 4
  notableObjects: string; // notable deep-sky objects
}

const DATA: Record<string, ConstellationMythology> = {
  UMa: {
    abbr: "UMa",
    mythology: "Ursa Major represents Callisto, a nymph transformed by Zeus into a bear to protect her from Hera's jealousy. The Big Dipper asterism is one of the most recognized patterns in the sky.",
    bestMonth: "April",
    brightStars: 7,
    notableObjects: "M81 & M82 galaxies, Owl Nebula (M97)",
  },
  UMi: {
    abbr: "UMi",
    mythology: "Ursa Minor represents Arcas, son of Callisto. Zeus placed them together in the sky. Polaris, the North Star, marks the bear's tail and has guided navigators for millennia.",
    bestMonth: "June",
    brightStars: 4,
    notableObjects: "Polaris (triple star system)",
  },
  Ori: {
    abbr: "Ori",
    mythology: "Orion was a mighty hunter, son of Poseidon. After his death, Zeus placed him in the sky with his dogs (Canis Major and Minor) pursuing the Pleiades. The belt stars are among the most recognizable.",
    bestMonth: "January",
    brightStars: 8,
    notableObjects: "Orion Nebula (M42), Horsehead Nebula, Betelgeuse (red supergiant)",
  },
  Cas: {
    abbr: "Cas",
    mythology: "Cassiopeia was a vain queen who boasted she was more beautiful than the sea nymphs. As punishment, Poseidon placed her in the sky, tied to her throne, upside-down half the time as the sky rotates.",
    bestMonth: "November",
    brightStars: 5,
    notableObjects: "Tycho's SNR, Heart & Soul Nebulas",
  },
  Lyr: {
    abbr: "Lyr",
    mythology: "Lyra represents the lyre of Orpheus, the legendary musician who could charm all living things. After his death, Zeus placed his lyre in the sky. Vega, its brightest star, was once the pole star.",
    bestMonth: "August",
    brightStars: 2,
    notableObjects: "Ring Nebula (M57), Vega",
  },
  Cyg: {
    abbr: "Cyg",
    mythology: "Cygnus represents Zeus disguised as a swan to seduce Leda. The Northern Cross asterism is prominent in summer skies. Deneb, its brightest star, is one of the most luminous known stars.",
    bestMonth: "September",
    brightStars: 5,
    notableObjects: "North America Nebula, Veil Nebula",
  },
  Leo: {
    abbr: "Leo",
    mythology: "Leo represents the Nemean Lion slain by Heracles as his first labor. The lion's skin was impervious to weapons, so Heracles strangled it. The 'sickle' pattern marks the lion's mane.",
    bestMonth: "April",
    brightStars: 4,
    notableObjects: "Leo Triplet galaxies (M65, M66, NGC 3628)",
  },
  Sco: {
    abbr: "Sco",
    mythology: "Scorpius is the scorpion that killed Orion. They were placed on opposite sides of the sky so they would never meet again. Antares, the heart of the scorpion, is a red supergiant rivaling Mars.",
    bestMonth: "July",
    brightStars: 9,
    notableObjects: "Ptolemy Cluster (M7), Butterfly Cluster (M6)",
  },
  Tau: {
    abbr: "Tau",
    mythology: "Taurus represents Zeus disguised as a white bull to abduct Europa. The Hyades and Pleiades star clusters mark the bull's face and shoulder. Aldebaran is the bull's red eye.",
    bestMonth: "January",
    brightStars: 4,
    notableObjects: "Pleiades (M45), Hyades, Crab Nebula (M1)",
  },
  CMa: {
    abbr: "CMa",
    mythology: "Canis Major is one of Orion's hunting dogs. Sirius, the 'Dog Star', is the brightest star in the night sky. Ancient Egyptians used its heliacal rising to predict the Nile flooding.",
    bestMonth: "February",
    brightStars: 5,
    notableObjects: "Sirius, M41 open cluster",
  },
  Boo: {
    abbr: "Boo",
    mythology: "Boötes represents a herdsman or plowman, invented the plow and was placed in the sky as a reward. Arcturus, the fourth brightest star, means 'bear watcher' as it follows Ursa Major.",
    bestMonth: "June",
    brightStars: 4,
    notableObjects: "Arcturus, Izar (double star)",
  },
  Peg: {
    abbr: "Peg",
    mythology: "Pegasus is the winged horse born from Medusa's blood when Perseus beheaded her. The Great Square of Pegasus is a prominent autumn asterism. The horse appears upside-down in the sky.",
    bestMonth: "October",
    brightStars: 4,
    notableObjects: "Stephan's Quintet, NGC 7331",
  },
  And: {
    abbr: "And",
    mythology: "Andromeda is the princess chained to a rock as sacrifice to a sea monster, rescued by Perseus. The Andromeda Galaxy (M31) is the most distant object visible to the naked eye.",
    bestMonth: "November",
    brightStars: 3,
    notableObjects: "Andromeda Galaxy (M31), Double Cluster",
  },
  Per: {
    abbr: "Per",
    mythology: "Perseus is the hero who slew Medusa and rescued Andromeda. Algol, the 'demon star', represents Medusa's eye — an eclipsing binary that winks every 2.9 days.",
    bestMonth: "December",
    brightStars: 5,
    notableObjects: "Algol (demon star), Double Cluster",
  },
  Aur: {
    abbr: "Aur",
    mythology: "Auriga represents a charioteer, often identified with Erichthonius, who invented the chariot. Capella, its brightest star, is actually a system of four stars.",
    bestMonth: "February",
    brightStars: 3,
    notableObjects: "Capella, M36, M37, M38 open clusters",
  },
  Gem: {
    abbr: "Gem",
    mythology: "Gemini represents the twins Castor and Pollux. When mortal Castor died, immortal Pollux asked Zeus to share his immortality, so they were placed together in the sky.",
    bestMonth: "February",
    brightStars: 4,
    notableObjects: "Castor (sextuple star), Pollux, M35",
  },
  Vir: {
    abbr: "Vir",
    mythology: "Virgo represents Demeter, goddess of agriculture, or her daughter Persephone. Spica, the brightest star, represents a sheaf of wheat. The constellation contains the Virgo Cluster of galaxies.",
    bestMonth: "May",
    brightStars: 3,
    notableObjects: "Spica, Virgo Cluster, Sombrero Galaxy (M104)",
  },
  Sgr: {
    abbr: "Sgr",
    mythology: "Sagittarius represents a centaur archer, sometimes identified as Chiron. The 'Teapot' asterism points toward the center of the Milky Way galaxy.",
    bestMonth: "August",
    brightStars: 7,
    notableObjects: "Lagoon Nebula (M8), Trifid Nebula (M20), Galactic Center",
  },
  Aql: {
    abbr: "Aql",
    mythology: "Aquila is the eagle of Zeus that carried his thunderbolts and abducted Ganymede. Altair, its brightest star, is one of the three Summer Triangle stars.",
    bestMonth: "August",
    brightStars: 2,
    notableObjects: "Altair, NGC 6709",
  },
  Cru: {
    abbr: "Cru",
    mythology: "Crux, the Southern Cross, is the smallest constellation but the most famous in the southern hemisphere. It appears on the flags of Australia, New Zealand, and Brazil.",
    bestMonth: "March",
    brightStars: 4,
    notableObjects: "Jewel Box Cluster, Coalsack Nebula",
  },
  Cen: {
    abbr: "Cen",
    mythology: "Centaurus represents Chiron, the wise centaur who trained heroes like Heracles and Achilles. Alpha and Beta Centauri point toward the Southern Cross.",
    bestMonth: "May",
    brightStars: 4,
    notableObjects: "Alpha Centauri (nearest star system), Omega Centauri (M13)",
  },
};

export function getConstellationMythology(abbr: string): ConstellationMythology | null {
  return DATA[abbr] ?? null;
}
