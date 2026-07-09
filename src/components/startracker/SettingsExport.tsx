"use client";

/**
 * SettingsExport — export/import the full app configuration (observer, layers,
 * filters, view) as a JSON file or shareable URL.
 *
 * Export: downloads a `startracker-config.json` file with the current settings.
 * Import: reads a JSON file and applies the settings.
 * Share URL: encodes the config in the URL hash for sharing.
 */

import { useRef } from "react";
import { useStarTracker } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Share2 } from "lucide-react";

interface ConfigExport {
  version: 1;
  exportedAt: string;
  observer: {
    latDeg: number;
    lonDeg: number;
    elevationM: number;
    label: string;
    timezone: string;
  };
  layers: Record<string, boolean>;
  filters: {
    maxMagnitude: number;
    constellation: string;
    minAltitude: number;
    visibleOnly: boolean;
    circumpolarOnly: boolean;
    neverSetOnly: boolean;
  };
  view: {
    zoom: number;
    rotation: number;
  };
  nightMode: boolean;
}

export function SettingsExport() {
  const observer = useStarTracker((s) => s.observer);
  const layers = useStarTracker((s) => s.layers);
  const filters = useStarTracker((s) => s.filters);
  const view = useStarTracker((s) => s.view);
  const nightMode = useStarTracker((s) => s.nightMode);
  const setObserver = useStarTracker((s) => s.setObserver);
  const setLayers = useStarTracker((s) => s.setLayers);
  const setFilters = useStarTracker((s) => s.setFilters);
  const setView = useStarTracker((s) => s.setView);
  const setNightMode = useStarTracker((s) => s.setNightMode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const buildConfig = (): ConfigExport => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    observer: { ...observer },
    layers: { ...layers },
    filters: { ...filters },
    view: { ...view },
    nightMode,
  });

  const handleExport = () => {
    const config = buildConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `startracker-config-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Configuration exported" });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const config = JSON.parse(ev.target?.result as string) as ConfigExport;
        if (config.observer) setObserver(config.observer);
        if (config.layers) setLayers(config.layers);
        if (config.filters) setFilters(config.filters);
        if (config.view) setView(config.view);
        if (typeof config.nightMode === "boolean") setNightMode(config.nightMode);
        toast({ title: "Configuration imported" });
      } catch {
        toast({ title: "Failed to import", description: "Invalid JSON", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset for re-import
  };

  const handleShareUrl = async () => {
    const config = buildConfig();
    // Compress: use minimal keys
    const mini = {
      o: [config.observer.latDeg, config.observer.lonDeg, config.observer.elevationM, config.observer.timezone],
      l: config.layers,
      f: [config.filters.maxMagnitude, config.filters.constellation, config.filters.minAltitude,
          +config.filters.visibleOnly, +config.filters.circumpolarOnly, +config.filters.neverSetOnly],
      v: [config.view.zoom, config.view.rotation],
      n: +config.nightMode,
    };
    const hash = btoa(JSON.stringify(mini));
    const url = `${window.location.origin}${window.location.pathname}#cfg=${hash}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Share URL copied to clipboard" });
    } catch {
      // Fallback: select the URL
      window.prompt("Copy this URL:", url);
    }
  };

  // Load config from URL hash on mount (called from the page)
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
        <Share2 className="h-3.5 w-3.5" />
        Settings Export / Import
      </div>
      <div className="text-[10px] text-slate-500">
        Save your observer location, layers, and filters — or share your view
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Export */}
        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="h-8 justify-start border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
        >
          <Download className="mr-2 h-3.5 w-3.5 text-amber-300" />
          Export config as JSON
        </Button>

        {/* Import */}
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          className="h-8 justify-start border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
        >
          <Upload className="mr-2 h-3.5 w-3.5 text-sky-300" />
          Import config from JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
        />

        {/* Share URL */}
        <Button
          onClick={handleShareUrl}
          variant="outline"
          size="sm"
          className="h-8 justify-start border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
        >
          <Share2 className="mr-2 h-3.5 w-3.5 text-emerald-300" />
          Copy share URL
        </Button>
      </div>

      {/* Current config preview */}
      <div className="rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-2 text-[10px] text-slate-400">
        <div className="mb-1 font-semibold text-slate-300">Current settings:</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono">
          <div>Lat: {observer.latDeg.toFixed(2)}°</div>
          <div>Lon: {observer.lonDeg.toFixed(2)}°</div>
          <div>Mag ≤ {filters.maxMagnitude}</div>
          <div>Zoom: {view.zoom.toFixed(1)}×</div>
          <div>Night: {nightMode ? "on" : "off"}</div>
          <div>Layers: {Object.values(layers).filter(Boolean).length} on</div>
        </div>
      </div>
    </div>
  );
}

/** Load config from URL hash on page load. Call this once from the main page. */
export function loadConfigFromHash() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash;
  if (!hash.startsWith("#cfg=")) return;
  try {
    const mini = JSON.parse(atob(hash.slice(5)));
    const store = useStarTracker.getState();
    if (mini.o) store.setObserver({
      latDeg: mini.o[0],
      lonDeg: mini.o[1],
      elevationM: mini.o[2],
      timezone: mini.o[3],
      label: `Shared (${mini.o[0].toFixed(1)}°, ${mini.o[1].toFixed(1)}°)`,
    });
    if (mini.l) store.setLayers(mini.l);
    if (mini.f) store.setFilters({
      maxMagnitude: mini.f[0],
      constellation: mini.f[1],
      minAltitude: mini.f[2],
      visibleOnly: !!mini.f[3],
      circumpolarOnly: !!mini.f[4],
      neverSetOnly: !!mini.f[5],
    });
    if (mini.v) store.setView({ zoom: mini.v[0], rotation: mini.v[1] });
    if (mini.n !== undefined) store.setNightMode(!!mini.n);
  } catch {
    // invalid hash — ignore
  }
}
