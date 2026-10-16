"use client";

/**
 * SkyMap — Canvas 2D all-sky renderer.
 *
 * Stereographic projection centered on the zenith. North up. Renders:
 *  - sky gradient + horizon ring + cardinal directions
 *  - altitude/azimuth grid (every 15° alt, 30° az)
 *  - celestial equator + ecliptic
 *  - milky way band (procedural)
 *  - constellation stick figures + names
 *  - stars (size by magnitude, color by spectral type)
 *  - star labels when zoomed or hovered
 *  - selected/hovered highlight rings
 *  - mouse hover and click → select star
 *
 * Rendering targets 60 FPS but only re-renders when time/observer/view changes
 * (~10 Hz actual physics update; animation frame interpolates).
 */

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useStarTracker } from "@/lib/store";
import { STARS, STARS_BY_HIP, spectralColor, type Star } from "@/data/stars";
import { getStarProperties } from "@/data/starProperties";
import { CONSTELLATION_LINES, CONSTELLATION_MAP } from "@/data/constellations";
import { MESSIER, MESSIER_TYPE_COLORS, type MessierObject } from "@/data/messier";
import { getActiveShowers, daysToPeak } from "@/data/meteorShowers";
import {
  buildFrame,
  transformStar,
  refract,
  applyProperMotion,
  type FrameContext,
} from "@/lib/astro/engine";
import {
  projectStereographic,
  unprojectStereographic,
  magnitudeToRadius,
  magnitudeToOpacity,
} from "@/lib/astro/projection";
import { equatorialToHorizontal } from "@/lib/astro/coordinates";
import { formatHMS, formatDMS, formatDeg } from "@/lib/astro/time";
import { sunPosition, moonPosition, planetPositions, moonPhase } from "@/lib/astro/solarSystem";
import { computeAsteroidPositions } from "@/data/asteroids";
import { fetchLiveTLEs, computeSatellitePositions, subscribeSatellites } from "@/data/satellites";
import { computeCometPositions } from "@/data/comets";
import { NGC_OBJECTS, NGC_TYPE_COLORS } from "@/data/ngc";
import { useLightPollution } from "@/hooks/useLightPollution";
import { getOrbitTracks } from "@/lib/astro/orbits";

interface RenderedStar {
  star: Star;
  x: number;
  y: number;
  r: number;
  alt: number;
  az: number;
  visible: boolean;
}

