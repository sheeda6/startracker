/**
 * Atmospheric refraction — Bennett's formula (fast, accurate to ~0.1' for alt > 5°).
 *
 * Reference: Bennett, G.G. (1982), "The Calculation of Astronomical Refraction
 * in Marine Navigation", Journal of Navigation 35.
 *
 * Input/output altitudes in radians.
 */

/** Apparent (observed) altitude → true (geometric) altitude. */
export function refractionBennett(apparentAlt: number): number {
  if (apparentAlt < -Math.PI / 2) return apparentAlt;
  const aDeg = (apparentAlt * 180) / Math.PI;
  // R in arcminutes
  const rArcmin =
    1.0 / Math.tan((aDeg + 7.31 / (aDeg + 4.4)) * (Math.PI / 180));
  const rRad = (rArcmin / 60) * (Math.PI / 180);
  return apparentAlt - rRad;
}

/** True (geometric) altitude → apparent (observed) altitude (inverse Bennett). */
export function refractionBennettInverse(trueAlt: number): number {
  if (trueAlt < -Math.PI / 2) return trueAlt;
  const hDeg = (trueAlt * 180) / Math.PI;
  const rArcmin =
    1.0 / Math.tan((hDeg + 10.3 / (hDeg + 5.11)) * (Math.PI / 180));
  const rRad = (rArcmin / 60) * (Math.PI / 180);
  return trueAlt + rRad;
}
