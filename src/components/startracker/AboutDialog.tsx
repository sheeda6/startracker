"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Info,
  ExternalLink,
  BookOpen,
  Orbit,
  Star,
  CloudSun,
  Database,
  Binary,
  Layers,
  Search,
  Check,
  Copy,
  Sparkles,
} from "lucide-react";

interface DataSourceItem {
  id: string;
  name: string;
  category: "stars" | "solarsystem" | "dso" | "astrometry" | "environment";
  sourceName: string;
  institution: string;
  license: string;
  description: string;
  fieldsUsed: string[];
  referenceCitation: string;
  externalUrl?: string;
  accuracyNote?: string;
}

const DATA_SOURCES: DataSourceItem[] = [
  // ─── 1. Stars & Astrometry ───
  {
    id: "hipparcos",
    name: "Hipparcos Space Astrometry Catalog",
    category: "stars",
    sourceName: "ESA Hipparcos Space Mission (1989–1993)",
    institution: "European Space Agency (ESA) / CDS Strasbourg",
    license: "Public Domain / Open Scientific Data",
    description:
      "Primary astrometric star catalog providing high-precision positions, trigonometric parallaxes, and proper motions for stars down to visual magnitude ~6.0.",
    fieldsUsed: [
      "HIP Number (catalog identifier)",
      "Right Ascension (α) & Declination (δ) at J2000.0",
      "Proper Motion in RA (μ_α cos δ) and Dec (μ_δ) in mas/year",
      "Parallax (converted to distance in light-years)",
      "Johnson V-band visual magnitude",
    ],
    referenceCitation:
      "Perryman, M. A. C., et al. (1997). 'The HIPPARCOS Catalogue'. Astronomy & Astrophysics, 323, L49–L52. VizieR Catalog: I/239.",
    externalUrl: "https://www.cosmos.esa.int/web/hipparcos",
    accuracyNote: "Position accuracy ~1 milliarcsecond at epoch J1991.25. Propagated with linear proper motion.",
  },
  {
    id: "brightstar",
    name: "Yale Bright Star Catalog (BSC5)",
    category: "stars",
    sourceName: "Bright Star Catalogue, 5th Revised Edition",
    institution: "Yale University Observatory / NASA CDS",
    license: "Public Academic Archive",
    description:
      "Supplementary astrophysical data for all naked-eye stars, including Bayer designations (e.g., α Orionis), Flamsteed numbers, and historical common names.",
    fieldsUsed: [
      "Traditional & IAU approved common star names",
      "Bayer Greek letter designations",
      "Flamsteed catalog numbers",
      "Henry Draper (HD) catalog cross-references",
      "Spectral classification (e.g. M2Ib for Betelgeuse, A1V for Sirius)",
    ],
    referenceCitation:
      "Hoffleit, D. and Warren, W. H. Jr. (1991). 'The Bright Star Catalogue', 5th Revised Ed., Yale University Observatory. VizieR Catalog: V/50.",
    externalUrl: "http://tdc-www.harvard.edu/catalogs/bsc5.html",
  },
  {
    id: "simbad-gaia",
    name: "SIMBAD & Gaia DR3 Stellar Astrophysics",
    category: "stars",
    sourceName: "SIMBAD Astronomical Database & Gaia DR3",
    institution: "Centre de Données astronomiques de Strasbourg (CDS) / ESA",
    license: "Creative Commons Attribution 4.0",
    description:
      "Astrophysical parameters for prominent bright stars used in the Star Details inspector, proper motion time-travel engine, and stellar evolution comparisons.",
    fieldsUsed: [
      "Effective surface temperature (T_eff in Kelvin)",
      "Stellar Mass (M_☉ in solar masses)",
      "Stellar Radius (R_☉ in solar radii)",
      "Bolometric Luminosity (L_☉ in solar luminosities)",
      "Estimated stellar age (in Millions of Years, Myr)",
      "Rotational velocity (v sin i in km/s)",
      "Stellar variability types (Cepheid, eclipsing binary, α Cygni, etc.)",
    ],
    referenceCitation:
      "Wenger, M., et al. (2000). 'The SIMBAD astronomical database'. Astronomy & Astrophysics Supplement, 143(1), 9–22; Gaia Collaboration (2023) A&A 674, A1.",
    externalUrl: "https://simbad.cds.unistra.fr/simbad/",
  },

  // ─── 2. Solar System & Celestial Mechanics ───
  {
    id: "sun-vsop87",
    name: "Solar Ephemeris via VSOP87 Theory",
    category: "solarsystem",
    sourceName: "Variations Séculaires des Orbites Planétaires (VSOP87)",
    institution: "Bureau des Longitudes, Paris / Observatoire de Paris",
    license: "Public Scientific Release",
    description:
      "Semi-analytical planetary theory used to calculate the apparent geocentric equatorial coordinates (Right Ascension, Declination), distance, and equation of the center of the Sun.",
    fieldsUsed: [
      "Geometric mean longitude of the Sun (L0)",
      "Mean anomaly (M) and Earth orbital eccentricity (e)",
      "Sun's equation of the center (C)",
      "Corrections for nutation and planetary aberration (~-20.49 arcsec)",
      "Heliocentric and geocentric distance in Astronomical Units (AU)",
    ],
    referenceCitation:
      "Bretagnon, P. and Francou, G. (1988). 'Planetary theories in rectangular and spherical variables - VSOP87 solutions'. Astronomy & Astrophysics, 202, 309–315.",
    externalUrl: "https://web.archive.org/web/20131212080351/ftp://ftp.imcce.fr/pub/ephem/planets/vsop87/",
    accuracyNote: "Truncated series model achieves ~0.05° precision, well within the visual resolution of browser sky charts.",
  },
  {
    id: "moon-elp2000",
    name: "Lunar Ephemeris via ELP-2000/82 & Brown Theory",
    category: "solarsystem",
    sourceName: "Éphéméride Lunaire Parisienne (ELP-2000/82)",
    institution: "Bureau des Longitudes, Paris / Michelle Chapront-Touzé & Jean Chapront",
    license: "Public Scientific Release",
    description:
      "Computes the position of the Moon, distance from Earth, apparent angular diameter, topocentric coordinates, illumination percentage, and phase names.",
    fieldsUsed: [
      "Mean longitude (L'), mean elongation Moon-Sun (D)",
      "Lunar mean anomaly (M_m) and argument of latitude (F)",
      "Major periodic perturbation terms in longitude and latitude",
      "Lunar geocentric distance (km)",
      "Sun-Moon elongation angle for illumination fraction: (1 - cos Ψ) / 2",
    ],
    referenceCitation:
      "Chapront-Touzé, M. and Chapront, J. (1983). 'The lunar ephemeris ELP 2000'. Astronomy & Astrophysics, 124, 50–62.",
    externalUrl: "https://ui.adsabs.harvard.edu/abs/1983A%26A...124...50C",
    accuracyNote: "Truncated 15-term harmonic expansion yields ~0.2° position accuracy and exact phase timing.",
  },
  {
    id: "planets-jpl",
    name: "Planetary Keplerian Elements & Secular Variations",
    category: "solarsystem",
    sourceName: "NASA JPL Solar System Dynamics (SSD) Planetary Ephemerides",
    institution: "NASA Jet Propulsion Laboratory (JPL) / Caltech",
    license: "Public Domain (NASA)",
    description:
      "Keplerian orbital elements (semi-major axis, eccentricity, inclination, longitude of ascending node, longitude of perihelion, mean longitude) with secular rates for Mercury, Venus, Mars, Jupiter, and Saturn.",
    fieldsUsed: [
      "Semi-major axis a (AU) & eccentricity e",
      "Orbital inclination I (degrees)",
      "Mean longitude L, longitude of perihelion ϖ, longitude of ascending node Ω",
      "Newton-Raphson solution to Kepler's Equation: M = E - e sin E",
      "True anomaly ν and heliocentric ecliptic → geocentric equatorial coordinates",
    ],
    referenceCitation:
      "Standish, E. M. (1992). 'Keplerian Elements for Approximate Positions of the Major Planets'. NASA JPL Solar System Dynamics Group; Simon, J. L., et al. (1994) A&A, 282, 663.",
    externalUrl: "https://ssd.jpl.nasa.gov/planets/approx_pos.html",
    accuracyNote: "Accurate to ~0.5°–1° over 1800–2050 AD, optimal for celestial mapping and physics orbit calculations.",
  },
  {
    id: "asteroids-jpl",
    name: "Asteroid Orbital Elements Catalog",
    category: "solarsystem",
    sourceName: "NASA JPL Small-Body Database (SBDB)",
    institution: "NASA Jet Propulsion Laboratory / Caltech",
    license: "Public Domain (NASA)",
    description:
      "Osculating Keplerian elements for famous minor planets (1 Ceres, 2 Pallas, 4 Vesta, 10 Hygiea, 433 Eros, 1566 Icarus, 99942 Apophis, etc.).",
    fieldsUsed: [
      "Epoch J2000 (JD 2451545.0) osculating orbital elements",
      "Semi-major axis a, eccentricity e, inclination i",
      "Longitude of ascending node (Ω), argument of perihelion (ω)",
      "Mean anomaly at epoch (M0)",
      "Absolute magnitude (H) and slope parameter (G)",
    ],
    referenceCitation:
      "Giorgini, J. D., et al. (1996). 'JPL's On-Line Solar System Data Service and Ephemeris Computation Program'. Bulletin of the American Astronomical Society, 28, 1158.",
    externalUrl: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html",
  },
  {
    id: "comets-mpc",
    name: "Comet Orbital Elements",
    category: "solarsystem",
    sourceName: "IAU Minor Planet Center (MPC) & JPL Horizons",
    institution: "International Astronomical Union (IAU) / Smithsonian Astrophysical Observatory",
    license: "Public Domain",
    description:
      "High-eccentricity orbital elements for famous periodic and historical comets including 1P/Halley, 2P/Encke, Hale-Bopp (C/1995 O1), and Neowise (C/2020 F3).",
    fieldsUsed: [
      "Perihelion distance q, eccentricity e (up to 0.999), inclination i",
      "Epoch and mean anomaly at epoch",
      "Orbit trajectory sampling and real-time sky coordinates",
    ],
    referenceCitation:
      "Marsden, B. G. and Williams, G. V. (2008). 'Catalogue of Cometary Orbits', 17th ed., Minor Planet Center.",
    externalUrl: "https://minorplanetcenter.net/iau/Ephemerides/Comets/",
  },
  {
    id: "satellites-norad",
    name: "Artificial Satellite Ephemerides (SGP4/SDP4)",
    category: "solarsystem",
    sourceName: "NORAD Two-Line Element (TLE) Sets",
    institution: "US Space Command / Space-Track.org / Celestrak",
    license: "Public Domain Open Ephemerides",
    description:
      "Real-time orbital tracking for the International Space Station (ISS), Hubble Space Telescope (HST), and Tiangong Space Station via the Simplified General Perturbations (SGP4) model.",
    fieldsUsed: [
      "NORAD Satellite Catalog ID & International Designator",
      "TLE Line 1 & Line 2 (epoch, mean motion, inclination, eccentricity, BSTAR drag)",
      "Real-time topocentric azimuth, elevation, range, and range-rate via satellite.js",
    ],
    referenceCitation:
      "Hoots, F. R. and Roehrich, R. L. (1980). 'Models for Propagation of NORAD Element Sets'. Spacetrack Report No. 3; Kelso, T. S. (2020) CelesTrak.",
    externalUrl: "https://celestrak.org/",
  },

  // ─── 3. Deep Sky & Constellations ───
  {
    id: "messier-catalog",
    name: "Messier Deep-Sky Objects Catalog",
    category: "dso",
    sourceName: "Charles Messier Catalog (1781) & SEDS Database",
    institution: "Students for the Exploration and Development of Space (SEDS) / SIMBAD",
    license: "Open Academic Reference",
    description:
      "Complete curated subset of all prominent Messier objects (M1 Crab Nebula, M31 Andromeda Galaxy, M42 Orion Nebula, M45 Pleiades, M51 Whirlpool, etc.).",
    fieldsUsed: [
      "Messier Number (M1–M110)",
      "Object classification: galaxy, diffuse nebula, planetary nebula, open cluster, globular cluster",
      "Integrated visual magnitude and angular size (arcminutes)",
      "Distance in light-years",
    ],
    referenceCitation:
      "Frommert, H. and Kronberg, C. (2007). 'The SEDS Messier Database'. SEDS; Messier, C. (1781) Connoissance des Temps.",
    externalUrl: "http://www.messier.seds.org/",
  },
  {
    id: "ngc-ic",
    name: "New General Catalogue & Index Catalogue (NGC/IC)",
    category: "dso",
    sourceName: "Revised New General Catalogue / NED",
    institution: "NASA/IPAC Extragalactic Database (NED) / CDS Strasbourg",
    license: "Public Domain",
    description:
      "Curated catalog of ~65 iconic non-Messier deep-sky objects including the Horsehead Nebula (IC 434), Pillars of Creation, Veil Nebula (NGC 6960), and Perseus Double Cluster (NGC 869/884).",
    fieldsUsed: [
      "NGC/IC catalog designations",
      "Accurate J2000 Right Ascension and Declination",
      "Integrated magnitudes, angular dimensions, and astrophysical object classes",
    ],
    referenceCitation:
      "Dreyer, J. L. E. (1888). 'A New General Catalogue of Nebulae and Clusters of Stars'. Memoirs of the Royal Astronomical Society, 49, 1–237; Sulentic, J. W. and Tifft, W. G. (1973) Revised NGC.",
    externalUrl: "https://ned.ipac.caltech.edu/",
  },
  {
    id: "constellations-iau",
    name: "88 Official IAU Constellations & Boundaries",
    category: "dso",
    sourceName: "International Astronomical Union (IAU) Standards",
    institution: "International Astronomical Union (IAU)",
    license: "Official Astronomical Standard",
    description:
      "Standard 88 modern constellations, official Latin names, genitive forms, 3-letter IAU abbreviations, Delporte constellation boundaries (1930), and classical mythology.",
    fieldsUsed: [
      "88 constellation official names & 3-letter abbreviations (e.g. Ori, UMa, Cas)",
      "Asterism stick figures and connecting star links",
      "IAU celestial boundary polygons",
      "Cultural and classical Greco-Roman mythology descriptions",
    ],
    referenceCitation:
      "Delporte, E. (1930). 'Délimitation scientifique des constellations'. Cambridge University Press; IAU Commission 3.",
    externalUrl: "https://www.iau.org/public/themes/constellations/",
  },
  {
    id: "meteor-imo",
    name: "Meteor Showers Radiants & Zenithal Hourly Rates",
    category: "dso",
    sourceName: "International Meteor Organization (IMO) Catalog",
    institution: "International Meteor Organization (IMO) / AMS",
    license: "Open Data",
    description:
      "Radiant coordinates, activity windows, peak dates, entry speeds, and expected peak Zenithal Hourly Rates (ZHR) for major annual meteor showers (Perseids, Geminids, Quadrantids, Leonids, Orionids).",
    fieldsUsed: [
      "Activity date range (start, peak, end)",
      "Radiant coordinates (RA & Dec in radians/degrees)",
      "Peak Zenithal Hourly Rate (ZHR)",
      "Atmospheric entry velocity (km/s)",
      "Known parent cometary or asteroidal body",
    ],
    referenceCitation:
      "Rendtel, J. (2024). 'IMO Meteor Shower Calendar'. International Meteor Organization; American Meteor Society (AMS).",
    externalUrl: "https://www.imo.net/resources/calendar/",
  },

  // ─── 4. Astrometrical Reductions & Time ───
  {
    id: "precession-iau2006",
    name: "Precession & Nutation Models (IAU 2006/2000B)",
    category: "astrometry",
    sourceName: "IAU 2006 Precession (P03) & IAU 2000B Nutation",
    institution: "International Earth Rotation and Reference Systems Service (IERS) / IAU",
    license: "IAU Standard Model",
    description:
      "High-precision rotation transformations from the International Celestial Reference System (ICRS J2000) to the true apparent celestial equator and equinox of date.",
    fieldsUsed: [
      "Precession angles ζ_A, z_A, θ_A from Capitaine et al. (2003) polynomial",
      "IAU 2000B 80-lunation truncated nutation series (dPsi, dEps) to ±1 milliarcsec",
      "IAU 1980 mean obliquity of the ecliptic polynomial ε_0(T)",
      "Euler 3-2-3 coordinate rotation matrices applied to all stars and targets",
    ],
    referenceCitation:
      "Capitaine, N., Wallace, P. T., and Chapront, J. (2003). 'Expressions for IAU 2000 precession quantities'. A&A, 412, 567–586; McCarthy, D. D. and Luzum, B. J. (2002) IERS TN 29.",
    externalUrl: "https://www.iers.org/",
  },
  {
    id: "time-sidereal",
    name: "Astronomical Time, GMST & Delta T",
    category: "astrometry",
    sourceName: "USNO Circular 179 & Espenak-Meeus Delta T Polynomial",
    institution: "U.S. Naval Observatory (USNO) / NASA GSFC",
    license: "Public Scientific Standard",
    description:
      "Time conversions bridging civil clock time (UTC), dynamical time (TT), Greenwich Mean Sidereal Time (GMST), Greenwich Apparent Sidereal Time (GAST), and Local Sidereal Time (LST).",
    fieldsUsed: [
      "Julian Date (JD) and Modified Julian Date (MJD)",
      "Terrestrial Time (TT) via ΔT = TT - UT1 polynomial (Espenak & Meeus 2006)",
      "IAU 1982 / 2000 formula for GMST in seconds and radians",
      "Equation of the equinoxes: GAST = GMST + Δψ cos(ε)",
      "Local Sidereal Time: LST = GAST + observer_longitude",
    ],
    referenceCitation:
      "Kaplan, G. H. (2005). 'The IAU Resolutions on Astronomical Reference Systems, Time Scales, and Earth Rotation Models', USNO Circular No. 179; Espenak, F. and Meeus, J. (2006).",
    externalUrl: "https://eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html",
  },
  {
    id: "refraction-bennett",
    name: "Atmospheric Refraction (Bennett 1982)",
    category: "astrometry",
    sourceName: "Bennett's Empirical Refraction Formula",
    institution: "Royal Institute of Navigation (UK)",
    license: "Open Academic Reference",
    description:
      "Calculates atmospheric bending of starlight near the horizon, correcting apparent observed altitudes down to the astronomical horizon.",
    fieldsUsed: [
      "Bennett's empirical formula: R = 1 / tan(h + 7.31 / (h + 4.4)) arcminutes",
      "Inverse Bennett formula for true → apparent altitude mapping",
      "Standard temperature (10°C) and barometric pressure (1010 hPa) scaling",
    ],
    referenceCitation:
      "Bennett, G. G. (1982). 'The Calculation of Astronomical Refraction in Marine Navigation'. Journal of Navigation, 35(2), 255–259.",
    externalUrl: "https://www.cambridge.org/core/journals/journal-of-navigation/article/abs/calculation-of-astronomical-refraction-in-marine-navigation/6E1E4532B40784968B75F38E6A89EB7D",
    accuracyNote: "Accurate to ~0.1 arcminutes for altitudes h > 5°, within 0.5 arcmin at the horizon.",
  },
  {
    id: "riseset-meeus",
    name: "Rise, Transit & Set Celestial Mechanics",
    category: "astrometry",
    sourceName: "Meeus Astronomical Algorithms (Chapter 15)",
    institution: "Jean Meeus / Willmann-Bell",
    license: "Published Academic Standard",
    description:
      "Computes meridian transit times, rising, and setting instants for any celestial body as a function of observer latitude, target declination, and horizon altitude.",
    fieldsUsed: [
      "Horizon hour angle: cos(H0) = (sin h0 - sin φ sin δ) / (cos φ cos δ)",
      "Standard horizon dip thresholds: -0.833° (stars, planets), -0.833° (Sun geometric center), +0.125° (Moon with parallax)",
      "Circumpolar above (never sets) and circumpolar below (never rises) classification",
    ],
    referenceCitation:
      "Meeus, Jean (1998). 'Astronomical Algorithms', 2nd Edition, Chapter 15: Rising, Transit, and Setting. Willmann-Bell, Richmond, VA.",
  },

  // ─── 5. Real-Time Environment & Weather ───
  {
    id: "weather-openmeteo",
    name: "Real-Time Weather & Atmospheric Seeing",
    category: "environment",
    sourceName: "Open-Meteo Weather API",
    institution: "Open-Meteo (WMO compliant National Weather Service Models)",
    license: "Non-Commercial / Open Database License (ODbL) / Attribution 4.0",
    description:
      "Fetches real-time atmospheric conditions for the observer's GPS or selected coordinates to compute astronomical seeing, atmospheric transparency, and dew hazard.",
    fieldsUsed: [
      "Total cloud cover percentage (0% = crystal clear, 100% = overcast)",
      "2-metre ambient temperature (°C) and relative humidity (%)",
      "Dew point temperature (°C) for optical telescope condensation warnings",
      "Surface wind speed (km/h) for telescope mount stability and seeing estimation",
      "Meteorological horizontal visibility (metres/km)",
    ],
    referenceCitation:
      "Open-Meteo Weather Forecast API. Numerical Weather Prediction models: ECMWF IFS, DWD ICON, NOAA GFS. Free open-source weather API.",
    externalUrl: "https://open-meteo.com/",
    accuracyNote: "Updated hourly with high spatial resolution (1km–11km depending on region).",
  },
  {
    id: "lightpollution-falchi",
    name: "World Atlas of Artificial Night Sky Brightness",
    category: "environment",
    sourceName: "World Atlas of Artificial Night Sky Brightness 2015 & lightpollutionmap.info",
    institution: "Falchi et al. (ISTIL / NOAA / National Park Service) & lightpollutionmap.info",
    license: "Open Scientific Publication / Creative Commons",
    description:
      "High-resolution satellite data (VIIRS Day-Night Band) calibrated with ground-based Sky Quality Meter (SQM) measurements to determine light pollution severity and naked-eye limiting magnitude.",
    fieldsUsed: [
      "Sky Quality Meter (SQM) brightness in mag/arcsec²",
      "Bortle Dark-Sky Class (Class 1 Excellent Dark Sky to Class 9 Inner-City Sky)",
      "Schaefer (2001) naked-eye limiting magnitude conversion: LM ≈ 7.93 - 5 log10(1 + 10^(4.316 - SQM/5))",
      "Dynamic horizon sky-glow rendering on the StarTracker canvas",
    ],
    referenceCitation:
      "Falchi, F., Cinzano, P., Duriscoe, D., et al. (2016). 'The new world atlas of artificial night sky brightness'. Science Advances, 2(6), e1600377; Schaefer, B. E. (2001).",
    externalUrl: "https://www.lightpollutionmap.info/",
    accuracyNote: "Includes offline population-density fallback estimator when external raster queries are unavailable.",
  },
];