export function SkyMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef<RenderedStar[]>([]);
  const lastTimeRef = useRef<number>(0);
  const dprRef = useRef<number>(1);
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number; moved: boolean }>({ active: false, lastX: 0, lastY: 0, moved: false });

  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const clockMode = useStarTracker((s) => s.clockMode);
  const layers = useStarTracker((s) => s.layers);
  const view = useStarTracker((s) => s.view);
  const filters = useStarTracker((s) => s.filters);
  const selectedHip = useStarTracker((s) => s.selectedHip);
  const hoveredHip = useStarTracker((s) => s.hoveredHip);
  const setSelectedHip = useStarTracker((s) => s.setSelectedHip);
  const setHoveredHip = useStarTracker((s) => s.setHoveredHip);
  const tickTime = useStarTracker((s) => s.tickTime);
  const setView = useStarTracker((s) => s.setView);
  const measureMode = useStarTracker((s) => s.measureMode);
  const measureStart = useStarTracker((s) => s.measureStart);
  const measureEnd = useStarTracker((s) => s.measureEnd);
  const setMeasureStart = useStarTracker((s) => s.setMeasureStart);
  const setMeasureEnd = useStarTracker((s) => s.setMeasureEnd);
  const properMotionYear = useStarTracker((s) => s.properMotionYear);

  const selectedBody = useStarTracker((s) => s.selectedBody);
  const setSelectedBody = useStarTracker((s) => s.setSelectedBody);
  const [hoveredBody, setHoveredBody] = useState<string | null>(null);
  const lp = useLightPollution(observer);
  const renderedBodiesRef = useRef<{ id: string; x: number; y: number; r: number }[]>([]);

  // Precomputed frame (memoized per time/observer)
  const frame: FrameContext = useMemo(
    () =>
      buildFrame({
        date: currentTime,
        lat: (observer.latDeg * Math.PI) / 180,
        lon: (observer.lonDeg * Math.PI) / 180,
        elevationM: observer.elevationM,
      }),
    [currentTime, observer.latDeg, observer.lonDeg, observer.elevationM]
  );

  const [, setSatVersion] = useState(0);
  useEffect(() => {
    fetchLiveTLEs();
    return subscribeSatellites(() => {
      setSatVersion((v) => v + 1);
    });
  }, []);

  // Tick the clock in realtime modes
  useEffect(() => {
    if (clockMode === "paused" || clockMode === "custom") return;
    const interval = setInterval(() => {
      tickTime(100);
    }, 100);
    return () => clearInterval(interval);
  }, [clockMode, tickTime]);

  // Resize handling
  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Main render loop — use a ref to hold the latest render fn and a single
  // rAF loop that reads from it. This avoids re-subscribing on every prop change.
  const renderRef = useRef<() => void>(() => {});

  // The render function reads current props/state at call time via closure.
  // We sync it to the ref inside an effect (not during render) to satisfy the
  // React Compiler's "no ref writes during render" rule.
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    const dpr = dprRef.current;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) / 2 - 8 * dpr;
    const zoomedRadius = radius * view.zoom;
    const scale = Math.min(W, H) / 600;
    const timeMs = performance.now();

    // 1. Sky background gradient (dark zenith → lighter horizon)
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, zoomedRadius);
    bgGrad.addColorStop(0, "#020412");
    bgGrad.addColorStop(0.55, "#070d24");
    bgGrad.addColorStop(1, "#101b3a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 1b. Atmospheric haze near horizon (subtle blue glow)
    const hazeGrad = ctx.createRadialGradient(cx, cy, zoomedRadius * 0.7, cx, cy, zoomedRadius);
    hazeGrad.addColorStop(0, "rgba(30, 60, 120, 0)");
    hazeGrad.addColorStop(0.7, "rgba(30, 60, 120, 0.03)");
    hazeGrad.addColorStop(1, "rgba(60, 100, 180, 0.08)");
    ctx.fillStyle = hazeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, zoomedRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Light pollution overlay (if enabled)
    if (layers.lightPollutionOverlay && !lp.loading) {
      const lpColors = [
        "rgba(200, 200, 200, 0)", // Bortle 1
        "rgba(200, 200, 200, 0)", // Bortle 2
        "rgba(251, 191, 36, 0.02)", // Bortle 3
        "rgba(251, 191, 36, 0.05)", // Bortle 4
        "rgba(245, 158, 11, 0.10)", // Bortle 5
        "rgba(245, 158, 11, 0.15)", // Bortle 6
        "rgba(217, 119, 6, 0.22)",  // Bortle 7
        "rgba(180, 83, 9, 0.30)",   // Bortle 8
        "rgba(146, 64, 14, 0.40)",  // Bortle 9
      ];
      const lpGlow = lpColors[lp.bortle - 1] || "rgba(0,0,0,0)";
      if (lp.bortle > 2) {
        const glowGrad = ctx.createRadialGradient(cx, cy, zoomedRadius * 0.4, cx, cy, zoomedRadius);
        glowGrad.addColorStop(0, "rgba(251, 191, 36, 0)");
        glowGrad.addColorStop(0.5, lpGlow.replace(/[\d\.]+\)$/, "0.04)"));
        glowGrad.addColorStop(1, lpGlow);
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, zoomedRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // 2. Outside-horizon mask (ground)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.arc(cx, cy, zoomedRadius, 0, 2 * Math.PI, true);
    ctx.fillStyle = "rgba(8, 5, 2, 0.92)";
    ctx.fill("evenodd");
    ctx.restore();

    // 3. Milky Way band (procedural)
    if (layers.milkyWay) {
      drawMilkyWay(ctx, cx, cy, zoomedRadius, frame, layers.refraction, view.rotation, view.zoom, dpr);
    }

    // 4. Alt/Az grid
    if (layers.grid) {
      drawAltAzGrid(ctx, cx, cy, zoomedRadius, view.rotation, dpr);
    }

    const latRad = (observer.latDeg * Math.PI) / 180;

    // 5. Celestial equator
    if (layers.equator) {
      drawCelestialCircle(ctx, cx, cy, zoomedRadius, frame, 0, view.rotation, layers.refraction, "#3b6ea5", 1 * dpr);
    }
    // 6. Ecliptic
    if (layers.ecliptic) {
      drawCelestialCircle(ctx, cx, cy, zoomedRadius, frame, frame.epsTrue, view.rotation, layers.refraction, "#a87c2f", 1 * dpr);
    }

    // 6b. Orbit/daily path for selected object or star
    if (layers.orbits && (selectedBody || selectedHip != null)) {
      drawOrbitTracks(ctx, cx, cy, zoomedRadius, frame, view.rotation, layers.refraction, dpr, currentTime, observer.latDeg, observer.lonDeg, observer.elevationM, latRad, selectedBody, selectedHip);
    }

    // 7. Constellation lines
    const renderedStars: RenderedStar[] = [];
    if (layers.constellations) {
      drawConstellationLines(ctx, cx, cy, zoomedRadius, frame, view.rotation, layers.refraction, dpr, selectedHip);
    }

    // 8. Stars
    const sinPhi = frame.sinLat;
    const cosPhi = frame.cosLat;

    // Sort by magnitude (brightest last so they render on top)
    const sortedStars = [...STARS].sort((a, b) => b.mag - a.mag);

    for (const star of sortedStars) {
      if (star.mag > filters.maxMagnitude) continue;
      // Apply proper motion if the demo year is non-zero
      const pos = properMotionYear !== 0
        ? applyProperMotion(star.ra, star.dec, star.pmRa, star.pmDec, properMotionYear)
        : { ra: star.ra, dec: star.dec };
      const tr = transformStar(pos.ra, pos.dec, frame, latRad);
      let alt = tr.horizontal.alt;
      const az = tr.horizontal.az;
      if (layers.refraction && alt < Math.PI / 2) {
        alt = refract(alt); // observed altitude
      }
      if (alt <= -0.02) continue; // below horizon

      const proj = projectStereographic({
        cx,
        cy,
        radius: zoomedRadius,
        alt,
        az: az + view.rotation,
      });

      // Apply constellation filter
      if (filters.constellation !== "all" && star.constellation !== filters.constellation) {
        continue;
      }
      // Apply visible-only
      if (filters.visibleOnly && alt < 0.05) continue;

      renderedStars.push({
        star,
        x: proj.x,
        y: proj.y,
        r: magnitudeToRadius(star.mag, scale),
        alt,
        az,
        visible: proj.visible,
      });

      // Apply spectral color
      const [cr, cg, cb] = spectralColor(star.spectral);
      const baseAlpha = magnitudeToOpacity(star.mag);
      const r = magnitudeToRadius(star.mag, scale);

      // Subtle twinkle: per-star phase based on HIP, modulated by time.
      const twinklePhase = (star.hip % 100) / 100 * Math.PI * 2;
      const twinkle = 1 + 0.06 * Math.sin(timeMs / 700 + twinklePhase);
      const alpha = baseAlpha * twinkle;

      // Multi-layer glow for brighter stars — outer halo + inner corona
      if (star.mag < 3.0) {
        // Outer halo (large, faint)
        const haloR = r * (star.mag < 1.0 ? 10 : 6);
        const halo = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, haloR);
        const haloAlpha = star.mag < 0 ? 0.35 : star.mag < 1 ? 0.22 : star.mag < 2 ? 0.12 : 0.06;
        halo.addColorStop(0, `rgba(${cr},${cg},${cb},${haloAlpha * alpha})`);
        halo.addColorStop(0.3, `rgba(${cr},${cg},${cb},${haloAlpha * 0.4 * alpha})`);
        halo.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, haloR, 0, 2 * Math.PI);
        ctx.fill();

        // Inner corona (smaller, brighter)
        const coronaR = r * 3;
        const corona = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, coronaR);
        corona.addColorStop(0, `rgba(${cr},${cg},${cb},${0.6 * alpha})`);
        corona.addColorStop(0.5, `rgba(${cr},${cg},${cb},${0.2 * alpha})`);
        corona.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = corona;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, coronaR, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Star body — gradient disc for a 3D sphere look
      const bodyGrad = ctx.createRadialGradient(
        proj.x - r * 0.2, proj.y - r * 0.2, 0,
        proj.x, proj.y, r
      );
      bodyGrad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      bodyGrad.addColorStop(0.3, `rgba(${Math.min(255,cr+40)},${Math.min(255,cg+40)},${Math.min(255,cb+40)},${alpha})`);
      bodyGrad.addColorStop(1, `rgba(${cr},${cg},${cb},${alpha * 0.8})`);
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r, 0, 2 * Math.PI);
      ctx.fill();

      // Diffraction spikes (Airy disk pattern) for bright stars
      if (star.mag < 1.5) {
        const spikeIntensity = star.mag < 0 ? 0.6 : star.mag < 0.5 ? 0.45 : 0.25;
        const spikeLen = r * (star.mag < 0 ? 6 : 4.5);
        // 4-point cross (horizontal + vertical)
        const spikeGrad = ctx.createLinearGradient(proj.x - spikeLen, proj.y, proj.x + spikeLen, proj.y);
        spikeGrad.addColorStop(0, `rgba(${cr},${cg},${cb},0)`);
        spikeGrad.addColorStop(0.5, `rgba(${cr},${cg},${cb},${spikeIntensity * alpha})`);
        spikeGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.strokeStyle = spikeGrad;
        ctx.lineWidth = (star.mag < 0 ? 1.2 : 0.8) * dpr;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(proj.x - spikeLen, proj.y);
        ctx.lineTo(proj.x + spikeLen, proj.y);
        ctx.stroke();
        const spikeGradV = ctx.createLinearGradient(proj.x, proj.y - spikeLen, proj.x, proj.y + spikeLen);
        spikeGradV.addColorStop(0, `rgba(${cr},${cg},${cb},0)`);
        spikeGradV.addColorStop(0.5, `rgba(${cr},${cg},${cb},${spikeIntensity * alpha})`);
        spikeGradV.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.strokeStyle = spikeGradV;
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y - spikeLen);
        ctx.lineTo(proj.x, proj.y + spikeLen);
        ctx.stroke();
      }
    }

    // 9. Star labels (with collision avoidance)
    if (layers.starLabels) {
      ctx.font = `${11 * dpr}px ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      // Collect candidate labels sorted by magnitude (brightest first)
      const candidates = renderedStars
        .filter((rs) => {
          const isSelected = rs.star.hip === selectedHip;
          const isHovered = rs.star.hip === hoveredHip;
          if (rs.star.mag > 2.5 && !isSelected && !isHovered) return false;
          const label = rs.star.name || rs.star.bayer;
          return !!label;
        })
        .sort((a, b) => a.star.mag - b.star.mag);

      // Simple collision avoidance: track placed label rectangles
      const placed: { x: number; y: number; w: number; h: number }[] = [];
      const labelH = 12 * dpr;
      const padX = 2 * dpr;
      const padY = 3 * dpr;

      for (const rs of candidates) {
        const isSelected = rs.star.hip === selectedHip;
        const isHovered = rs.star.hip === hoveredHip;
        const label = rs.star.name || rs.star.bayer || "";
        const labelW = ctx.measureText(label).width + rs.r + 4 * dpr;
        const lx = rs.x + rs.r + 3 * dpr;
        const ly = rs.y;
        const box = { x: lx - padX, y: ly - labelH / 2 - padY, w: labelW, h: labelH + padY * 2 };

        // Check collision with already-placed labels
        let collides = false;
        if (!isSelected && !isHovered) {
          for (const p of placed) {
            if (
              box.x < p.x + p.w &&
              box.x + box.w > p.x &&
              box.y < p.y + p.h &&
              box.y + box.h > p.y
            ) {
              collides = true;
              break;
            }
          }
        }
        if (collides) continue;
        placed.push(box);

        // Draw label background for selected/hovered
        if (isSelected || isHovered) {
          ctx.fillStyle = isSelected ? "rgba(251, 191, 36, 0.15)" : "rgba(186, 230, 253, 0.12)";
          ctx.fillRect(box.x, box.y, box.w, box.h);
        }

        ctx.fillStyle = isSelected
          ? "#fde68a"
          : isHovered
          ? "#e0e7ff"
          : "rgba(220, 230, 255, 0.82)";
        ctx.fillText(label, lx, ly);
      }
    }

    // 9b. Solar system bodies (Sun, Moon, planets)
    const renderedBodies = layers.solarSystem
      ? drawSolarSystem(ctx, cx, cy, zoomedRadius, frame, view.rotation, layers.refraction, dpr, currentTime, latRad, view.zoom)
      : [];

    // 9c. Messier deep-sky objects
    const renderedMessier = layers.messier
      ? drawMessier(ctx, cx, cy, zoomedRadius, frame, view.rotation, layers.refraction, dpr, currentTime, latRad, view.zoom)
      : [];

    // 9d. NGC/IC deep-sky objects
    const renderedNGC = layers.ngcObjects
      ? drawNGC(ctx, cx, cy, zoomedRadius, frame, view.rotation, layers.refraction, dpr, latRad, view.zoom)
      : [];

    // 9e. Asteroids
    const renderedAsteroids = layers.asteroids
      ? drawAsteroids(ctx, cx, cy, zoomedRadius, view.rotation, layers.refraction, dpr, currentTime, latRad, view.zoom, frame)
      : [];

    // 9f. Comets
    const renderedComets = layers.comets
      ? drawComets(ctx, cx, cy, zoomedRadius, view.rotation, layers.refraction, dpr, currentTime, latRad, view.zoom, frame)
      : [];

    // 9g. Satellites
    const renderedSatellites = layers.satellites
      ? drawSatellites(ctx, cx, cy, zoomedRadius, view.rotation, layers.refraction, dpr, currentTime, observer.latDeg, observer.lonDeg, observer.elevationM, view.zoom, selectedBody)
      : [];

    renderedBodiesRef.current = [...renderedBodies, ...renderedMessier, ...renderedNGC, ...renderedAsteroids, ...renderedComets, ...renderedSatellites];

    // 9h. Meteor shower radiants
    if (layers.meteorShowers) {
      drawMeteorRadiants(ctx, cx, cy, zoomedRadius, frame, view.rotation, layers.refraction, dpr, currentTime, latRad, view.zoom);
    }

    // 10. Hovered star ring
    if (hoveredHip != null) {
      const rs = renderedStars.find((s) => s.star.hip === hoveredHip);
      if (rs) {
        ctx.strokeStyle = "rgba(186, 230, 253, 0.9)";
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.arc(rs.x, rs.y, rs.r + 5 * dpr, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
    // 10b. Hovered body ring
    if (hoveredBody != null) {
      const rb = renderedBodiesRef.current.find((b) => b.id === hoveredBody);
      if (rb) {
        ctx.strokeStyle = "rgba(186, 230, 253, 0.9)";
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.arc(rb.x, rb.y, rb.r + 5 * dpr, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // 11. Selected star ring
    if (selectedHip != null) {
      const rs = renderedStars.find((s) => s.star.hip === selectedHip);
      if (rs) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.6 * dpr;
        ctx.setLineDash([4 * dpr, 3 * dpr]);
        ctx.beginPath();
        ctx.arc(rs.x, rs.y, rs.r + 7 * dpr, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        // Crosshair
        ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
        ctx.lineWidth = 0.8 * dpr;
        ctx.beginPath();
        ctx.moveTo(rs.x - 18 * dpr, rs.y);
        ctx.lineTo(rs.x - 10 * dpr, rs.y);
        ctx.moveTo(rs.x + 10 * dpr, rs.y);
        ctx.lineTo(rs.x + 18 * dpr, rs.y);
        ctx.moveTo(rs.x, rs.y - 18 * dpr);
        ctx.lineTo(rs.x, rs.y - 10 * dpr);
        ctx.moveTo(rs.x, rs.y + 10 * dpr);
        ctx.lineTo(rs.x, rs.y + 18 * dpr);
        ctx.stroke();
      }
    }
    // 11a. Selected body ring
    if (selectedBody != null) {
      const rb = renderedBodiesRef.current.find((b) => b.id === selectedBody);
      if (rb) {
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.6 * dpr;
        ctx.setLineDash([4 * dpr, 3 * dpr]);
        ctx.beginPath();
        ctx.arc(rb.x, rb.y, rb.r + 7 * dpr, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        // Crosshair
        ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
        ctx.lineWidth = 0.8 * dpr;
        ctx.beginPath();
        ctx.moveTo(rb.x - 18 * dpr, rb.y);
        ctx.lineTo(rb.x - 10 * dpr, rb.y);
        ctx.moveTo(rb.x + 10 * dpr, rb.y);
        ctx.lineTo(rb.x + 18 * dpr, rb.y);
        ctx.moveTo(rb.x, rb.y - 18 * dpr);
        ctx.lineTo(rb.x, rb.y - 10 * dpr);
        ctx.moveTo(rb.x, rb.y + 10 * dpr);
        ctx.lineTo(rb.x, rb.y + 18 * dpr);
        ctx.stroke();
      }
    }

    // 11b. Measurement line
    if (measureMode && measureStart != null) {
      const startRs = renderedStars.find((s) => s.star.hip === measureStart);
      const endRs = measureEnd != null ? renderedStars.find((s) => s.star.hip === measureEnd) : null;
      if (startRs) {
        // Draw start marker (pulsing cyan ring)
        ctx.strokeStyle = "rgba(56, 189, 248, 0.9)";
        ctx.lineWidth = 1.5 * dpr;
        ctx.setLineDash([3 * dpr, 3 * dpr]);
        ctx.beginPath();
        ctx.arc(startRs.x, startRs.y, startRs.r + 8 * dpr, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);

        if (endRs) {
          // Draw line between the two stars
          ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
          ctx.lineWidth = 1.2 * dpr;
          ctx.setLineDash([4 * dpr, 3 * dpr]);
          ctx.beginPath();
          ctx.moveTo(startRs.x, startRs.y);
          ctx.lineTo(endRs.x, endRs.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw end marker
          ctx.beginPath();
          ctx.arc(endRs.x, endRs.y, endRs.r + 8 * dpr, 0, 2 * Math.PI);
          ctx.stroke();

          // Draw angle label at midpoint
          const mx = (startRs.x + endRs.x) / 2;
          const my = (startRs.y + endRs.y) / 2;
          // Compute angular separation
          const s1 = STARS_BY_HIP.get(measureStart);
          const s2 = STARS_BY_HIP.get(measureEnd!);
          if (s1 && s2) {
            const cosSep = Math.sin(s1.dec) * Math.sin(s2.dec) + Math.cos(s1.dec) * Math.cos(s2.dec) * Math.cos(s1.ra - s2.ra);
            const sepDeg = Math.acos(Math.max(-1, Math.min(1, cosSep))) * 180 / Math.PI;
            const label = sepDeg < 1 ? `${(sepDeg * 60).toFixed(1)}′` : `${sepDeg.toFixed(2)}°`;
            // Label background
            ctx.font = `bold ${11 * dpr}px ui-monospace, monospace`;
            const tw = ctx.measureText(label).width;
            ctx.fillStyle = "rgba(2, 6, 23, 0.9)";
            ctx.fillRect(mx - tw / 2 - 4 * dpr, my - 8 * dpr, tw + 8 * dpr, 16 * dpr);
            ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
            ctx.lineWidth = 0.5 * dpr;
            ctx.strokeRect(mx - tw / 2 - 4 * dpr, my - 8 * dpr, tw + 8 * dpr, 16 * dpr);
            ctx.fillStyle = "#7dd3fc";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(label, mx, my);
          }
        } else if (hoveredHip != null && hoveredHip !== measureStart) {
          // Draw preview line to hovered star
          const hoverRs = renderedStars.find((s) => s.star.hip === hoveredHip);
          if (hoverRs) {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
            ctx.lineWidth = 1 * dpr;
            ctx.setLineDash([3 * dpr, 4 * dpr]);
            ctx.beginPath();
            ctx.moveTo(startRs.x, startRs.y);
            ctx.lineTo(hoverRs.x, hoverRs.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    }

    // 12. Cardinal directions
    if (layers.cardinalDirections) {
      drawCardinalDirections(ctx, cx, cy, zoomedRadius, view.rotation, dpr);
    }

    // 13. Zenith marker
    ctx.fillStyle = "rgba(251, 191, 36, 0.85)";
    ctx.font = `${10 * dpr}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Z", cx, cy - 6 * dpr);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
    ctx.lineWidth = 0.6 * dpr;
    ctx.beginPath();
    ctx.arc(cx, cy, 4 * dpr, 0, 2 * Math.PI);
    ctx.stroke();

    renderedRef.current = renderedStars;
  }, [frame, layers, view, filters, selectedHip, hoveredHip, selectedBody, hoveredBody, lp, observer.latDeg, observer.lonDeg, observer.elevationM, currentTime, measureMode, measureStart, measureEnd, properMotionYear]);

  // Sync the latest render closure into the ref (inside an effect, not during render).
  useEffect(() => {
    renderRef.current = render;
  }, [render]);

  // Single rAF loop — reads the latest render fn from the ref each frame.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      renderRef.current();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Mouse interaction
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY, moved: false };
    },
    []
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const wasDragging = dragRef.current.active && dragRef.current.moved;
      dragRef.current.active = false;
      // If we were dragging, don't treat this as a click (selection handled in click handler)
      if (wasDragging) {
        e.stopPropagation();
      }
    },
    []
  );

  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = dprRef.current;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      mousePosRef.current = { x: px, y: py };

      // Handle drag-to-rotate
      if (dragRef.current.active) {
        const dx = e.clientX - dragRef.current.lastX;
        if (Math.abs(dx) > 3) dragRef.current.moved = true;
        // Rotate based on horizontal drag
        setView({ rotation: useStarTracker.getState().view.rotation + dx * 0.005 });
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        canvas.style.cursor = "grabbing";
        return;
      }

      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;

      // Check bodies first
      let bestBody: string | null = null;
      let bestBodyDist = 16 * dpr;
      for (const rb of renderedBodiesRef.current) {
        const d = Math.hypot(rb.x - x, rb.y - y);
        if (d < bestBodyDist) {
          bestBodyDist = d;
          bestBody = rb.id;
        }
      }
      setHoveredBody(bestBody);

      // Find nearest star within tolerance (only if not hovering a body)
      let best: RenderedStar | null = null;
      if (!bestBody) {
        let bestDist = 16 * dpr;
        for (const rs of renderedRef.current) {
          const d = Math.hypot(rs.x - x, rs.y - y);
          if (d < bestDist) {
            bestDist = d;
            best = rs;
          }
        }
      }
      setHoveredHip(best ? best.star.hip : null);

      // Throttle mouse position state updates — only when hovering a star or body
      if (best || bestBody) {
        setMousePos({ x: px, y: py });
      }
      canvas.style.cursor = (best || bestBody) ? "pointer" : "grab";
    },
    [setHoveredHip, setView, setMousePos, setHoveredBody]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Skip click if we just finished dragging
      if (dragRef.current.moved) {
        dragRef.current.moved = false;
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = dprRef.current;
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;

      // Check bodies first
      let bestBody: string | null = null;
      let bestBodyDist = 16 * dpr;
      for (const rb of renderedBodiesRef.current) {
        const d = Math.hypot(rb.x - x, rb.y - y);
        if (d < bestBodyDist) {
          bestBodyDist = d;
          bestBody = rb.id;
        }
      }

      if (bestBody) {
        if (!measureMode) {
          setSelectedBody(bestBody);
        }
      } else {
        let best: RenderedStar | null = null;
        let bestDist = 16 * dpr;
        for (const rs of renderedRef.current) {
          const d = Math.hypot(rs.x - x, rs.y - y);
          if (d < bestDist) {
            bestDist = d;
            best = rs;
          }
        }
        if (best) {
          if (measureMode) {
            // In measure mode: first click sets start, second sets end
            if (measureStart == null) {
              setMeasureStart(best.star.hip);
            } else if (measureStart !== best.star.hip) {
              setMeasureEnd(best.star.hip);
            }
          } else {
            setSelectedHip(best.star.hip);
          }
        } else {
          // If clicking empty sky, deselect (only in normal mode)
          if (!measureMode) {
            setSelectedHip(null);
            setSelectedBody(null);
          }
        }
      }
    },
    [setSelectedHip, setSelectedBody, measureMode, measureStart, setMeasureStart, setMeasureEnd]
  );

  // Double-click: zoom in on the clicked star/body
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (measureMode) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = dprRef.current;
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;

      let bestBody: string | null = null;
      let bestBodyDist = 20 * dpr;
      for (const rb of renderedBodiesRef.current) {
        const d = Math.hypot(rb.x - x, rb.y - y);
        if (d < bestBodyDist) {
          bestBodyDist = d;
          bestBody = rb.id;
        }
      }

      if (bestBody) {
        setSelectedBody(bestBody);
        setView({ zoom: Math.min(4, useStarTracker.getState().view.zoom + 0.8) });
        return;
      }

      let best: RenderedStar | null = null;
      let bestDist = 20 * dpr;
      for (const rs of renderedRef.current) {
        const d = Math.hypot(rs.x - x, rs.y - y);
        if (d < bestDist) {
          bestDist = d;
          best = rs;
        }
      }
      if (best) {
        setSelectedHip(best.star.hip);
        setView({ zoom: Math.min(4, useStarTracker.getState().view.zoom + 0.8) });
      }
    },
    [setSelectedHip, setSelectedBody, setView, measureMode]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      // Zoom in/out
      const delta = -e.deltaY * 0.001;
      setView({ zoom: Math.max(0.6, Math.min(4, view.zoom + delta)) });
    },
    [view.zoom, setView]
  );

  // Touch support for mobile: single-finger drag to rotate, pinch to zoom, tap to select
  const touchRef = useRef<{
    mode: "none" | "rotate" | "pinch";
    startX: number;
    startY: number;
    lastX: number;
    lastDist: number;
    startTime: number;
    hasMoved: boolean;
  }>({ mode: "none", startX: 0, startY: 0, lastX: 0, lastDist: 0, startTime: 0, hasMoved: false });

  const selectObjectAtClientPos = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = dprRef.current;
      const x = (clientX - rect.left) * dpr;
      const y = (clientY - rect.top) * dpr;

      // Check bodies first
      let bestBody: string | null = null;
      let bestBodyDist = 22 * dpr;
      for (const rb of renderedBodiesRef.current) {
        const d = Math.hypot(rb.x - x, rb.y - y);
        if (d < bestBodyDist) {
          bestBodyDist = d;
          bestBody = rb.id;
        }
      }

      if (bestBody) {
        if (!measureMode) {
          setSelectedBody(bestBody);
        }
      } else {
        let best: RenderedStar | null = null;
        let bestDist = 22 * dpr;
        for (const rs of renderedRef.current) {
          const d = Math.hypot(rs.x - x, rs.y - y);
          if (d < bestDist) {
            bestDist = d;
            best = rs;
          }
        }
        if (best) {
          if (measureMode) {
            if (measureStart == null) {
              setMeasureStart(best.star.hip);
            } else if (measureStart !== best.star.hip) {
              setMeasureEnd(best.star.hip);
            }
          } else {
            setSelectedHip(best.star.hip);
          }
        } else {
          if (!measureMode) {
            setSelectedHip(null);
            setSelectedBody(null);
          }
        }
      }
    },
    [setSelectedHip, setSelectedBody, measureMode, measureStart, setMeasureStart, setMeasureEnd]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchRef.current = {
          mode: "rotate",
          startX: t.clientX,
          startY: t.clientY,
          lastX: t.clientX,
          lastDist: 0,
          startTime: Date.now(),
          hasMoved: false,
        };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchRef.current = {
          mode: "pinch",
          startX: 0,
          startY: 0,
          lastX: 0,
          lastDist: Math.hypot(dx, dy),
          startTime: Date.now(),
          hasMoved: true,
        };
      }
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (touchRef.current.mode === "rotate" && e.touches.length === 1) {
        const t = e.touches[0];
        const dist = Math.hypot(t.clientX - touchRef.current.startX, t.clientY - touchRef.current.startY);
        if (dist > 8) {
          touchRef.current.hasMoved = true;
        }
        const dx = t.clientX - touchRef.current.lastX;
        setView({ rotation: useStarTracker.getState().view.rotation + dx * 0.005 });
        touchRef.current.lastX = t.clientX;
      } else if (touchRef.current.mode === "pinch" && e.touches.length === 2) {
        touchRef.current.hasMoved = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (touchRef.current.lastDist > 0) {
          const delta = (dist - touchRef.current.lastDist) * 0.005;
          setView({ zoom: Math.max(0.6, Math.min(4, useStarTracker.getState().view.zoom + delta)) });
        }
        touchRef.current.lastDist = dist;
      }
    },
    [setView]
  );

  const handleTouchEnd = useCallback(() => {
    const { mode, startX, startY, startTime, hasMoved } = touchRef.current;
    const duration = Date.now() - startTime;
    if (mode === "rotate" && !hasMoved && duration < 350) {
      selectObjectAtClientPos(startX, startY);
    }
    touchRef.current = { mode: "none", startX: 0, startY: 0, lastX: 0, lastDist: 0, startTime: 0, hasMoved: false };
  }, [selectObjectAtClientPos]);


  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Create a temporary link and download the canvas as PNG
    const link = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    link.download = `startracker-${ts}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-lg">
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-grab touch-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredHip(null); dragRef.current.active = false; }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label="Interactive sky map. Click a star to view details. Drag to rotate. Pinch to zoom."
      />
      {/* Export button */}
      <button
        onClick={handleExport}
        title="Export sky map as PNG"
        aria-label="Export sky map as PNG"
        className="absolute left-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-slate-950/80 text-slate-400 backdrop-blur transition-colors hover:bg-slate-800 hover:text-amber-300"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      {/* Hover tooltip — follows the cursor, shows detailed star info */}
      {hoveredHip != null && STARS_BY_HIP.has(hoveredHip) && (() => {
        const star = STARS_BY_HIP.get(hoveredHip)!;
        const props = getStarProperties(star.hip);
        const [cr, cg, cb] = spectralColor(star.spectral);
        const mp = mousePos;
        // Position tooltip near cursor but keep within bounds
        const tipW = 220;
        const containerW = 800;
        const tipLeft = mp.x + 16 + tipW > containerW ? mp.x - tipW - 16 : mp.x + 16;
        return (
          <div
            className="pointer-events-none absolute z-30 w-[220px] rounded-lg border border-white/15 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur-md"
            style={{ left: tipLeft, top: mp.y + 16 }}
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ background: `rgb(${cr},${cg},${cb})`, boxShadow: `0 0 6px rgb(${cr},${cg},${cb})` }}
              />
              <span className="flex-1 truncate font-semibold text-amber-300">
                {star.name || star.bayer || `HIP ${star.hip}`}
              </span>
              <span className="font-mono text-[10px] text-slate-500">{star.constellation}</span>
            </div>
            {/* Quick stats */}
            <div className="mt-1.5 grid grid-cols-3 gap-1 border-t border-white/5 pt-1.5">
              <div>
                <div className="text-[8px] uppercase text-slate-600">Mag</div>
                <div className="font-mono text-[11px] text-slate-200">{star.mag.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[8px] uppercase text-slate-600">Spec</div>
                <div className="font-mono text-[11px] text-slate-200">{star.spectral}</div>
              </div>
              <div>
                <div className="text-[8px] uppercase text-slate-600">Dist</div>
                <div className="font-mono text-[11px] text-slate-200">{star.distanceLy > 0 ? `${star.distanceLy < 1000 ? star.distanceLy : (star.distanceLy/1000).toFixed(1)+'k'}` : '—'}</div>
              </div>
            </div>
            {/* Physical properties preview */}
            {props && (
              <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-white/5 pt-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Temp</span>
                  <span className="font-mono text-slate-300">{props.temperatureK.toLocaleString()}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mass</span>
                  <span className="font-mono text-slate-300">{props.massSolar}M☉</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Radius</span>
                  <span className="font-mono text-slate-300">{props.radiusSolar.toLocaleString()}R☉</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lum</span>
                  <span className="font-mono text-slate-300">{props.luminositySolar.toLocaleString()}L☉</span>
                </div>
              </div>
            )}
            {/* Bayer/Flamsteed */}
            {(star.bayer || star.flamsteed > 0) && (
              <div className="mt-1.5 border-t border-white/5 pt-1.5 text-[10px] text-slate-400">
                {star.bayer && <span className="mr-2">{star.bayer}</span>}
                {star.flamsteed > 0 && <span>{star.flamsteed} {star.constellation}</span>}
                <span className="ml-2 text-slate-600">· HIP {star.hip}</span>
              </div>
            )}
            {/* Hint */}
            <div className="mt-1.5 text-center text-[9px] text-slate-600">
              Click to inspect · Press Esc to deselect
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Drawing helpers ───────────────────────────────────────────────────────

function drawAltAzGrid(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  dpr: number
) {
  ctx.strokeStyle = "rgba(120, 150, 200, 0.18)";
  ctx.lineWidth = 0.6 * dpr;
  ctx.setLineDash([2 * dpr, 4 * dpr]);
  // Altitude rings every 15°
  for (let altDeg = 15; altDeg < 90; altDeg += 15) {
    const alt = (altDeg * Math.PI) / 180;
    const r = 2 * radius * Math.tan((Math.PI / 2 - alt) / 2);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
  }
  // Azimuth lines every 30°
  for (let azDeg = 0; azDeg < 360; azDeg += 30) {
    const az = (azDeg * Math.PI) / 180 + rotation;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + radius * Math.sin(az), cy - radius * Math.cos(az));
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCardinalDirections(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  dpr: number
) {
  ctx.font = `bold ${14 * dpr}px ui-sans-serif, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const dirs = [
    { label: "N", az: 0, color: "#f87171" },
    { label: "E", az: Math.PI / 2, color: "#93c5fd" },
    { label: "S", az: Math.PI, color: "#fcd34d" },
    { label: "W", az: (3 * Math.PI) / 2, color: "#86efac" },
  ];
  for (const d of dirs) {
    const a = d.az + rotation;
    const x = cx + (radius + 16 * dpr) * Math.sin(a);
    const y = cy - (radius + 16 * dpr) * Math.cos(a);
    // Badge
    ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
    ctx.beginPath();
    ctx.arc(x, y, 12 * dpr, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = d.color;
    ctx.fillText(d.label, x, y);
  }
}

