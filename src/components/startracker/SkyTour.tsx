"use client";

/**
 * SkyTour — a guided "What's Up Tonight" tour that cycles through visible
 * astronomical highlights (brightest stars, planets, Moon, Messier objects,
 * meteor shower radiants).
 *
 * A floating button opens the tour; clicking "Next" advances through the
 * highlights, selecting each one and showing a description card.
 */

import { useState, useMemo, useCallback } from "react";
import { useStarTracker } from "@/lib/store";
import { STARS, STARS_BY_HIP } from "@/data/stars";
import { MESSIER, MESSIER_BY_NUMBER } from "@/data/messier";
import { CONSTELLATION_MAP } from "@/data/constellations";
import { getActiveShowers } from "@/data/meteorShowers";
import { buildFrame, transformStar, refract } from "@/lib/astro/engine";
import { sunPosition, moonPosition, planetPositions, moonPhase } from "@/lib/astro/solarSystem";
import { constellationName } from "@/data/constellations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Compass,
  ChevronRight,
  X,
  Star,
  Sun,
  Moon,
  Orbit,
  Telescope,
  Zap,
  Sparkles,
} from "lucide-react";

interface TourStop {
  id: string;
  category: "star" | "planet" | "moon" | "sun" | "messier" | "meteor";
  title: string;
  subtitle: string;
  description: string;
  hip?: number;
  messierNumber?: number;
  icon: typeof Star;
  color: string;
}

