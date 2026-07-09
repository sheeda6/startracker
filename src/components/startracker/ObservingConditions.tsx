"use client";

/**
 * ObservingConditions — shows twilight times and observing windows for the
 * current night.
 *
 * Computes:
 *  - Sunset, civil/nautical/astronomical dusk and dawn
 *  - Best deep-sky observing window (between astro dusk and astro dawn)
 *  - Moon set/rise (interference windows)
 *  - Total dark-sky hours
 *
 * Displayed inside a popover from the toolbar.
 */

import { useMemo } from "react";
import { useStarTracker } from "@/lib/store";
import { buildFrame, transformStar } from "@/lib/astro/engine";
import { sunPosition, moonPosition } from "@/lib/astro/solarSystem";
import { Sun, Moon, Telescope, Eye, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ObservingConditions() {
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);

  const data = useMemo(() => {
    const latRad = (observer.latDeg * Math.PI) / 180;
    const lonRad = (observer.lonDeg * Math.PI) / 180;

    // Sample the next 24 hours at 5-min resolution to find twilight transitions
    const steps = 288; // 24h * 12 (5-min)
    const startMs = currentTime.getTime();
    const samples: { time: Date; sunAlt: number; moonAlt: number; moonIllum: number }[] = [];

    for (let i = 0; i < steps; i++) {
      const t = new Date(startMs + i * 5 * 60 * 1000);
      const frame = buildFrame({ date: t, lat: latRad, lon: lonRad, elevationM: observer.elevationM });
      const sun = sunPosition(t);
      const moon = moonPosition(t);
      const sunTr = transformStar(sun.ra, sun.dec, frame, latRad);
      const moonTr = transformStar(moon.ra, moon.dec, frame, latRad);
      samples.push({
        time: t,
        sunAlt: (sunTr.horizontal.alt * 180) / Math.PI,
        moonAlt: (moonTr.horizontal.alt * 180) / Math.PI,
        moonIllum: 0, // simplified — would need moonPhase
      });
    }

    // Find twilight transitions
    const transitions: { time: Date; sunAlt: number; label: string }[] = [];
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];
      const thresholds = [
        { alt: 0, up: "Sunset", down: "Sunrise" },
        { alt: -6, up: "Civil dusk", down: "Civil dawn" },
        { alt: -12, up: "Nautical dusk", down: "Nautical dawn" },
        { alt: -18, up: "Astro dusk", down: "Astro dawn" },
      ];
      for (const th of thresholds) {
        if (prev.sunAlt > th.alt && curr.sunAlt <= th.alt) {
          transitions.push({ time: curr.time, sunAlt: curr.sunAlt, label: th.up });
        } else if (prev.sunAlt < th.alt && curr.sunAlt >= th.alt) {
          transitions.push({ time: curr.time, sunAlt: curr.sunAlt, label: th.down });
        }
      }
    }

    // Find dark-sky window (sun below -18°)
    const darkStart = samples.find((s) => s.sunAlt < -18);
    const darkEnd = [...samples].reverse().find((s) => s.sunAlt < -18);
    const darkHours = darkStart && darkEnd
      ? (darkEnd.time.getTime() - darkStart.time.getTime()) / 3600000
      : 0;

    // Moon set/rise
    const moonSet = samples.find((s, i) => i > 0 && samples[i - 1].moonAlt > 0 && s.moonAlt <= 0);
    const moonRise = samples.find((s, i) => i > 0 && samples[i - 1].moonAlt < 0 && s.moonAlt >= 0);

    // Moon-dark overlap (moon below horizon AND sun below -18°)
    let moonDarkHours = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i].sunAlt < -18 && samples[i].moonAlt < 0) {
        moonDarkHours += 5 / 60; // 5 min
      }
    }

    return {
      transitions: transitions.slice(0, 8),
      darkHours,
      moonDarkHours,
      moonSet: moonSet?.time ?? null,
      moonRise: moonRise?.time ?? null,
    };
  }, [observer, currentTime]);

  const fmtTime = (d: Date | null) => {
    if (!d) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: observer.timezone || "UTC",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d);
    } catch {
      return d.toISOString().slice(11, 16);
    }
  };

  const darkQuality = data.moonDarkHours > 4 ? "Excellent" : data.moonDarkHours > 2 ? "Good" : data.moonDarkHours > 0.5 ? "Fair" : "Poor";
  const qualityColor = darkQuality === "Excellent" ? "text-emerald-300" : darkQuality === "Good" ? "text-sky-300" : darkQuality === "Fair" ? "text-amber-300" : "text-rose-300";

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
        <Telescope className="h-3.5 w-3.5" />
        Observing Conditions
      </div>

      {/* Quality summary */}
      <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Dark-sky quality</span>
          <span className={`text-sm font-semibold ${qualityColor}`}>{darkQuality}</span>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Eye className="h-3 w-3 text-sky-300" />
            <span className="text-slate-400">Total dark:</span>
            <span className="font-mono text-slate-200">{data.darkHours.toFixed(1)}h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Moon className="h-3 w-3 text-slate-300" />
            <span className="text-slate-400">Moon-free:</span>
            <span className="font-mono text-slate-200">{data.moonDarkHours.toFixed(1)}h</span>
          </div>
        </div>
      </div>

      {/* Twilight timeline */}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
          <Clock className="h-3 w-3" />
          Tonight's timeline
        </div>
        <div className="space-y-0.5">
          {data.transitions.length === 0 ? (
            <div className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5 text-center text-[11px] text-slate-500">
              No twilight transitions in the next 24h (polar conditions)
            </div>
          ) : (
            data.transitions.map((t, i) => (
              <div key={i} className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-2 py-1">
                <span className={`text-[11px] ${t.label.includes("dusk") || t.label === "Sunset" ? "text-amber-300" : t.label.includes("dawn") || t.label === "Sunrise" ? "text-sky-300" : "text-slate-300"}`}>
                  {t.label}
                </span>
                <span className="font-mono text-[11px] text-slate-200">{fmtTime(t.time)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Moon interference */}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
          <Moon className="h-3 w-3" />
          Moon interference
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5 text-center">
            <div className="text-[9px] uppercase text-slate-500">Moonset</div>
            <div className="font-mono text-sm text-slate-200">{fmtTime(data.moonSet)}</div>
          </div>
          <div className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5 text-center">
            <div className="text-[9px] uppercase text-slate-500">Moonrise</div>
            <div className="font-mono text-sm text-slate-200">{fmtTime(data.moonRise)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
