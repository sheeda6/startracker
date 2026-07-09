"use client";

/**
 * ObserverPanel — configuration panel for the observer's geographic location.
 *
 * Intended to be mounted inside a Popover / Dialog. Supports:
 *  - One-tap GPS via the browser geolocation API (with loading indicator)
 *  - Quick selection from LOCATION_PRESETS
 *  - Manual entry of latitude / longitude / elevation
 *  - Read-only timezone display (auto-detected)
 *  - A live Local Sidereal Time readout that updates with the clock
 */

import { useMemo, useState } from "react";
import {
  MapPin,
  Navigation,
  LocateFixed,
  Globe2,
  Mountain,
  Loader2,
} from "lucide-react";
import { useStarTracker, LOCATION_PRESETS } from "@/lib/store";
import { buildFrame } from "@/lib/astro/engine";
import { formatHMS } from "@/lib/astro/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Format a (lat, lon) pair with cardinal directions, e.g. "40.7128° N, 74.0060° W". */
function cardinal(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

/** Value used by the preset <Select> when the coordinates don't match any preset. */
const CUSTOM_VALUE = "__custom__";

export function ObserverPanel() {
  const observer = useStarTracker((s) => s.observer);
  const setObserver = useStarTracker((s) => s.setObserver);
  const requestGeolocation = useStarTracker((s) => s.requestGeolocation);
  const currentTime = useStarTracker((s) => s.currentTime);

  // --- GPS loading state ---------------------------------------------------
  // requestGeolocation() is fire-and-forget in the store, so we track loading
  // locally and clear it either when the observer label changes (success) or
  // after a safety timeout (error / denial). The label-change is detected via
  // the "adjust state during render" pattern (React-recommended over useEffect).
  const [gpsLoading, setGpsLoading] = useState(false);
  const [prevLabel, setPrevLabel] = useState(observer.label);
  if (gpsLoading && observer.label !== prevLabel) {
    setPrevLabel(observer.label);
    setGpsLoading(false);
  }

  const handleGps = () => {
    setPrevLabel(observer.label);
    setGpsLoading(true);
    requestGeolocation();
    // Store uses an 8s timeout; give a small buffer before giving up on the UI.
    window.setTimeout(() => setGpsLoading(false), 10000);
  };

  // --- Live astronomical frame (for LST readout) ---------------------------
  const frame = useMemo(
    () =>
      buildFrame({
        date: currentTime,
        lat: (observer.latDeg * Math.PI) / 180,
        lon: (observer.lonDeg * Math.PI) / 180,
        elevationM: observer.elevationM,
      }),
    [currentTime, observer.latDeg, observer.lonDeg, observer.elevationM],
  );

  // --- Preset matching (for Select value) ----------------------------------
  const matchingPreset = useMemo(() => {
    const idx = LOCATION_PRESETS.findIndex(
      (p) =>
        Math.abs(p.latDeg - observer.latDeg) < 1e-6 &&
        Math.abs(p.lonDeg - observer.lonDeg) < 1e-6 &&
        Math.abs(p.elevationM - observer.elevationM) < 1e-6,
    );
    return idx >= 0 ? String(idx) : CUSTOM_VALUE;
  }, [observer.latDeg, observer.lonDeg, observer.elevationM]);

  return (
    <div className="flex flex-col gap-4 p-1 text-slate-200">
      {/* Location: GPS + presets */}
      <section className="flex flex-col gap-2">
        <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
          <LocateFixed className="h-3.5 w-3.5" />
          Location
        </Label>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGps}
          disabled={gpsLoading}
          className="h-8 w-full gap-1.5 border-amber-400/30 bg-amber-400/10 px-3 text-xs text-amber-200 hover:bg-amber-400/20 hover:text-amber-100"
        >
          {gpsLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Navigation className="h-3.5 w-3.5" />
          )}
          {gpsLoading ? "Locating…" : "Use GPS"}
        </Button>
        <Select
          value={matchingPreset}
          onValueChange={(v) => {
            if (v === CUSTOM_VALUE) return;
            const preset = LOCATION_PRESETS[Number(v)];
            if (preset) setObserver(preset);
          }}
        >
          <SelectTrigger
            className="h-8 w-full border-white/15 bg-white/[0.03] text-xs text-slate-200"
            size="sm"
            aria-label="Preset locations"
          >
            <SelectValue placeholder="Choose a preset location" />
          </SelectTrigger>
          <SelectContent className="border-white/15 bg-slate-950 text-slate-200">
            <SelectItem value={CUSTOM_VALUE} className="text-xs italic text-slate-400 focus:bg-white/10">
              Custom coordinates
            </SelectItem>
            {LOCATION_PRESETS.map((p, i) => (
              <SelectItem
                key={`${p.label}-${i}`}
                value={String(i)}
                className="text-xs focus:bg-white/10 focus:text-amber-200"
              >
                <MapPin className="h-3.5 w-3.5 text-sky-300" />
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <Separator className="bg-white/10" />

      {/* Manual coordinates */}
      <section className="flex flex-col gap-3">
        <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
          <Globe2 className="h-3.5 w-3.5" />
          Coordinates
        </Label>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="obs-lat" className="text-[10px] text-slate-400">
              Latitude (°)
            </Label>
            <NumberField
              id="obs-lat"
              value={observer.latDeg}
              onCommit={(v) => setObserver({ latDeg: v })}
              min={-90}
              max={90}
              step={0.0001}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="obs-lon" className="text-[10px] text-slate-400">
              Longitude (°)
            </Label>
            <NumberField
              id="obs-lon"
              value={observer.lonDeg}
              onCommit={(v) => setObserver({ lonDeg: v })}
              min={-180}
              max={180}
              step={0.0001}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="obs-elev" className="flex items-center gap-1 text-[10px] text-slate-400">
            <Mountain className="h-3 w-3" />
            Elevation (m)
          </Label>
          <NumberField
            id="obs-elev"
            value={observer.elevationM}
            onCommit={(v) => setObserver({ elevationM: v })}
            step={1}
          />
        </div>

        <p className="font-mono text-[10px] text-slate-500">
          {cardinal(observer.latDeg, observer.lonDeg)}
        </p>
      </section>

      <Separator className="bg-white/10" />

      {/* Timezone (read-only) */}
      <section className="flex flex-col gap-1">
        <Label
          htmlFor="obs-tz"
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300/80"
        >
          <Globe2 className="h-3.5 w-3.5" />
          Timezone
        </Label>
        <Input
          id="obs-tz"
          readOnly
          value={observer.timezone}
          aria-readonly
          className="h-8 cursor-not-allowed border-white/15 bg-white/[0.02] font-mono text-xs text-slate-400"
        />
        <p className="text-[10px] text-slate-500">Auto-detected from browser or preset.</p>
      </section>

      <Separator className="bg-white/10" />

      {/* Live LST readout */}
      <section
        className="flex items-center justify-between rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2"
        aria-live="polite"
      >
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            Local Sidereal Time
          </span>
          <span className="font-mono text-sm text-amber-200">{formatHMS(frame.lst)}</span>
        </div>
        <LocateFixed className="h-4 w-4 text-amber-300/60" aria-hidden />
      </section>

      {/* Current location label */}
      <p className="text-center text-[10px] text-slate-500">{observer.label}</p>
    </div>
  );
}

/**
 * Controlled number input with local string state so decimal entry (e.g.
 * "40." → "40.5") works without the field snapping back mid-keystroke.
 *
 * External changes (preset / GPS) are synced in via the "adjust state during
 * render" pattern, comparing the incoming `value` against the last value this
 * field committed locally.
 */
function NumberField({
  id,
  value,
  onCommit,
  min,
  max,
  step,
}: {
  id?: string;
  value: number;
  onCommit: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  // External changes (preset / GPS) are synced in via the "adjust state during
  // render" pattern: when the incoming `value` differs from what we last saw,
  // and it wasn't a value we committed ourselves, refresh the local string.
  const [str, setStr] = useState(() => String(value));
  const [prevValue, setPrevValue] = useState(value);
  const [lastCommitted, setLastCommitted] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== lastCommitted) {
      setStr(String(value));
      setLastCommitted(value);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setStr(next);
    const v = parseFloat(next);
    if (!Number.isNaN(v)) {
      let clamped = v;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      setLastCommitted(clamped);
      onCommit(clamped);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(str);
    if (Number.isNaN(parsed)) {
      setStr(String(value));
      setLastCommitted(value);
    }
  };

  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      value={str}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      onBlur={handleBlur}
      className="h-8 border-white/15 bg-white/[0.03] font-mono text-xs text-slate-100"
    />
  );
}
