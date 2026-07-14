"use client";

/**
 * SearchBar — compact star search input for the top toolbar.
 *
 * - Leading Search icon + clear (X) button when text is present.
 * - Instant filtering via `setSearch` in the Zustand store.
 * - Live "N matches" count using the same matching logic as the catalog
 *   filter (case-insensitive substring across name, Bayer, HIP, HD,
 *   Flamsteed, and constellation abbreviation).
 * - Optional Popover dropdown of the top 8 matches when focused; clicking a
 *   row selects that star (sets `selectedHip` and opens the details panel).
 */

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useStarTracker } from "@/lib/store";
import { STARS, type Star } from "@/data/stars";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Display label for a star (preferred name → Bayer → HIP fallback). */
function starLabel(s: Star): string {
  return s.name || s.bayer || `HIP ${s.hip}`;
}

/** Secondary label: shows Bayer if name was used, else HIP id, else constellation. */
function starSubLabel(s: Star): string {
  if (s.name && s.bayer) return s.bayer;
  if (s.bayer) return `HIP ${s.hip}`;
  return s.constellation;
}

/** Case-insensitive substring match across all searchable star fields. */
function matchesQuery(star: Star, q: string): boolean {
  const needle = q.toLowerCase();
  if (needle === "") return false;
  return (
    star.name.toLowerCase().includes(needle) ||
    star.bayer.toLowerCase().includes(needle) ||
    String(star.hip).includes(needle) ||
    (star.hd > 0 && String(star.hd).includes(needle)) ||
    (star.flamsteed > 0 && String(star.flamsteed).includes(needle)) ||
    star.constellation.toLowerCase().includes(needle)
  );
}

export function SearchBar() {
  const search = useStarTracker((s) => s.search);
  const setSearch = useStarTracker((s) => s.setSearch);
  const setSelectedHip = useStarTracker((s) => s.setSelectedHip);
  const setView = useStarTracker((s) => s.setView);
  const [focused, setFocused] = useState(false);

  const q = search.trim();

  // All matches (sorted by brightness) — used for the live count.
  const matches = useMemo(() => {
    if (!q) return [] as Star[];
    return STARS.filter((s) => matchesQuery(s, q)).sort((a, b) => a.mag - b.mag);
  }, [q]);

  const topMatches = matches.slice(0, 8);
  const showDropdown = focused && q.length > 0 && topMatches.length > 0;

  const handleReset = () => {
    setSearch("");
    // keep focus on the input for fast re-typing
  };

  return (
    <div className="flex w-64 flex-col gap-1">
      <Popover
        open={showDropdown}
        onOpenChange={(o) => {
          // Radix fires this on Escape / outside-click; mirror into `focused`
          // so the derived `showDropdown` stays in sync.
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
              placeholder="Search by name, Bayer, HIP, HD, Flamsteed…"
              aria-label="Search stars"
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
                // Prevent input blur so the dropdown state doesn't flicker.
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
          // Keep focus on the input; closing is driven by blur/escape instead.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="w-64 border-white/10 bg-slate-950/95 p-1 text-slate-200 shadow-xl backdrop-blur-md"
        >
          <div
            className="max-h-80 overflow-y-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            {topMatches.map((s) => (
              <SearchResult
                key={s.hip}
                star={s}
                onSelect={() => {
                  setSelectedHip(s.hip);
                  // Zoom in on the star for "go to" effect
                  setView({ zoom: Math.min(4, Math.max(2, useStarTracker.getState().view.zoom)) });
                  setFocused(false);
                }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Live match count */}
      <div className="px-1 text-[11px] text-slate-500">
        {q.length === 0 ? (
          <span className="text-slate-600">
            <span className="font-mono">{STARS.length}</span> stars in catalog
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

function SearchResult({
  star,
  onSelect,
}: {
  star: Star;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      // Prevent the input from blurring so `onClick` fires reliably.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none"
    >
      <div className="min-w-0">
        <div className="truncate text-xs text-slate-100">{starLabel(star)}</div>
        <div className="truncate text-[10px] text-slate-500">
          {starSubLabel(star)}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-[10px] text-amber-300/80">
          m{star.mag.toFixed(1)}
        </span>
        <span className="text-[10px] text-slate-400">{star.constellation}</span>
      </div>
    </button>
  );
}