export function SkyTour() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const layers = useStarTracker((s) => s.layers);
  const filters = useStarTracker((s) => s.filters);
  const setSelectedHip = useStarTracker((s) => s.setSelectedHip);

  // Build the list of tour stops for the current time/location
  const stops = useMemo<TourStop[]>(() => {
    const latRad = (observer.latDeg * Math.PI) / 180;
    const frame = buildFrame({
      date: currentTime,
      lat: latRad,
      lon: (observer.lonDeg * Math.PI) / 180,
      elevationM: observer.elevationM,
    });
    const stops: TourStop[] = [];

    // Brightest visible stars
    const visibleStars = STARS
      .filter((s) => s.mag <= Math.max(3, filters.maxMagnitude))
      .map((s) => {
        const tr = transformStar(s.ra, s.dec, frame, latRad);
        let alt = tr.horizontal.alt;
        if (layers.refraction && alt < Math.PI / 2) alt = refract(alt);
        return { star: s, alt };
      })
      .filter((x) => x.alt > 10 * Math.PI / 180)
      .sort((a, b) => a.star.mag - b.star.mag)
      .slice(0, 5);

    for (const { star } of visibleStars) {
      stops.push({
        id: `star-${star.hip}`,
        category: "star",
        title: star.name || star.bayer || `HIP ${star.hip}`,
        subtitle: `${star.spectral} · mag ${star.mag.toFixed(2)} · ${constellationName(star.constellation)}`,
        description: `${star.name || star.bayer} is ${star.distanceLy > 0 ? `${star.distanceLy.toLocaleString()} light-years away` : "a distant star"} in ${constellationName(star.constellation)}. ${star.mag < 1 ? "One of the brightest stars in the night sky." : "Visible to the naked eye."}`,
        hip: star.hip,
        icon: Star,
        color: "#fde68a",
      });
    }

    // Moon
    const moon = moonPosition(currentTime);
    const moonTr = transformStar(moon.ra, moon.dec, frame, latRad);
    if (moonTr.horizontal.alt > 0) {
      const phase = moonPhase(currentTime);
      stops.push({
        id: "moon",
        category: "moon",
        title: "The Moon",
        subtitle: `${phase.name} · ${(phase.illumination * 100).toFixed(0)}% illuminated`,
        description: `The Moon is ${((moonTr.horizontal.alt * 180) / Math.PI).toFixed(0)}° above the horizon, currently in its ${phase.name.toLowerCase()} phase. ${phase.illumination < 0.1 ? "Perfect for deep-sky observing." : phase.illumination > 0.8 ? "Bright moonlight will wash out faint objects." : "Moderate moonlight."}`,
        icon: Moon,
        color: "#e2e8f0",
      });
    }

    // Planets
    const planets = planetPositions(currentTime);
    for (const p of planets) {
      const tr = transformStar(p.ra, p.dec, frame, latRad);
      if (tr.horizontal.alt > 5 * Math.PI / 180) {
        stops.push({
          id: `planet-${p.name}`,
          category: "planet",
          title: p.name,
          subtitle: `${p.symbol} · mag ~${p.magnitude.toFixed(1)} · ${((tr.horizontal.alt * 180) / Math.PI).toFixed(0)}° alt`,
          description: `${p.name} is visible tonight at ${((tr.horizontal.alt * 180) / Math.PI).toFixed(0)}° altitude. ${p.name === "Venus" ? "The brightest planet, often called the Morning or Evening Star." : p.name === "Jupiter" ? "The largest planet, a rewarding telescopic target." : p.name === "Saturn" ? "Famous for its spectacular ring system." : p.name === "Mars" ? "The Red Planet, glowing with a distinctive orange hue." : "An inner planet, best seen near twilight."}`,
          icon: Orbit,
          color: p.color,
        });
      }
    }

    // Messier objects above horizon
    const visibleMessier = MESSIER
      .map((m) => {
        const tr = transformStar(m.ra, m.dec, frame, latRad);
        return { m, alt: tr.horizontal.alt };
      })
      .filter((x) => x.alt > 5 * Math.PI / 180 && x.m.magnitude < 8)
      .sort((a, b) => a.m.magnitude - b.m.magnitude)
      .slice(0, 3);

    for (const { m } of visibleMessier) {
      stops.push({
        id: `messier-${m.number}`,
        category: "messier",
        title: `M${m.number} ${m.name}`,
        subtitle: `${m.type} · mag ${m.magnitude.toFixed(1)} · ${constellationName(m.constellation)}`,
        description: `${m.name} (M${m.number}) is a ${m.type} in ${constellationName(m.constellation)}, ${m.distance > 0 ? `${m.distance.toLocaleString()} light-years away` : "a deep-sky object"}. ${m.magnitude < 4 ? "Visible to the naked eye under dark skies." : "Requires binoculars or a telescope."}`,
        messierNumber: m.number,
        icon: Telescope,
        color: "#fbbf24",
      });
    }

    // Active meteor showers
    const showers = getActiveShowers(currentTime);
    for (const s of showers) {
      const tr = transformStar(s.radiantRa, s.radiantDec, frame, latRad);
      if (tr.horizontal.alt > 0) {
        stops.push({
          id: `meteor-${s.id}`,
          category: "meteor",
          title: `${s.name} Meteor Shower`,
          subtitle: `ZHR ${s.zhr} · radiant in ${constellationName(s.constellation)}`,
          description: `The ${s.name} are active now, originating from ${s.parentBody}. The radiant is ${((tr.horizontal.alt * 180) / Math.PI).toFixed(0)}° above the horizon. Expected rate: up to ${s.zhr} meteors per hour at peak under ideal conditions.`,
          icon: Zap,
          color: "#fb923c",
        });
      }
    }

    return stops;
  }, [observer, currentTime, layers.refraction, filters.maxMagnitude]);

  const currentStop = stops[index];

  const handleNext = useCallback(() => {
    setIndex((i) => (i + 1) % stops.length);
  }, [stops.length]);

  const handlePrev = useCallback(() => {
    setIndex((i) => (i - 1 + stops.length) % stops.length);
  }, [stops.length]);

  const handleSelect = useCallback(() => {
    if (currentStop?.hip) {
      setSelectedHip(currentStop.hip);
    }
  }, [currentStop, setSelectedHip]);

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setIndex(0); }}
        className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1.5 text-xs font-medium text-amber-200 backdrop-blur-md transition-colors hover:bg-amber-400/25"
        title="Guided tour of tonight's highlights"
      >
        <Compass className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">What's Up Tonight</span>
        <span className="sm:hidden">Tour</span>
      </button>
    );
  }

  return (
    <Card className="absolute left-1/2 top-3 z-30 w-[340px] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 border-amber-400/30 bg-slate-950/95 p-0 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />
          What's Up Tonight
          <span className="ml-1 font-mono text-[10px] text-slate-500">
            {index + 1}/{stops.length}
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-slate-500 hover:text-slate-200"
          aria-label="Close tour"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      {currentStop ? (
        <div className="px-3 py-3">
          <div className="flex items-start gap-2.5">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${currentStop.color}22`, boxShadow: `0 0 8px ${currentStop.color}44` }}
            >
              <currentStop.icon className="h-4 w-4" style={{ color: currentStop.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-100">{currentStop.title}</div>
              <div className="mt-0.5 font-mono text-[10px] text-slate-400">{currentStop.subtitle}</div>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            {currentStop.description}
          </p>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="h-7 border-white/10 bg-white/5 px-2 text-[11px] text-slate-300 hover:bg-white/10"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
              Prev
            </Button>
            {currentStop.hip && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelect}
                className="h-7 border-amber-400/30 bg-amber-400/10 px-2 text-[11px] text-amber-200 hover:bg-amber-400/20"
              >
                <Star className="mr-1 h-3 w-3" />
                Inspect
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="ml-auto h-7 bg-amber-400/80 px-3 text-[11px] font-medium text-slate-950 hover:bg-amber-300"
            >
              Next
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          {/* Progress dots */}
          <div className="mt-2 flex justify-center gap-1">
            {stops.slice(0, 12).map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-amber-400" : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to stop ${i + 1}`}
              />
            ))}
            {stops.length > 12 && (
              <span className="text-[9px] text-slate-600">+{stops.length - 12}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="px-3 py-6 text-center text-xs text-slate-400">
          No visible highlights at the current time and location.
          Try adjusting the time or observer location.
        </div>
      )}
    </Card>
  );
}
