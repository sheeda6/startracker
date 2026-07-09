"use client";

/**
 * MagnitudeFilter — compact quick-filter buttons for limiting the star catalog
 * by apparent magnitude.
 *
 * Shows preset buttons: ≤1, ≤2, ≤3, ≤4, ≤5, All. The active filter is
 * highlighted. Drives the `filters.maxMagnitude` slice of the store.
 */

import { useStarTracker } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

const PRESETS = [
  { label: "≤1", value: 1.5, title: "Brightest stars only (mag ≤ 1.5)" },
  { label: "≤2", value: 2.5, title: "Very bright stars (mag ≤ 2.5)" },
  { label: "≤3", value: 3.5, title: "Bright stars (mag ≤ 3.5)" },
  { label: "≤4", value: 4.5, title: "Naked-eye stars (mag ≤ 4.5)" },
  { label: "≤5", value: 5.5, title: "Faint naked-eye (mag ≤ 5.5)" },
  { label: "All", value: 6.5, title: "All catalog stars" },
];

export function MagnitudeFilter() {
  const maxMag = useStarTracker((s) => s.filters.maxMagnitude);
  const setFilters = useStarTracker((s) => s.setFilters);

  return (
    <div className="hidden items-center gap-0.5 rounded-md border border-white/10 bg-white/5 p-0.5 xl:flex" title="Magnitude limit">
      <Star className="mr-1 ml-1 h-3 w-3 text-amber-300/70" />
      {PRESETS.map((p) => {
        const isActive = Math.abs(maxMag - p.value) < 0.01;
        return (
          <button
            key={p.label}
            onClick={() => setFilters({ maxMagnitude: p.value })}
            title={p.title}
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[10px] font-medium transition-colors",
              isActive
                ? "bg-amber-400/80 text-slate-950 shadow-sm"
                : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
            )}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
