"use client";

/**
 * FilterPanel — settings panel for sky-catalog filtering.
 *
 * Designed to live inside a Popover/Dialog. Controls:
 *  - Max magnitude slider (0.0–6.5, step 0.1)
 *  - Constellation <Select> populated from the IAU 88 (alphabetical by name)
 *  - Min altitude slider (-90..90, step 1)
 *  - Three toggle switches: Visible only / Circumpolar only / Never-set only
 *  - Reset filters button
 *
 * All controls drive the `filters` slice of the Zustand store.
 */

import {
  Filter,
  RotateCcw,
  Eye,
  Globe2,
  SlidersHorizontal,
} from "lucide-react";
import { useStarTracker, type Filters } from "@/lib/store";
import { CONSTELLATIONS } from "@/data/constellations";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Store defaults — used by the Reset button. */
const DEFAULT_FILTERS: Filters = {
  maxMagnitude: 5.0,
  constellation: "all",
  minAltitude: -90,
  visibleOnly: false,
  circumpolarOnly: false,
  neverSetOnly: false,
};

/** IAU 88 sorted alphabetically by full name (computed once at module load). */
const SORTED_CONSTELLATIONS = [...CONSTELLATIONS].sort((a, b) =>
  a.name.localeCompare(b.name),
);

export function FilterPanel() {
  const filters = useStarTracker((s) => s.filters);
  const setFilters = useStarTracker((s) => s.setFilters);

  // Normalize "" → "all" so the Select always has a valid value.
  const constellationValue = filters.constellation || "all";

  const reset = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-7 gap-1.5 px-2 text-[11px] text-slate-400 hover:bg-white/10 hover:text-slate-100"
        >
          <RotateCcw className="h-3 w-3" />
          Reset filters
        </Button>
      </div>

      <Separator className="bg-white/10" />

      {/* Max magnitude */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-slate-300">
          <SlidersHorizontal className="h-3.5 w-3.5 text-sky-300/80" />
          <span className="flex-1">Magnitude limit</span>
          <span className="font-mono text-amber-300/90">
            Mag ≤ {filters.maxMagnitude.toFixed(1)}
          </span>
        </Label>
        <Slider
          value={[filters.maxMagnitude]}
          min={0}
          max={6.5}
          step={0.1}
          onValueChange={(v) => setFilters({ maxMagnitude: v[0] })}
          aria-label="Maximum magnitude"
          className="[&_[data-slot=slider-range]]:bg-amber-400/70 [&_[data-slot=slider-thumb]]:border-amber-400/60 [&_[data-slot=slider-thumb]]:bg-slate-900 [&_[data-slot=slider-track]]:bg-white/10"
        />
        <div className="flex justify-between font-mono text-[10px] text-slate-600">
          <span>0.0</span>
          <span>6.5</span>
        </div>
      </div>

      {/* Constellation */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-slate-300">
          <Globe2 className="h-3.5 w-3.5 text-sky-300/80" />
          <span className="flex-1">Constellation</span>
        </Label>
        <Select
          value={constellationValue}
          onValueChange={(v) => setFilters({ constellation: v })}
        >
          <SelectTrigger
            size="sm"
            aria-label="Constellation filter"
            className="w-full border-white/10 bg-slate-950/60 text-xs text-slate-200 hover:bg-white/5 focus-visible:border-amber-400/40 focus-visible:ring-amber-400/20"
          >
            <SelectValue placeholder="All constellations" />
          </SelectTrigger>
          <SelectContent className="max-h-72 border-white/10 bg-slate-950/95 text-xs text-slate-200">
            <SelectItem value="all">All constellations</SelectItem>
            {SORTED_CONSTELLATIONS.map((c) => (
              <SelectItem key={c.abbr} value={c.abbr}>
                {c.name} ({c.abbr})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min altitude */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-slate-300">
          <SlidersHorizontal className="h-3.5 w-3.5 text-sky-300/80" />
          <span className="flex-1">Minimum altitude</span>
          <span className="font-mono text-amber-300/90">
            ≥ {filters.minAltitude}°
          </span>
        </Label>
        <Slider
          value={[filters.minAltitude]}
          min={-90}
          max={90}
          step={1}
          onValueChange={(v) => setFilters({ minAltitude: v[0] })}
          aria-label="Minimum altitude"
          className="[&_[data-slot=slider-range]]:bg-amber-400/70 [&_[data-slot=slider-thumb]]:border-amber-400/60 [&_[data-slot=slider-thumb]]:bg-slate-900 [&_[data-slot=slider-track]]:bg-white/10"
        />
        <div className="flex justify-between font-mono text-[10px] text-slate-600">
          <span>−90°</span>
          <span>0°</span>
          <span>+90°</span>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Visibility switches */}
      <div className="flex flex-col gap-2.5">
        <SwitchRow
          icon={<Eye className="h-3.5 w-3.5 text-sky-300/80" />}
          label="Visible only"
          hint="Above horizon"
          checked={filters.visibleOnly}
          onCheckedChange={(b) => setFilters({ visibleOnly: b })}
        />
        <SwitchRow
          icon={<Globe2 className="h-3.5 w-3.5 text-sky-300/80" />}
          label="Circumpolar only"
          hint="Never sets at this latitude"
          checked={filters.circumpolarOnly}
          onCheckedChange={(b) => setFilters({ circumpolarOnly: b })}
        />
        <SwitchRow
          icon={<Globe2 className="h-3.5 w-3.5 text-sky-300/80" />}
          label="Never-set only"
          hint="Permanently below the horizon"
          checked={filters.neverSetOnly}
          onCheckedChange={(b) => setFilters({ neverSetOnly: b })}
        />
      </div>
    </div>
  );
}

function SwitchRow({
  icon,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (b: boolean) => void;
}) {
  return (
    <Label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs text-slate-200 hover:bg-white/[0.05]">
      {icon}
      <div className="flex flex-1 flex-col">
        <span className="leading-tight">{label}</span>
        {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="data-[state=checked]:bg-amber-400/80 data-[state=unchecked]:bg-white/10"
      />
    </Label>
  );
}
