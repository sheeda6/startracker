"use client";

/**
 * ConstellationBrowser — a searchable list of constellations that lets users
 * click to highlight one on the sky map (by selecting its brightest star).
 *
 * Shown inside a popover from the toolbar. Each constellation row shows:
 *  - abbreviation badge
 *  - full name
 *  - hemisphere indicator (N/S/E)
 *  - star count from the catalog
 *  - "visible now" indicator (if any of its stars are above the horizon)
 */

import { useMemo, useState } from "react";
import { useStarTracker } from "@/lib/store";
import { CONSTELLATIONS, CONSTELLATION_LINES } from "@/data/constellations";
import { STARS } from "@/data/stars";
import { buildFrame, transformStar } from "@/lib/astro/engine";
import { Search, Globe2, Star, Eye, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ConstellationBrowser() {
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const setSelectedHip = useStarTracker((s) => s.setSelectedHip);
  const [query, setQuery] = useState("");

  // Precompute per-constellation metadata
  const constellations = useMemo(() => {
    const frame = buildFrame({
      date: currentTime,
      lat: (observer.latDeg * Math.PI) / 180,
      lon: (observer.lonDeg * Math.PI) / 180,
      elevationM: observer.elevationM,
    });
    const latRad = (observer.latDeg * Math.PI) / 180;

    return CONSTELLATIONS.map((c) => {
      const stars = STARS.filter((s) => s.constellation === c.abbr);
      const brightest = stars.length > 0
        ? stars.reduce((a, b) => (a.mag < b.mag ? a : b))
        : null;
      // Check if any star is visible
      let visibleNow = false;
      for (const s of stars) {
        const tr = transformStar(s.ra, s.dec, frame, latRad);
        if (tr.horizontal.alt > 0) {
          visibleNow = true;
          break;
        }
      }
      const hasLines = !!CONSTELLATION_LINES[c.abbr];
      return {
        ...c,
        starCount: stars.length,
        brightest,
        visibleNow,
        hasLines,
      };
    });
  }, [observer, currentTime]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return constellations;
    return constellations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.abbr.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q)
    );
  }, [constellations, query]);

  const handleClick = (abbr: string) => {
    const con = constellations.find((c) => c.abbr === abbr);
    if (con?.brightest) {
      setSelectedHip(con.brightest.hip);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-white/10 bg-slate-950/60 p-3 text-slate-200 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
        <Globe2 className="h-3.5 w-3.5" />
        Constellations
        <Badge variant="outline" className="ml-1 border-white/15 bg-white/5 text-[9px] text-slate-400">
          {filtered.length}
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search constellations..."
          className="h-8 border-white/10 bg-white/5 pl-7 text-xs text-slate-100 placeholder:text-slate-500"
        />
      </div>

      <ScrollArea className="h-[320px] rounded-md border border-white/5">
        <div className="divide-y divide-white/5">
          {filtered.map((c) => (
            <button
              key={c.abbr}
              onClick={() => handleClick(c.abbr)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-white/5"
            >
              <Badge
                variant="outline"
                className={cn(
                  "w-10 shrink-0 justify-center border-white/15 text-[10px] font-mono",
                  c.visibleNow
                    ? "bg-amber-400/15 text-amber-300"
                    : "bg-white/5 text-slate-400"
                )}
              >
                {c.abbr}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-slate-100">
                  {c.name}
                </div>
                <div className="truncate text-[10px] text-slate-500">
                  {c.meaning}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {c.visibleNow && (
                  <Eye className="h-3 w-3 text-emerald-400" />
                )}
                <span className="font-mono text-[10px] text-slate-500">
                  {c.starCount}★
                </span>
                <span
                  className={cn(
                    "rounded px-1 text-[9px] font-bold",
                    c.hemisphere === "N"
                      ? "bg-sky-500/20 text-sky-300"
                      : c.hemisphere === "S"
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  )}
                >
                  {c.hemisphere}
                </span>
                <ChevronRight className="h-3 w-3 text-slate-600" />
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
