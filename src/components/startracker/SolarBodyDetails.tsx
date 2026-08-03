"use client";

/**
 * SolarBodyDetails — detail panel for the Sun or Moon.
 *
 * Shown in the right panel when the user clicks the Sun or Moon on the sky map.
 * Displays:
 *   Sun:  altitude/az, rise/transit/set times, angular diameter, distance (AU), UV index hint.
 *   Moon: altitude/az, phase name + animated icon, illumination %, distance (km),
 *         rise/set, angular diameter, and next new/full moon countdown.
 */

import { useMemo } from "react";
import { useStarTracker } from "@/lib/store";
import { buildFrame, transformStar, refract } from "@/lib/astro/engine";
import { sunPosition, moonPosition, moonPhase, planetPositions } from "@/lib/astro/solarSystem";
import { formatDeg } from "@/lib/astro/time";
import { Sun, Moon, ArrowUp, ArrowDown, Compass, Ruler, Radio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatTime(d: Date | null, tz: string): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return d.toISOString().slice(11, 16);
  }
}

/** Find rise/set/transit by binary search over the next 24 hours. */
function findEvents(
  getAlt: (t: Date) => number,
  startTime: Date,
): { rise: Date | null; set: Date | null; transit: Date | null } {
  const steps = 288; // 5-min steps over 24h
  const ms5 = 5 * 60 * 1000;
  const alts: { t: Date; alt: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const t = new Date(startTime.getTime() + i * ms5);
    alts.push({ t, alt: getAlt(t) });
  }

  let rise: Date | null = null;
  let set_: Date | null = null;
  let transit: Date | null = null;
  let maxAlt = -Infinity;

  for (let i = 1; i < alts.length; i++) {
    const prev = alts[i - 1];
    const curr = alts[i];
    if (prev.alt < 0 && curr.alt >= 0 && !rise) rise = curr.t;
    if (prev.alt >= 0 && curr.alt < 0 && !set_) set_ = curr.t;
    if (curr.alt > maxAlt) { maxAlt = curr.alt; transit = curr.t; }
  }
  return { rise, set: set_, transit };
}

