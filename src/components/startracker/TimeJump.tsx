"use client";

/**
 * TimeJump — quick navigation panel for jumping to key astronomical events:
 * sunset, astronomical dusk, midnight, astronomical dawn, sunrise, and next
 * meteor shower peak.
 *
 * Shown inside a popover from the toolbar.
 */

import { useMemo } from "react";
import { useStarTracker } from "@/lib/store";
import { buildFrame, transformStar } from "@/lib/astro/engine";
import { sunPosition } from "@/lib/astro/solarSystem";
import { getNextShower, daysToPeak } from "@/data/meteorShowers";
import { Sunset, Sunrise, Moon, Clock, Zap, Calendar } from "lucide-react";

export function TimeJump() {
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const setCurrentTime = useStarTracker((s) => s.setCurrentTime);

  const events = useMemo(() => {
    const latRad = (observer.latDeg * Math.PI) / 180;
    const lonRad = (observer.lonDeg * Math.PI) / 180;
    const now = currentTime.getTime();
    const events: { label: string; time: Date; icon: typeof Sunset; color: string }[] = [];

    // Sample next 48h at 2-min resolution to find sun altitude transitions
    const steps = 1440; // 48h * 30 (2-min)
    let prevSunAlt = 0;
    const samples: { time: Date; sunAlt: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = new Date(now + i * 2 * 60 * 1000);
      const frame = buildFrame({ date: t, lat: latRad, lon: lonRad, elevationM: observer.elevationM });
      const sun = sunPosition(t);
      const sunTr = transformStar(sun.ra, sun.dec, frame, latRad);
      const sunAlt = (sunTr.horizontal.alt * 180) / Math.PI;
      samples.push({ time: t, sunAlt });
      if (i === 0) prevSunAlt = sunAlt;
      else {
        // Detect transitions
        const thresholds = [
          { alt: 0, down: "Sunset", up: "Sunrise", icon: Sunset, color: "text-orange-300" },
          { alt: -18, down: "Astro dusk", up: "Astro dawn", icon: Moon, color: "text-sky-300" },
        ];
        for (const th of thresholds) {
          if (prevSunAlt > th.alt && sunAlt <= th.alt && events.length < 6) {
            events.push({ label: th.down, time: t, icon: th.icon, color: th.color });
          } else if (prevSunAlt < th.alt && sunAlt >= th.alt && events.length < 6) {
            events.push({ label: th.up, time: t, icon: th.icon, color: th.color });
          }
        }
        prevSunAlt = sunAlt;
      }
    }

    // Add local midnight (next midnight in observer tz — approximated as UTC midnight)
    const tomorrow = new Date(now + 24 * 3600 * 1000);
    tomorrow.setUTCHours(0, 0, 0, 0);
    events.push({ label: "Midnight", time: tomorrow, icon: Clock, color: "text-violet-300" });

    // Next meteor shower peak
    const nextShower = getNextShower(currentTime);
    if (nextShower) {
      const d = daysToPeak(nextShower, currentTime);
      const peakTime = new Date(now + d * 24 * 3600 * 1000);
      peakTime.setUTCHours(2, 0, 0, 0); // approximate peak at 2am local
      events.push({ label: `${nextShower.name} peak`, time: peakTime, icon: Zap, color: "text-amber-300" });
    }

    // Sort by time and dedupe
    events.sort((a, b) => a.time.getTime() - b.time.getTime());
    return events;
  }, [observer, currentTime]);

  const fmtTime = (d: Date) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: observer.timezone || "UTC",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d);
    } catch {
      return d.toISOString().slice(5, 16).replace("T", " ");
    }
  };

  const jumpTo = (time: Date) => {
    setCurrentTime(time);
  };

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
        <Calendar className="h-3.5 w-3.5" />
        Time Jump
      </div>
      <div className="text-[10px] text-slate-500">Jump to key astronomical events</div>

      <div className="space-y-1">
        {events.length === 0 ? (
          <div className="rounded border border-white/5 bg-white/[0.02] px-2 py-2 text-center text-[11px] text-slate-500">
            No events found (polar conditions?)
          </div>
        ) : (
          events.map((ev, i) => (
            <button
              key={i}
              onClick={() => jumpTo(ev.time)}
              className="flex w-full items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-amber-400/30 hover:bg-amber-400/[0.05]"
            >
              <ev.icon className={`h-3.5 w-3.5 shrink-0 ${ev.color}`} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-slate-100">{ev.label}</div>
                <div className="font-mono text-[10px] text-slate-400">{fmtTime(ev.time)}</div>
              </div>
              <span className="text-[9px] text-slate-600">→</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