/**
 * Draw a great circle on the celestial sphere (e.g. equator, ecliptic)
 * defined by its pole declination relative to the celestial pole.
 * `inclination` is the obliquity for the ecliptic (0 for the equator).
 */
function drawCelestialCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  frame: FrameContext,
  inclination: number,
  rotation: number,
  refraction: boolean,
  color: string,
  lineWidth: number
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  let started = false;
  const N = 360;
  for (let i = 0; i <= N; i++) {
    const lon = (i / N) * 2 * Math.PI;
    // Point on the circle: equator (dec=0, ra=lon) or ecliptic
    let ra: number, dec: number;
    if (inclination === 0) {
      ra = lon;
      dec = 0;
    } else {
      // Ecliptic circle: convert ecliptic longitude to equatorial
      const sinEps = Math.sin(inclination);
      const cosEps = Math.cos(inclination);
      const sinBeta = 0; // ecliptic latitude 0
      const cosBeta = 1;
      const sinLon = Math.sin(lon);
      const cosLon = Math.cos(lon);
      const sinDec = sinBeta * cosEps + cosBeta * sinEps * sinLon;
      dec = Math.asin(sinDec);
      ra = Math.atan2(sinLon * cosEps - (sinBeta / cosBeta) * sinEps, cosLon);
      if (ra < 0) ra += 2 * Math.PI;
    }
    const tr = transformStar(ra, dec, frame, Math.asin(frame.sinLat));
    let alt = tr.horizontal.alt;
    const az = tr.horizontal.az;
    if (refraction && alt < Math.PI / 2) alt = refract(alt);
    if (alt < -0.02) {
      started = false;
      continue;
    }
    const p = projectStereographic({ cx, cy, radius, alt, az: az + rotation });
    if (!started) {
      ctx.moveTo(p.x, p.y);
      started = true;
    } else {
      ctx.lineTo(p.x, p.y);
    }
  }
  ctx.stroke();
}

