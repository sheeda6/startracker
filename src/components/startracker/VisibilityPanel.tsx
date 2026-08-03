"use client";

/**
 * VisibilityPanel — smart visibility classifier.
 *
 * Combines light pollution (Bortle/SQM) + weather (cloud cover, humidity)
 * to compute the observer's effective limiting magnitude, then classifies
 * all sky objects above the horizon into:
 *   - Naked eye   (lm_eff >= object.mag)
 *   - Binoculars  (lm_eff + 2.5 >= object.mag)
 *   - Telescope   (lm_eff + 5.0 >= object.mag)
 *   - Not tonight (too faint or not above horizon)
 *
 * Sources:
 *   Stars:    STARS catalog
 *   Planets:  planetPositions()
 *   Messier:  MESSIER catalog
 *   NGC/IC:   NGC_OBJECTS catalog
 */

import { useMemo, useState } from "react";
import { useStarTracker } from "@/lib/store";
import { useLightPollution } from "@/hooks/useLightPollution";
import { useWeather } from "@/hooks/useWeather";
import { buildFrame, transformStar, refract } from "@/lib/astro/engine";
import { sunPosition, moonPosition, planetPositions, moonPhase } from "@/lib/astro/solarSystem";
import { STARS } from "@/data/stars";
import { MESSIER } from "@/data/messier";
import { NGC_OBJECTS } from "@/data/ngc";
import { Eye, Binoculars, Telescope, CloudOff, Star, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Binoculars is not in lucide-react, so we inline a simple SVG
function BinocularsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="6" cy="15" r="4" /><circle cx="18" cy="15" r="4" />
      <path d="M10 15a2 2 0 0 0 4 0" /><path d="M2 15l2-7 2.5-.5" />
      <path d="M22 15l-2-7-2.5-.5" /><line x1="9" y1="15" x2="9.01" y2="15" />
    </svg>
  );
}

interface VisibleObject {
  name: string;
  mag: number;
  altDeg: number;
  type: string;
  category: "star" | "planet" | "messier" | "ngc";
}

type VisibilityClass = "naked-eye" | "binoculars" | "telescope" | "not-tonight";

function classifyObjects(
  lm: number,
  objects: VisibleObject[]
): Record<VisibilityClass, VisibleObject[]> {
  const result: Record<VisibilityClass, VisibleObject[]> = {
    "naked-eye": [],
    binoculars: [],
    telescope: [],
    "not-tonight": [],
  };
  for (const obj of objects) {
    if (obj.altDeg <= 0) { result["not-tonight"].push(obj); continue; }
    if (obj.mag <= lm) result["naked-eye"].push(obj);
    else if (obj.mag <= lm + 2.5) result["binoculars"].push(obj);
    else if (obj.mag <= lm + 5.0) result["telescope"].push(obj);
    else result["not-tonight"].push(obj);
  }
  // Sort each group by altitude descending
  for (const key of Object.keys(result) as VisibilityClass[]) {
    result[key].sort((a, b) => b.altDeg - a.altDeg);
  }
  return result;
}

function ClassSection({
  title,
  icon,
  color,
  objects,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  objects: VisibleObject[];
}) {
  const [expanded, setExpanded] = useState(false);
  const limit = 10;
  const showMore = objects.length > limit;
  const displayedObjects = expanded ? objects : objects.slice(0, limit);

  if (objects.length === 0) return null;
  return (
    <div>
      <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}>
        {icon}
        {title} ({objects.length})
      </div>
      <div className="flex flex-col gap-0.5">
        {displayedObjects.map((o, i) => (
          <div key={i} className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[9px] uppercase text-slate-600 shrink-0">{o.category === "ngc" ? "NGC" : o.category}</span>
              <span className="truncate text-slate-200">{o.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-[10px] text-slate-500">
              <span className="font-mono">m{o.mag.toFixed(1)}</span>
              <span className="font-mono text-sky-400">{o.altDeg.toFixed(0)}°↑</span>
            </div>
          </div>
        ))}
        {showMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full rounded border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[10px] text-slate-400 hover:bg-white/10 hover:text-slate-200"
          >
            + See {objects.length - limit} more
          </button>
        )}
      </div>
    </div>
  );
}

