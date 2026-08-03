"use client";

/**
 * MoonPhasesCalendar — shows moon phases for the next 30 days.
 *
 * Each day displays a small SVG moon icon with the correct illumination,
 * the date, and the moon's altitude at local midnight. Days with notable
 * phases (New, First Quarter, Full, Last Quarter) are highlighted.
 */

import { useMemo } from "react";
import { useStarTracker } from "@/lib/store";
import { moonPhase, moonPosition } from "@/lib/astro/solarSystem";
import { buildFrame, transformStar } from "@/lib/astro/engine";
import { Moon, Calendar } from "lucide-react";

export function MoonPhasesCalendar() {
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);

  const days = useMemo(() => {
    const latRad = (observer.latDeg * Math.PI) / 180;
    const lonRad = (observer.lonDeg * Math.PI) / 180;
    const startMs = Date.UTC(
      currentTime.getUTCFullYear(),
      currentTime.getUTCMonth(),
      currentTime.getUTCDate(),
    );
    const today = currentTime.getUTCDate();

    const result: { date: Date; phase: any; altDeg: number; isPhaseDay: boolean }[] = [];
    for (let i = 0; i < 30; i++) {
      const t = new Date(startMs + i * 24 * 3600 * 1000);
      const phase = moonPhase(t);
      const moon = moonPosition(t);
      // Altitude at local midnight (approximate)
      const midnight = new Date(t);
      midnight.setUTCHours(0, 0, 0, 0);
      const frame = buildFrame({ date: midnight, lat: latRad, lon: lonRad, elevationM: observer.elevationM });
      const tr = transformStar(moon.ra, moon.dec, frame, latRad);
      const altDeg = (tr.horizontal.alt * 180) / Math.PI;

      // Check if this is a notable phase day
      const isPhaseDay =
        (i === 0 && phase.illumination < 0.05) ||
        Math.abs(phase.illumination - 0.5) < 0.03 ||
        phase.illumination > 0.97;

      result.push({
        date: t,
        phase,
        altDeg,
        isPhaseDay,
      });
    }
    return result;
  }, [observer, currentTime]);

  const fmtDate = (d: Date) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: observer.timezone || "UTC",
        month: "short",
        day: "numeric",
      }).format(d);
    } catch {
      return d.toISOString().slice(5, 10);
    }
  };

  const fmtWeekday = (d: Date) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: observer.timezone || "UTC",
        weekday: "short",
      }).format(d);
    } catch {
      return "";
    }
  };

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
        <Calendar className="h-3.5 w-3.5" />
        Moon Phases — 30 Days
      </div>
      <div className="text-[10px] text-slate-500">
        Moon illumination and altitude at local midnight
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
        {days.map((d, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 text-center transition-colors ${
              d.isPhaseDay
                ? "border-amber-400/30 bg-amber-400/[0.08]"
                : "border-white/5 bg-white/[0.02]"
            }`}
            title={`${d.phase.name} · ${(d.phase.illumination * 100).toFixed(0)}% lit · ${d.altDeg.toFixed(0)}° alt`}
          >
            <MoonPhaseMiniIcon illum={d.phase.illumination} waxing={d.phase.waxing} size={24} />
            <div className="text-[9px] font-medium text-slate-300">{fmtWeekday(d.date)}</div>
            <div className="font-mono text-[9px] text-slate-500">{fmtDate(d.date)}</div>
            <div className="font-mono text-[8px] text-slate-600">{(d.phase.illumination * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>

      {/* Phase legend */}
      <div className="mt-1 flex items-center justify-center gap-3 border-t border-white/5 pt-2 text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <MoonPhaseMiniIcon illum={0} waxing={true} size={12} /> New
        </span>
        <span className="flex items-center gap-1">
          <MoonPhaseMiniIcon illum={0.5} waxing={true} size={12} /> First Qtr
        </span>
        <span className="flex items-center gap-1">
          <MoonPhaseMiniIcon illum={1} waxing={true} size={12} /> Full
        </span>
        <span className="flex items-center gap-1">
          <MoonPhaseMiniIcon illum={0.5} waxing={false} size={12} /> Last Qtr
        </span>
      </div>
    </div>
  );
}

/** A small SVG moon phase icon. */
function MoonPhaseMiniIcon({ illum, waxing, size = 16 }: { illum: number; waxing: boolean; size?: number }) {
  const r = size / 2 - 1;
  const cx = size / 2;
  const cy = size / 2;
  const xRad = r * Math.abs(1 - 2 * illum);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <defs>
        <clipPath id={`mclip-${size}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="#e2e8f0" stroke="#475569" strokeWidth="0.5" />
      <g clipPath={`url(#mclip-${size})`}>
        {illum < 0.99 && (
          <>
            <ellipse cx={cx} cy={cy} rx={xRad} ry={r} fill="#1e293b" />
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