export function SolarBodyDetails() {
  const selectedBody = useStarTracker((s) => s.selectedBody);
  const setSelectedBody = useStarTracker((s) => s.setSelectedBody);
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const layers = useStarTracker((s) => s.layers);

  const data = useMemo(() => {
    if (!selectedBody) return null;
    const latRad = (observer.latDeg * Math.PI) / 180;
    const lonRad = (observer.lonDeg * Math.PI) / 180;
    const frame = buildFrame({ date: currentTime, lat: latRad, lon: lonRad, elevationM: observer.elevationM });

    if (selectedBody === "sun") {
      const sun = sunPosition(currentTime);
      const tr = transformStar(sun.ra, sun.dec, frame, latRad);
      let alt = tr.horizontal.alt;
      if (layers.refraction) alt = refract(alt);
      const altDeg = (alt * 180) / Math.PI;
      const azDeg = ((tr.horizontal.az * 180) / Math.PI + 360) % 360;

      // Angular diameter: 0.9336° / distance(AU)
      const angDiamArcsec = (1919.26 / sun.distance).toFixed(0);

      const getAlt = (t: Date) => {
        const f2 = buildFrame({ date: t, lat: latRad, lon: lonRad, elevationM: observer.elevationM });
        const s2 = sunPosition(t);
        const tr2 = transformStar(s2.ra, s2.dec, f2, latRad);
        return (tr2.horizontal.alt * 180) / Math.PI;
      };
      const events = findEvents(getAlt, currentTime);

      return {
        type: "sun" as const,
        altDeg,
        azDeg,
        distance: sun.distance,
        angDiamArcsec,
        events,
      };
    } else if (selectedBody === "moon") {
      const moon = moonPosition(currentTime);
      const tr = transformStar(moon.ra, moon.dec, frame, latRad);
      let alt = tr.horizontal.alt;
      if (layers.refraction) alt = refract(alt);
      const altDeg = (alt * 180) / Math.PI;
      const azDeg = ((tr.horizontal.az * 180) / Math.PI + 360) % 360;
      const phase = moonPhase(currentTime);

      // Angular diameter: ~0.5° (varies 0.49°–0.55° with distance)
      const angDiamArcmin = ((384400 / moon.distance) * 31.1).toFixed(1);

      const getAlt = (t: Date) => {
        const f2 = buildFrame({ date: t, lat: latRad, lon: lonRad, elevationM: observer.elevationM });
        const m2 = moonPosition(t);
        const tr2 = transformStar(m2.ra, m2.dec, f2, latRad);
        return (tr2.horizontal.alt * 180) / Math.PI;
      };
      const events = findEvents(getAlt, currentTime);

      // Next full / new moon (rough: search forward up to 30 days)
      let nextFull: Date | null = null;
      let nextNew: Date | null = null;
      for (let d = 1; d < 30 && (!nextFull || !nextNew); d++) {
        const t = new Date(currentTime.getTime() + d * 86400000);
        const p = moonPhase(t);
        if (!nextFull && p.name === "Full Moon") nextFull = t;
        if (!nextNew && p.name === "New Moon") nextNew = t;
      }

      return {
        type: "moon" as const,
        altDeg,
        azDeg,
        distance: moon.distance,
        angDiamArcmin,
        phase,
        events,
        nextFull,
        nextNew,
      };
    } else if (selectedBody.startsWith("planet_")) {
      const planetName = selectedBody.replace("planet_", "");
      const planets = planetPositions(currentTime);
      const planet = planets.find(p => p.name.toLowerCase() === planetName.toLowerCase());
      if (!planet) return null;

      const tr = transformStar(planet.ra, planet.dec, frame, latRad);
      let alt = tr.horizontal.alt;
      if (layers.refraction) alt = refract(alt);
      const altDeg = (alt * 180) / Math.PI;
      const azDeg = ((tr.horizontal.az * 180) / Math.PI + 360) % 360;

      const getAlt = (t: Date) => {
        const f2 = buildFrame({ date: t, lat: latRad, lon: lonRad, elevationM: observer.elevationM });
        const p2s = planetPositions(t);
        const p2 = p2s.find(p => p.name.toLowerCase() === planetName.toLowerCase());
        if (!p2) return -90;
        const tr2 = transformStar(p2.ra, p2.dec, f2, latRad);
        return (tr2.horizontal.alt * 180) / Math.PI;
      };
      const events = findEvents(getAlt, currentTime);

      return {
        type: "planet" as const,
        name: planet.name,
        color: planet.color,
        symbol: planet.symbol,
        altDeg,
        azDeg,
        distance: planet.distance,
        mag: planet.magnitude,
        events,
      };
    }
  }, [selectedBody, observer, currentTime, layers.refraction]);

  if (!data) return null;

  const tz = observer.timezone || "UTC";

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-lg border border-white/10 bg-slate-950/60 text-slate-200 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          {data.type === "sun" ? (
            <Sun className="h-5 w-5 text-amber-300" />
          ) : data.type === "moon" ? (
            <Moon className="h-5 w-5 text-slate-300" />
          ) : (
            <span className="text-xl" style={{ color: data.color }}>{data.symbol}</span>
          )}
          <div>
            <div className="font-semibold text-slate-100">
              {data.type === "sun" ? "The Sun" : data.type === "moon" ? "The Moon" : data.name}
            </div>
            <div className="text-[11px] text-slate-500">
              {data.type === "sun" ? "Solar System · G-type star" : data.type === "moon" ? "Earth's natural satellite" : "Solar System · Planet"}
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

        {/* Rise/Transit/Set */}
        <Section title="Today's Events">
          <Row label="Rise">{formatTime(data.events.rise, tz)}</Row>
          <Row label="Transit">{formatTime(data.events.transit, tz)}</Row>
          <Row label="Set">{formatTime(data.events.set, tz)}</Row>
        </Section>

        {/* Physical */}
        <Section title="Physical Data">
          {data.type === "sun" ? (
            <>
              <Row label="Distance">
                <span className="font-mono">{data.distance.toFixed(4)} AU</span>
              </Row>
              <Row label="Angular diameter">
                <span className="font-mono">{data.angDiamArcsec}″</span>
              </Row>
              <Row label="Light travel time">
                <span className="font-mono">{(data.distance * 499.0).toFixed(0)} sec</span>
              </Row>
              <Row label="Status">
                {data.altDeg > 6 ? (
                  <Badge className="bg-amber-500/20 text-amber-200 border-amber-500/30">Daytime</Badge>
                ) : data.altDeg > -18 ? (
                  <Badge className="bg-orange-500/20 text-orange-200 border-orange-500/30">Twilight</Badge>
                ) : (
                  <Badge className="bg-sky-500/20 text-sky-200 border-sky-500/30">Night</Badge>
                )}
              </Row>
            </>
          ) : data.type === "moon" ? (
            <>
              <Row label="Distance">
                <span className="font-mono">{Math.round(data.distance).toLocaleString()} km</span>
              </Row>
              <Row label="Angular diameter">
                <span className="font-mono">{data.angDiamArcmin}′</span>
              </Row>
              <Row label="Phase">
                <span className="text-slate-200">{data.phase.name}</span>
              </Row>
              <Row label="Illumination">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-slate-300"
                      style={{ width: `${(data.phase.illumination * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="font-mono text-slate-300">{(data.phase.illumination * 100).toFixed(1)}%</span>
                </div>
              </Row>
            </>
          ) : (
            <>
              <Row label="Magnitude">
                <span className="font-mono">{data.mag.toFixed(2)}</span>
              </Row>
              <Row label="Distance">
                <span className="font-mono">{data.distance.toFixed(4)} AU</span>
              </Row>
              <Row label="Light travel time">
                <span className="font-mono">{(data.distance * 499.0 / 60).toFixed(1)} min</span>
              </Row>
            </>
          )}
        </Section>

        {/* Moon-specific: next events */}
        {data.type === "moon" && (
          <Section title="Upcoming Phases">
            <Row label="Next Full Moon">
              <span className="text-slate-300 text-[11px]">
                {data.nextFull ? data.nextFull.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              </span>
            </Row>
            <Row label="Next New Moon">
              <span className="text-slate-300 text-[11px]">
                {data.nextNew ? data.nextNew.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              </span>
            </Row>
          </Section>
        )}

        {/* Sun-specific: observation warning */}
        {data.type === "sun" && data.altDeg > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            ⚠️ <strong>Never look at the Sun without certified solar filters.</strong> Even brief exposure can cause permanent eye damage.
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</div>
      <div className="flex flex-col gap-1 rounded-md border border-white/8 bg-white/[0.02] px-3 py-2">
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5 text-[12px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-200">{children}</span>
    </div>
  );
}