/**
 * Draw orbital trajectories for moving objects (planets, sun, moon, asteroids, comets, satellites).
 */
function drawOrbitTracks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  frame: FrameContext,
  rotation: number,
  refraction: boolean,
  dpr: number,
  date: Date,
  latDeg: number,
  lonDeg: number,
  elevationM: number,
  latRad: number,
  selectedBody: string | null,
  selectedHip: number | null
) {
  const tracks = getOrbitTracks(date, latDeg, lonDeg, elevationM, selectedBody, selectedHip);
  for (const track of tracks) {
    if (track.points.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = track.color + "a0";
    ctx.lineWidth = 1.2 * dpr;
    ctx.setLineDash([3 * dpr, 3 * dpr]);

    // Clip to the sky circle so below-horizon segments don't draw outside the map
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 2 * dpr, 0, 2 * Math.PI);
    ctx.clip();

    ctx.beginPath();
    let started = false;

    for (const pt of track.points) {
      let alt: number;
      let az: number;
      if (pt.alt !== undefined && pt.az !== undefined) {
        alt = pt.alt;
        az = pt.az;
      } else {
        const tr = transformStar(pt.ra, pt.dec, frame, latRad);
        alt = tr.horizontal.alt;
        az = tr.horizontal.az;
      }
      if (refraction && alt < Math.PI / 2) alt = refract(alt);
      // Skip points very far below the horizon — they project to extreme coordinates
      // that can cause rendering glitches (nadir and beyond → r → ∞)
      if (alt < -Math.PI / 2 + 0.05) {
        started = false;
        continue;
      }
      const p = projectStereographic({ cx, cy, radius, alt, az: az + rotation });
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draw all constellation stick-figure lines. Only stars present in the catalog
 * are projected; lines with missing stars are skipped.
 */
function drawConstellationLines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  frame: FrameContext,
  rotation: number,
  refraction: boolean,
  dpr: number,
  selectedHip: number | null
) {
  // Determine the constellation of the selected star (for highlighting)
  let highlightAbbr: string | null = null;
  if (selectedHip != null) {
    const sel = STARS_BY_HIP.get(selectedHip);
    if (sel) highlightAbbr = sel.constellation;
  }

  const latRad = Math.asin(frame.sinLat);

  for (const [abbr, lines] of Object.entries(CONSTELLATION_LINES)) {
    const isHighlighted = abbr === highlightAbbr;
    ctx.strokeStyle = isHighlighted
      ? "rgba(251, 191, 36, 0.9)"
      : "rgba(125, 211, 252, 0.45)";
    ctx.lineWidth = (isHighlighted ? 1.8 : 1.0) * dpr;
    ctx.lineCap = "round";
    if (isHighlighted) {
      ctx.shadowColor = "rgba(251, 191, 36, 0.4)";
      ctx.shadowBlur = 6 * dpr;
    } else {
      ctx.shadowBlur = 0;
    }
    for (const [hipA, hipB] of lines) {
      const sA = STARS_BY_HIP.get(hipA);
      const sB = STARS_BY_HIP.get(hipB);
      if (!sA || !sB) continue;
      const trA = transformStar(sA.ra, sA.dec, frame, latRad);
      const trB = transformStar(sB.ra, sB.dec, frame, latRad);
      let altA = trA.horizontal.alt;
      let altB = trB.horizontal.alt;
      if (refraction) {
        if (altA < Math.PI / 2) altA = refract(altA);
        if (altB < Math.PI / 2) altB = refract(altB);
      }
      if (altA < -0.02 || altB < -0.02) continue;
      const pA = projectStereographic({
        cx, cy, radius, alt: altA, az: trA.horizontal.az + rotation,
      });
      const pB = projectStereographic({
        cx, cy, radius, alt: altB, az: trB.horizontal.az + rotation,
      });
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Constellation name label at the centroid of its first line
    if (lines.length > 0) {
      const [h0, h1] = lines[0];
      const s0 = STARS_BY_HIP.get(h0);
      const s1 = STARS_BY_HIP.get(h1);
      if (s0 && s1) {
        const tr0 = transformStar(s0.ra, s0.dec, frame, latRad);
        if (tr0.horizontal.alt > 0.05) {
          const p = projectStereographic({
            cx, cy, radius,
            alt: tr0.horizontal.alt,
            az: tr0.horizontal.az + rotation,
          });
          const info = CONSTELLATION_MAP[abbr];
          if (info) {
            ctx.font = `${isHighlighted ? "bold " : ""}${10 * dpr}px ui-sans-serif, system-ui`;
            ctx.fillStyle = isHighlighted ? "rgba(251, 191, 36, 0.95)" : "rgba(147, 197, 253, 0.55)";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(info.abbr, p.x, p.y - 14 * dpr);
          }
        }
      }
    }
  }
}

/**
 * Procedural Milky Way band. Sample along the galactic equator (b=0) and draw
 * a soft glowing band; offset the band by varying density along the plane.
 */
function drawMilkyWay(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  frame: FrameContext,
  refraction: boolean,
  rotation: number,
  zoom: number,
  dpr: number
) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const latRad = Math.asin(frame.sinLat);
  const GAL_R = [
    [-0.054875539, -0.87343709, -0.48383499],
    [0.494109453, -0.44482963, 0.74698224],
    [-0.867666136, -0.19807639, 0.45598377],
  ];
  // Galactic → equatorial (transpose of equatorial→galactic)
  function galToEquatorial(l: number, b: number): { ra: number; dec: number } {
    const cl = Math.cos(l);
    const sl = Math.sin(l);
    const cb = Math.cos(b);
    const sb = Math.sin(b);
    const x = cb * cl;
    const y = cb * sl;
    const z = sb;
    // Apply transpose of GAL_R
    const eq = [
      GAL_R[0][0] * x + GAL_R[1][0] * y + GAL_R[2][0] * z,
      GAL_R[0][1] * x + GAL_R[1][1] * y + GAL_R[2][1] * z,
      GAL_R[0][2] * x + GAL_R[1][2] * y + GAL_R[2][2] * z,
    ];
    const dec = Math.asin(eq[2]);
    let ra = Math.atan2(eq[1], eq[0]);
    if (ra < 0) ra += 2 * Math.PI;
    return { ra, dec };
  }

  const steps = 180;
  for (let i = 0; i < steps; i++) {
    const l = (i / steps) * 2 * Math.PI;
    // density variation — brighter near galactic center (l~0) and anti-center
    const density = Math.exp(-Math.pow(((l + Math.PI) % (2 * Math.PI)) - Math.PI, 2) / 2) * 0.6 + 0.2;
    for (let bDeg = -8; bDeg <= 8; bDeg += 2) {
      const b = (bDeg * Math.PI) / 180;
      const { ra, dec } = galToEquatorial(l, b);
      const tr = transformStar(ra, dec, frame, latRad);
      let alt = tr.horizontal.alt;
      if (refraction && alt < Math.PI / 2) alt = refract(alt);
      if (alt < 0) continue;
      const p = projectStereographic({ cx, cy, radius, alt, az: tr.horizontal.az + rotation });
      const alpha = density * (1 - Math.abs(bDeg) / 9) * 0.12;
      const r = 18 * dpr * zoom;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, `rgba(190, 200, 255, ${alpha})`);
      g.addColorStop(1, "rgba(190, 200, 255, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Draw the Sun, Moon, and naked-eye planets on the sky map.
 * The Sun is a golden disc with rays; the Moon shows its current phase
 * (shaded dark side); planets use their traditional color + symbol.
 */
function drawSolarSystem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  frame: FrameContext,
  rotation: number,
  refraction: boolean,
  dpr: number,
  date: Date,
  latRad: number,
  zoom: number
): { id: string; x: number; y: number; r: number }[] {
  const rendered: { id: string; x: number; y: number; r: number }[] = [];

  // Planets
  const planets = planetPositions(date);
  for (const p of planets) {
    const tr = transformStar(p.ra, p.dec, frame, latRad);
    let alt = tr.horizontal.alt;
    if (refraction && alt < Math.PI / 2) alt = refract(alt);
    if (alt < -0.02) continue;
    const proj = projectStereographic({ cx, cy, radius, alt, az: tr.horizontal.az + rotation });
    const r = 4 * dpr * Math.sqrt(zoom);
    // Glow
    const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, r * 4);
    glow.addColorStop(0, p.color + "aa");
    glow.addColorStop(1, p.color + "00");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, r * 4, 0, 2 * Math.PI);
    ctx.fill();
    // Body
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, r, 0, 2 * Math.PI);
    ctx.fill();
    rendered.push({ id: `planet_${p.name.toLowerCase()}`, x: proj.x, y: proj.y, r: Math.max(r, 6 * dpr) });
    // Symbol + name
    ctx.font = `bold ${11 * dpr}px ui-sans-serif, system-ui`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = p.color;
    ctx.fillText(`${p.symbol} ${p.name}`, proj.x + r + 4 * dpr, proj.y);
  }

  // Sun
  const sun = sunPosition(date);
  {
    const tr = transformStar(sun.ra, sun.dec, frame, latRad);
    let alt = tr.horizontal.alt;
    if (refraction && alt < Math.PI / 2) alt = refract(alt);
    if (alt > -0.02) {
      const proj = projectStereographic({ cx, cy, radius, alt, az: tr.horizontal.az + rotation });
      const r = 8 * dpr * zoom;
      rendered.push({ id: "sun", x: proj.x, y: proj.y, r });
      // Outer corona glow
      const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, r * 5);
      glow.addColorStop(0, "rgba(253, 224, 71, 0.6)");
      glow.addColorStop(0.4, "rgba(251, 146, 60, 0.25)");
      glow.addColorStop(1, "rgba(251, 146, 60, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r * 5, 0, 2 * Math.PI);
      ctx.fill();
      // Rays
      ctx.strokeStyle = "rgba(253, 224, 71, 0.7)";
      ctx.lineWidth = 1.2 * dpr;
      ctx.lineCap = "round";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(proj.x + Math.cos(a) * r * 1.3, proj.y + Math.sin(a) * r * 1.3);
        ctx.lineTo(proj.x + Math.cos(a) * r * 2.4, proj.y + Math.sin(a) * r * 2.4);
        ctx.stroke();
      }
      // Disc
      const disc = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, r);
      disc.addColorStop(0, "#fffbeb");
      disc.addColorStop(0.6, "#fcd34d");
      disc.addColorStop(1, "#f59e0b");
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r, 0, 2 * Math.PI);
      ctx.fill();
      // Label
      ctx.font = `bold ${11 * dpr}px ui-sans-serif, system-ui`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fde68a";
      ctx.fillText("☉ Sun", proj.x + r + 6 * dpr, proj.y);
    }
  }

  // Moon
  const moon = moonPosition(date);
  {
    const tr = transformStar(moon.ra, moon.dec, frame, latRad);
    let alt = tr.horizontal.alt;
    if (refraction && alt < Math.PI / 2) alt = refract(alt);
    if (alt > -0.02) {
      const proj = projectStereographic({ cx, cy, radius, alt, az: tr.horizontal.az + rotation });
      const r = 7 * dpr * zoom;
      const phase = moonPhase(date);
      rendered.push({ id: "moon", x: proj.x, y: proj.y, r });
      // Soft glow
      const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, r * 3);
      glow.addColorStop(0, "rgba(226, 232, 240, 0.3)");
      glow.addColorStop(1, "rgba(226, 232, 240, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r * 3, 0, 2 * Math.PI);
      ctx.fill();
      // Lit disc
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r, 0, 2 * Math.PI);
      ctx.fill();
      // Dark side (shadow) — drawn as an offset circle
      const illum = phase.illumination;
      const offset = (1 - 2 * illum) * r;
      ctx.save();
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r, 0, 2 * Math.PI);
      ctx.clip();
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.beginPath();
      if (phase.waxing) {
        ctx.arc(proj.x - r + offset * 2, proj.y, r, 0, 2 * Math.PI);
      } else {
        ctx.arc(proj.x + r - offset * 2, proj.y, r, 0, 2 * Math.PI);
      }
      ctx.fill();
      ctx.restore();
      // Label
      ctx.font = `bold ${11 * dpr}px ui-sans-serif, system-ui`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(`☽ Moon ${(illum * 100).toFixed(0)}%`, proj.x + r + 6 * dpr, proj.y);
    }
  }

  return rendered;
}

