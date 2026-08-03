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

import { useState, useEffect, useRef, useCallback } from "react";
import { SkyMap } from "@/components/startracker/SkyMap";
import { StarDetails } from "@/components/startracker/StarDetails";
import { StarTable } from "@/components/startracker/StarTable";
import { TimeControls } from "@/components/startracker/TimeControls";
import { ObserverPanel } from "@/components/startracker/ObserverPanel";
import { SearchBar } from "@/components/startracker/SearchBar";
import { FilterPanel } from "@/components/startracker/FilterPanel";
import { LayersPanel } from "@/components/startracker/LayersPanel";
import { SkySummaryPanel } from "@/components/startracker/SkySummaryPanel";
import { ConstellationBrowser } from "@/components/startracker/ConstellationBrowser";
import { MagnitudeFilter } from "@/components/startracker/MagnitudeFilter";
import { SkyTour } from "@/components/startracker/SkyTour";
import { MeasureOverlay } from "@/components/startracker/MeasureOverlay";
import { ObservingConditions } from "@/components/startracker/ObservingConditions";
import { CompassControl } from "@/components/startracker/CompassControl";
import { TimeJump } from "@/components/startracker/TimeJump";
import { TonightAtAGlance } from "@/components/startracker/TonightAtAGlance";
import { ProperMotionDemo } from "@/components/startracker/ProperMotionDemo";
import { SettingsExport, loadConfigFromHash } from "@/components/startracker/SettingsExport";
import { MoonPhasesCalendar } from "@/components/startracker/MoonPhasesCalendar";
import { SolarBodyDetails } from "@/components/startracker/SolarBodyDetails";
import { AsteroidDetails } from "@/components/startracker/AsteroidDetails";
import { CometDetails } from "@/components/startracker/CometDetails";
import { SatelliteDetails } from "@/components/startracker/SatelliteDetails";
import { DSODetails } from "@/components/startracker/DSODetails";
import { LightPollutionPanel } from "@/components/startracker/LightPollutionPanel";
import { WeatherPanel } from "@/components/startracker/WeatherPanel";
import { VisibilityPanel } from "@/components/startracker/VisibilityPanel";
import { useStarTracker } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Keyboard,
  MoonStar,
  Ruler,
  Calendar,
  TrendingUp,
  History,
  Share2,
  CalendarDays,
  Cloud,
  CloudSun,
  Eye,
  MoreHorizontal,
  ChevronRight,
  Menu,
  Table,
} from "lucide-react";

