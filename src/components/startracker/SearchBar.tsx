"use client";

import { useMemo, useState } from "react";
import { Search, X, Star as StarIcon, Sparkles, Orbit, Telescope, Rocket, Sun } from "lucide-react";
import { useStarTracker } from "@/lib/store";
import { STARS, type Star } from "@/data/stars";
import { ASTEROIDS } from "@/data/asteroids";
import { COMETS } from "@/data/comets";
import { MESSIER } from "@/data/messier";
import { NGC_OBJECTS } from "@/data/ngc";
import { getActiveSatellites } from "@/data/satellites";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SearchItem {
  key: string;
  label: string;
  subLabel: string;
  mag: number; // For sorting
  type: "star" | "planet" | "asteroid" | "comet" | "satellite" | "messier" | "ngc";
  icon: any;
  color: string;
  dispatch: () => void;
}

const PLANETS = [
  { id: "sun", name: "Sun", mag: -26.7 },
  { id: "moon", name: "Moon", mag: -12.7 },
  { id: "mercury", name: "Mercury", mag: -0.5 },
  { id: "venus", name: "Venus", mag: -4.4 },
  { id: "mars", name: "Mars", mag: -1.5 },
  { id: "jupiter", name: "Jupiter", mag: -2.2 },
  { id: "saturn", name: "Saturn", mag: 0.5 },
  { id: "uranus", name: "Uranus", mag: 5.5 },
  { id: "neptune", name: "Neptune", mag: 7.8 },
];

function buildSearchIndex(setSelectedHip: (hip: number) => void, setSelectedBody: (body: string) => void): SearchItem[] {
  const items: SearchItem[] = [];

  // Planets
  for (const p of PLANETS) {
    items.push({
      key: `planet_${p.id}`,
      label: p.name,
      subLabel: "Solar System",
      mag: p.mag,
      type: "planet",
      icon: Sun,
      color: "text-amber-400",
      dispatch: () => setSelectedBody(`planet_${p.id}`),
    });
  }

  // Asteroids
  for (const a of ASTEROIDS) {
    items.push({
      key: `asteroid_${a.name.toLowerCase()}`,
      label: a.name,
      subLabel: `Asteroid · ${a.designation}`,
      mag: a.peakMag,
      type: "asteroid",
      icon: Sparkles,
      color: "text-stone-400",
      dispatch: () => setSelectedBody(`asteroid_${a.name.toLowerCase()}`),
    });
  }

  // Comets
  for (const c of COMETS) {
    items.push({
      key: `comet_${c.id.toLowerCase()}`,
      label: c.name,
      subLabel: `Comet · ${c.id}`,
      mag: c.H || 5, // rough sorting
      type: "comet",
      icon: Sparkles,
      color: "text-teal-300",
      dispatch: () => setSelectedBody(`comet_${c.id.toLowerCase()}`),
    });
  }

  // Satellites
  for (const s of getActiveSatellites()) {
    items.push({
      key: `satellite_${s.id}`,
      label: s.name,
      subLabel: `Satellite · NORAD ${s.id}`,
      mag: -2, // Usually bright / high priority
      type: "satellite",
      icon: Rocket,
      color: "text-sky-300",
      dispatch: () => setSelectedBody(`satellite_${s.id}`),
    });
  }

  // Messier
  for (const m of MESSIER) {
    items.push({
      key: `messier_${m.number}`,
      label: `M${m.number}${m.name ? ` · ${m.name}` : ""}`,
      subLabel: `Deep Sky · ${m.type}`,
      mag: m.magnitude || 8,
      type: "messier",
      icon: Telescope,
      color: "text-indigo-300",
      dispatch: () => setSelectedBody(`messier_${m.number}`),
    });
  }

  // NGC
  for (const n of NGC_OBJECTS) {
    items.push({
      key: `ngc_${n.number}`,
      label: `NGC ${n.number}${n.name ? ` · ${n.name}` : ""}`,
      subLabel: `Deep Sky · ${n.type}`,
      mag: n.magnitude || 10,
      type: "ngc",
      icon: Orbit,
      color: "text-fuchsia-300",
      dispatch: () => setSelectedBody(`ngc_${n.number}`),
    });
  }

  // Stars
  for (const s of STARS) {
    const label = s.name || s.bayer || `HIP ${s.hip}`;
    let subLabel = s.constellation;
    if (s.name && s.bayer) subLabel = s.bayer;
    else if (s.bayer) subLabel = `HIP ${s.hip}`;

    items.push({
      key: `star_${s.hip}`,
      label,
      subLabel,
      mag: s.mag,
      type: "star",
      icon: StarIcon,
      color: "text-amber-200",
      dispatch: () => setSelectedHip(s.hip),
    });
  }

  return items;
}