export function VisibilityPanel() {
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const layers = useStarTracker((s) => s.layers);
  const lp = useLightPollution(observer);
  const weather = useWeather(observer);

  // Effective limiting magnitude
  const effectiveLM = useMemo(() => {
    const baseLM = lp.limitingMagnitude;
    const cloudPenalty = (weather.cloudCover / 100) * 3.0;
    const humPenalty = Math.max(0, (weather.humidity - 70) / 30) * 1.0;
    return Math.max(1.0, baseLM - cloudPenalty - humPenalty);
  }, [lp.limitingMagnitude, weather.cloudCover, weather.humidity]);

  // Compute altitudes and classify all objects
  const classified = useMemo(() => {
    const latRad = (observer.latDeg * Math.PI) / 180;
    const lonRad = (observer.lonDeg * Math.PI) / 180;
    const frame = buildFrame({ date: currentTime, lat: latRad, lon: lonRad, elevationM: observer.elevationM });

    const allObjects: VisibleObject[] = [];

    // Bright stars (up to mag 6.5)
    for (const s of STARS) {
      if (s.mag > 6.5) continue;
      const tr = transformStar(s.ra, s.dec, frame, latRad);
      let alt = tr.horizontal.alt;
      if (layers.refraction) alt = refract(alt);
      const altDeg = (alt * 180) / Math.PI;
      allObjects.push({
        name: s.name || s.bayer || `HIP ${s.hip}`,
        mag: s.mag,
        altDeg,
        type: "star",
        category: "star",
      });
    }

    // Planets
    for (const p of planetPositions(currentTime)) {
      const tr = transformStar(p.ra, p.dec, frame, latRad);
      const altDeg = (tr.horizontal.alt * 180) / Math.PI;
      allObjects.push({ name: p.name, mag: p.magnitude, altDeg, type: "planet", category: "planet" });
    }

    // Sun
    const sun = sunPosition(currentTime);
    const sunTr = transformStar(sun.ra, sun.dec, frame, latRad);
    const sunAltDeg = (sunTr.horizontal.alt * 180) / Math.PI;
    if (sunAltDeg > 0) {
      allObjects.push({ name: "Sun", mag: -26.7, altDeg: sunAltDeg, type: "star", category: "planet" });
    }

    // Moon
    const moon = moonPosition(currentTime);
    const moonTr = transformStar(moon.ra, moon.dec, frame, latRad);
    const moonAltDeg = (moonTr.horizontal.alt * 180) / Math.PI;
    const phase = moonPhase(currentTime);
    const moonMag = -12.7 + 2.5 * Math.log10(1 / (phase.illumination + 0.001));
    if (moonAltDeg > 0) {
      allObjects.push({ name: `Moon (${phase.name})`, mag: Math.round(moonMag), altDeg: moonAltDeg, type: "moon", category: "planet" });
    }

    // Messier objects
    for (const m of MESSIER) {
      const tr = transformStar(m.ra, m.dec, frame, latRad);
      const altDeg = (tr.horizontal.alt * 180) / Math.PI;
      allObjects.push({ name: `M${m.number} ${m.name}`, mag: m.magnitude, altDeg, type: m.type, category: "messier" });
    }

    // NGC objects
    for (const n of NGC_OBJECTS) {
      const tr = transformStar(n.ra, n.dec, frame, latRad);
      const altDeg = (tr.horizontal.alt * 180) / Math.PI;
      allObjects.push({ name: `${n.catalog} ${n.number} ${n.name}`, mag: n.magnitude, altDeg, type: n.type, category: "ngc" });
    }

    return classifyObjects(effectiveLM, allObjects);
  }, [observer, currentTime, layers.refraction, effectiveLM]);

  const isLoading = lp.loading || weather.loading;
  const cloudHeavy = weather.cloudCover > 85;

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
        <Eye className="h-3.5 w-3.5" />
        Visibility Tonight
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Computing visibility…</span>
        </div>
      ) : (
        <>
          {/* Limiting magnitude card */}
          <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Effective Limiting Magnitude</div>
                <div className="mt-0.5 font-mono text-2xl font-bold text-amber-300">{effectiveLM.toFixed(1)}</div>
              </div>
              <div className="text-right text-[10px] text-slate-500">
                <div>Base (Bortle {lp.bortle}): {lp.limitingMagnitude.toFixed(1)}</div>
                <div>Cloud loss: −{((weather.cloudCover / 100) * 3.0).toFixed(1)}</div>
                <div>Humidity loss: −{(Math.max(0, (weather.humidity - 70) / 30)).toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* Heavy cloud warning */}
          {cloudHeavy && (
            <div className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
              <CloudOff className="h-3.5 w-3.5 shrink-0" />
              Heavy cloud cover ({weather.cloudCover}%). Observing severely impacted.
            </div>
          )}

          {/* Visibility classes */}
          <ScrollArea className="h-[300px] w-full pr-3">
            <div className="flex flex-col gap-3">
              <ClassSection
                title="Naked Eye"
                icon={<Eye className="h-3 w-3" />}
                color="text-emerald-300"
                objects={classified["naked-eye"]}
              />
              <ClassSection
                title="Binoculars"
                icon={<BinocularsIcon className="h-3 w-3" />}
                color="text-sky-300"
                objects={classified["binoculars"]}
              />
              <ClassSection
                title="Telescope"
                icon={<Telescope className="h-3 w-3" />}
                color="text-amber-300"
                objects={classified["telescope"]}
              />
            </div>
          </ScrollArea>

          <div className="text-[10px] text-slate-600">
            Bortle {lp.bortle} · {weather.cloudCover}% cloud · {weather.humidity}% humidity
          </div>
        </>
      )}
    </div>
  );
}
