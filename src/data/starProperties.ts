/**
 * Physical properties of bright stars — temperature, mass, radius, luminosity,
 * age, and other astrophysical data.
 *
 * Only includes the ~40 brightest/most famous stars. Data from SIMBAD and
 * research catalogs. Values are approximate.
 */

export interface StarProperties {
  hip: number;
  temperatureK: number;    // effective temperature (Kelvin)
  massSolar: number;       // mass in solar masses
  radiusSolar: number;     // radius in solar radii
  luminositySolar: number; // luminosity in solar luminosities
  ageMyr: number;          // age in millions of years (0 if unknown)
  rotationKmh: number;     // rotation velocity (km/s, 0 if unknown)
  varType?: string;        // variability type (e.g. "Eclipsing binary", "Cepheid")
  notes?: string;          // interesting fact
}

const DATA: Record<number, StarProperties> = {
  // Sirius
  32349: { hip: 32349, temperatureK: 9940, massSolar: 2.063, radiusSolar: 1.711, luminositySolar: 25.4, ageMyr: 242, rotationKmh: 16, notes: "Brightest star in the night sky. Binary system with a white dwarf (Sirius B)." },
  // Canopus
  30438: { hip: 30438, temperatureK: 7350, massSolar: 8.0, radiusSolar: 71, luminositySolar: 10700, ageMyr: 25, rotationKmh: 0, notes: "Second brightest night star. A bright giant in Carina." },
  // Arcturus
  69673: { hip: 69673, temperatureK: 4286, massSolar: 1.08, radiusSolar: 25.4, luminositySolar: 170, ageMyr: 7100, rotationKmh: 0, notes: "Brightest star in the northern celestial hemisphere. An orange giant." },
  // Vega
  91262: { hip: 91262, temperatureK: 9602, massSolar: 2.135, radiusSolar: 2.362, luminositySolar: 40.12, ageMyr: 455, rotationKmh: 0, varType: "Delta Scuti variable", notes: "Standard for zero-point magnitude calibration. Once the northern pole star (~12,000 BC)." },
  // Capella
  24608: { hip: 24608, temperatureK: 4970, massSolar: 2.5, radiusSolar: 11.98, luminositySolar: 78.5, ageMyr: 590, rotationKmh: 0, varType: "Spectroscopic binary", notes: "A quadruple star system. The primary pair is two yellow giants." },
  // Rigel
  24305: { hip: 24305, temperatureK: 12100, massSolar: 21, radiusSolar: 78.9, luminositySolar: 120000, ageMyr: 8, rotationKmh: 0, varType: "Alpha Cygni variable", notes: "Blue supergiant. One of the most intrinsically luminous naked-eye stars." },
  // Procyon
  37279: { hip: 37279, temperatureK: 6530, massSolar: 1.499, radiusSolar: 2.048, luminositySolar: 6.93, ageMyr: 1880, rotationKmh: 0, notes: "Binary system with a white dwarf. One of the nearest bright stars (11.5 ly)." },
  // Betelgeuse
  25336: { hip: 25336, temperatureK: 3600, massSolar: 16.5, radiusSolar: 887, luminositySolar: 126000, ageMyr: 10, rotationKmh: 0, varType: "Semi-regular variable", notes: "Red supergiant. Will end as a supernova within ~100,000 years." },
  // Altair
  98036: { hip: 98036, temperatureK: 7670, massSolar: 1.79, radiusSolar: 1.79, luminositySolar: 10.6, ageMyr: 100, rotationKmh: 900, notes: "Rotates so fast it is noticeably oblate (equatorial bulge)." },
  // Aldebaran
  21421: { hip: 21421, temperatureK: 3910, massSolar: 1.16, radiusSolar: 45.1, luminositySolar: 439, ageMyr: 6600, rotationKmh: 0, notes: "Orange giant. Has a confirmed exoplanet (Aldebaran b)." },
  // Antares
  64553: { hip: 64553, temperatureK: 3660, massSolar: 12, radiusSolar: 680, luminositySolar: 75900, ageMyr: 11, rotationKmh: 0, varType: "Slow irregular variable", notes: "Red supergiant. If placed at the Sun's position, would extend past Mars' orbit." },
  // Spica
  65474: { hip: 65474, temperatureK: 22400, massSolar: 11.43, radiusSolar: 7.47, luminositySolar: 20512, ageMyr: 12.5, rotationKmh: 0, varType: "Beta Cephei variable", notes: "Close binary star. Blue giant." },
  // Pollux
  36850: { hip: 36850, temperatureK: 4666, massSolar: 1.91, radiusSolar: 9.06, luminositySolar: 32.7, ageMyr: 724, rotationKmh: 0, notes: "Orange giant. Has a confirmed exoplanet (Pollux b)." },
  // Fomalhaut
  113963: { hip: 113963, temperatureK: 8590, massSolar: 1.92, radiusSolar: 1.842, luminositySolar: 16.63, ageMyr: 440, rotationKmh: 0, notes: "Surrounded by a debris disk. One of the 'Royal Stars' of Persia." },
  // Deneb
  102098: { hip: 102098, temperatureK: 8525, massSolar: 19, radiusSolar: 203, luminositySolar: 196000, ageMyr: 11, rotationKmh: 0, varType: "Alpha Cygni variable", notes: "One of the most luminous stars known. ~2,600 ly distant." },
  // Regulus
  49583: { hip: 49583, temperatureK: 12460, massSolar: 3.8, radiusSolar: 4.35, luminositySolar: 316, ageMyr: 150, rotationKmh: 0, notes: "Rotates at near breakup velocity (96% of critical)." },
  // Castor
  34088: { hip: 34088, temperatureK: 10286, massSolar: 2.76, radiusSolar: 2.4, luminositySolar: 34.7, ageMyr: 290, rotationKmh: 0, notes: "Actually a sextuple star system (6 stars gravitationally bound)." },
  // Polaris
  85822: { hip: 85822, temperatureK: 6015, massSolar: 5.4, radiusSolar: 37.5, luminositySolar: 1260, ageMyr: 70, rotationKmh: 0, varType: "Classical Cepheid", notes: "The North Star. A triple star system with a Cepheid variable primary." },
  // Mira
  1562: { hip: 1562, temperatureK: 3042, massSolar: 1.2, radiusSolar: 350, luminositySolar: 9000, ageMyr: 7000, rotationKmh: 0, varType: "Mira variable", notes: "Prototype of Mira-type long-period variables. Brightens from mag 9 to 3 over 332 days." },
  // Algol
  14576: { hip: 14576, temperatureK: 13000, massSolar: 3.17, radiusSolar: 2.73, luminositySolar: 182, ageMyr: 570, rotationKmh: 0, varType: "Eclipsing binary", notes: "Prototype eclipsing binary. Brightness drops every 2.87 days when the fainter star passes in front." },
};

export function getStarProperties(hip: number): StarProperties | null {
  return DATA[Math.round(hip)] ?? null;
}
