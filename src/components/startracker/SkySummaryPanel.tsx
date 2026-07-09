"use client";

/**
 * SkySummaryPanel — a compact "Tonight's Sky" overview widget.
 *
 * Shows at a glance:
 *  - Sun altitude (day/night/twilight) with a day/night indicator
 *  - Moon phase icon + illumination %
 *  - Visible planets (which are above the horizon now)
 *  - Brightest visible star
 *  - Total visible stars (above horizon, within magnitude limit)
 *
 * Designed to overlay the top-right corner of the sky map as a small
 * glass-morphism card.
 */

import { useMemo } from "react";
import { useStarTracker } from "@/lib/store";
import { STARS } from "@/data/stars";
import { buildFrame, transformStar, refract } from "@/lib/astro/engine";
import { sunPosition, moonPosition, planetPositions, moonPhase } from "@/lib/astro/solarSystem";
import { getActiveShowers, daysToPeak, type MeteorShower } from "@/data/meteorShowers";
import { Sun, Moon, Star, Eye, Sparkles, Sunrise, Sunset, Zap } from "lucide-react";

export function SkySummaryPanel() {
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const layers = useStarTracker((s) => s.layers);
  const filters = useStarTracker((s) => s.filters);
  const setSelectedHip = useStarTracker((s) => s.setSelectedHip);

  const data = useMemo(() => {
    const latRad = (observer.latDeg * Math.PI) / 180;
    const frame = buildFrame({
      date: currentTime,
      lat: latRad,
      lon: (observer.lonDeg * Math.PI) / 180,
      elevationM: observer.elevationM,
    });

    // Sun
    const sun = sunPosition(currentTime);
    const sunTr = transformStar(sun.ra, sun.dec, frame, latRad);
    const sunAltDeg = (sunTr.horizontal.alt * 180) / Math.PI;

    // Moon
    const moon = moonPosition(currentTime);
    const moonTr = transformStar(moon.ra, moon.dec, frame, latRad);
    const moonAltDeg = (moonTr.horizontal.alt * 180) / Math.PI;
    const phase = moonPhase(currentTime);

    // Planets
    const planets = planetPositions(currentTime).map((p) => {
      const tr = transformStar(p.ra, p.dec, frame, latRad);
      return { ...p, altDeg: (tr.horizontal.alt * 180) / Math.PI };
    });
    const visiblePlanets = planets.filter((p) => p.altDeg > 0);

    // Stars
    let visibleCount = 0;
    let brightestVisible: { hip: number; name: string; mag: number } | null = null;
    for (const s of STARS) {
      if (s.mag > filters.maxMagnitude) continue;
      const tr = transformStar(s.ra, s.dec, frame, latRad);
      let alt = tr.horizontal.alt;
      if (layers.refraction && alt < Math.PI / 2) alt = refract(alt);
      if (alt > 0) {
        visibleCount++;
        if (!brightestVisible || s.mag < brightestVisible.mag) {
          brightestVisible = { hip: s.hip, name: s.name || s.bayer || `HIP ${s.hip}`, mag: s.mag };
        }
      }
    }

    // Sun status
    let sunStatus: string;
    let sunColor: string;
    if (sunAltDeg > 6) { sunStatus = "Daytime"; sunColor = "text-amber-300"; }
    else if (sunAltDeg > 0) { sunStatus = "Civil twilight"; sunColor = "text-orange-300"; }
    else if (sunAltDeg > -6) { sunStatus = "Civil twilight"; sunColor = "text-orange-300"; }
    else if (sunAltDeg > -12) { sunStatus = "Nautical twilight"; sunColor = "text-indigo-300"; }
    else if (sunAltDeg > -18) { sunStatus = "Astronomical twilight"; sunColor = "text-violet-300"; }
    else { sunStatus = "Night"; sunColor = "text-sky-300"; }

    // Meteor showers
    const activeShowers = getActiveShowers(currentTime).map((s) => ({
      ...s,
      daysToPeak: daysToPeak(s, currentTime),
      // Compute radiant altitude
      radiantAlt: (() => {
        const tr = transformStar(s.radiantRa, s.radiantDec, frame, latRad);
        return (tr.horizontal.alt * 180) / Math.PI;
      })(),
    }));

    return {
      sunAltDeg,
      sunStatus,
      sunColor,
      moonAltDeg,
      moonIllum: phase.illumination,
      moonPhaseName: phase.name,
      moonWaxing: phase.waxing,
      visiblePlanets,
      visibleCount,
      brightestVisible,
      activeShowers,
    };
  }, [observer, currentTime, layers.refraction, filters.maxMagnitude]);

  return (
    <div className="pointer-events-auto absolute right-3 top-3 w-56 rounded-lg border border-white/10 bg-slate-950/85 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur-md">
      {/* Sun status */}
      <div className="flex items-center gap-2 pb-2">
        <Sun className={`h-4 w-4 ${data.sunColor}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Sun</span>
            <span className={`text-[10px] font-semibold ${data.sunColor}`}>{data.sunStatus}</span>
          </div>
          <div className="font-mono text-[11px] text-slate-300">
            {data.sunAltDeg > 0 ? "↑" : "↓"} {Math.abs(data.sunAltDeg).toFixed(1)}°
          </div>
        </div>
      </div>

      {/* Moon */}
      <div className="flex items-center gap-2 border-t border-white/5 py-2">
        <MoonPhaseIcon illum={data.moonIllum} waxing={data.moonWaxing} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Moon</span>
            <span className="text-[10px] text-slate-400">{data.moonPhaseName}</span>
          </div>
          <div className="font-mono text-[11px] text-slate-300">
            {(data.moonIllum * 100).toFixed(0)}% lit · {data.moonAltDeg > 0 ? "↑" : "↓"} {Math.abs(data.moonAltDeg).toFixed(1)}°
          </div>
        </div>
      </div>

      {/* Planets */}
      {data.visiblePlanets.length > 0 && (
        <div className="border-t border-white/5 py-2">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Planets up</div>
          <div className="flex flex-wrap gap-1.5">
            {data.visiblePlanets.map((p) => (
              <span
                key={p.name}
                className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px]"
                style={{ color: p.color }}
                title={`${p.name}: ${p.altDeg.toFixed(1)}° alt`}
              >
                <span>{p.symbol}</span>
                <span className="text-slate-400">{p.altDeg.toFixed(0)}°</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Brightest star */}
      {data.brightestVisible && (
        <button
          onClick={() => setSelectedHip(data.brightestVisible!.hip)}
          className="flex w-full items-center gap-2 border-t border-white/5 py-2 text-left hover:bg-white/5"
        >
          <Star className="h-3.5 w-3.5 text-amber-300" />
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Brightest visible</div>
            <div className="font-mono text-[11px] text-amber-200">
              {data.brightestVisible.name} · m{data.brightestVisible.mag.toFixed(2)}
            </div>
          </div>
        </button>
      )}

      {/* Visible count */}
      <div className="flex items-center gap-2 border-t border-white/5 pt-2">
        <Eye className="h-3.5 w-3.5 text-sky-300" />
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Visible stars</div>
          <div className="font-mono text-[11px] text-slate-300">
            {data.visibleCount} above horizon
          </div>
        </div>
      </div>

      {/* Meteor showers */}
      {data.activeShowers.length > 0 && (
        <div className="border-t border-white/5 pt-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
            <Zap className="h-3 w-3 text-amber-300" />
            Meteor showers
          </div>
          <div className="flex flex-col gap-1">
            {data.activeShowers.map((s) => {
              const d = s.daysToPeak;
              const peakLabel = d === 0 ? "peak tonight" : d === 1 ? "peaks tomorrow" : `peaks in ${d}d`;
              const radiantUp = s.radiantAlt > 0;
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded border border-white/5 bg-white/[0.02] px-1.5 py-1">
                  <div className="min-w-0">
                    <div className="truncate text-[11px] text-amber-200">{s.name}</div>
                    <div className="font-mono text-[9px] text-slate-500">
                      ZHR {s.zhr} · {peakLabel}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[9px] ${radiantUp ? "text-emerald-400" : "text-slate-600"}`}>
                      {radiantUp ? "↑" : "↓"} {Math.abs(s.radiantAlt).toFixed(0)}°
                    </span>
                    <span className="text-[8px] text-slate-600">{s.constellation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** A small SVG-based moon phase icon that renders the illuminated fraction. */
function MoonPhaseIcon({ illum, waxing }: { illum: number; waxing: boolean }) {
  const size = 16;
  const r = size / 2 - 1;
  const cx = size / 2;
  const cy = size / 2;

  // Compute the shadow ellipse
  // illum 0 → full shadow (new moon), 1 → no shadow (full moon)
  const xRad = r * Math.abs(1 - 2 * illum);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <defs>
        <clipPath id="moon-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      {/* Lit disc */}
      <circle cx={cx} cy={cy} r={r} fill="#e2e8f0" stroke="#475569" strokeWidth="0.5" />
      {/* Shadow */}
      <g clipPath="url(#moon-clip)">
        {illum < 0.99 && (
          <>
            {/* Outer ellipse half (dark side) */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={xRad}
              ry={r}
              fill="#1e293b"
            />
            {/* If waning crescent or waxing gibbous, fill the appropriate half */}
            {(illum < 0.5) === waxing ? (
              <rect x={cx} y={0} width={r} height={size} fill="#1e293b" />
            ) : (
              <rect x={0} y={0} width={cx} height={size} fill="#1e293b" />
            )}
          </>
        )}
      </g>
    </svg>
  );
}
