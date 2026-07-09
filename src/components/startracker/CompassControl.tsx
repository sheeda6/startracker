"use client";

/**
 * CompassControl — a floating zoom/rotate control widget for the sky map.
 *
 * Shows:
 *  - A compass rose indicating North direction (updates with view.rotation)
 *  - Zoom in/out buttons + reset
 *  - Rotate left/right buttons
 *  - Current zoom level
 *
 * Positioned at the bottom-left of the sky map.
 */

import { useStarTracker } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Locate, Compass } from "lucide-react";

export function CompassControl() {
  const view = useStarTracker((s) => s.view);
  const setView = useStarTracker((s) => s.setView);

  const rotationDeg = (view.rotation * 180) / Math.PI;

  return (
    <div className="pointer-events-auto absolute bottom-14 right-3 z-20 flex flex-col items-center gap-2">
      {/* Compass rose */}
      <div className="relative h-16 w-16 rounded-full border border-white/15 bg-slate-950/85 backdrop-blur-md">
        <svg viewBox="0 0 64 64" className="h-full w-full">
          {/* Outer ring */}
          <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          {/* Rotating compass rose */}
          <g transform={`rotate(${rotationDeg} 32 32)`}>
            {/* N-S-E-W ticks */}
            <line x1="32" y1="4" x2="32" y2="12" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
            <line x1="32" y1="52" x2="32" y2="60" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4" y1="32" x2="12" y2="32" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="52" y1="32" x2="60" y2="32" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            {/* Diagonal ticks */}
            {[45, 135, 225, 315].map((a) => (
              <line
                key={a}
                x1={32 + Math.cos((a - 90) * Math.PI / 180) * 24}
                y1={32 + Math.sin((a - 90) * Math.PI / 180) * 24}
                x2={32 + Math.cos((a - 90) * Math.PI / 180) * 28}
                y2={32 + Math.sin((a - 90) * Math.PI / 180) * 28}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />
            ))}
          </g>
          {/* Cardinal letters (fixed) */}
          <text x="32" y="16" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="bold">N</text>
          <text x="32" y="56" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7">S</text>
          <text x="8" y="35" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7">W</text>
          <text x="56" y="35" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7">E</text>
          {/* Center dot */}
          <circle cx="32" cy="32" r="2" fill="#fbbf24" />
        </svg>
        {/* Rotation indicator */}
        {rotationDeg !== 0 && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-slate-900 px-1 font-mono text-[8px] text-amber-300">
            {rotationDeg.toFixed(0)}°
          </div>
        )}
      </div>

      {/* Zoom + rotate controls */}
      <div className="flex flex-col gap-1 rounded-lg border border-white/15 bg-slate-950/85 p-1 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-300 hover:bg-white/10 hover:text-amber-300"
          onClick={() => setView({ zoom: Math.min(4, view.zoom + 0.2) })}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <div className="px-1 text-center font-mono text-[9px] text-slate-400">
          {view.zoom.toFixed(1)}×
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-300 hover:bg-white/10 hover:text-amber-300"
          onClick={() => setView({ zoom: Math.max(0.6, view.zoom - 0.2) })}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <div className="my-0.5 h-px bg-white/10" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-300 hover:bg-white/10 hover:text-sky-300"
          onClick={() => setView({ rotation: view.rotation - Math.PI / 12 })}
          aria-label="Rotate left"
          title="Rotate left"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-300 hover:bg-white/10 hover:text-sky-300"
          onClick={() => setView({ rotation: view.rotation + Math.PI / 12 })}
          aria-label="Rotate right"
          title="Rotate right"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
        <div className="my-0.5 h-px bg-white/10" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-300 hover:bg-white/10 hover:text-amber-300"
          onClick={() => setView({ zoom: 1, rotation: 0 })}
          aria-label="Reset view"
          title="Reset view"
        >
          <Locate className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