/**
 * Draw Messier catalog deep-sky objects on the sky map.
 *
 * Each object is rendered with a type-specific glyph:
 *  - galaxy         → faint amber tilted ellipse (suggesting a disk)
 *  - nebula         → small dashed green circle
 *  - planetary      → small cyan ring (annulus)
 *  - open cluster   → cluster of tiny yellow dots arranged in a ring
 *  - globular       → fuzzy orange circle (radial gradient)
 *  - supernova      → tiny red remnant dot with cross spikes
 *
 * Below-horizon objects are skipped. A small "M{number}" label is drawn next
 * to each visible object, color-coded by type.
 */
function drawMessier(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  frame: FrameContext,
  rotation: number,
  refraction: boolean,
  dpr: number,
  _date: Date,
  latRad: number,
  zoom: number
): { id: string; x: number; y: number; r: number }[] {
  const rendered: { id: string; x: number; y: number; r: number }[] = [];
  for (const m of MESSIER) {
    const tr = transformStar(m.ra, m.dec, frame, latRad);
    let alt = tr.horizontal.alt;
    if (refraction && alt < Math.PI / 2) alt = refract(alt);
    if (alt <= 0) continue; // below horizon

    const proj = projectStereographic({
      cx,
      cy,
      radius,
      alt,
      az: tr.horizontal.az + rotation,
    });

    // Scale the glyph by angular size, but clamp to a sensible range so
    // large angular extents (M31 ~3°) don't dominate the chart.
    const sizePx = Math.max(3 * dpr, Math.min(14 * dpr, (m.size / 30) * 6 * dpr)) * zoom;

    drawMessierGlyph(ctx, m, proj.x, proj.y, sizePx, dpr);

    // Label — color-coded by type
    ctx.font = `${9 * dpr}px ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = MESSIER_TYPE_COLORS[m.type];
    ctx.fillText(`M${m.number}`, proj.x + sizePx + 3 * dpr, proj.y);
    rendered.push({ id: `messier_${m.number}`, x: proj.x, y: proj.y, r: Math.max(sizePx, 6 * dpr) });
  }
  return rendered;
}

/** Draw the type-specific glyph for a Messier object at (x, y). */
function drawMessierGlyph(
  ctx: CanvasRenderingContext2D,
  m: MessierObject,
  x: number,
  y: number,
  size: number,
  dpr: number
) {
  ctx.save();
  switch (m.type) {
    case "galaxy": {
      // Faint amber tilted ellipse — disk orientation varies with number
      const tilt = (m.number * 0.6) % Math.PI;
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.strokeStyle = "rgba(252, 211, 77, 0.55)";
      ctx.fillStyle = "rgba(252, 211, 77, 0.10)";
      ctx.lineWidth = 0.9 * dpr;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.4, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      // Faint core glow
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.5);
      core.addColorStop(0, "rgba(252, 211, 77, 0.45)");
      core.addColorStop(1, "rgba(252, 211, 77, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, 2 * Math.PI);
      ctx.fill();
      break;
    }
    case "nebula": {
      // Dashed green circle
      ctx.strokeStyle = "rgba(134, 239, 172, 0.75)";
      ctx.fillStyle = "rgba(134, 239, 172, 0.08)";
      ctx.lineWidth = 0.9 * dpr;
      ctx.setLineDash([2 * dpr, 2 * dpr]);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    case "planetary": {
      // Cyan ring (annulus)
      ctx.strokeStyle = "rgba(103, 232, 249, 0.85)";
      ctx.fillStyle = "rgba(103, 232, 249, 0.10)";
      ctx.lineWidth = 1.1 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      // Inner hole
      ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
      ctx.beginPath();
      ctx.arc(x, y, size * 0.45, 0, 2 * Math.PI);
      ctx.fill();
      break;
    }
    case "open": {
      // Yellow cluster of dots in a ring pattern
      const dots = 7;
      ctx.fillStyle = "rgba(253, 224, 71, 0.85)";
      for (let i = 0; i < dots; i++) {
        const a = (i / dots) * 2 * Math.PI;
        const dx = x + Math.cos(a) * size * 0.7;
        const dy = y + Math.sin(a) * size * 0.7;
        ctx.beginPath();
        ctx.arc(dx, dy, 0.9 * dpr, 0, 2 * Math.PI);
        ctx.fill();
      }
      // Center dot
      ctx.fillStyle = "rgba(253, 224, 71, 0.95)";
      ctx.beginPath();
      ctx.arc(x, y, 1.0 * dpr, 0, 2 * Math.PI);
      ctx.fill();
      break;
    }
    case "globular": {
      // Fuzzy orange circle with radial gradient
      const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
      grad.addColorStop(0, "rgba(251, 146, 60, 0.95)");
      grad.addColorStop(0.4, "rgba(251, 146, 60, 0.45)");
      grad.addColorStop(1, "rgba(251, 146, 60, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      // Outer ring for definition
      ctx.strokeStyle = "rgba(251, 146, 60, 0.55)";
      ctx.lineWidth = 0.8 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.stroke();
      break;
    }
    case "supernova": {
      // Red remnant dot with cross spikes
      const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
      grad.addColorStop(0, "rgba(248, 113, 113, 0.9)");
      grad.addColorStop(1, "rgba(248, 113, 113, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "rgba(248, 113, 113, 0.7)";
      ctx.lineWidth = 0.7 * dpr;
      const spike = size * 1.6;
      ctx.beginPath();
      ctx.moveTo(x - spike, y);
      ctx.lineTo(x + spike, y);
      ctx.moveTo(x, y - spike);
      ctx.lineTo(x, y + spike);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/**
 * Draw active meteor-shower radiants on the sky map.
 *
 * For each currently-active shower (per `getActiveShowers(date)`):
 *  - transform the J2000 radiant RA/Dec to horizontal coords via `transformStar`
 *  - apply atmospheric refraction (if enabled) and skip if below the horizon
 *  - project to canvas with `projectStereographic`
 *  - render a small 4-pointed amber/red star-burst icon with short radiating
 *    lines, plus a two-line label (shower name + "ZHR {zhr}")
 *  - showers near peak (daysToPeak <= 1) get a larger, more prominent glow.
 *
 * Signature mirrors `drawSolarSystem` / `drawMessier`.
 */
function drawMeteorRadiants(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  frame: FrameContext,
  rotation: number,
  refraction: boolean,
  dpr: number,
  date: Date,
  latRad: number,
  zoom: number
) {
  const showers = getActiveShowers(date);
  if (showers.length === 0) return;

  // Amber/orange palette tuned for the dark slate-950 sky background.
  const markerColor = "rgba(251, 146, 60, 0.85)";
  const spikeColor = "rgba(251, 146, 60, 0.7)";
  const glowColorPeak = "rgba(253, 186, 116, 0.55)";
  const glowColorNormal = "rgba(251, 146, 60, 0.30)";
  const labelColor = "rgba(253, 186, 116, 0.95)";
  const zhrColor = "rgba(252, 165, 60, 0.75)";

  for (const shower of showers) {
    const tr = transformStar(shower.radiantRa, shower.radiantDec, frame, latRad);
    let alt = tr.horizontal.alt;
    if (refraction && alt < Math.PI / 2) alt = refract(alt);
    if (alt <= 0) continue; // below horizon

    const proj = projectStereographic({
      cx,
      cy,
      radius,
      alt,
      az: tr.horizontal.az + rotation,
    });

    const nearPeak = daysToPeak(shower, date) <= 1;
    const size = 6 * dpr * (nearPeak ? 1.4 : 1) * zoom;
    const glowRadius = (nearPeak ? 22 : 12) * dpr * zoom;

    ctx.save();

    // Glow halo (more prominent when near peak)
    const glow = ctx.createRadialGradient(
      proj.x,
      proj.y,
      0,
      proj.x,
      proj.y,
      glowRadius
    );
    glow.addColorStop(0, nearPeak ? glowColorPeak : glowColorNormal);
    glow.addColorStop(1, "rgba(251, 146, 60, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, glowRadius, 0, 2 * Math.PI);
    ctx.fill();

    // 4-pointed star-burst: two perpendicular spike lines + a small center dot
    ctx.translate(proj.x, proj.y);
    ctx.strokeStyle = spikeColor;
    ctx.lineWidth = 1.2 * dpr;
    ctx.lineCap = "round";
    const spikeLen = size * 1.8;
    // Diagonal spikes (X pattern) — 4 directions
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 2 * Math.PI + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * spikeLen, Math.sin(a) * spikeLen);
      ctx.stroke();
    }
    // Cross spikes (cardinal) — slightly shorter, for an 8-ray burst look
    const shortLen = spikeLen * 0.6;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * shortLen, Math.sin(a) * shortLen);
      ctx.stroke();
    }

    // Bright center dot
    ctx.fillStyle = markerColor;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.35, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();

    // Label: shower name (small) + "ZHR {zhr}" (even smaller)
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const labelX = proj.x + size + 3 * dpr;
    const labelY = proj.y - size;
    ctx.font = `bold ${10 * dpr}px ui-sans-serif, system-ui`;
    ctx.fillStyle = labelColor;
    ctx.fillText(shower.name, labelX, labelY);
    ctx.font = `${9 * dpr}px ui-monospace, monospace`;
    ctx.fillStyle = zhrColor;
    ctx.fillText(`ZHR ${shower.zhr}`, labelX, labelY + 11 * dpr);
    if (nearPeak) {
      ctx.font = `bold ${8 * dpr}px ui-sans-serif, system-ui`;
      ctx.fillStyle = "rgba(253, 224, 71, 0.95)";
      ctx.fillText("● peak", labelX, labelY + 22 * dpr);
    }
    ctx.restore();
  }
}

function drawAsteroids(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  refraction: boolean,
  dpr: number,
  date: Date,
  latRad: number,
  zoom: number,
  frame: FrameContext
): { id: string; x: number; y: number; r: number }[] {
  const rendered: { id: string; x: number; y: number; r: number }[] = [];
  const asteroids = computeAsteroidPositions(date);
  for (const ast of asteroids) {
    const tr = transformStar(ast.ra, ast.dec, frame, latRad);
    let alt = tr.horizontal.alt;
    if (refraction && alt < Math.PI / 2) alt = refract(alt);
    if (alt <= 0) continue;

    const proj = projectStereographic({ cx, cy, radius, alt, az: tr.horizontal.az + rotation });
    const r = 3 * dpr * Math.sqrt(zoom);

    // Draw diamond glyph (◇)
    ctx.strokeStyle = ast.color;
    ctx.lineWidth = 1 * dpr;
    ctx.fillStyle = ast.color + "20";
    ctx.beginPath();
    ctx.moveTo(proj.x, proj.y - r);
    ctx.lineTo(proj.x + r, proj.y);
    ctx.lineTo(proj.x, proj.y + r);
    ctx.lineTo(proj.x - r, proj.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw tiny trail tick (faint grey line)
    ctx.strokeStyle = "rgba(150, 150, 150, 0.4)";
    ctx.beginPath();
    ctx.moveTo(proj.x, proj.y);
    ctx.lineTo(proj.x - 2 * r, proj.y + r);
    ctx.stroke();

    // Label
    ctx.font = `${9 * dpr}px ui-sans-serif, system-ui`;
    ctx.fillStyle = "rgba(200, 210, 225, 0.7)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(ast.name, proj.x + r + 3 * dpr, proj.y);
    rendered.push({ id: `asteroid_${ast.name.toLowerCase()}`, x: proj.x, y: proj.y, r: Math.max(r, 6 * dpr) });
  }
  return rendered;
}

function drawComets(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  refraction: boolean,
  dpr: number,
  date: Date,
  latRad: number,
  zoom: number,
  frame: FrameContext
): { id: string; x: number; y: number; r: number }[] {
  const rendered: { id: string; x: number; y: number; r: number }[] = [];
  const comets = computeCometPositions(date);
  for (const comet of comets) {
    const tr = transformStar(comet.ra, comet.dec, frame, latRad);
    let alt = tr.horizontal.alt;
    if (refraction && alt < Math.PI / 2) alt = refract(alt);
    if (alt <= 0) continue;

    const proj = projectStereographic({ cx, cy, radius, alt, az: tr.horizontal.az + rotation });
    const r = 3 * dpr * Math.sqrt(zoom);

    // Draw comet core (circle with a glowing tail)
    ctx.fillStyle = comet.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, r, 0, 2 * Math.PI);
    ctx.fill();

    // Draw tail pointing away from the sun (rough approximation, we just draw it up/right for simplicity here or radial)
    const tailGrad = ctx.createLinearGradient(proj.x, proj.y, proj.x + r * 5, proj.y - r * 5);
    tailGrad.addColorStop(0, comet.color + "80");
    tailGrad.addColorStop(1, comet.color + "00");
    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = r;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(proj.x, proj.y);
    ctx.lineTo(proj.x + r * 5, proj.y - r * 5);
    ctx.stroke();

    // Label
    ctx.font = `${9 * dpr}px ui-sans-serif, system-ui`;
    ctx.fillStyle = "rgba(200, 210, 225, 0.7)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("☄️ " + comet.name, proj.x + r + 3 * dpr, proj.y + r + 3 * dpr);
    rendered.push({ id: `comet_${comet.id.toLowerCase()}`, x: proj.x, y: proj.y, r: Math.max(r, 6 * dpr) });
  }
  return rendered;
}

function drawSatellites(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  refraction: boolean,
  dpr: number,
  date: Date,
  latDeg: number,
  lonDeg: number,
  elevationM: number,
  zoom: number,
  selectedBody: string | null
): { id: string; x: number; y: number; r: number }[] {
  const rendered: { id: string; x: number; y: number; r: number }[] = [];
  const satellites = computeSatellitePositions(date, latDeg, lonDeg, elevationM);

  for (const sat of satellites) {
    let alt = (sat.altDeg * Math.PI) / 180;
    if (refraction && alt < Math.PI / 2) alt = refract(alt);

    const isSelected = selectedBody === `satellite_${sat.id}` || selectedBody === `satellite_${sat.id.toLowerCase()}`;

    // If below horizon and not selected, skip
    if (alt <= 0 && !isSelected) continue;

    const az = (sat.azDeg * Math.PI) / 180;
    const proj = projectStereographic({ cx, cy, radius, alt, az: az + rotation });
    const r = (isSelected ? 3.5 : 2.5) * dpr * Math.sqrt(zoom);

    // Is it a major well-known satellite?
    const isMajor = sat.name.includes("ISS") || sat.name.includes("CSS") || sat.name.includes("TIAN") ||
                    sat.name.includes("HST") || sat.name.includes("TERRA") || sat.name.includes("AQUA") ||
                    sat.name.includes("ENVISAT") || sat.name.includes("XRISM");

    // Check if below horizon (selected only)
    if (alt <= 0 && isSelected) {
      // Draw ghosted indicator
      ctx.save();
      ctx.strokeStyle = sat.color + "99";
      ctx.lineWidth = 1.2 * dpr;
      ctx.setLineDash([3 * dpr, 3 * dpr]);
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, r * 2, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.font = `italic ${9 * dpr}px ui-sans-serif, system-ui`;
      ctx.fillStyle = sat.color + "cc";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(`🛰️ ${sat.name} (Alt ${sat.altDeg.toFixed(0)}°)`, proj.x, proj.y + r * 2 + 2 * dpr);
      ctx.restore();

      rendered.push({ id: `satellite_${sat.id}`, x: proj.x, y: proj.y, r: Math.max(r * 2, 8 * dpr) });
      continue;
    }

    // Draw visible satellite as a glowing dot
    ctx.fillStyle = sat.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, r, 0, 2 * Math.PI);
    ctx.fill();

    const halo = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, r * 3);
    halo.addColorStop(0, sat.color + (isSelected ? "bb" : "80"));
    halo.addColorStop(1, sat.color + "00");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, r * 3, 0, 2 * Math.PI);
    ctx.fill();

    // Crosshair-like brackets for major or selected or zoomed-in satellites
    if (isMajor || isSelected || zoom > 1.3) {
      ctx.strokeStyle = sat.color + (isSelected ? "ff" : "a0");
      ctx.lineWidth = (isSelected ? 1.5 : 1) * dpr;
      const s = r * 2;
      ctx.beginPath();
      ctx.moveTo(proj.x - s, proj.y - s / 2);
      ctx.lineTo(proj.x - s, proj.y - s);
      ctx.lineTo(proj.x - s / 2, proj.y - s);

      ctx.moveTo(proj.x + s, proj.y - s / 2);
      ctx.lineTo(proj.x + s, proj.y - s);
      ctx.lineTo(proj.x + s / 2, proj.y - s);

      ctx.moveTo(proj.x - s, proj.y + s / 2);
      ctx.lineTo(proj.x - s, proj.y + s);
      ctx.lineTo(proj.x - s / 2, proj.y + s);

      ctx.moveTo(proj.x + s, proj.y + s / 2);
      ctx.lineTo(proj.x + s, proj.y + s);
      ctx.lineTo(proj.x + s / 2, proj.y + s);
      ctx.stroke();

      // Label
      ctx.font = `bold ${9 * dpr}px ui-sans-serif, system-ui`;
      ctx.fillStyle = sat.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("🛰️ " + sat.name, proj.x, proj.y + s + 3 * dpr);
    }

    rendered.push({ id: `satellite_${sat.id}`, x: proj.x, y: proj.y, r: Math.max(r * 2, 8 * dpr) });
  }

  return rendered;
}

function drawNGC(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  frame: FrameContext,
  rotation: number,
  refraction: boolean,
  dpr: number,
  latRad: number,
  zoom: number
): { id: string; x: number; y: number; r: number }[] {
  const rendered: { id: string; x: number; y: number; r: number }[] = [];
  for (const n of NGC_OBJECTS) {
    const tr = transformStar(n.ra, n.dec, frame, latRad);
    let alt = tr.horizontal.alt;
    if (refraction && alt < Math.PI / 2) alt = refract(alt);
    if (alt <= 0) continue;

    const proj = projectStereographic({
      cx,
      cy,
      radius,
      alt,
      az: tr.horizontal.az + rotation,
    });

    const size = Math.max(3 * dpr, Math.min(12 * dpr, (n.size / 30) * 5 * dpr)) * zoom;
    const x = proj.x;
    const y = proj.y;
    const color = NGC_TYPE_COLORS[n.type] || "#ffffff";

    ctx.save();

    switch (n.type) {
      case "galaxy": {
        // Tilted ellipse
        ctx.strokeStyle = color + "aa";
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.4, Math.PI / 6, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
      case "nebula":
      case "cluster+nebula": {
        // Dashed circle
        ctx.strokeStyle = color + "cc";
        ctx.lineWidth = 1 * dpr;
        ctx.setLineDash([3 * dpr, 3 * dpr]);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
      case "planetary": {
        // Ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.1 * dpr;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }
      case "open": {
        // Star pattern
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * 2 * Math.PI;
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * size * 0.6, y + Math.sin(a) * size * 0.6, 0.8 * dpr, 0, 2 * Math.PI);
          ctx.fill();
        }
        break;
      }
      case "globular": {
        // Fuzzy gradient
        const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "rgba(251, 146, 60, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
        break;
      }
      default: {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 2 * dpr, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    ctx.restore();

    // Label
    ctx.font = `${9 * dpr}px ui-sans-serif, system-ui`;
    ctx.fillStyle = "rgba(200, 220, 255, 0.65)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${n.catalog}${n.number}`, x + size + 4 * dpr, y);
    rendered.push({ id: `ngc_${n.number}`, x: proj.x, y: proj.y, r: Math.max(size, 6 * dpr) });
  }
  return rendered;
}

