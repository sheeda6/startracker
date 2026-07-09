"use client";

/**
 * StarTracker main page.
 *
 * Layout:
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  Top toolbar: logo · search · filter · layers · observer │
 *  │  Time controls strip                                    │
 *  ├──────────────────────────────────┬──────────────────────┤
 *  │                                  │                      │
 *  │           Sky Map (canvas)       │   Star Details       │
 *  │                                  │   (right panel)      │
 *  │                                  │                      │
 *  ├──────────────────────────────────┴──────────────────────┤
 *  │  Star Catalog Table (bottom panel, collapsible)         │
 *  ├─────────────────────────────────────────────────────────┤
 *  │  Footer (sticky)                                        │
 *  └─────────────────────────────────────────────────────────┘
 */

import { useState } from "react";
import { SkyMap } from "@/components/startracker/SkyMap";
import { StarDetails } from "@/components/startracker/StarDetails";
import { StarTable } from "@/components/startracker/StarTable";
import { TimeControls } from "@/components/startracker/TimeControls";
import { ObserverPanel } from "@/components/startracker/ObserverPanel";
import { SearchBar } from "@/components/startracker/SearchBar";
import { FilterPanel } from "@/components/startracker/FilterPanel";
import { LayersPanel } from "@/components/startracker/LayersPanel";
import { useStarTracker } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Telescope,
  SlidersHorizontal,
  Layers,
  MapPin,
  PanelRightOpen,
  PanelRightClose,
  PanelBottomOpen,
  PanelBottomClose,
  Github,
  Satellite,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const rightPanelOpen = useStarTracker((s) => s.rightPanelOpen);
  const setRightPanelOpen = useStarTracker((s) => s.setRightPanelOpen);
  const bottomPanelOpen = useStarTracker((s) => s.bottomPanelOpen);
  const setBottomPanelOpen = useStarTracker((s) => s.setBottomPanelOpen);
  const selectedHip = useStarTracker((s) => s.selectedHip);
  const observer = useStarTracker((s) => s.observer);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* ─── Top Toolbar ─────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/10 bg-slate-950/85 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          {/* Logo + title */}
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 shadow-lg shadow-amber-500/20">
              <Telescope className="h-4 w-4 text-slate-950" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-sky-300 shadow-[0_0_6px] shadow-sky-300" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-slate-50">
                Star<span className="text-amber-300">Tracker</span>
              </div>
              <div className="hidden text-[10px] text-slate-500 sm:block">
                Real-Time Astronomical Sky Tracker
              </div>
            </div>
          </div>

          <div className="mx-1 hidden h-6 w-px bg-white/10 md:block" />

          {/* Search */}
          <SearchBar />

          <div className="flex-1" />

          {/* Settings popovers */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 border-white/10 bg-slate-950/95 p-0 text-slate-200 backdrop-blur-md"
              align="end"
              sideOffset={6}
            >
              <FilterPanel />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <Layers className="mr-1.5 h-3.5 w-3.5" />
                Layers
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 border-white/10 bg-slate-950/95 p-0 text-slate-200 backdrop-blur-md"
              align="end"
              sideOffset={6}
            >
              <LayersPanel />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Location</span>
                <span className="sm:hidden">Loc</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 border-white/10 bg-slate-950/95 p-0 text-slate-200 backdrop-blur-md"
              align="end"
              sideOffset={6}
            >
              <ObserverPanel />
            </PopoverContent>
          </Popover>

          <div className="mx-0.5 hidden h-6 w-px bg-white/10 md:block" />

          {/* Panel toggles */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-slate-100"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            aria-label={rightPanelOpen ? "Hide details panel" : "Show details panel"}
          >
            {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-slate-100"
            onClick={() => setBottomPanelOpen(!bottomPanelOpen)}
            aria-label={bottomPanelOpen ? "Hide star table" : "Show star table"}
          >
            {bottomPanelOpen ? <PanelBottomClose className="h-4 w-4" /> : <PanelBottomOpen className="h-4 w-4" />}
          </Button>
        </div>

        {/* Time controls strip */}
        <div className="border-t border-white/5 px-3 py-1.5">
          <TimeControls />
        </div>
      </header>

      {/* ─── Main content ─────────────────────────────────────── */}
      <main className="flex flex-1 flex-col gap-2 p-2 min-h-0">
        {/* Sky map + details row */}
        <div className="flex flex-1 gap-2 min-h-0">
          {/* Sky map */}
          <section
            className="relative flex-1 min-w-0 rounded-lg border border-white/10 bg-slate-950"
            aria-label="Sky map"
          >
            <SkyMap />
            {/* Observer badge overlay */}
            <div className="pointer-events-none absolute left-3 bottom-3 rounded-md border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-[10px] text-slate-300 backdrop-blur">
              <div className="flex items-center gap-1.5">
                <Satellite className="h-3 w-3 text-amber-300" />
                <span className="font-mono">
                  {observer.latDeg >= 0 ? "N" : "S"} {Math.abs(observer.latDeg).toFixed(2)}° ·{" "}
                  {observer.lonDeg >= 0 ? "E" : "W"} {Math.abs(observer.lonDeg).toFixed(2)}°
                </span>
              </div>
              {observer.label && (
                <div className="mt-0.5 truncate text-[9px] text-slate-500 max-w-[200px]">
                  {observer.label}
                </div>
              )}
            </div>
            {/* Legend overlay */}
            <div className="pointer-events-none absolute right-3 bottom-3 rounded-md border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-[10px] text-slate-300 backdrop-blur">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-sky-300" />
                <span>Click stars to inspect</span>
              </div>
            </div>
          </section>

          {/* Details panel */}
          {rightPanelOpen && (
            <aside
              className={`shrink-0 ${selectedHip ? "w-[340px]" : "w-[300px]"} hidden md:block`}
              aria-label="Star details"
            >
              {selectedHip ? (
                <StarDetails />
              ) : (
                <EmptyDetails />
              )}
            </aside>
          )}
        </div>

        {/* Bottom table */}
        {bottomPanelOpen && (
          <section
            className="h-[220px] shrink-0"
            aria-label="Star catalog table"
          >
            <StarTable />
          </section>
        )}
      </main>

      {/* Mobile details drawer */}
      {!rightPanelOpen && selectedHip && (
        <Sheet open={true} onOpenChange={() => setRightPanelOpen(true)}>
          <SheetTrigger asChild>
            <Button
              className="fixed right-3 bottom-3 z-40 h-12 w-12 rounded-full bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 hover:bg-amber-300 md:hidden"
              size="icon"
              aria-label="Open star details"
            >
              <Telescope className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full border-white/10 bg-slate-950 p-0 sm:w-[400px]">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle className="text-slate-100">Star Details</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-80px)] p-2">
              <StarDetails />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ─── Footer (sticky) ─────────────────────────────────── */}
      <footer className="shrink-0 border-t border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Telescope className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold text-slate-300">StarTracker</span>
              <Badge variant="outline" className="ml-1 border-white/15 bg-white/5 text-[9px] text-slate-400">
                v1.0
              </Badge>
            </span>
            <span className="hidden text-slate-600 sm:inline">·</span>
            <span className="hidden sm:inline">
              IAU 2006 precession · IAU 2000B nutation · Bennett refraction
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline">
              Hipparcos catalog · ~270 bright stars
            </span>
            <span className="text-slate-600">·</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-slate-200"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Source</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Placeholder shown in the details panel when no star is selected. */
function EmptyDetails() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/10 bg-slate-950/50 p-6 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900">
        <Telescope className="h-6 w-6 text-amber-300/70" />
        <span className="absolute inset-0 animate-ping rounded-full border border-amber-300/30" />
      </div>
      <div>
        <div className="text-sm font-medium text-slate-200">No star selected</div>
        <div className="mt-1 max-w-[220px] text-xs text-slate-500">
          Click any star on the sky map — or any row in the catalog table — to inspect its full coordinates, rise/transit/set times, and altitude curve.
        </div>
      </div>
    </div>
  );
}
