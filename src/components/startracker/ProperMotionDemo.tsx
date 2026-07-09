"use client";

/**
 * ProperMotionDemo — animates how constellations change over millennia due
 * to stellar proper motion.
 *
 * Uses a slider (±100,000 years) to show how the Big Dipper, Orion, and
 * other constellation shapes distort over time. The SkyMap reads the
 * `properMotionYear` from the store and applies proper motion corrections
 * to each star's J2000 position before transforming.
 */

import { useState, useEffect } from "react";
import { useStarTracker } from "@/lib/store";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { History, Play, Pause, RotateCcw, FastForward } from "lucide-react";

const PRESETS = [
  { label: "Now", year: 0 },
  { label: "+1k yr", year: 1000 },
  { label: "+10k yr", year: 10000 },
  { label: "+50k yr", year: 50000 },
  { label: "-50k yr", year: -50000 },
];

export function ProperMotionDemo() {
  const properMotionYear = useStarTracker((s) => s.properMotionYear);
  const setProperMotionYear = useStarTracker((s) => s.setProperMotionYear);
  const [animating, setAnimating] = useState(false);
  const [speed, setSpeed] = useState(500); // years per second

  // Animation loop
  useEffect(() => {
    if (!animating) return;
    const interval = setInterval(() => {
      const current = useStarTracker.getState().properMotionYear;
      const next = current + speed * 0.1;
      if (next > 100000) {
        setProperMotionYear(-100000);
      } else {
        setProperMotionYear(next);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [animating, speed, setProperMotionYear]);

  const fmtYear = (y: number) => {
    if (y === 0) return "Now (J2000)";
    if (y > 0) return `+${Math.round(y).toLocaleString()} yr`;
    return `${Math.round(y).toLocaleString()} yr`;
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
        <History className="h-3.5 w-3.5" />
        Proper Motion Time Travel
      </div>
      <div className="text-[10px] text-slate-500">
        See how constellations change over millennia as stars move through space
      </div>

      {/* Current year display */}
      <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Epoch</span>
        <span className="font-mono text-sm text-amber-300">{fmtYear(properMotionYear)}</span>
      </div>

      {/* Slider */}
      <div>
        <Slider
          value={[properMotionYear]}
          min={-100000}
          max={100000}
          step={100}
          onValueChange={(v) => setProperMotionYear(v[0])}
          aria-label="Proper motion year"
          className="[&_[data-slot=slider-range]]:bg-amber-400/70 [&_[data-slot=slider-thumb]]:border-amber-400/60 [&_[data-slot=slider-thumb]]:bg-slate-900 [&_[data-slot=slider-track]]:bg-white/10"
        />
        <div className="flex justify-between font-mono text-[10px] text-slate-600">
          <span>-100k yr</span>
          <span>Now</span>
          <span>+100k yr</span>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setProperMotionYear(p.year)}
            className={`rounded border px-2 py-1 text-[10px] font-medium transition-colors ${
              Math.abs(properMotionYear - p.year) < 50
                ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Animation controls */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAnimating(!animating)}
          className="h-7 flex-1 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
        >
          {animating ? <Pause className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}
          {animating ? "Pause" : "Animate"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSpeed(speed === 500 ? 5000 : 500)}
          className="h-7 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          title="Toggle animation speed"
        >
          <FastForward className="h-3 w-3" />
          <span className="ml-1 text-[10px]">{speed === 500 ? "1×" : "10×"}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setProperMotionYear(0); setAnimating(false); }}
          className="h-7 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      {/* Educational note */}
      <div className="rounded-md border border-sky-400/20 bg-sky-400/[0.05] px-2.5 py-2 text-[10px] leading-relaxed text-slate-300">
        Stars move at different velocities relative to the Sun. Over 50,000+ years,
        familiar constellations like the Big Dipper become unrecognizable. The
        fastest-moving naked-eye star is Barnard's Star (10.3″/yr).
      </div>
    </div>
  );
}
