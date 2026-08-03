"use client";

/**
 * useWeather — fetches real-time weather for the observer's location.
 *
 * API: Open-Meteo (https://open-meteo.com) — completely free, no API key.
 * Refreshes every 15 minutes or when the observer location changes.
 *
 * Returns cloud cover, temperature, humidity, visibility, wind, dew point,
 * and derived observing metrics (transparency, seeing, dew risk).
 */

import { useEffect, useState, useRef } from "react";
import type { ObserverLocation } from "@/lib/store";

export interface WeatherData {
  temperature: number;      // °C
  humidity: number;         // % relative humidity
  cloudCover: number;       // % (0=clear, 100=overcast)
  visibility: number;       // metres
  windSpeed: number;        // km/h
  dewPoint: number;         // °C
  precipitation: number;    // mm (last hour)

  // Derived
  transparency: "Excellent" | "Good" | "Fair" | "Poor";
  transparencyScore: number;   // 0–1
  seeing: "Excellent" | "Good" | "Fair" | "Poor";
  seeingScore: number;         // 0–1
  dewRisk: "High" | "Moderate" | "Low";
  observingScore: number;      // 0–100 overall observing quality

  loading: boolean;
  error: string | null;
  updatedAt: Date | null;
}

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

function deriveMetrics(data: Omit<WeatherData, "transparency" | "transparencyScore" | "seeing" | "seeingScore" | "dewRisk" | "observingScore" | "loading" | "error" | "updatedAt">) {
  const { cloudCover, humidity, windSpeed, temperature, dewPoint } = data;

  // Transparency: mainly cloud cover + humidity
  const transp = Math.max(0, 1 - cloudCover / 100 * 0.8 - Math.max(0, humidity - 70) / 100 * 0.3);
  let transparency: WeatherData["transparency"];
  if (transp > 0.85) transparency = "Excellent";
  else if (transp > 0.65) transparency = "Good";
  else if (transp > 0.40) transparency = "Fair";
  else transparency = "Poor";

  // Seeing: mainly wind speed (lower = better) + stability
  const windFactor = Math.max(0, 1 - windSpeed / 60);
  const humFactor = Math.max(0, 1 - Math.max(0, humidity - 60) / 60 * 0.4);
  const seeingScore = windFactor * 0.6 + humFactor * 0.4;
  let seeing: WeatherData["seeing"];
  if (seeingScore > 0.80) seeing = "Excellent";
  else if (seeingScore > 0.60) seeing = "Good";
  else if (seeingScore > 0.40) seeing = "Fair";
  else seeing = "Poor";

  // Dew risk: temp - dew point spread (< 3°C = high risk)
  const spread = temperature - dewPoint;
  let dewRisk: WeatherData["dewRisk"];
  if (spread < 3) dewRisk = "High";
  else if (spread < 6) dewRisk = "Moderate";
  else dewRisk = "Low";

  // Overall observing score (0–100)
  const observingScore = Math.round(transp * 60 + seeingScore * 30 + (spread > 5 ? 10 : spread / 5 * 10));

  return { transparency, transparencyScore: transp, seeing, seeingScore, dewRisk, observingScore };
}

export function useWeather(observer: ObserverLocation): WeatherData {
  const [data, setData] = useState<WeatherData>({
    temperature: 0, humidity: 0, cloudCover: 0, visibility: 0,
    windSpeed: 0, dewPoint: 0, precipitation: 0,
    transparency: "Fair", transparencyScore: 0.5,
    seeing: "Fair", seeingScore: 0.5,
    dewRisk: "Low", observingScore: 50,
    loading: true, error: null, updatedAt: null,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch_() {
      try {
        const { latDeg: lat, lonDeg: lon } = observer;
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.searchParams.set("latitude", lat.toFixed(4));
        url.searchParams.set("longitude", lon.toFixed(4));
        url.searchParams.set("current", [
          "temperature_2m",
          "relative_humidity_2m",
          "dew_point_2m",
          "precipitation",
          "cloud_cover",
          "visibility",
          "wind_speed_10m",
        ].join(","));
        url.searchParams.set("wind_speed_unit", "kmh");

        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`Weather API HTTP ${res.status}`);
        const json = await res.json();
        const c = json.current;

        if (cancelled) return;

        const raw = {
          temperature: c.temperature_2m ?? 15,
          humidity: c.relative_humidity_2m ?? 50,
          cloudCover: c.cloud_cover ?? 30,
          visibility: c.visibility ?? 10000,
          windSpeed: c.wind_speed_10m ?? 10,
          dewPoint: c.dew_point_2m ?? 5,
          precipitation: c.precipitation ?? 0,
        };

        const derived = deriveMetrics(raw);
        setData({ ...raw, ...derived, loading: false, error: null, updatedAt: new Date() });
      } catch (err) {
        if (!cancelled) {
          setData((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : "Weather fetch failed",
          }));
        }
      }
    }

    fetch_();

    // Set up auto-refresh
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetch_, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [observer.latDeg, observer.lonDeg]);

  return data;
}
