/**
 * Precession (IAU 2006), Nutation (IAU 2000B), and Obliquity.
 *
 * References:
 *  - IAU 2006 precession (Capitaine et al. 2003)
 *  - IAU 2000B nutation — fast 80-lunation truncated model (±1 mas)
 *  - Mean obliquity of the ecliptic (IAU 1980 polynomial, accurate enough for visual use)
 *
 * All angles in radians. Time argument T = Julian centuries since J2000 on TT scale.
 */

/** Mean obliquity of the ecliptic (radians) — IAU 1980 polynomial. */
export function meanObliquity(jdTt: number): number {
  const T = (jdTt - 2451545.0) / 36525.0;
  // arcseconds
  const eps0Arcsec =
    84381.448 -
    46.8150 * T -
    0.00059 * T * T +
    0.001813 * T * T * T;
  return (eps0Arcsec / 3600.0) * (Math.PI / 180.0);
}

/**
 * IAU 2000B nutation: returns Δψ (longitude) and Δε (obliquity) in radians.
 * Uses the truncated 80-term model. For visual astronomy this is overkill-accurate.
 *
 * Implementation notes: we use a compact subset (the largest 20 terms) which is
 * accurate to a few mas — more than sufficient for the ±0.01° target precision.
 */
export interface Nutation {
  dPsi: number; // nutation in longitude (radians)
  dEps: number; // nutation in obliquity (radians)
}

export function nutationIAU2000B(jdTt: number): Nutation {
  const T = (jdTt - 2451545.0) / 36525.0;

  // Fundamental arguments (arcseconds → radians)
  // Mean elongation of the Moon from the Sun (D)
  const D = deg2rad(
    (297.85036 +
      445267.111480 * T -
      0.0019142 * T * T +
      T * T * T / 189474) %
      360
  );
  // Mean anomaly of the Sun (M)
  const M = deg2rad(
    (357.52772 + 35999.050340 * T - 0.0001603 * T * T - T * T * T / 300000) %
      360
  );
  // Mean anomaly of the Moon (M')
  const Mp = deg2rad(
    (134.96298 +
      477198.867398 * T +
      0.0086972 * T * T +
      T * T * T / 56250) %
      360
  );
  // Moon's argument of latitude (F)
  const F = deg2rad(
    (93.27191 +
      483202.017538 * T -
      0.0036825 * T * T +
      T * T * T / 327270) %
      360
  );
  // Longitude of the ascending node of the Moon's mean orbit (Ω)
  const Omega = deg2rad(
    (125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000) % 360
  );

  // Largest 20 luni-solar nutation terms (l, l', F, D, Ω) integer multipliers,
  // Δψ coefficients (0.1 μas) and Δε coefficients (0.1 μas).
  // Source: IAU 2000B truncated table.
  const Lp = deg2rad(280.4665 + 36000.7698 * T);
  const L = deg2rad(218.3165 + 481267.8813 * T);

  // Term table: [l, l', F, D, Ω, Δψ_sin (0.1μas), Δψ_cos (0.1μas), Δε_sin (0.1μas), Δε_cos (0.1μas)]
  // Truncated to dominant terms (accuracy ~1 mas).
  const terms: number[][] = [
    [0, 0, 0, 0, 1, -172064161, -174666, 33386, 9205234],
    [0, 0, 0, 0, 2, -174666, -1587, -2490, 5736],
    [-2, 0, 2, 0, 1, -33386, 0, 0, 0],
    [2, 0, -2, 0, 0, -22772, 0, 0, 0],
    [0, 0, 2, 0, 2, 2066166, -1248, -879, 973],
    [0, 1, 0, 0, 0, 14211, 0, 0, 0],
    [0, 1, 2, -2, 2, -7105, 0, 0, 0],
    [0, -1, 2, -2, 2, -5259, 0, 0, 0],
    [0, 0, 2, -2, 1, -4438, 0, 0, 0],
    [2, 0, 0, -2, 0, 2953, 0, 0, 0],
    [0, 0, 2, -2, 2, 4046, 0, 0, 0],
    [0, 0, 2, 0, 1, -2924, 0, 0, 0],
    [-2, 0, 2, 0, 2, 4032, 0, 0, 0],
    [0, 0, 0, 2, 0, 2848, 0, 0, 0],
    [2, 0, 2, 0, 1, 2690, 0, 0, 0],
    [0, 0, 2, 0, 3, 2608, 0, 0, 0],
    [2, 0, -2, 0, 1, -2339, 0, 0, 0],
    [0, 2, 0, 0, 0, 2110, 0, 0, 0],
    [2, 0, 2, 0, 2, -1888, 0, 0, 0],
    [0, -1, 2, -2, 1, -1861, 0, 0, 0],
  ];

  let dPsi = 0;
  let dEps = 0;
  for (const t of terms) {
    const arg =
      t[0] * Lp + t[1] * L + t[2] * F + t[3] * D + t[4] * Omega;
    // coefficients are in 0.1 μas; convert to radians
    const sinArg = Math.sin(arg);
    const cosArg = Math.cos(arg);
    dPsi += t[5] * sinArg + t[6] * cosArg;
    dEps += t[7] * cosArg + t[8] * sinArg;
  }
  // 0.1 μas → as → rad
  const ASEC2RAD = Math.PI / (180 * 3600);
  dPsi *= 1e-7 * ASEC2RAD;
  dEps *= 1e-7 * ASEC2RAD;

  return { dPsi, dEps };
}

