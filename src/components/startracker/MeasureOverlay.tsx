"use client";

/**
 * MeasureOverlay — displays the angular distance between two selected stars.
 *
 * When measure mode is active, the user clicks two stars on the sky map.
 * This overlay shows the angular separation, the position angle, and the
 * names of both stars.
 */

import { useMemo } from "react";
import { useStarTracker } from "@/lib/store";
import { STARS_BY_HIP } from "@/data/stars";
import { buildFrame, transformStar } from "@/lib/astro/engine";
import { Ruler, X, ArrowRight } from "lucide-react";

const RAD2DEG = 180 / Math.PI;

export function MeasureOverlay() {
  const measureMode = useStarTracker((s) => s.measureMode);
  const measureStart = useStarTracker((s) => s.measureStart);
  const measureEnd = useStarTracker((s) => s.measureEnd);
  const setMeasureMode = useStarTracker((s) => s.setMeasureMode);
  const clearMeasure = useStarTracker((s) => s.clearMeasure);
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);

  const result = useMemo(() => {
    if (measureStart == null || measureEnd == null) return null;
    const s1 = STARS_BY_HIP.get(measureStart);
    const s2 = STARS_BY_HIP.get(measureEnd);
    if (!s1 || !s2) return null;

    // Angular separation using J2000 RA/Dec (haversine on the sphere)
    const ra1 = s1.ra, dec1 = s1.dec;
    const ra2 = s2.ra, dec2 = s2.dec;
    const sinDec1 = Math.sin(dec1), cosDec1 = Math.cos(dec1);
    const sinDec2 = Math.sin(dec2), cosDec2 = Math.cos(dec2);
    const dra = ra2 - ra1;
    const cosSep = sinDec1 * sinDec2 + cosDec1 * cosDec2 * Math.cos(dra);
    const sepRad = Math.acos(Math.max(-1, Math.min(1, cosSep)));
    const sepDeg = sepRad * RAD2DEG;

    // Position angle (from star 1 to star 2, measured east from north)
    const y = Math.sin(dra) * cosDec2;
    const x = cosDec1 * sinDec2 - sinDec1 * cosDec2 * Math.cos(dra);
    const paRad = Math.atan2(y, x);
    const paDeg = ((paRad * RAD2DEG) % 360 + 360) % 360;

    // Also compute current alt/az separation (for reference)
    const latRad = (observer.latDeg * Math.PI) / 180;
    const frame = buildFrame({
      date: currentTime,
      lat: latRad,
      lon: (observer.lonDeg * Math.PI) / 180,
      elevationM: observer.elevationM,
    });
    const h1 = transformStar(s1.ra, s1.dec, frame, latRad).horizontal;
    const h2 = transformStar(s2.ra, s2.dec, frame, latRad).horizontal;
    const za1 = Math.PI / 2 - h1.alt;
    const za2 = Math.PI / 2 - h2.alt;
    const dAz = h2.az - h1.az;
    const cosAltSep = Math.cos(za1) * Math.cos(za2) + Math.sin(za1) * Math.sin(za2) * Math.cos(dAz);
    const altSepDeg = Math.acos(Math.max(-1, Math.min(1, cosAltSep))) * RAD2DEG;

    return {
      star1: s1,
      star2: s2,
      sepDeg,
      sepArcmin: sepDeg * 60,
      paDeg,
      altSepDeg,
    };
  }, [measureStart, measureEnd, observer, currentTime]);

  if (!measureMode) return null;

  return (
    <div className="absolute bottom-14 left-1/2 z-30 w-[360px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 rounded-lg border border-sky-400/30 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-sky-300">
          <Ruler className="h-3.5 w-3.5" />
          Angular Distance Measurement
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setMeasureMode(false); clearMeasure(); }}
            className="text-slate-500 hover:text-slate-200"
            aria-label="Exit measure mode"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!result ? (
        <div className="py-2 text-center text-slate-400">
          {measureStart == null
            ? "Click the first star to measure from."
            : "Now click the second star to measure to."}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Star pair */}
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5">
            <span className="min-w-0 flex-1 truncate text-slate-200">
              {result.star1.name || result.star1.bayer || `HIP ${result.star1.hip}`}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0 text-sky-400" />
            <span className="min-w-0 flex-1 truncate text-right text-slate-200">
              {result.star2.name || result.star2.bayer || `HIP ${result.star2.hip}`}
            </span>
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-3 gap-1.5">
            <Metric
              label="Separation"
              value={result.sepDeg < 1 ? `${result.sepArcmin.toFixed(1)}′` : `${result.sepDeg.toFixed(2)}°`}
              highlight
            />
            <Metric
              label="Pos. angle"
              value={`${result.paDeg.toFixed(0)}°`}
            />
            <Metric
              label="Alt/Az sep."
              value={`${result.altSepDeg.toFixed(2)}°`}
            />
          </div>

          <div className="text-[10px] text-slate-500">
            Separation is the true angular distance on the celestial sphere (J2000).
            Position angle is measured eastward from north. Alt/Az separation is the
            apparent distance in the current sky.
          </div>
        </div>
      )}

      <div className="mt-1.5 flex justify-center">
        <button
          onClick={() => clearMeasure()}
          className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-white/10 hover:text-slate-200"
        >
          Reset measurement
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border px-2 py-1.5 text-center ${
      highlight ? "border-sky-400/30 bg-sky-400/10" : "border-white/10 bg-white/[0.02]"
    }`}>
      <div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-0.5 font-mono text-sm ${highlight ? "text-sky-300" : "text-slate-200"}`}>
        {value}
      </div>
    </div>
  );
}
