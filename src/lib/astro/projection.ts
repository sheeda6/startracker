/**
 * Stereographic sky projection — maps (alt, az) to canvas (x, y).
 *
 * Two modes:
 *  - "all-sky" — zenith at center, horizon at the edge. Standard azimuthal
 *    equidistant / stereographic projection centered on the zenith.
 *  - azimuth runs clockwise from North at the top.
 *
 * Stereographic formula (centered on zenith):
 *   r = tan(π/2 - alt) / tan(π/2)   (i.e. r = tan(zenithAngle) for gnomonic)
 *   For stereographic from the nadir point:
 *     r = 2 * tan(zenithAngle/2)
 *
 * We use stereographic (from antipode) which keeps the horizon as a circle:
 *   r = 2 * R * tan((π/2 - alt)/2)
 * where R is the canvas radius.
 *
 * x = cx + r * sin(az)
 * y = cy - r * cos(az)
 * (North at top, East at right — matches the sky as seen looking up.)
 */

export interface ProjectionResult {
  x: number;
  y: number;
  visible: boolean;
}

export interface ProjectOpts {
  cx: number;       // canvas center x
  cy: number;       // canvas center y
  radius: number;   // radius of the horizon circle in pixels
  /** Altitude in radians. */
  alt: number;
  /** Azimuth in radians (from North through East). */
  az: number;
}

/** Stereographic projection of an (alt, az) point to canvas coordinates. */
export function projectStereographic(opts: ProjectOpts): ProjectionResult {
  const { cx, cy, radius, alt, az } = opts;
  const visible = alt > -0.01; // include up to horizon
  const za = Math.PI / 2 - alt; // zenith angle
  // stereographic: r = 2R tan(za/2)
  // For very low altitudes (za → π) this blows up; clamp.
  let r: number;
  if (za >= Math.PI) {
    r = radius * 4; // far off-screen
  } else {
    r = 2 * radius * Math.tan(za / 2);
  }
  const x = cx + r * Math.sin(az);
  const y = cy - r * Math.cos(az);
  return { x, y, visible };
}

/**
 * Inverse projection: canvas (x, y) -> (alt, az).
 * Useful for mouse interaction.
 */
export function unprojectStereographic(
  cx: number,
  cy: number,
  radius: number,
  x: number,
  y: number,
): { alt: number; az: number; visible: boolean } | null {
  const dx = x - cx;
  const dy = -(y - cy); // flip y so North is up
  const r = Math.hypot(dx, dy);
  if (r < 1e-9) {
    return { alt: Math.PI / 2, az: 0, visible: true };
  }
  // r = 2R tan(za/2)  →  za = 2 atan(r / (2R))
  const za = 2 * Math.atan(r / (2 * radius));
  if (za > Math.PI / 2 + 0.01) return null; // outside horizon + margin
  const alt = Math.PI / 2 - za;
  const az = Math.atan2(dx, dy) % (2 * Math.PI);
  const visible = alt > -0.05;
  return { alt, az: az < 0 ? az + 2 * Math.PI : az, visible };
}

/**
 * Compute great-circle angular distance between two (alt, az) points.
 */
export function angularDistance(alt1: number, az1: number, alt2: number, az2: number): number {
  const za1 = Math.PI / 2 - alt1;
  const za2 = Math.PI / 2 - alt2;
  const dAz = az2 - az1;
  const cosD =
    Math.cos(za1) * Math.cos(za2) + Math.sin(za1) * Math.sin(za2) * Math.cos(dAz);
  return Math.acos(Math.max(-1, Math.min(1, cosD)));
}

/** Pick a star radius (in px) for a given magnitude. Brighter stars are bigger. */
export function magnitudeToRadius(mag: number, scale = 1): number {
  // Map mag -1.5..+6 to radius 3.2..0.4 px (clamped)
  const clamped = Math.max(-2, Math.min(7, mag));
  const t = (clamped + 2) / 9; // 0..1
  const r = 3.2 - t * 2.8;
  return Math.max(0.4, r * scale);
}

/** Map magnitude to opacity for nicer rendering of faint stars. */
export function magnitudeToOpacity(mag: number): number {
  const clamped = Math.max(-2, Math.min(6.5, mag));
  return Math.max(0.25, 1 - (clamped + 2) / 9);
}
