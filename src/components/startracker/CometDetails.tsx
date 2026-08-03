"use client";

import { useMemo } from "react";
import { useStarTracker } from "@/lib/store";
import { X, ArrowUp, ArrowDown, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildFrame, transformStar, refract } from "@/lib/astro/engine";
import { computeCometPositions, COMETS } from "@/data/comets";

// Reusable UI sections
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02]">
      <div className="border-b border-white/5 bg-white/[0.02] px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">
        {title}
      </div>
      <div className="flex flex-col gap-1 p-3 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export function CometDetails() {
  const selectedBody = useStarTracker((s) => s.selectedBody);
  const setSelectedBody = useStarTracker((s) => s.setSelectedBody);
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const layers = useStarTracker((s) => s.layers);

  const data = useMemo(() => {
    if (!selectedBody || !selectedBody.startsWith("comet_")) return null;
    const id = selectedBody.replace("comet_", "");
    
    const elements = COMETS.find(e => e.id.toLowerCase() === id.toLowerCase());
    if (!elements) return null;

    const latRad = (observer.latDeg * Math.PI) / 180;
    const lonRad = (observer.lonDeg * Math.PI) / 180;
    const frame = buildFrame({ date: currentTime, lat: latRad, lon: lonRad, elevationM: observer.elevationM });

    const positions = computeCometPositions(currentTime);
    const pos = positions.find(p => p.id.toLowerCase() === id.toLowerCase());
    if (!pos) return null;

    const tr = transformStar(pos.ra, pos.dec, frame, latRad);
    let alt = tr.horizontal.alt;
    if (layers.refraction) alt = refract(alt);
    const altDeg = (alt * 180) / Math.PI;
    const azDeg = ((tr.horizontal.az * 180) / Math.PI + 360) % 360;

    return {
      name: pos.name,
      id: pos.id,
      altDeg,
      azDeg,
      ra: pos.ra,
      dec: pos.dec,
      distance: pos.distance,
      color: pos.color,
      a: elements.a,
      e: elements.e,
      i: elements.i,
    };
  }, [selectedBody, observer, currentTime, layers.refraction]);

  if (!data) return null;

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-lg border border-white/10 bg-slate-950/60 text-slate-200 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" style={{ color: data.color }} />
          <div>
            <div className="font-semibold text-slate-100">
              {data.name}
            </div>
            <div className="text-[11px] text-slate-500 capitalize">
              Comet · {data.id}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-500 hover:text-slate-200"
          onClick={() => setSelectedBody(null)}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <Section title="Current Position">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center rounded-lg bg-slate-900/50 p-2">
              <span className="text-[10px] uppercase text-slate-500">Altitude</span>
              <div className="flex items-center gap-1 font-mono text-lg text-amber-300/90">
                {data.altDeg >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(data.altDeg).toFixed(2)}°
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-slate-900/50 p-2">
              <span className="text-[10px] uppercase text-slate-500">Azimuth</span>
              <div className="flex items-center gap-1 font-mono text-lg text-emerald-300/90">
                <Compass className="h-3 w-3" />
                {data.azDeg.toFixed(1)}°
              </div>
            </div>
          </div>
        </Section>

        <Section title="Coordinates & Distance">
          <Row label="Right Ascension (J2000)">
            <span className="font-mono text-amber-100">
              {((data.ra * 180) / Math.PI / 15).toFixed(2)}h
            </span>
          </Row>
          <Row label="Declination (J2000)">
            <span className="font-mono text-amber-100">
              {((data.dec * 180) / Math.PI).toFixed(2)}°
            </span>
          </Row>
          <Row label="Distance from Earth">
            <span className="font-mono text-amber-100">
              {data.distance.toFixed(3)} AU
            </span>
          </Row>
        </Section>

        <Section title="Orbital Elements">
          <Row label="Semi-major axis (a)">
            <span className="font-mono text-slate-300">{data.a.toFixed(3)} AU</span>
          </Row>
          <Row label="Eccentricity (e)">
            <span className="font-mono text-slate-300">{data.e.toFixed(4)}</span>
          </Row>
          <Row label="Inclination (i)">
            <span className="font-mono text-slate-300">{data.i.toFixed(2)}°</span>
          </Row>
        </Section>
      </div>
    </div>
  );
}
