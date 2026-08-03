"use client";

import { useMemo } from "react";
import { useStarTracker } from "@/lib/store";
import { X, ArrowUp, ArrowDown, Compass, Telescope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildFrame, transformStar, refract } from "@/lib/astro/engine";
import { MESSIER, MessierObject } from "@/data/messier";
import { NGC_OBJECTS, NGCObject } from "@/data/ngc";

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

type DSO = {
  name: string;
  commonName: string | null;
  type: string;
  constellation: string;
  magnitude: number;
  size: number;
  ra: number;
  dec: number;
};

function resolveDSO(selectedBody: string): DSO | null {
  if (selectedBody.startsWith("messier_")) {
    const num = parseInt(selectedBody.replace("messier_", ""), 10);
    const m: MessierObject | undefined = MESSIER.find(x => x.number === num);
    if (!m) return null;
    return {
      name: `M${m.number}`,
      commonName: m.name || null,
      type: m.type,
      constellation: m.constellation,
      magnitude: m.magnitude,
      size: m.size,
      ra: m.ra,
      dec: m.dec,
    };
  } else if (selectedBody.startsWith("ngc_")) {
    const num = parseInt(selectedBody.replace("ngc_", ""), 10);
    const n: NGCObject | undefined = NGC_OBJECTS.find(x => x.number === num);
    if (!n) return null;
    return {
      name: `${n.catalog}${n.number}`,
      commonName: n.name || null,
      type: n.type,
      constellation: n.constellation,
      magnitude: n.magnitude,
      size: n.size,
      ra: n.ra,
      dec: n.dec,
    };
  }
  return null;
}

export function DSODetails() {
  const selectedBody = useStarTracker((s) => s.selectedBody);
  const setSelectedBody = useStarTracker((s) => s.setSelectedBody);
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const layers = useStarTracker((s) => s.layers);

  const data = useMemo(() => {
    if (!selectedBody) return null;
    const dso = resolveDSO(selectedBody);
    if (!dso) return null;

    const latRad = (observer.latDeg * Math.PI) / 180;
    const lonRad = (observer.lonDeg * Math.PI) / 180;
    const frame = buildFrame({ date: currentTime, lat: latRad, lon: lonRad, elevationM: observer.elevationM });

    const tr = transformStar(dso.ra, dso.dec, frame, latRad);
    let alt = tr.horizontal.alt;
    if (layers.refraction) alt = refract(alt);
    const altDeg = (alt * 180) / Math.PI;
    const azDeg = ((tr.horizontal.az * 180) / Math.PI + 360) % 360;

    return { ...dso, altDeg, azDeg };
  }, [selectedBody, observer, currentTime, layers.refraction]);

  if (!data) return null;

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-lg border border-white/10 bg-slate-950/60 text-slate-200 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Telescope className="h-5 w-5 text-indigo-400" />
          <div>
            <div className="font-semibold text-slate-100">
              {data.name} {data.commonName ? `(${data.commonName})` : ""}
            </div>
            <div className="text-[11px] text-slate-500 capitalize">
              {data.type} · {data.constellation}
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
        {/* Position */}
        <Section title="Current Position">
          <Row label="Altitude">
            <span className={`font-mono ${data.altDeg > 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {data.altDeg > 0 ? <ArrowUp className="mr-1 inline h-3 w-3" /> : <ArrowDown className="mr-1 inline h-3 w-3" />}
              {Math.abs(data.altDeg).toFixed(2)}°
            </span>
          </Row>
          <Row label="Azimuth">
            <span className="font-mono text-slate-300">
              <Compass className="mr-1 inline h-3 w-3 text-sky-300" />
              {data.azDeg.toFixed(2)}°
            </span>
          </Row>
        </Section>

        {/* Physical */}
        <Section title="Observation">
          <Row label="Magnitude">
            <span className="font-mono text-slate-300">{data.magnitude.toFixed(1)}</span>
          </Row>
          <Row label="Apparent Size">
            <span className="font-mono text-slate-300">{data.size}′</span>
          </Row>
          <Row label="Type">
            <span className="text-slate-300 capitalize">{data.type}</span>
          </Row>
          <Row label="Constellation">
            <span className="text-slate-300">{data.constellation}</span>
          </Row>
        </Section>
      </div>
    </div>
  );
}
