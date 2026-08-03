"use client";

/**
 * LayersPanel — settings panel for sky-map overlay layers + view zoom.
 *
 * Designed to live inside a Popover/Dialog. Provides:
 *  - Toggle switches for each sky-map layer (grid, constellations, names,
 *    equator, ecliptic, milky way, cardinal directions, star labels,
 *    atmospheric refraction).
 *  - Zoom slider (0.6–4.0, step 0.1) bound to `view.zoom`.
 *  - Reset view button (restores zoom=1, rotation=0).
 *
 * Layer toggles drive the `layers` slice; zoom drives the `view` slice of the
 * Zustand store.
 */

import {
  Grid3x3,
  Sparkles,
  Type,
  Circle,
  Compass,
  Cloud,
  Navigation,
  Star,
  Waves,
  ZoomIn,
  RotateCcw,
  Sun,
  Orbit,
  Telescope,
  Zap,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { useStarTracker, type ViewLayers } from "@/lib/store";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface LayerDef {
  key: keyof ViewLayers;
  label: string;
  icon: LucideIcon;
}

/** Ordered layer list — order here is the display order in the panel. */
const LAYER_DEFS: LayerDef[] = [
  { key: "grid", label: "Alt/Az grid", icon: Grid3x3 },
  { key: "constellations", label: "Constellation lines", icon: Sparkles },
  { key: "constellationNames", label: "Constellation names", icon: Type },
  { key: "equator", label: "Celestial equator", icon: Circle },
  { key: "ecliptic", label: "Ecliptic", icon: Compass },
  { key: "milkyWay", label: "Milky Way", icon: Cloud },
  { key: "solarSystem", label: "Sun · Moon · Planets", icon: Sun },
  { key: "orbits", label: "Object orbit tracks", icon: Orbit },
  { key: "messier", label: "Messier objects", icon: Telescope },
  { key: "ngcObjects", label: "NGC/IC objects", icon: Orbit },
  { key: "asteroids", label: "Asteroids", icon: Sparkles },
  { key: "comets", label: "Comets", icon: Sparkles },
  { key: "satellites", label: "Artificial Satellites", icon: Sparkles },
  { key: "meteorShowers", label: "Meteor radiants", icon: Zap },
  { key: "cardinalDirections", label: "Cardinal directions", icon: Navigation },
  { key: "starLabels", label: "Star labels", icon: Star },
  { key: "refraction", label: "Atmospheric refraction", icon: Waves },
  { key: "lightPollutionOverlay", label: "Light pollution glow", icon: Lightbulb },
];

export function LayersPanel() {
  const layers = useStarTracker((s) => s.layers);
  const setLayers = useStarTracker((s) => s.setLayers);
  const view = useStarTracker((s) => s.view);
  const setView = useStarTracker((s) => s.setView);

  const resetView = () => setView({ zoom: 1, rotation: 0 });

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
          <Sparkles className="h-3.5 w-3.5" />
          Sky layers
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetView}
          className="h-7 gap-1.5 px-2 text-[11px] text-slate-400 hover:bg-white/10 hover:text-slate-100"
        >
          <RotateCcw className="h-3 w-3" />
          Reset view
        </Button>
      </div>

      <Separator className="bg-white/10" />

      {/* Layer toggles — two-column on wider surfaces, single column on narrow. */}
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {LAYER_DEFS.map(({ key, label, icon: Icon }) => (
          <LayerToggle
            key={key}
            label={label}
            icon={<Icon className="h-3.5 w-3.5 text-sky-300/80" />}
            checked={layers[key]}
            onCheckedChange={(b) => setLayers({ [key]: b })}
          />
        ))}
      </div>

      <Separator className="bg-white/10" />

      {/* Zoom */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs text-slate-300">
          <ZoomIn className="h-3.5 w-3.5 text-sky-300/80" />
          <span className="flex-1">Zoom</span>
          <span className="font-mono text-amber-300/90">
            {view.zoom.toFixed(1)}×
          </span>
        </Label>
        <Slider
          value={[view.zoom]}
          min={0.6}
          max={4}
          step={0.1}
          onValueChange={(v) => setView({ zoom: v[0] })}
          aria-label="Zoom"
          className="[&_[data-slot=slider-range]]:bg-amber-400/70 [&_[data-slot=slider-thumb]]:border-amber-400/60 [&_[data-slot=slider-thumb]]:bg-slate-900 [&_[data-slot=slider-track]]:bg-white/10"
        />
        <div className="flex justify-between font-mono text-[10px] text-slate-600">
          <span>0.6×</span>
          <span>1.0×</span>
          <span>4.0×</span>
        </div>
      </div>
    </div>
  );
}

function LayerToggle({
  label,
  icon,
  checked,
  onCheckedChange,
}: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onCheckedChange: (b: boolean) => void;
}) {
  return (
    <Label className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs text-slate-200 hover:bg-white/[0.05]">
      {icon}
      <span className="flex-1 leading-tight">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className="data-[state=checked]:bg-amber-400/80 data-[state=unchecked]:bg-white/10"
      />
    </Label>
  );
}
