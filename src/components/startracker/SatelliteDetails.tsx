"use client";

import { useMemo } from "react";
import { useStarTracker } from "@/lib/store";
import { X, ArrowUp, ArrowDown, Compass, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildFrame, transformStar, refract } from "@/lib/astro/engine";
import { computeSatellitePositions } from "@/data/satellites";

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

export function SatelliteDetails() {
  const selectedBody = useStarTracker((s) => s.selectedBody);
  const setSelectedBody = useStarTracker((s) => s.setSelectedBody);
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const layers = useStarTracker((s) => s.layers);

  const data = useMemo(() => {
    if (!selectedBody || !selectedBody.startsWith("satellite_")) return null;
    const id = selectedBody.replace("satellite_", "");
    
    const positions = computeSatellitePositions(currentTime, observer.latDeg, observer.lonDeg, observer.elevationM);
    const pos = positions.find((p: any) => p.id === id);
    if (!pos) return null;

    let alt = pos.altDeg;
    if (layers.refraction && alt < 90) {
       alt = (refract(alt * Math.PI / 180) * 180) / Math.PI;
    }

    return {
      name: pos.name,
      id: pos.id,
      altDeg: alt,
      azDeg: pos.azDeg,
      ra: pos.ra,
      dec: pos.dec,
      rangeKm: pos.rangeKm,
      color: pos.color,
    };
  }, [selectedBody, observer, currentTime, layers.refraction]);

  if (!data) return null;

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-lg border border-white/10 bg-slate-950/60 text-slate-200 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5" style={{ color: data.color }} />
          <div>
            <div className="font-semibold text-slate-100">
              {data.name}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                Artificial Satellite · NORAD {data.id}
              </span>
              {data.altDeg >= 0 ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300 border border-emerald-500/30">
                  Visible in Sky
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-300 border border-amber-500/20">
                  Below Horizon
                </span>
              )}
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
          <Row label="Range to Observer">
            <span className="font-mono text-amber-100">
              {data.rangeKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km
            </span>
          </Row>
        </Section>
      </div>
    </div>
  );
}
