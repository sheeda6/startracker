"use client";

/**
 * WelcomeOverlay — a first-visit onboarding overlay that introduces the key
 * features of StarTracker.
 *
 * Shows on first visit (localStorage flag) and can be re-opened via the
 * Help (?) button + a "Show welcome" option, or a dedicated button.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Telescope,
  Search,
  Clock,
  MapPin,
  Sparkles,
  Ruler,
  MoonStar,
  Keyboard,
  ChevronRight,
  X,
  Star,
  Eye,
  Zap,
} from "lucide-react";

const STORAGE_KEY = "startracker-welcome-seen";

export function WelcomeOverlay() {
  // Check localStorage once on mount; use a ref to avoid calling setState in effect.
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!show) return null;

  const features = [
    { icon: Star, title: "Interactive Sky Map", desc: "Click any star to inspect its full coordinates, rise/set times, and physical properties. Drag to rotate, scroll to zoom." },
    { icon: Search, title: "Search & Filter", desc: "Search by name, Bayer designation, HIP/HD number. Filter by magnitude, constellation, or visibility." },
    { icon: Clock, title: "Time Controls", desc: "Pause, fast-forward, or reverse time. See how the sky changes over hours or years." },
    { icon: MapPin, title: "Observer Location", desc: "Set your GPS coordinates or choose a preset. All calculations update in real time." },
    { icon: Sparkles, title: "Solar System", desc: "Track the Sun, Moon (with phases), and naked-eye planets. Includes Messier deep-sky objects." },
    { icon: Ruler, title: "Angular Measurement", desc: "Toggle measure mode and click two stars to measure the angular distance between them." },
    { icon: Zap, title: "Meteor Showers", desc: "See active meteor shower radiants with ZHR ratings and peak timing." },
    { icon: MoonStar, title: "Night Mode", desc: "Switch to red theme for dark adaptation. Press 'M' to toggle." },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md" onClick={dismiss}>
      <div
        className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-rose-500/20 px-6 pb-4 pt-6">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
          <button
            onClick={dismiss}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-100"
            aria-label="Close welcome"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 shadow-lg shadow-amber-500/30">
              <Telescope className="h-6 w-6 text-slate-950" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-sky-300 shadow-[0_0_8px] shadow-sky-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-50">
                Welcome to Star<span className="text-amber-300">Tracker</span>
              </h1>
              <p className="text-sm text-slate-400">Real-Time Astronomical Sky Tracker</p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-4" style={{ scrollbarWidth: "thin" }}>
          <p className="mb-4 text-sm text-slate-300">
            Explore the night sky with scientific accuracy. Here's what you can do:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.05]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
                  <Icon className="h-4 w-4 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-100">{title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-slate-400">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-400/[0.05] px-3 py-2">
            <Keyboard className="h-4 w-4 shrink-0 text-sky-300" />
            <span className="text-xs text-slate-300">
              Press <kbd className="rounded border border-white/15 bg-white/5 px-1 font-mono text-[10px] text-amber-300">?</kbd> anytime to see keyboard shortcuts.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-3">
          <span className="text-xs text-slate-500">
            IAU 2006 precession · Bennett refraction · Hipparcos catalog
          </span>
          <Button
            onClick={dismiss}
            className="bg-amber-400/90 text-slate-950 hover:bg-amber-300"
            size="sm"
          >
            Start Exploring
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
