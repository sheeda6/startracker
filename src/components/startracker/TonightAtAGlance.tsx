"use client";

/**
 * TonightAtAGlance — a compact dashboard summarizing the best observing
 * targets for the current night, with priority ranking.
 *
 * Shown inside a popover. Ranks targets by:
 *  - Altitude (higher = better)
 *  - Magnitude (brighter = better)
 *  - Moon interference (moon far from target = better)
 *  - Object type diversity (mix of stars, planets, DSOs)
 */

import { useMemo } from "react";
import { useStarTracker } from "@/lib/store";
import { STARS, STARS_BY_HIP } from "@/data/stars";
import { MESSIER } from "@/data/messier";
import { CONSTELLATION_MAP } from "@/data/constellations";
import { buildFrame, transformStar } from "@/lib/astro/engine";
import { sunPosition, moonPosition, planetPositions } from "@/lib/astro/solarSystem";
import { constellationName } from "@/data/constellations";
import { Telescope, Star, Orbit, Moon, TrendingUp, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Target {
  rank: number;
  name: string;
  type: "star" | "planet" | "moon" | "messier";
  mag: number;
  altDeg: number;
  constellation: string;
  score: number;
  reason: string;
  color: string;
  hip?: number;
}

export function TonightAtAGlance() {
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const setSelectedHip = useStarTracker((s) => s.setSelectedHip);

  const targets = useMemo<Target[]>(() => {
    const latRad = (observer.latDeg * Math.PI) / 180;
    const frame = buildFrame({
      date: currentTime,
      lat: latRad,
      lon: (observer.lonDeg * Math.PI) / 180,
      elevationM: observer.elevationM,
    });

    // Sun and Moon for interference check
    const sun = sunPosition(currentTime);
    const sunTr = transformStar(sun.ra, sun.dec, frame, latRad);
    const sunAltDeg = (sunTr.horizontal.alt * 180) / Math.PI;
    const moon = moonPosition(currentTime);
    const moonTr = transformStar(moon.ra, moon.dec, frame, latRad);

    // Angular separation helper
    const sep = (ra1: number, dec1: number, ra2: number, dec2: number) => {
      const cosD = Math.sin(dec1) * Math.sin(dec2) + Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);
      return Math.acos(Math.max(-1, Math.min(1, cosD))) * 180 / Math.PI;
    };

    const candidates: Omit<Target, "rank">[] = [];

    // Stars (top 10 brightest above horizon)
    for (const s of STARS) {
      if (s.mag > 2.5) continue;
      const tr = transformStar(s.ra, s.dec, frame, latRad);
      const altDeg = (tr.horizontal.alt * 180) / Math.PI;
      if (altDeg < 15) continue;
      const moonSep = sep(s.ra, s.dec, moon.ra, moon.dec);
      // Score: altitude + brightness + moon separation
      const score = altDeg * 0.5 + (3 - s.mag) * 15 + (moonSep > 30 ? 10 : 0);
      candidates.push({
        rank: 0,
        name: s.name || s.bayer || `HIP ${s.hip}`,
        type: "star",
        mag: s.mag,
        altDeg,
        constellation: s.constellation,
        score,
        reason: `${altDeg > 45 ? "High overhead" : "Well placed"} · ${moonSep > 30 ? "moon-free" : "near moon"}`,
        color: "#fde68a",
        hip: s.hip,
      });
    }

    // Planets
    for (const p of planetPositions(currentTime)) {
      const tr = transformStar(p.ra, p.dec, frame, latRad);
      const altDeg = (tr.horizontal.alt * 180) / Math.PI;
      if (altDeg < 15) continue;
      const moonSep = sep(p.ra, p.dec, moon.ra, moon.dec);
      const score = altDeg * 0.5 + (3 - p.magnitude) * 10 + (moonSep > 30 ? 10 : 0);
      candidates.push({
        rank: 0,
        name: p.name,
        type: "planet",
        mag: p.magnitude,
        altDeg,
        constellation: "—",
        score,
        reason: `${altDeg > 45 ? "High overhead" : "Well placed"} · ${p.symbol}`,
        color: p.color,
      });
    }

    // Moon (if up and sun is down)
    const moonAltDeg = (moonTr.horizontal.alt * 180) / Math.PI;
    if (moonAltDeg > 15 && sunAltDeg < 0) {
      candidates.push({
        rank: 0,
        name: "The Moon",
        type: "moon",
        mag: -12,
        altDeg: moonAltDeg,
        constellation: "—",
        score: moonAltDeg * 0.5 + 30,
        reason: `${moonAltDeg.toFixed(0)}° altitude`,
        color: "#e2e8f0",
      });
    }

    // Messier objects (brightest 3 above horizon)
    for (const m of MESSIER) {
      if (m.magnitude > 6) continue;
      const tr = transformStar(m.ra, m.dec, frame, latRad);
      const altDeg = (tr.horizontal.alt * 180) / Math.PI;
      if (altDeg < 15) continue;
      const moonSep = sep(m.ra, m.dec, moon.ra, moon.dec);
      const score = altDeg * 0.4 + (8 - m.magnitude) * 5 + (moonSep > 30 ? 10 : 0);
      candidates.push({
        rank: 0,
        name: `M${m.number} ${m.name}`,
        type: "messier",
        mag: m.magnitude,
        altDeg,
        constellation: m.constellation,
        score,
        reason: `${m.type} · ${m.magnitude < 4 ? "naked-eye" : "binoculars"}`,
        color: "#fbbf24",
      });
    }

    // Sort by score and take top 8
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, 8).map((c, i) => ({ ...c, rank: i + 1 }));
  }, [observer, currentTime]);

  const handleSelect = (t: Target) => {
    if (t.hip) setSelectedHip(t.hip);
  };

  const typeIcon = (type: Target["type"]) => {
    switch (type) {
      case "star": return Star;
      case "planet": return Orbit;
      case "moon": return Moon;
      case "messier": return Telescope;
    }
  };

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/80">
        <Telescope className="h-3.5 w-3.5" />
        Tonight at a Glance
      </div>
      <div className="flex items-center gap-1 text-[10px] text-slate-500">
        <TrendingUp className="h-3 w-3" />
        Top {targets.length} observing targets, ranked by score
      </div>

      <div className="space-y-1">
        {targets.map((t) => {
          const Icon = typeIcon(t.type);
          return (
            <button
              key={`${t.type}-${t.name}`}
              onClick={() => handleSelect(t)}
              className="flex w-full items-center gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-amber-400/30 hover:bg-amber-400/[0.05]"
            >
              {/* Rank badge */}
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                t.rank === 1 ? "bg-amber-400/20 text-amber-300" : "bg-white/5 text-slate-400"
              }`}>
                {t.rank}
              </div>
              {/* Icon */}
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: t.color }} />
              {/* Name + reason */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-medium text-slate-100">{t.name}</span>
                  {t.type !== "moon" && (
                    <span className="font-mono text-[9px] text-slate-500">m{t.mag.toFixed(1)}</span>
                  )}
                </div>
                <div className="truncate text-[10px] text-slate-400">{t.reason}</div>
              </div>
              {/* Altitude */}
              <div className="shrink-0 text-right">
                <div className="font-mono text-[11px] text-emerald-300">{t.altDeg.toFixed(0)}°</div>
                {t.constellation !== "—" && (
                  <Badge variant="outline" className="border-white/10 bg-white/5 px-1 text-[8px] text-slate-400">
                    {t.constellation}
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-1 flex items-center gap-1 border-t border-white/5 pt-2 text-[9px] text-slate-600">
        <Eye className="h-2.5 w-2.5" />
        Score = altitude + brightness + moon separation. Click to inspect.
      </div>
    </div>
  );
}