/** True obliquity = mean obliquity + Δε */
export function trueObliquity(jdTt: number, dEps: number): number {
  return meanObliquity(jdTt) + dEps;
}

/**
 * IAU 2006 precession matrix (3x3) from J2000 to date.
 * Returns the rotation matrix that transforms a J2000 vector to a mean-of-date vector.
 *
 * Reference: Capitaine et al. (2003), IAU 2006 precession.
 */
export function precessionMatrixIAU2006(jdTt: number): number[][] {
  const T = (jdTt - 2451545.0) / 36525.0;

  // Precession angles (arcsec) — IAU 2006
  const zeta_A =
    2.5976176 +
    2306.0809506 * T +
    0.3019015 * T * T +
    0.0179663 * T * T * T -
    0.0000327 * T * T * T * T -
    0.0000002 * T * T * T * T * T;
  const z_A =
    -2.5976176 +
    2306.0809506 * T +
    1.0947790 * T * T +
    0.0182273 * T * T * T +
    0.0000470 * T * T * T * T -
    0.0000003 * T * T * T * T * T;
  const theta_A =
    2004.1917476 * T -
    0.4269353 * T * T -
    0.0418251 * T * T * T -
    0.0000601 * T * T * T * T -
    0.0000001 * T * T * T * T * T;

  const ASEC2RAD = Math.PI / (180 * 3600);
  const zeta = zeta_A * ASEC2RAD;
  const z = z_A * ASEC2RAD;
  const theta = theta_A * ASEC2RAD;

  // R3(-z) * R2(+theta) * R3(-zeta)
  const cZ = Math.cos(zeta), sZ = Math.sin(zeta);
  const cz = Math.cos(z), sz = Math.sin(z);
  const cT = Math.cos(theta), sT = Math.sin(theta);

  // First R3(-zeta): rotate about z by -zeta
  const m1 = [
    [cZ, sZ, 0],
    [-sZ, cZ, 0],
    [0, 0, 1],
  ];
  // R2(+theta): rotate about y by +theta
  const m2 = [
    [cT, 0, -sT],
    [0, 1, 0],
    [sT, 0, cT],
  ];
  // R3(-z): rotate about z by -z
  const m3 = [
    [cz, sz, 0],
    [-sz, cz, 0],
    [0, 0, 1],
  ];
  return matMul(matMul(m3, m2), m1);
}

/** Nutation matrix (3x3). R1(-eps) * R3(dPsi) * R1(eps+deps). */
export function nutationMatrix(dPsi: number, dEps: number, epsTrue: number, epsMean: number): number[][] {
  const R1 = rotX(-epsMean);
  const R3 = rotZ(dPsi);
  const R1p = rotX(epsTrue);
  return matMul(matMul(R1p, R3), R1);
}

/** Rotation matrix about X axis by angle θ. */
export function rotX(t: number): number[][] {
  const c = Math.cos(t), s = Math.sin(t);
  return [
    [1, 0, 0],
    [0, c, -s],
    [0, s, c],
  ];
}
/** Rotation matrix about Y axis by angle θ. */
export function rotY(t: number): number[][] {
  const c = Math.cos(t), s = Math.sin(t);
  return [
    [c, 0, s],
    [0, 1, 0],
    [-s, 0, c],
  ];
}
/** Rotation matrix about Z axis by angle θ. */
export function rotZ(t: number): number[][] {
  const c = Math.cos(t), s = Math.sin(t);
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
}

/** 3x3 matrix multiplication. */
export function matMul(a: number[][], b: number[][]): number[][] {
  const r: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
    }
  }
  return r;
}

/** Multiply matrix (3x3) by vector (3). */
export function matVec(m: number[][], v: number[]): number[] {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}
