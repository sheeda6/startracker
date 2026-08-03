"use client";

/**
 * WeatherPanel — real-time weather dashboard for the observer's location.
 *
 * Data from Open-Meteo API (free, no key). Shows:
 *  - Cloud cover with visual bar
 *  - Temperature + dew point + dew risk
 *  - Humidity
 *  - Visibility
 *  - Wind speed
 *  - Derived atmospheric transparency & seeing
 *  - Overall observing score
 *  - Last-updated timestamp
 */

import { useStarTracker } from "@/lib/store";
import { useWeather } from "@/hooks/useWeather";
import {
  Cloud, Thermometer, Droplets, Wind, Eye,
  Telescope, Loader2, RefreshCw, AlertTriangle,
} from "lucide-react";

function QualityBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${value * 100}%`, background: color }} />
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const grade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : score >= 35 ? "D" : "F";
  const color = score >= 80 ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
    : score >= 65 ? "text-sky-300 border-sky-500/40 bg-sky-500/10"
    : score >= 50 ? "text-amber-300 border-amber-500/40 bg-amber-500/10"
    : "text-rose-300 border-rose-500/40 bg-rose-500/10";
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${color}`}>
      <div className="text-3xl font-bold">{grade}</div>
      <div className="text-[10px] uppercase tracking-wide">{score}/100</div>
    </div>
  );
}

function qualityColor(q: "Excellent" | "Good" | "Fair" | "Poor") {
  if (q === "Excellent") return "text-emerald-300";
  if (q === "Good") return "text-sky-300";
  if (q === "Fair") return "text-amber-300";
  return "text-rose-300";
}

function barColor(q: "Excellent" | "Good" | "Fair" | "Poor") {
  if (q === "Excellent") return "#6ee7b7";
  if (q === "Good") return "#7dd3fc";
  if (q === "Fair") return "#fcd34d";
  return "#fca5a5";
}

export function WeatherPanel() {
  const observer = useStarTracker((s) => s.observer);
  const w = useWeather(observer);

  const cloudColor = w.cloudCover < 20 ? "#6ee7b7" : w.cloudCover < 60 ? "#fcd34d" : "#fca5a5";
  const humColor = w.humidity < 60 ? "#6ee7b7" : w.humidity < 80 ? "#fcd34d" : "#fca5a5";
  const tempSpread = w.temperature - w.dewPoint;

  return (
    <div className="flex w-full flex-col gap-4 rounded-lg border border-white/10 bg-slate-950/60 p-4 text-slate-200 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-300/80">
          <Cloud className="h-3.5 w-3.5" />
          Current Weather
        </div>
        {w.updatedAt && (
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <RefreshCw className="h-2.5 w-2.5" />
            {w.updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {w.loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Fetching weather…</span>
        </div>
      ) : w.error ? (
        <div className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {w.error}
        </div>
      ) : (
        <>
          {/* Overall score + transparency/seeing */}
          <div className="flex gap-3">
            <ScoreBadge score={w.observingScore} />
            <div className="flex flex-1 flex-col gap-2">
              <div>
                <div className="mb-1 flex justify-between text-[10px]">
                  <span className="text-slate-500">Transparency</span>
                  <span className={qualityColor(w.transparency)}>{w.transparency}</span>
                </div>
                <QualityBar value={w.transparencyScore} color={barColor(w.transparency)} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[10px]">
                  <span className="text-slate-500">Seeing</span>
                  <span className={qualityColor(w.seeing)}>{w.seeing}</span>
                </div>
                <QualityBar value={w.seeingScore} color={barColor(w.seeing)} />
              </div>
            </div>
          </div>

          {/* Cloud cover */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-slate-500">
                <Cloud className="h-3 w-3" /> Cloud Cover
              </span>
              <span className="font-mono" style={{ color: cloudColor }}>{w.cloudCover}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div className="h-1.5 rounded-full" style={{ width: `${w.cloudCover}%`, background: cloudColor }} />
            </div>
            <div className="mt-0.5 text-[10px] text-slate-600">
              {w.cloudCover < 10 ? "Clear sky ✓" : w.cloudCover < 30 ? "Mostly clear" : w.cloudCover < 60 ? "Partly cloudy" : w.cloudCover < 85 ? "Mostly overcast" : "Overcast ✗"}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <WeatherStat icon={<Thermometer className="h-3 w-3 text-amber-300" />} label="Temperature" value={`${w.temperature.toFixed(1)}°C`} />
            <WeatherStat icon={<Thermometer className="h-3 w-3 text-sky-300" />} label="Dew Point" value={`${w.dewPoint.toFixed(1)}°C`} />
            <WeatherStat
              icon={<Droplets className="h-3 w-3" style={{ color: humColor }} />}
              label="Humidity"
              value={`${w.humidity}%`}
              valueColor={w.humidity > 80 ? "text-amber-300" : "text-slate-200"}
            />
            <WeatherStat icon={<Eye className="h-3 w-3 text-slate-400" />} label="Visibility" value={w.visibility >= 10000 ? ">10 km" : `${(w.visibility / 1000).toFixed(1)} km`} />
            <WeatherStat icon={<Wind className="h-3 w-3 text-slate-400" />} label="Wind" value={`${w.windSpeed.toFixed(0)} km/h`} />
            <WeatherStat icon={<Telescope className="h-3 w-3 text-slate-400" />} label="Temp spread" value={`${tempSpread.toFixed(1)}°`} />
          </div>

          {/* Dew risk */}
          {w.dewRisk !== "Low" && (
            <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-[11px] ${
              w.dewRisk === "High"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                : "border-amber-500/30 bg-amber-500/10 text-amber-200"
            }`}>
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
              <div>
                <strong>Dew risk {w.dewRisk.toLowerCase()}</strong> (spread {tempSpread.toFixed(1)}°C).
                {w.dewRisk === "High"
                  ? " Use a dew heater on eyepieces and corrector plates."
                  : " Monitor optics for condensation."}
              </div>
            </div>
          )}

          {/* Precipitation */}
          {w.precipitation > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-[11px] text-blue-200">
              <Droplets className="h-3.5 w-3.5 shrink-0" />
              Precipitation: {w.precipitation.toFixed(1)} mm in last hour. Observing not recommended.
            </div>
          )}

          <div className="text-[10px] text-slate-600">
            Source: Open-Meteo · {observer.latDeg.toFixed(2)}°, {observer.lonDeg.toFixed(2)}°
          </div>
        </>
      )}
    </div>
  );
}

function WeatherStat({ icon, label, value, valueColor = "text-slate-200" }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.02] px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </div>
      <div className={`mt-1 font-mono text-sm ${valueColor}`}>{value}</div>
    </div>
  );
}
