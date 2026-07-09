"use client";

/**
 * StarDetails — right-hand panel showing full information for the selected star.
 *
 * Displays every coordinate system required by the spec:
 *  - ICRS / J2000 RA & Dec
 *  - Apparent (date) RA & Dec (precession + nutation applied)
 *  - Horizontal: Altitude, Azimuth, Zenith angle, Airmass
 *  - Galactic: l, b
 *  - Ecliptic: longitude, latitude
 *  - Cartesian unit vector
 *
 * Plus rise/transit/set times, visibility info, spectral color swatch,
 * and a 24h altitude graph (rendered on a small canvas).
 */

import { useEffect, useMemo, useRef } from "react";
import { useStarTracker } from "@/lib/store";
import { STARS_BY_HIP, spectralColor, type Star } from "@/data/stars";
import { constellationName } from "@/data/constellations";
import { buildFrame, transformStar, refract } from "@/lib/astro/engine";
import { computeRiseTransitSet } from "@/lib/astro/riseSet";
import {
  formatHMS,
  formatDMS,
  formatDeg,
  radToHms,
  radToDms,
} from "@/lib/astro/time";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { X, Star as StarIcon, Compass, Globe2, Clock, Activity } from "lucide-react";

export function StarDetails() {
  const selectedHip = useStarTracker((s) => s.selectedHip);
  const setSelectedHip = useStarTracker((s) => s.setSelectedHip);
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const layers = useStarTracker((s) => s.layers);
  const open = useStarTracker((s) => s.rightPanelOpen);

  const star: Star | undefined = selectedHip != null ? STARS_BY_HIP.get(selectedHip) : undefined;

  const frame = useMemo(
    () =>
      buildFrame({
        date: currentTime,
        lat: (observer.latDeg * Math.PI) / 180,
        lon: (observer.lonDeg * Math.PI) / 180,
        elevationM: observer.elevationM,
      }),
    [currentTime, observer.latDeg, observer.lonDeg, observer.elevationM]
  );

  const transformed = useMemo(() => {
    if (!star) return null;
    return transformStar(star.ra, star.dec, frame, (observer.latDeg * Math.PI) / 180);
  }, [star, frame, observer.latDeg]);

  const riseSet = useMemo(() => {
    if (!star) return null;
    return computeRiseTransitSet({
      ra: star.ra,
      dec: star.dec,
      lat: (observer.latDeg * Math.PI) / 180,
      lon: (observer.lonDeg * Math.PI) / 180,
      date: currentTime,
    });
  }, [star, observer.latDeg, observer.lonDeg, currentTime]);

  if (!open || !star || !transformed) {
    return null;
  }

  const [cr, cg, cb] = spectralColor(star.spectral);
  const tz = observer.timezone || "UTC";
  const fmtTz = (d: Date | null) => {
    if (!d) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(d);
    } catch {
      return d.toUTCString().slice(17, 25);
    }
  };
  const fmtDate = (d: Date | null) => {
    if (!d) return "—";
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        month: "short",
        day: "numeric",
      }).format(d);
    } catch {
      return d.toISOString().slice(5, 10);
    }
  };

  const isVisible = transformed.horizontal.alt > 0;
  const isCircumpolar = riseSet?.circumpolar ?? false;
  const neverRises = riseSet?.neverRises ?? false;

  return (
    <Card className="flex h-full flex-col overflow-hidden border-white/10 bg-slate-950/70 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-white/10 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle, rgb(${cr},${cg},${cb}) 0%, rgba(${cr},${cg},${cb},0.25) 70%, transparent 100%)`,
              boxShadow: `0 0 14px rgba(${cr},${cg},${cb},0.5)`,
            }}
          >
            <StarIcon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-slate-50">
              {star.name || star.bayer || `HIP ${star.hip}`}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              {star.bayer && <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">{star.bayer}</Badge>}
              {star.flamsteed > 0 && <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">{star.flamsteed} {star.constellation}</Badge>}
              <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-200">{constellationName(star.constellation)}</Badge>
            </div>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-slate-400 hover:bg-white/10 hover:text-slate-100"
          onClick={() => setSelectedHip(null)}
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-200" style={{ scrollbarWidth: "thin" }}>
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatBox label="Magnitude" value={star.mag.toFixed(2)} icon={<Activity className="h-3 w-3" />} />
          <StatBox label="Spectral" value={star.spectral} swatch={`rgb(${cr},${cg},${cb})`} />
          <StatBox label="Distance" value={star.distanceLy > 0 ? `${star.distanceLy.toLocaleString()} ly` : "—"} />
          <StatBox
            label="Visibility"
            value={isVisible ? "Above horizon" : isCircumpolar ? "Circumpolar" : neverRises ? "Never rises" : "Below horizon"}
            valueClass={isVisible ? "text-emerald-300" : "text-slate-400"}
          />
        </div>

        {/* Coordinate systems */}
        <SectionTitle icon={<Globe2 className="h-3.5 w-3.5" />} title="Equatorial (J2000 / ICRS)" />
        <CoordGrid rows={[
          ["Right Ascension", formatHMS(star.ra)],
          ["Declination", formatDMS(star.dec)],
          ["RA (decimal)", `${(star.ra * 12 / Math.PI).toFixed(5)} h`],
          ["Dec (decimal)", `${(star.dec * 180 / Math.PI).toFixed(5)}°`],
        ]} />

        <SectionTitle icon={<Globe2 className="h-3.5 w-3.5" />} title="Apparent (date)" />
        <CoordGrid rows={[
          ["Apparent RA", formatHMS(transformed.apparent.ra)],
          ["Apparent Dec", formatDMS(transformed.apparent.dec)],
        ]} />

        <SectionTitle icon={<Compass className="h-3.5 w-3.5" />} title="Horizontal" />
        <CoordGrid rows={[
          ["Altitude", formatDeg(transformed.horizontal.alt)],
          ["Azimuth", formatDeg(transformed.horizontal.az)],
          ["Zenith angle", formatDeg(transformed.horizontal.zenithAngle)],
          ["Airmass", transformed.horizontal.airmass === Infinity ? "∞" : transformed.horizontal.airmass.toFixed(3)],
          ["Altitude (refracted)", formatDeg(refract(transformed.horizontal.alt))],
        ]} />

        <SectionTitle icon={<Globe2 className="h-3.5 w-3.5" />} title="Galactic" />
        <CoordGrid rows={[
          ["l (longitude)", formatDeg(transformed.galactic.l)],
          ["b (latitude)", formatDeg(transformed.galactic.b)],
        ]} />

        <SectionTitle icon={<Globe2 className="h-3.5 w-3.5" />} title="Ecliptic (date)" />
        <CoordGrid rows={[
          ["λ (longitude)", formatDeg(transformed.ecliptic.lon)],
          ["β (latitude)", formatDeg(transformed.ecliptic.lat)],
        ]} />

        <SectionTitle icon={<Globe2 className="h-3.5 w-3.5" />} title="Cartesian unit vector" />
        <CoordGrid rows={[
          ["x", (Math.cos(star.ra) * Math.cos(star.dec)).toFixed(5)],
          ["y", (Math.sin(star.ra) * Math.cos(star.dec)).toFixed(5)],
          ["z", Math.sin(star.dec).toFixed(5)],
        ]} />

        {/* Rise / Transit / Set */}
        <SectionTitle icon={<Clock className="h-3.5 w-3.5" />} title="Rise · Transit · Set" />
        <div className="mb-4 grid grid-cols-3 gap-2">
          <TimeBox label="Rise" time={fmtTz(riseSet?.rise ?? null)} date={fmtDate(riseSet?.rise ?? null)} dim={!riseSet?.rise} />
          <TimeBox label="Transit" time={fmtTz(riseSet?.transit ?? null)} date={fmtDate(riseSet?.transit ?? null)} highlight />
          <TimeBox label="Set" time={fmtTz(riseSet?.set ?? null)} date={fmtDate(riseSet?.set ?? null)} dim={!riseSet?.set} />
        </div>

        {/* Catalog IDs */}
        <SectionTitle icon={<Globe2 className="h-3.5 w-3.5" />} title="Catalog IDs" />
        <CoordGrid rows={[
          ["HIP", String(star.hip)],
          ["HD", star.hd > 0 ? String(star.hd) : "—"],
          ["Flamsteed", star.flamsteed > 0 ? String(star.flamsteed) : "—"],
          ["Constellation", `${star.constellation} · ${constellationName(star.constellation)}`],
          ["Proper motion RA", `${star.pmRa.toFixed(2)} mas/yr`],
          ["Proper motion Dec", `${star.pmDec.toFixed(2)} mas/yr`],
        ]} />

        {/* Altitude graph */}
        <SectionTitle icon={<Activity className="h-3.5 w-3.5" />} title="24-hour altitude curve" />
        <AltitudeGraph
          star={star}
          observer={observer}
          baseDate={currentTime}
          refraction={layers.refraction}
        />
      </div>
    </Card>
  );
}

