/**
 * Global application state for StarTracker.
 *
 * Holds:
 *  - observer location (lat/lon/elevation)
 *  - current time + clock mode (real-time / paused / fast-forward)
 *  - search query
 *  - filters (magnitude limit, constellation, altitude, visible-only, circumpolar)
 *  - selected star HIP
 *  - sky map view options (projection, layers, zoom)
 *  - UI layout (panel toggles)
 */

import { create } from "zustand";

export type ClockMode = "realtime" | "paused" | "fast" | "reverse" | "custom";

export interface ObserverLocation {
  latDeg: number;   // -90..90
  lonDeg: number;   // -180..180 (east positive)
  elevationM: number;
  label: string;
  timezone: string; // IANA tz name
}

export interface Filters {
  maxMagnitude: number;     // show stars brighter than this
  constellation: string;    // "" or IAU abbr; "all"
  minAltitude: number;      // degrees
  visibleOnly: boolean;
  circumpolarOnly: boolean;
  neverSetOnly: boolean;
}

export interface ViewLayers {
  grid: boolean;
  constellations: boolean;
  constellationNames: boolean;
  ecliptic: boolean;
  equator: boolean;
  milkyWay: boolean;
  cardinalDirections: boolean;
  starLabels: boolean;
  refraction: boolean;
  solarSystem: boolean;
  constellationBoundaries: boolean;
}

export interface ViewState {
  zoom: number;       // 1 = whole sky
  rotation: number;   // rotation offset in radians (0 = North up)
}

interface StarTrackerState {
  // Observer
  observer: ObserverLocation;
  setObserver: (o: Partial<ObserverLocation>) => void;
  requestGeolocation: () => void;

  // Time
  currentTime: Date;
  clockMode: ClockMode;
  timeSpeed: number;     // multiplier for fast/reverse
  setClockMode: (m: ClockMode) => void;
  setTimeSpeed: (s: number) => void;
  tickTime: (deltaMs: number) => void;
  setCurrentTime: (d: Date) => void;
  resetToNow: () => void;

  // Search
  search: string;
  setSearch: (s: string) => void;

  // Filters
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;

  // Selection
  selectedHip: number | null;
  hoveredHip: number | null;
  setSelectedHip: (h: number | null) => void;
  setHoveredHip: (h: number | null) => void;

  // View
  view: ViewState;
  layers: ViewLayers;
  setView: (v: Partial<ViewState>) => void;
  setLayers: (l: Partial<ViewLayers>) => void;

  // UI
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  settingsOpen: boolean;
  setRightPanelOpen: (b: boolean) => void;
  setBottomPanelOpen: (b: boolean) => void;
  setSettingsOpen: (b: boolean) => void;
}

export const useStarTracker = create<StarTrackerState>((set, get) => ({
  observer: {
    latDeg: 40.0,       // default mid-northern
    lonDeg: -74.0,      // ~New York
    elevationM: 30,
    label: "Default (40°N, 74°W)",
    timezone: "America/New_York",
  },
  setObserver: (o) =>
    set((s) => ({ observer: { ...s.observer, ...o } })),
  requestGeolocation: () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        set((s) => ({
          observer: {
            ...s.observer,
            latDeg: pos.coords.latitude,
            lonDeg: pos.coords.longitude,
            elevationM: pos.coords.altitude ?? s.observer.elevationM,
            label: `GPS (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`,
            timezone: tz,
          },
        }));
      },
      () => {
        // ignore errors silently
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  },

  currentTime: new Date(),
  clockMode: "realtime",
  timeSpeed: 60,
  setClockMode: (m) => set({ clockMode: m }),
  setTimeSpeed: (s) => set({ timeSpeed: s }),
  tickTime: (deltaMs) =>
    set((s) => {
      if (s.clockMode === "paused" || s.clockMode === "custom" || s.clockMode === "realtime") {
        if (s.clockMode === "realtime") return { currentTime: new Date() };
        return {};
      }
      const sign = s.clockMode === "reverse" ? -1 : 1;
      const step = (deltaMs * s.timeSpeed * sign) / 1000; // seconds
      return { currentTime: new Date(s.currentTime.getTime() + step * 1000) };
    }),
  setCurrentTime: (d) => set({ currentTime: d, clockMode: "custom" }),
  resetToNow: () => set({ currentTime: new Date(), clockMode: "realtime" }),

  search: "",
  setSearch: (s) => set({ search: s }),

  filters: {
    maxMagnitude: 5.0,
    constellation: "all",
    minAltitude: -90,
    visibleOnly: false,
    circumpolarOnly: false,
    neverSetOnly: false,
  },
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),

  selectedHip: null,
  hoveredHip: null,
  setSelectedHip: (h) => set({ selectedHip: h, rightPanelOpen: h != null }),
  setHoveredHip: (h) => set({ hoveredHip: h }),

  view: { zoom: 1, rotation: 0 },
  layers: {
    grid: true,
    constellations: true,
    constellationNames: true,
    ecliptic: true,
    equator: true,
    milkyWay: true,
    cardinalDirections: true,
    starLabels: true,
    refraction: true,
    solarSystem: true,
    constellationBoundaries: false,
  },
  setView: (v) => set((s) => ({ view: { ...s.view, ...v } })),
  setLayers: (l) => set((s) => ({ layers: { ...s.layers, ...l } })),

  rightPanelOpen: true,
  bottomPanelOpen: true,
  settingsOpen: false,
  setRightPanelOpen: (b) => set({ rightPanelOpen: b }),
  setBottomPanelOpen: (b) => set({ bottomPanelOpen: b }),
  setSettingsOpen: (b) => set({ settingsOpen: b }),
}));

/** Common preset locations for the observer dropdown. */
export const LOCATION_PRESETS: ObserverLocation[] = [
  { latDeg: 0, lonDeg: 0, elevationM: 0, label: "Equator (0°, 0°)", timezone: "UTC" },
  { latDeg: 90, lonDeg: 0, elevationM: 0, label: "North Pole", timezone: "UTC" },
  { latDeg: -90, lonDeg: 0, elevationM: 0, label: "South Pole", timezone: "UTC" },
  { latDeg: 40.7128, lonDeg: -74.006, elevationM: 10, label: "New York, USA", timezone: "America/New_York" },
  { latDeg: 51.5074, lonDeg: -0.1278, elevationM: 35, label: "London, UK", timezone: "Europe/London" },
  { latDeg: 35.6762, lonDeg: 139.6503, elevationM: 40, label: "Tokyo, Japan", timezone: "Asia/Tokyo" },
  { latDeg: -33.8688, lonDeg: 151.2093, elevationM: 58, label: "Sydney, Australia", timezone: "Australia/Sydney" },
  { latDeg: -29.0, lonDeg: 70.0, elevationM: 2400, label: "Cerro Pachón, Chile", timezone: "America/Santiago" },
  { latDeg: 19.8208, lonDeg: -155.4681, elevationM: 4205, label: "Mauna Kea, Hawaii", timezone: "Pacific/Honolulu" },
  { latDeg: 30.2447, lonDeg: 70.4581, elevationM: 1300, label: "Lahore, Pakistan", timezone: "Asia/Karachi" },
  { latDeg: 24.8607, lonDeg: 67.0011, elevationM: 10, label: "Karachi, Pakistan", timezone: "Asia/Karachi" },
];