export function AboutDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSources = useMemo(() => {
    return DATA_SOURCES.filter((item) => {
      const matchesTab = activeTab === "all" || item.category === activeTab;
      if (!matchesTab) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sourceName.toLowerCase().includes(q) ||
        item.institution.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.fieldsUsed.some((f) => f.toLowerCase().includes(q)) ||
        item.referenceCitation.toLowerCase().includes(q)
      );
    });
  }, [activeTab, searchQuery]);

  const copyCitation = (item: DataSourceItem) => {
    const text = `${item.name} (${item.institution})\nSource: ${item.sourceName}\nCitation: ${item.referenceCitation}\nURL: ${item.externalUrl || "N/A"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllBibTeX = () => {
    const bibtex = DATA_SOURCES.map((s) => {
      const tag = s.id.replace(/[^a-zA-Z0-9]/g, "");
      return `@misc{startracker_${tag},
  title = {${s.name}},
  author = {${s.institution}},
  howpublished = {${s.sourceName}},
  note = {${s.referenceCitation}},
  url = {${s.externalUrl || ""}}
}`;
    }).join("\n\n");
    navigator.clipboard.writeText(bibtex);
    setCopiedId("bibtex_all");
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col p-0 gap-0 border-white/10 bg-slate-950/98 text-slate-100 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 shadow-md shadow-amber-500/20">
                <Database className="h-5 w-5 text-slate-950" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  About & Scientific Data Provenance
                  <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-300 text-[10px] font-mono">
                    Verified Sources
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete documentation of all astronomical catalogs, physical databases, ephemeris theories, and live APIs powering StarTracker.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={copyAllBibTeX}
              className="h-8 gap-1.5 border-white/15 bg-white/5 hover:bg-white/10 text-xs text-slate-300"
              title="Copy BibTeX citations for all data sources"
            >
              {copiedId === "bibtex_all" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">BibTeX Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy BibTeX Citations</span>
                </>
              )}
            </Button>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search data sources (e.g. Hipparcos, VSOP87, Open-Meteo, Bennett, Bortle, JPL, SGP4)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Content body with category tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-5 pt-2 pb-1 border-b border-white/5 bg-slate-900/30 flex-shrink-0">
            <TabsList className="bg-white/5 h-8 p-0.5 gap-1 border border-white/10 w-full sm:w-auto flex overflow-x-auto justify-start">
              <TabsTrigger value="all" className="h-7 text-xs px-2.5 data-[state=active]:bg-amber-400 data-[state=active]:text-slate-950 font-medium">
                All Sources ({DATA_SOURCES.length})
              </TabsTrigger>
              <TabsTrigger value="stars" className="h-7 text-xs px-2.5 data-[state=active]:bg-amber-400 data-[state=active]:text-slate-950 font-medium flex items-center gap-1">
                <Star className="h-3 w-3" /> Stars & Gaia
              </TabsTrigger>
              <TabsTrigger value="solarsystem" className="h-7 text-xs px-2.5 data-[state=active]:bg-amber-400 data-[state=active]:text-slate-950 font-medium flex items-center gap-1">
                <Orbit className="h-3 w-3" /> Solar System
              </TabsTrigger>
              <TabsTrigger value="dso" className="h-7 text-xs px-2.5 data-[state=active]:bg-amber-400 data-[state=active]:text-slate-950 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Deep Sky & DSOs
              </TabsTrigger>
              <TabsTrigger value="astrometry" className="h-7 text-xs px-2.5 data-[state=active]:bg-amber-400 data-[state=active]:text-slate-950 font-medium flex items-center gap-1">
                <Binary className="h-3 w-3" /> Astrometry & Math
              </TabsTrigger>
              <TabsTrigger value="environment" className="h-7 text-xs px-2.5 data-[state=active]:bg-amber-400 data-[state=active]:text-slate-950 font-medium flex items-center gap-1">
                <CloudSun className="h-3 w-3" /> Weather & Bortle
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 min-h-0">
            {filteredSources.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No data sources found matching &ldquo;{searchQuery}&rdquo;. Try another term.
              </div>
            ) : (
              filteredSources.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition-all duration-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-100">{item.name}</h3>
                        <Badge
                          variant="secondary"
                          className="bg-white/10 text-slate-300 border-white/10 text-[9px] uppercase tracking-wider font-mono"
                        >
                          {item.category}
                        </Badge>
                      </div>
                      <div className="text-xs text-amber-300 font-mono mt-0.5">
                        {item.institution} · <span className="text-slate-400">{item.sourceName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCitation(item)}
                        className="h-7 px-2 text-[11px] text-slate-400 hover:text-white hover:bg-white/10 gap-1"
                        title="Copy citation"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Cite</span>
                          </>
                        )}
                      </Button>

                      {item.externalUrl && (
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                        >
                          <span>Official Link</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Fields extracted */}
                  <div className="mt-3 pt-2.5 border-t border-white/5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1.5">
                      Exact Data Fields Extracted:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.fieldsUsed.map((field, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md bg-white/[0.04] border border-white/5 px-2 py-0.5 text-[11px] text-slate-300"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reference & Accuracy Note */}
                  <div className="mt-2.5 bg-slate-900/60 rounded-lg p-2.5 border border-white/5 text-[11px] space-y-1">
                    <div className="text-slate-400">
                      <span className="text-slate-500 font-semibold font-mono">CITATION: </span>
                      <span className="font-serif italic text-slate-300">{item.referenceCitation}</span>
                    </div>
                    {item.accuracyNote && (
                      <div className="text-emerald-400/90 text-[10px] font-mono">
                        <span className="text-emerald-500 font-semibold">ACCURACY: </span>
                        {item.accuracyNote}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Tabs>

        {/* Footer info bar */}
        <div className="p-3.5 border-t border-white/10 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 flex-shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            All algorithms strictly conform to IAU standards & JPL Horizons ephemerides.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