function StatBox({
  label,
  value,
  icon,
  swatch,
  valueClass,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  swatch?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <div className={`mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-100 ${valueClass ?? ""}`}>
        {swatch && <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: swatch, boxShadow: `0 0 6px ${swatch}` }} />}
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
      {icon}
      {title}
      <Separator className="ml-2 flex-1 bg-white/10" />
    </div>
  );
}

function CoordGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mb-1 grid grid-cols-1 gap-y-0.5 rounded-md border border-white/5 bg-white/[0.02] p-2.5">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-slate-400">{k}</span>
          <span className="font-mono text-slate-100 text-right">{v}</span>
        </div>
      ))}
    </div>
  );
}

function TimeBox({
  label,
  time,
  date,
  highlight,
  dim,
}: {
  label: string;
  time: string;
  date: string;
  highlight?: boolean;
  dim?: boolean;
}) {
  return (
    <div className={`rounded-md border px-2 py-1.5 text-center ${
      highlight ? "border-amber-400/30 bg-amber-400/10" : "border-white/10 bg-white/[0.03]"
    } ${dim ? "opacity-40" : ""}`}>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`font-mono text-sm ${highlight ? "text-amber-200" : "text-slate-100"}`}>{time}</div>
      <div className="text-[10px] text-slate-500">{date}</div>
    </div>
  );
}