export function SearchBar() {
  const search = useStarTracker((s) => s.search);
  const setSearch = useStarTracker((s) => s.setSearch);
  const setSelectedHip = useStarTracker((s) => s.setSelectedHip);
  const setSelectedBody = useStarTracker((s) => s.setSelectedBody);
  const setView = useStarTracker((s) => s.setView);
  const [focused, setFocused] = useState(false);

  const q = search.trim().toLowerCase();

  // Re-build index if things change, though mostly static.
  const searchIndex = useMemo(() => buildSearchIndex(setSelectedHip, setSelectedBody), [setSelectedHip, setSelectedBody]);

  const matches = useMemo(() => {
    if (!q) return [];
    return searchIndex
      .filter((item) => {
        return (
          item.label.toLowerCase().includes(q) ||
          item.subLabel.toLowerCase().includes(q) ||
          item.key.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.mag - b.mag);
  }, [q, searchIndex]);

  const topMatches = matches.slice(0, 8);
  const showDropdown = focused && q.length > 0 && topMatches.length > 0;

  const handleReset = () => {
    setSearch("");
  };

  return (
    <div className="flex w-64 flex-col gap-1">
      <Popover
        open={showDropdown}
        onOpenChange={(o) => {
          if (!o) setFocused(false);
        }}
      >
        <PopoverAnchor asChild>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search all objects..."
              aria-label="Search sky"
              spellCheck={false}
              autoComplete="off"
              className="h-8 w-full border-white/10 bg-slate-950/60 pl-8 pr-7 text-xs text-slate-200 placeholder:text-slate-500 focus-visible:border-amber-400/40 focus-visible:ring-amber-400/20"
            />
            {search.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleReset}
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400 hover:bg-white/10 hover:text-slate-100"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="w-64 border-white/10 bg-slate-950/95 p-1 text-slate-200 shadow-xl backdrop-blur-md"
        >
          <div className="max-h-80 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {topMatches.map((item) => (
              <SearchResult
                key={item.key}
                item={item}
                onSelect={() => {
                  item.dispatch();
                  setView({ zoom: Math.min(4, Math.max(2, useStarTracker.getState().view.zoom)) });
                  setFocused(false);
                }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="px-1 text-[11px] text-slate-500">
        {q.length === 0 ? (
          <span className="text-slate-600">
            <span className="font-mono">{searchIndex.length}</span> objects
          </span>
        ) : (
          <span>
            <span
              className={cn(
                "font-mono",
                matches.length > 0 ? "text-amber-300/80" : "text-slate-400",
              )}
            >
              {matches.length}
            </span>{" "}
            {matches.length === 1 ? "match" : "matches"}
          </span>
        )}
      </div>
    </div>
  );
}

function SearchResult({ item, onSelect }: { item: SearchItem; onSelect: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={cn("h-4 w-4 shrink-0", item.color)} />
        <div className="min-w-0">
          <div className="truncate text-xs text-slate-100">{item.label}</div>
          <div className="truncate text-[10px] text-slate-500">{item.subLabel}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-[10px] text-amber-300/80">
          {item.mag !== undefined ? `m${item.mag.toFixed(1)}` : ""}
        </span>
      </div>
    </button>
  );
}