export default function Home() {
  const rightPanelOpen = useStarTracker((s) => s.rightPanelOpen);
  const setRightPanelOpen = useStarTracker((s) => s.setRightPanelOpen);
  const bottomPanelOpen = useStarTracker((s) => s.bottomPanelOpen);
  const setBottomPanelOpen = useStarTracker((s) => s.setBottomPanelOpen);
  const selectedHip = useStarTracker((s) => s.selectedHip);
  const setSelectedHip = useStarTracker((s) => s.setSelectedHip);
  const selectedBody = useStarTracker((s) => s.selectedBody);
  const setSelectedBody = useStarTracker((s) => s.setSelectedBody);
  const observer = useStarTracker((s) => s.observer);
  const clockMode = useStarTracker((s) => s.clockMode);
  const setClockMode = useStarTracker((s) => s.setClockMode);
  const setCurrentTime = useStarTracker((s) => s.setCurrentTime);
  const resetToNow = useStarTracker((s) => s.resetToNow);
  const nightMode = useStarTracker((s) => s.nightMode);
  const setNightMode = useStarTracker((s) => s.setNightMode);
  const measureMode = useStarTracker((s) => s.measureMode);
  const setMeasureMode = useStarTracker((s) => s.setMeasureMode);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeToolPanel, setActiveToolPanel] = useState<string | null>(null);

  // Tool panel map
  type ToolPanelKey = "moonCalendar" | "topTargets" | "constellations" | "timeJump" | "timeTravel" | "observing" | "skyGlow" | "weather" | "visibility" | "share";
  const toolPanelContent: Record<ToolPanelKey, React.ReactNode> = {
    moonCalendar: <MoonPhasesCalendar />,
    topTargets: <TonightAtAGlance />,
    constellations: <ConstellationBrowser />,
    timeJump: <TimeJump />,
    timeTravel: <ProperMotionDemo />,
    observing: <ObservingConditions />,
    skyGlow: <LightPollutionPanel />,
    weather: <WeatherPanel />,
    visibility: <VisibilityPanel />,
    share: <SettingsExport />,
  };
  const toolPanelLabel: Record<ToolPanelKey, string> = {
    moonCalendar: "Moon Calendar",
    topTargets: "Top Targets Tonight",
    constellations: "Constellations",
    timeJump: "Time Jump",
    timeTravel: "Time Travel (Stars)",
    observing: "Observing Conditions",
    skyGlow: "Sky Glow / Light Pollution",
    weather: "Weather",
    visibility: "Visibility",
    share: "Share / Export",
  };
  const openTool = (key: string) => setActiveToolPanel(activeToolPanel === key ? null : key);

  // Load shared config from URL hash on mount
  useEffect(() => {
    loadConfigFromHash();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setClockMode(clockMode === "paused" ? "realtime" : "paused");
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentTime(new Date(useStarTracker.getState().currentTime.getTime() + (e.shiftKey ? 3600000 : 60000)));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCurrentTime(new Date(useStarTracker.getState().currentTime.getTime() - (e.shiftKey ? 3600000 : 60000)));
          break;
        case "n": case "N":
          resetToNow();
          break;
        case "f": case "F":
          setClockMode("fast");
          break;
        case "r": case "R":
          setClockMode("reverse");
          break;
        case "Escape":
          setSelectedHip(null);
          setMeasureMode(false);
          break;
        case "d": case "D":
          setMeasureMode(!useStarTracker.getState().measureMode);
          break;
        case "?":
          setShowShortcuts((v) => !v);
          break;
        case "m": case "M":
          setNightMode(!nightMode);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clockMode, setClockMode, setCurrentTime, resetToNow, setSelectedHip, nightMode, setNightMode, setMeasureMode]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* ─── Top Toolbar ─────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/10 bg-slate-950/85 backdrop-blur-md">
        {/* Main toolbar row */}
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          {/* Logo */}
          <div className="flex shrink-0 items-center gap-2 mr-1">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 shadow-lg shadow-amber-500/20">
              <Telescope className="h-3.5 w-3.5 text-slate-950" />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300 shadow-[0_0_6px] shadow-sky-300" />
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-semibold tracking-tight text-slate-50">
                Star<span className="text-amber-300">Tracker</span>
              </div>
            </div>
          </div>

          <div className="hidden h-5 w-px shrink-0 bg-white/10 sm:block" />

          {/* Search — grows to fill available space */}
          <div className="min-w-0 flex-1">
            <SearchBar />
          </div>

          {/* Magnitude quick-filter (desktop) */}
          <div className="hidden shrink-0 md:block">
            <MagnitudeFilter />
          </div>

          {/* Mobile Menu Sheet trigger (< md) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 md:hidden gap-1 px-2 text-slate-300 hover:bg-white/10 hover:text-white"
                title="Menu & Tools"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-xs border-white/10 bg-slate-950/95 text-slate-100 p-4 overflow-y-auto">
              <SheetHeader className="p-0 mb-4 border-b border-white/10 pb-3">
                <SheetTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Telescope className="h-4 w-4 text-amber-400" /> StarTracker Menu
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-4 text-xs">
                {/* Magnitude filter */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Magnitude Limit</span>
                  <MagnitudeFilter />
                </div>

                {/* Primary Controls */}
                <div className="grid grid-cols-3 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 justify-center gap-1 text-xs border-white/10 bg-white/5">
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 border-white/10 bg-slate-950/95 p-0 text-slate-200" align="start">
                      <FilterPanel />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 justify-center gap-1 text-xs border-white/10 bg-white/5">
                        <Layers className="h-3.5 w-3.5" /> Layers
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 border-white/10 bg-slate-950/95 p-0 text-slate-200" align="start">
                      <LayersPanel />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 justify-center gap-1 text-xs border-white/10 bg-white/5">
                        <MapPin className="h-3.5 w-3.5" /> Location
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 border-white/10 bg-slate-950/95 p-0 text-slate-200" align="start">
                      <ObserverPanel />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Tools section */}
                <div className="flex flex-col gap-1 pt-2 border-t border-white/10">
                  <span className="text-[10px] uppercase font-mono text-slate-400 mb-1">Observatory Tools</span>
                  <Button variant="ghost" size="sm" onClick={() => openTool("moonCalendar")} className="justify-start gap-2 h-8 text-xs text-slate-300">
                    <CalendarDays className="h-3.5 w-3.5 text-sky-300" /> Moon Calendar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openTool("topTargets")} className="justify-start gap-2 h-8 text-xs text-slate-300">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-300" /> Top Targets Tonight
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openTool("constellations")} className="justify-start gap-2 h-8 text-xs text-slate-300">
                    <Sparkles className="h-3.5 w-3.5 text-violet-300" /> Constellations
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openTool("timeJump")} className="justify-start gap-2 h-8 text-xs text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-emerald-300" /> Time Jump
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openTool("timeTravel")} className="justify-start gap-2 h-8 text-xs text-slate-300">
                    <History className="h-3.5 w-3.5 text-rose-300" /> Time Travel (Stars)
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openTool("observing")} className="justify-start gap-2 h-8 text-xs text-slate-300">
                    <Telescope className="h-3.5 w-3.5 text-slate-300" /> Observing Conditions
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openTool("skyGlow")} className="justify-start gap-2 h-8 text-xs text-slate-300">
                    <Cloud className="h-3.5 w-3.5 text-sky-300" /> Sky Glow / Light Pollution
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openTool("weather")} className="justify-start gap-2 h-8 text-xs text-slate-300">
                    <CloudSun className="h-3.5 w-3.5 text-amber-300" /> Weather Forecast
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openTool("visibility")} className="justify-start gap-2 h-8 text-xs text-slate-300">
                    <Eye className="h-3.5 w-3.5 text-emerald-300" /> Object Visibility
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openTool("share")} className="justify-start gap-2 h-8 text-xs text-slate-300">
                    <Share2 className="h-3.5 w-3.5 text-slate-300" /> Share & Export
                  </Button>
                </div>

                {/* View Options */}
                <div className="flex items-center justify-around gap-2 pt-2 border-t border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-8 gap-1 text-xs", measureMode ? "bg-sky-500/20 text-sky-300" : "text-slate-400")}
                    onClick={() => setMeasureMode(!measureMode)}
                  >
                    <Ruler className="h-3.5 w-3.5" /> Measure
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-8 gap-1 text-xs", nightMode ? "bg-red-500/20 text-red-300" : "text-slate-400")}
                    onClick={() => setNightMode(!nightMode)}
                  >
                    <MoonStar className="h-3.5 w-3.5" /> Night Mode
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs text-slate-400"
                    onClick={() => setShowShortcuts(true)}
                  >
                    <Keyboard className="h-3.5 w-3.5" /> Shortcuts
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden h-5 w-px shrink-0 bg-white/10 md:block" />

          {/* ── Always-visible desktop tools (>= md) ── */}
          <div className="hidden md:flex items-center gap-1.5">

          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 gap-1.5 px-2.5 text-slate-300 hover:bg-white/10 hover:text-white"
                title="Filters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden lg:inline text-xs">Filters</span>
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

          {/* Layers */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 gap-1.5 px-2.5 text-slate-300 hover:bg-white/10 hover:text-white"
                title="Sky layers"
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden lg:inline text-xs">Layers</span>
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

          {/* Location */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 gap-1.5 px-2.5 text-slate-300 hover:bg-white/10 hover:text-white"
                title="Observer location"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="hidden lg:inline text-xs">Location</span>
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

          {/* ── "Tools" overflow dropdown for secondary features ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 shrink-0 gap-1.5 px-2.5 hover:bg-white/10 ${
                  activeToolPanel ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"
                }`}
                title="More tools"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-xs">Tools</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 border-white/10 bg-slate-950/95 text-slate-200 backdrop-blur-md"
              align="end"
              sideOffset={6}
            >
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500">Observatory</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openTool("moonCalendar")} className={activeToolPanel === "moonCalendar" ? "bg-white/10" : ""}>
                <CalendarDays className="mr-2 h-3.5 w-3.5 text-sky-300" />
                Moon Calendar
                <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTool("topTargets")} className={activeToolPanel === "topTargets" ? "bg-white/10" : ""}>
                <TrendingUp className="mr-2 h-3.5 w-3.5 text-amber-300" />
                Top Targets Tonight
                <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTool("constellations")} className={activeToolPanel === "constellations" ? "bg-white/10" : ""}>
                <Sparkles className="mr-2 h-3.5 w-3.5 text-violet-300" />
                Constellations
                <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500">Time</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openTool("timeJump")} className={activeToolPanel === "timeJump" ? "bg-white/10" : ""}>
                <Calendar className="mr-2 h-3.5 w-3.5 text-emerald-300" />
                Time Jump
                <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTool("timeTravel")} className={activeToolPanel === "timeTravel" ? "bg-white/10" : ""}>
                <History className="mr-2 h-3.5 w-3.5 text-rose-300" />
                Time Travel (Stars)
                <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500">Conditions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openTool("observing")} className={activeToolPanel === "observing" ? "bg-white/10" : ""}>
                <Telescope className="mr-2 h-3.5 w-3.5 text-slate-300" />
                Observing Conditions
                <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTool("skyGlow")} className={activeToolPanel === "skyGlow" ? "bg-white/10" : ""}>
                <Cloud className="mr-2 h-3.5 w-3.5 text-sky-300" />
                Sky Glow / Light Pollution
                <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTool("weather")} className={activeToolPanel === "weather" ? "bg-white/10" : ""}>
                <CloudSun className="mr-2 h-3.5 w-3.5 text-amber-300" />
                Weather
                <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTool("visibility")} className={activeToolPanel === "visibility" ? "bg-white/10" : ""}>
                <Eye className="mr-2 h-3.5 w-3.5 text-emerald-300" />
                Visibility
                <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={() => openTool("share")} className={activeToolPanel === "share" ? "bg-white/10" : ""}>
                <Share2 className="mr-2 h-3.5 w-3.5 text-slate-300" />
                Share / Export
                <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden h-5 w-px shrink-0 bg-white/10 sm:block" />

          {/* ── Icon-only utility buttons ── */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-slate-400 hover:bg-white/10 hover:text-slate-100"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            aria-label={rightPanelOpen ? "Hide details panel" : "Show details panel"}
            title={rightPanelOpen ? "Hide details panel" : "Show details panel"}
          >
            {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-slate-400 hover:bg-white/10 hover:text-slate-100"
            onClick={() => setBottomPanelOpen(!bottomPanelOpen)}
            aria-label={bottomPanelOpen ? "Hide star table" : "Show star table"}
            title={bottomPanelOpen ? "Hide star table" : "Show star table"}
          >
            {bottomPanelOpen ? <PanelBottomClose className="h-4 w-4" /> : <PanelBottomOpen className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 shrink-0 hover:bg-white/10 ${
              measureMode ? "bg-sky-500/20 text-sky-300 hover:text-sky-200" : "text-slate-400 hover:text-slate-100"
            }`}
            onClick={() => setMeasureMode(!measureMode)}
            aria-label="Toggle measure mode"
            title="Measure angular distance (D)"
          >
            <Ruler className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 shrink-0 hover:bg-white/10 ${
              nightMode ? "bg-red-500/20 text-red-300 hover:text-red-200" : "text-slate-400 hover:text-slate-100"
            }`}
            onClick={() => setNightMode(!nightMode)}
            aria-label="Toggle night mode"
            title="Night mode — red theme for dark adaptation (M)"
          >
            <MoonStar className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-slate-400 hover:bg-white/10 hover:text-slate-100"
            onClick={() => setShowShortcuts(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          </div>
        </div>

        {/* Time controls strip */}
        <div className="border-t border-white/5 px-3 py-1.5">
          <TimeControls />
        </div>
      </header>

      {/* ─── Main content ─────────────────────────────────────── */}
      <main className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <ResizableLayout
          activeToolPanel={activeToolPanel}
          toolPanelLabel={toolPanelLabel}
          toolPanelContent={toolPanelContent}
          setActiveToolPanel={setActiveToolPanel}
          rightPanelOpen={rightPanelOpen}
          bottomPanelOpen={bottomPanelOpen}
          selectedHip={selectedHip}
          selectedBody={selectedBody}
          observer={observer}
        />
      </main>


      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-slate-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
                <Keyboard className="h-4 w-4 text-amber-300" />
                Keyboard Shortcuts
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-slate-400 hover:text-slate-100"
                onClick={() => setShowShortcuts(false)}
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { keys: ["Space"], desc: "Pause / resume time" },
                { keys: ["F"], desc: "Fast-forward" },
                { keys: ["R"], desc: "Reverse time" },
                { keys: ["N"], desc: "Reset to now" },
                { keys: ["←", "→"], desc: "Step backward / forward 1 min" },
                { keys: ["Shift+←", "Shift+→"], desc: "Step backward / forward 1 hour" },
                { keys: ["Esc"], desc: "Deselect + exit measure mode" },
                { keys: ["D"], desc: "Toggle measure mode" },
                { keys: ["M"], desc: "Toggle night mode (red)" },
                { keys: ["?"], desc: "Toggle this help" },
              ].map(({ keys, desc }) => (
                <div key={desc} className="flex items-center justify-between gap-3 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                  <span className="text-slate-300">{desc}</span>
                  <div className="flex gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Show welcome button */}
            <button
              onClick={() => { try { localStorage.removeItem("startracker-welcome-seen"); } catch {} window.location.reload(); }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] py-2 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
            >
              <Telescope className="h-3.5 w-3.5" />
              Show welcome guide
            </button>
          </div>
        </div>
      )}

      {/* Mobile details drawer */}
      {!rightPanelOpen && (selectedHip || selectedBody) && (
        <Sheet open={true} onOpenChange={() => setRightPanelOpen(true)}>
          <SheetTrigger asChild>
            <Button
              className="fixed right-3 bottom-3 z-40 h-12 w-12 rounded-full bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 hover:bg-amber-300 md:hidden"
              size="icon"
              aria-label="Open target details"
            >
              <Telescope className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full border-white/10 bg-slate-950 p-0 sm:w-[400px]">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle className="text-slate-100">Target Details</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-80px)] p-2">
              {selectedBody ? (
                selectedBody.startsWith("asteroid_") ? <AsteroidDetails /> :
                selectedBody.startsWith("messier_") || selectedBody.startsWith("ngc_") ? <DSODetails /> :
                <SolarBodyDetails />
              ) : <StarDetails />}
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
            <button
              onClick={() => setShowShortcuts(true)}
              className="hidden items-center gap-1 text-slate-500 transition-colors hover:text-slate-300 md:flex"
            >
              <Keyboard className="h-3 w-3" />
              <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[9px]">?</kbd>
              <span className="text-[10px]">Shortcuts</span>
            </button>
            <span className="hidden text-slate-600 md:inline">·</span>
            <span className="hidden md:inline">
              Hipparcos catalog · ~270 bright stars · Sun/Moon/planets
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

// ─── Custom drag-resize handle ────────────────────────────────────────────────

interface DragHandleProps {
  direction: "horizontal" | "vertical";
  onDrag: (delta: number) => void;
}

function DragHandle({ direction, onDrag }: DragHandleProps) {
  const isVertical = direction === "vertical";

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startPos = isVertical ? e.clientY : e.clientX;

      const onMove = (ev: MouseEvent) => {
        const delta = (isVertical ? ev.clientY : ev.clientX) - startPos;
        onDrag(delta);
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = isVertical ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [isVertical, onDrag]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const startPos = isVertical ? t.clientY : t.clientX;

      const onTouchMove = (ev: TouchEvent) => {
        if (ev.touches.length !== 1) return;
        const touch = ev.touches[0];
        const delta = (isVertical ? touch.clientY : touch.clientX) - startPos;
        onDrag(delta);
      };

      const onTouchEnd = () => {
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        document.body.style.userSelect = "";
      };

      document.body.style.userSelect = "none";
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onTouchEnd);
    },
    [isVertical, onDrag]
  );

  if (isVertical) {
    return (
      <div
        className="group relative h-1.5 shrink-0 cursor-row-resize bg-white/5 transition-colors hover:bg-amber-400/30 active:bg-amber-400/50"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        aria-label="Drag to resize"
      >
        <div className="absolute inset-x-0 top-1/2 mx-auto h-0.5 w-12 -translate-y-1/2 rounded-full bg-white/20 transition-colors group-hover:bg-amber-400/60" />
      </div>
    );
  }
  return (
    <div
      className="group relative w-1.5 shrink-0 cursor-col-resize bg-white/5 transition-colors hover:bg-amber-400/30 active:bg-amber-400/50"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      aria-label="Drag to resize"
    >
      <div className="absolute inset-y-0 left-1/2 top-1/2 my-auto h-12 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 transition-colors group-hover:bg-amber-400/60" />
    </div>
  );
}

// ─── Resizable main layout ────────────────────────────────────────────────────

interface ResizableLayoutProps {
  activeToolPanel: string | null;
  toolPanelLabel: Record<string, string>;
  toolPanelContent: Record<string, React.ReactNode>;
  setActiveToolPanel: (v: string | null) => void;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  selectedHip: number | null;
  selectedBody: string | null;
  observer: { latDeg: number; lonDeg: number; label?: string };
}

function ResizableLayout({
  activeToolPanel,
  toolPanelLabel,
  toolPanelContent,
  setActiveToolPanel,
  rightPanelOpen,
  bottomPanelOpen,
  selectedHip,
  selectedBody,
  observer,
}: ResizableLayoutProps) {
  // px heights / widths — stored in state so that layout re-renders correctly
  const [toolH, setToolH] = useState(220);
  const [tableH, setTableH] = useState(220);
  const [detailsW, setDetailsW] = useState(320);

  // Refs to track current sizes during drag without stale closures
  const toolHRef = useRef(toolH);
  const tableHRef = useRef(tableH);
  const detailsWRef = useRef(detailsW);
  useEffect(() => { toolHRef.current = toolH; }, [toolH]);
  useEffect(() => { tableHRef.current = tableH; }, [tableH]);
  useEffect(() => { detailsWRef.current = detailsW; }, [detailsW]);

  const onToolDrag = useCallback((delta: number) => {
    setToolH((h) => Math.min(500, Math.max(80, h + delta)));
  }, []);

  const onTableDrag = useCallback((delta: number) => {
    setTableH((h) => Math.min(500, Math.max(80, h - delta)));
  }, []);

  const onDetailsDrag = useCallback((delta: number) => {
    setDetailsW((w) => Math.min(600, Math.max(180, w - delta)));
  }, []);

  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [mobileTableOpen, setMobileTableOpen] = useState(false);

  // Auto-open mobile details sheet when a target/star is selected on mobile
  useEffect(() => {
    if (selectedHip !== null || selectedBody !== null) {
      setMobileDetailsOpen(true);
    }
  }, [selectedHip, selectedBody]);

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden p-1 gap-0">

      {/* ── Tool panel (resizable height) ── */}
      {activeToolPanel && (
        <>
          <div
            className="shrink-0 flex flex-col border border-white/10 rounded-lg bg-slate-950/95 backdrop-blur-md mb-0"
            style={{ height: toolH, minHeight: 80 }}
          >
            {/* Title bar */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-2">
              <span className="text-xs font-medium text-slate-300">
                {toolPanelLabel[activeToolPanel]}
              </span>
              <button
                className="h-6 w-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors text-sm"
                onClick={() => setActiveToolPanel(null)}
                aria-label="Close tool panel"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {toolPanelContent[activeToolPanel]}
            </div>
          </div>
          <DragHandle direction="vertical" onDrag={onToolDrag} />
        </>
      )}

      {/* ── Sky map row + star table (vertical) ── */}
      <div className="flex flex-1 flex-col min-h-0 gap-0">

        {/* ── Sky map + details panel (horizontal) ── */}
        <div className="flex flex-1 min-h-0 gap-0">

          {/* Sky map */}
          <section
            className="relative flex-1 min-w-0 rounded-lg border border-white/10 bg-slate-950 m-0.5"
            aria-label="Sky map"
          >
            <SkyMap />
            <SkySummaryPanel />
            <SkyTour />
            <MeasureOverlay />
            <CompassControl />
            {/* Observer badge */}
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

            {/* Mobile Floating Action Bar (< md) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 md:hidden flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/90 px-3 py-1.5 shadow-2xl backdrop-blur-md">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 px-3 rounded-full text-xs font-medium transition-colors",
                  (selectedHip || selectedBody)
                    ? "bg-amber-400/20 text-amber-300 hover:bg-amber-400/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
                onClick={() => setMobileDetailsOpen(true)}
              >
                <Telescope className="h-3.5 w-3.5" />
                <span>Details</span>
                {(selectedHip || selectedBody) && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </Button>

              <div className="h-4 w-px bg-white/15" />

              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-3 rounded-full text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => setMobileTableOpen(true)}
              >
                <Table className="h-3.5 w-3.5 text-sky-300" />
                <span>Catalog</span>
              </Button>
            </div>

            {/* Legend (desktop) */}
            <div className="pointer-events-none absolute right-3 bottom-3 hidden md:flex rounded-md border border-white/10 bg-slate-950/80 px-2.5 py-1.5 text-[10px] text-slate-300 backdrop-blur">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-sky-300" />
                <span>Click stars to inspect</span>
              </div>
            </div>
          </section>

          {/* Horizontal resize + details panel (desktop >= md) */}
          {rightPanelOpen && (
            <>
              <DragHandle direction="horizontal" onDrag={onDetailsDrag} />
              <aside
                className="shrink-0 hidden md:flex flex-col rounded-lg border border-white/10 bg-slate-900/50 m-0.5 ml-0 overflow-auto"
                style={{ width: detailsW, minWidth: 180 }}
                aria-label="Target details"
              >
                {selectedBody ? (
                  selectedBody.startsWith("asteroid_") ? <AsteroidDetails /> :
                  selectedBody.startsWith("comet_") ? <CometDetails /> :
                  selectedBody.startsWith("satellite_") ? <SatelliteDetails /> :
                  selectedBody.startsWith("messier_") || selectedBody.startsWith("ngc_") ? <DSODetails /> :
                  <SolarBodyDetails />
                ) : selectedHip ? (
                  <StarDetails />
                ) : (
                  <EmptyDetails />
                )}
              </aside>
            </>
          )}
        </div>

        {/* Star table (desktop >= md) */}
        {bottomPanelOpen && (
          <div className="hidden md:flex flex-col">
            <DragHandle direction="vertical" onDrag={onTableDrag} />
            <section
              className="shrink-0 rounded-lg border border-white/10 m-0.5 mt-0 overflow-hidden"
              style={{ height: tableH, minHeight: 80 }}
              aria-label="Star catalog table"
            >
              <StarTable />
            </section>
          </div>
        )}
      </div>

      {/* Mobile Target Details Bottom Sheet (< md) */}
      <Sheet open={mobileDetailsOpen} onOpenChange={setMobileDetailsOpen}>
        <SheetContent side="bottom" className="h-[75vh] max-h-[600px] border-t border-white/10 bg-slate-950/95 text-slate-100 p-4 rounded-t-2xl overflow-y-auto">
          <SheetHeader className="p-0 mb-3 border-b border-white/10 pb-2">
            <SheetTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Telescope className="h-4 w-4 text-amber-400" /> Target Information
            </SheetTitle>
          </SheetHeader>
          <div>
            {selectedBody ? (
              selectedBody.startsWith("asteroid_") ? <AsteroidDetails /> :
              selectedBody.startsWith("comet_") ? <CometDetails /> :
              selectedBody.startsWith("satellite_") ? <SatelliteDetails /> :
              selectedBody.startsWith("messier_") || selectedBody.startsWith("ngc_") ? <DSODetails /> :
              <SolarBodyDetails />
            ) : selectedHip ? (
              <StarDetails />
            ) : (
              <EmptyDetails />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Star Catalog Bottom Sheet (< md) */}
      <Sheet open={mobileTableOpen} onOpenChange={setMobileTableOpen}>
        <SheetContent side="bottom" className="h-[80vh] max-h-[650px] border-t border-white/10 bg-slate-950/95 text-slate-100 p-3 rounded-t-2xl overflow-hidden flex flex-col">
          <SheetHeader className="p-0 mb-2 border-b border-white/10 pb-2 shrink-0">
            <SheetTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Table className="h-4 w-4 text-sky-400" /> Star Catalog & Search
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <StarTable />
          </div>
        </SheetContent>
      </Sheet>
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