/**
 * 24-hour altitude curve rendered on a small canvas. The x-axis is local time
 * (0–24h), the y-axis is altitude (-90°..+90°). Highlights the current time
 * and the horizon.
 */
function AltitudeGraph({
  star,
  observer,
  baseDate,
  refraction,
}: {
  star: Star;
  observer: { latDeg: number; lonDeg: number; elevationM: number; timezone: string };
  baseDate: Date;
  refraction: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = 140;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "rgba(2, 6, 23, 0.6)";
    ctx.fillRect(0, 0, w, h);

    const padL = 28, padR = 8, padT = 8, padB = 18;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Grid: altitude -90..90 every 30°
    ctx.strokeStyle = "rgba(120, 150, 200, 0.12)";
    ctx.lineWidth = 0.5;
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let altDeg = -90; altDeg <= 90; altDeg += 30) {
      const y = padT + plotH * (1 - (altDeg + 90) / 180);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.fillText(`${altDeg}°`, padL - 4, y);
    }
    // Horizon (alt=0) emphasized
    ctx.strokeStyle = "rgba(252, 211, 77, 0.4)";
    ctx.lineWidth = 1;
    const yHoriz = padT + plotH * (1 - (0 + 90) / 180);
    ctx.beginPath();
    ctx.moveTo(padL, yHoriz);
    ctx.lineTo(w - padR, yHoriz);
    ctx.stroke();

    // Time axis labels (0, 6, 12, 18, 24)
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let hr = 0; hr <= 24; hr += 6) {
      const x = padL + (hr / 24) * plotW;
      ctx.fillText(`${hr}h`, x, h - padB + 3);
    }

    // Compute altitude curve
    const latRad = (observer.latDeg * Math.PI) / 180;
    const lonRad = (observer.lonDeg * Math.PI) / 180;
    const startMs = Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate(),
    );
    const pts: { x: number; y: number; alt: number }[] = [];
    for (let i = 0; i <= 96; i++) {
      const t = startMs + (i / 96) * 24 * 3600 * 1000;
      const d = new Date(t);
      const frame = buildFrame({ date: d, lat: latRad, lon: lonRad, elevationM: observer.elevationM });
      const tr = transformStar(star.ra, star.dec, frame, latRad);
      let alt = tr.horizontal.alt;
      if (refraction && alt < Math.PI / 2) alt = refract(alt);
      const x = padL + (i / 96) * plotW;
      const y = padT + plotH * (1 - ((alt * 180) / Math.PI + 90) / 180);
      pts.push({ x, y, alt });
    }

    // Fill below horizon in red tint
    ctx.fillStyle = "rgba(127, 29, 29, 0.25)";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, yHoriz);
    for (const p of pts) {
      ctx.lineTo(p.x, p.alt >= 0 ? p.y : yHoriz);
    }
    ctx.lineTo(pts[pts.length - 1].x, yHoriz);
    ctx.fill();

    // Fill above horizon in cyan tint
    ctx.fillStyle = "rgba(56, 189, 248, 0.18)";
    ctx.beginPath();
    ctx.moveTo(pts[0].x, yHoriz);
    for (const p of pts) {
      ctx.lineTo(p.x, p.alt >= 0 ? p.y : yHoriz);
    }
    ctx.lineTo(pts[pts.length - 1].x, yHoriz);
    ctx.closePath();
    ctx.fill();

    // The curve itself
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (const p of pts) {
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();

    // Current-time marker
    const nowMs = baseDate.getTime();
    const dayFrac = ((nowMs - startMs) / (24 * 3600 * 1000) + 24) % 24;
    const cx = padL + (dayFrac / 24) * plotW;
    ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(cx, padT);
    ctx.lineTo(cx, h - padB);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current altitude dot
    const idx = Math.min(pts.length - 1, Math.max(0, Math.round(dayFrac * 96)));
    if (pts[idx]) {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(pts[idx].x, pts[idx].y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [star, observer, baseDate, refraction]);

  return <canvas ref={canvasRef} className="w-full" aria-label="24 hour altitude curve" />;
}
