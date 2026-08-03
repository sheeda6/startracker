"use client";

/**
 * LightPollutionPanel — displays the Bortle sky quality for the current location.
 *
 * Features:
 *  - Gradient Bortle scale bar (1=black → 9=amber)
 *  - Current position indicator on the scale
 *  - Class label, description, and limiting magnitude
 *  - Data source indicator (live API vs. local estimate)
 */

import { useStarTracker } from "@/lib/store";
import { useLightPollution } from "@/hooks/useLightPollution";
import { Cloud, Eye, Loader2, Info, MapPin } from "lucide-react";

const BORTLE_COLORS = [
  "#0a0a2e", // 1 — Zodiacal light black
  "#0d1040", // 2 — Truly dark
  "#1a1a60", // 3 — Rural
  "#2d2d80", // 4 — Rural/suburban
  "#4a3a90", // 5 — Suburban
  "#7a4a80", // 6 — Bright suburban
  "#a05050", // 7 — Suburban/urban
  "#c06030", // 8 — City
  "#d08020", // 9 — Inner city
];

const BORTLE_STARS = [
  "All Zodiacal band, M33 direct",
  "M33 direct vision clearly",
  "Milky Way complex, M33 easy",
  "Milky Way complex, slight LP",
  "Milky Way washed out",
  "Only hints of Milky Way",
  "M31 barely visible",
  "City glow dominates",
  "Only Moon & Venus visible",
];

export function LightPollutionPanel() {
  const observer = useStarTracker((s) => s.observer);
  const lp = useLightPollution(observer);

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-300/80">
        <Cloud className="h-3.5 w-3.5" />
        Sky Quality / Light Pollution
      </div>

      {lp.loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Fetching sky quality…</span>
        </div>
      ) : (
        <>
          {/* Bortle class callout */}
          <div
            className="rounded-lg border border-white/10 p-3 text-center"
            style={{ background: `linear-gradient(135deg, ${BORTLE_COLORS[lp.bortle - 1]}40, transparent)`, borderColor: `${BORTLE_COLORS[lp.bortle - 1]}60` }}
          >
            <div className="text-4xl font-bold" style={{ color: BORTLE_COLORS[lp.bortle - 1] === "#0a0a2e" ? "#6080ff" : BORTLE_COLORS[lp.bortle - 1] }}>
              {lp.bortle}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-200">{lp.label}</div>
            <div className="mt-1 text-[11px] text-slate-400 max-w-[240px] mx-auto">{lp.description}</div>
          </div>

          {/* Bortle scale bar */}
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">Bortle Scale</div>
            <div className="relative h-5 w-full rounded-full overflow-hidden" style={{
              background: `linear-gradient(to right, ${BORTLE_COLORS.join(",")})`
            }}>
              {/* Indicator */}
              <div
                className="absolute top-0 h-full w-1 -translate-x-1/2 rounded bg-white shadow-lg"
                style={{ left: `${((lp.bortle - 1) / 8) * 100}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-slate-600">
              <span>1 Darkest</span>
              <span>9 Brightest</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <Stat label="SQM" value={`${lp.sqm.toFixed(2)} mag/″²`} icon={<Eye className="h-3 w-3 text-sky-300" />} />
            <Stat label="Limiting mag" value={`~${lp.limitingMagnitude.toFixed(1)}`} icon={<span className="text-amber-300 text-[10px]">★</span>} />
          </div>

          {/* What you can see with naked eye at this Bortle */}
          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">Naked-Eye Visibility</div>
            <div className="rounded-md border border-white/8 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-300">
              {BORTLE_STARS[lp.bortle - 1]}
            </div>
          </div>

          {/* Recommendation */}
          <div className={`rounded-md border px-3 py-2 text-[11px] ${
            lp.bortle <= 3
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : lp.bortle <= 5
              ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
              : lp.bortle <= 7
              ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
              : "border-rose-500/30 bg-rose-500/10 text-rose-200"
          }`}>
            {lp.bortle <= 3 && "🌌 Exceptional dark sky. DSOs and the Zodiacal light are spectacular."}
            {lp.bortle === 4 && "✨ Good dark sky for most deep-sky objects."}
            {lp.bortle === 5 && "🔭 Telescope recommended for faint galaxies and nebulae."}
            {lp.bortle === 6 && "🔭 Significant light pollution. Use OIII/UHC filters for nebulae."}
            {lp.bortle === 7 && "⚠️ Heavy light pollution. Only bright clusters and double stars rewarding."}
            {lp.bortle >= 8 && "🏙️ Severe light pollution. Moon, planets, and bright clusters only."}
          </div>

          {/* Source note */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <Info className="h-3 w-3" />
            <span>
              {lp.source === "api"
                ? "Data from lightpollutionmap.info (2015 VIIRS)"
                : "Estimated from location (local model)"}
            </span>
            <MapPin className="ml-auto h-3 w-3" />
            <span className="font-mono">{observer.latDeg.toFixed(2)}°, {observer.lonDeg.toFixed(2)}°</span>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.02] px-2.5 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-sm text-slate-200">{value}</div>
    </div>
  );
}
