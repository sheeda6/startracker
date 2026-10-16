"use client";

/**
 * TimeControls — horizontal toolbar for clock mode, time scrubbing, and
 * sidereal-time readouts.
 *
 * Drives the Zustand time slice (clockMode, timeSpeed, currentTime) and derives
 * LST / GMST / JD from the astronomy engine so the user can see the sky-rotation
 * state at a glance. All controls are icon-led and compact so the strip fits in a
 * single row on wide screens and wraps gracefully on narrow ones.
 */

import { useMemo, useState } from "react";
import {
  Play,
  Pause,
  FastForward,
  Rewind,
  Clock,
  Calendar,
  RotateCcw,
  Timer,
} from "lucide-react";
import { useStarTracker, type ClockMode } from "@/lib/store";
import { buildFrame } from "@/lib/astro/engine";
import { formatHMS } from "@/lib/astro/time";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Speed multipliers available for fast-forward / reverse modes. */
const SPEEDS = [1, 60, 600, 3600] as const;

/** Format a Date as the value of an <input type="datetime-local"> (browser-local tz). */
function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function TimeControls() {
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const clockMode = useStarTracker((s) => s.clockMode);
  const timeSpeed = useStarTracker((s) => s.timeSpeed);
  const setClockMode = useStarTracker((s) => s.setClockMode);
  const setTimeSpeed = useStarTracker((s) => s.setTimeSpeed);
  const setCurrentTime = useStarTracker((s) => s.setCurrentTime);
  const resetToNow = useStarTracker((s) => s.resetToNow);

  // Precompute the astronomical frame once per (time, observer) change.
  const frame = useMemo(
    () =>
      buildFrame({
        date: currentTime,
        lat: (observer.latDeg * Math.PI) / 180,
        lon: (observer.lonDeg * Math.PI) / 180,
        elevationM: observer.elevationM,
      }),
    [currentTime, observer.latDeg, observer.lonDeg, observer.elevationM],
  );

  // Observer-timezone date/time string.
  const tzTimeString = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: observer.timezone || "UTC",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(currentTime);
    } catch {
      return currentTime.toUTCString();
    }
  }, [currentTime, observer.timezone]);

  // datetime-local picker: while focused we freeze the displayed value into a
  // local override so live clock ticks don't clobber the user's in-progress
  // edit. While blurred, the value is derived straight from `currentTime`.
  const [dtOverride, setDtOverride] = useState<string | null>(null);
  const dtValue = dtOverride !== null ? dtOverride : toLocalInputValue(currentTime);

  const handleSpeed = (s: number) => {
    setTimeSpeed(s);
    if (clockMode === "realtime" || clockMode === "paused" || clockMode === "custom") {
      setClockMode("fast");
    }
  };

  const handleReverse = () => {
    setClockMode("reverse");
    setTimeSpeed(60);
  };

  const modeActive = (m: ClockMode) => clockMode === m;
  const speedActive = (s: number) =>
    (clockMode === "fast" || clockMode === "reverse") && timeSpeed === s;

  return (
    <>
      {/* Mobile Compact Time Bar (< md) */}
      <div className="flex md:hidden items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1.5 backdrop-blur w-full">
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
          <span className="font-mono text-xs text-slate-100 truncate" suppressHydrationWarning>{tzTimeString}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setClockMode(clockMode === "paused" ? "realtime" : "paused")}
            aria-label={clockMode === "paused" ? "Resume" : "Pause"}
            className={cn(
              "h-7 w-7 p-0 text-slate-200 hover:bg-white/10",
              clockMode === "realtime" && "text-amber-300 bg-amber-400/20"
            )}
          >
            {clockMode === "paused" ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-300" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setClockMode(clockMode === "fast" ? "realtime" : "fast")}
            aria-label="Fast Forward"
            className={cn(
              "h-7 w-7 p-0 text-slate-200 hover:bg-white/10",
              clockMode === "fast" && "text-amber-300 bg-amber-400/20"
            )}
          >
            <FastForward className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={resetToNow}
            aria-label="Reset to Now"
            className="h-7 px-2 text-[11px] text-slate-300 hover:bg-white/10"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Now
          </Button>
        </div>
      </div>

      {/* Desktop Full Time Bar (>= md) */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0">
        {/* Live date / time (observer tz) */}
        <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
          <span className="font-mono text-xs text-slate-100" suppressHydrationWarning>{tzTimeString}</span>
          <span className="text-[10px] text-slate-500">{observer.timezone}</span>
        </div>

        {/* Clock mode controls */}
        <div
          className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/[0.02] p-0.5"
          role="group"
          aria-label="Clock mode"
        >
          <ModeButton
            active={modeActive("realtime")}
            onClick={() => setClockMode("realtime")}
            label="Real-time"
            icon={<Play className="h-3.5 w-3.5" />}
          />
          <ModeButton
            active={modeActive("paused")}
            onClick={() => setClockMode("paused")}
            label="Pause"
            icon={<Pause className="h-3.5 w-3.5" />}
          />
          <ModeButton
            active={modeActive("fast")}
            onClick={() => setClockMode("fast")}
            label="Fast-forward"
            icon={<FastForward className="h-3.5 w-3.5" />}
          />
          <ModeButton
            active={modeActive("reverse")}
            onClick={handleReverse}
            label="Reverse"
            icon={<Rewind className="h-3.5 w-3.5" />}
          />
        </div>

        {/* Speed toggles (apply to fast / reverse) */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Speed</span>
          {SPEEDS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant="ghost"
              onClick={() => handleSpeed(s)}
              aria-pressed={speedActive(s)}
              aria-label={`Set speed ×${s}`}
              className={cn(
                "h-7 px-2 font-mono text-[11px]",
                speedActive(s)
                  ? "bg-amber-400/20 text-amber-200 hover:bg-amber-400/30"
                  : "text-slate-400 hover:bg-white/10 hover:text-slate-200",
              )}
            >
              ×{s}
            </Button>
          ))}
        </div>

        {/* Reset to now */}
        <Button
          size="sm"
          variant="outline"
          onClick={resetToNow}
          className="h-7 gap-1 border-white/15 bg-transparent px-2 text-[11px] text-slate-300 hover:bg-white/10 hover:text-amber-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Now
        </Button>

        {/* Custom datetime picker */}
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden />
          <input
            type="datetime-local"
            value={dtValue}
            onFocus={() => setDtOverride(toLocalInputValue(currentTime))}
            onBlur={() => setDtOverride(null)}
            onChange={(e) => {
              const v = e.target.value;
              setDtOverride(v);
              if (v) {
                const d = new Date(v);
                if (!isNaN(d.getTime())) setCurrentTime(d);
              }
            }}
            aria-label="Custom date and time"
            className="h-7 rounded-md border border-white/15 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-slate-100 outline-none transition-colors focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30 [color-scheme:dark]"
          />
        </div>

        {/* Sidereal readouts */}
        <div className="ml-auto flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-1.5">
          <Timer className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">LST</span>
              <span className="font-mono text-[11px] text-amber-200">
                {formatHMS(frame.lst)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">GMST</span>
              <span className="font-mono text-[11px] text-slate-300">
                {formatHMS(frame.gmst)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 border-l border-white/10 pl-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">JD</span>
              <span className="font-mono text-[11px] text-slate-200">
                {frame.jd.jdUt1.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">ΔT</span>
              <span className="font-mono text-[11px] text-slate-400">
                {frame.jd.deltaT.toFixed(1)}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Compact icon-led mode toggle button with an amber "active" state. */
function ModeButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "h-7 gap-1 px-2 text-[11px]",
        active
          ? "bg-amber-400/20 text-amber-200 hover:bg-amber-400/30"
          : "text-slate-400 hover:bg-white/10 hover:text-slate-200",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
