"use client";

/**
 * StarTable — bottom panel showing the full star catalog with all 16 columns
 * required by the spec, sortable, filterable, and clickable to select.
 *
 * Columns: Name, Bayer, Flamsteed, HIP, HD, Magnitude, Spectral, Distance,
 * RA, Dec, Altitude, Azimuth, Rise, Transit, Set, Visible, Constellation.
 *
 * Uses TanStack Table for sorting + filtering. Computed columns (Alt, Az,
 * Rise/Transit/Set, Visible) are recomputed when the frame (time/observer)
 * changes via useMemo.
 */

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { useStarTracker } from "@/lib/store";
import { STARS, spectralColor, type Star } from "@/data/stars";
import { constellationName } from "@/data/constellations";
import { buildFrame, transformStar, refract } from "@/lib/astro/engine";
import { computeRiseTransitSet } from "@/lib/astro/riseSet";
import { formatHMS, formatDMS, formatDeg } from "@/lib/astro/time";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
} from "lucide-react";

interface StarRow extends Star {
  altDeg: number;
  azDeg: number;
  riseTime: string;
  transitTime: string;
  setTime: string;
  visible: boolean;
}

export function StarTable() {
  const observer = useStarTracker((s) => s.observer);
  const currentTime = useStarTracker((s) => s.currentTime);
  const search = useStarTracker((s) => s.search);
  const filters = useStarTracker((s) => s.filters);
  const layers = useStarTracker((s) => s.layers);
  const selectedHip = useStarTracker((s) => s.selectedHip);
  const setSelectedHip = useStarTracker((s) => s.setSelectedHip);
  const [sorting, setSorting] = useState<SortingState>([{ id: "mag", desc: false }]);

  // Throttle: rise/set times only need to recompute when the calendar DATE
  // changes (not every 100ms tick). At ×3600 fast-forward this prevents
  // 270 × 10Hz rise/set calculations from freezing the page.
  const dateKey = useMemo(() => {
    const d = currentTime;
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  }, [currentTime]);

  const tz = observer.timezone || "UTC";

  // Rise/transit/set — recomputed only when the date or observer changes.
  const riseSetCache = useMemo(() => {
    const latRad = (observer.latDeg * Math.PI) / 180;
    const lonRad = (observer.lonDeg * Math.PI) / 180;
    const fmtTime = (d: Date | null) => {
      if (!d) return "—";
      try {
        return new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(d);
      } catch {
        return d.toISOString().slice(11, 16);
      }
    };
    const cache = new Map<number, { rise: string; transit: string; set: string }>();
    for (const s of STARS) {
      const rs = computeRiseTransitSet({
        ra: s.ra,
        dec: s.dec,
        lat: latRad,
        lon: lonRad,
        date: currentTime,
      });
      cache.set(s.hip, {
        rise: fmtTime(rs.rise),
        transit: fmtTime(rs.transit),
        set: fmtTime(rs.set),
      });
    }
    return cache;
  }, [dateKey, observer.latDeg, observer.lonDeg, observer.elevationM, tz]);

  // Alt/Az — recomputed on every tick (lightweight, O(1) per star).
  const rows: StarRow[] = useMemo(() => {
    const frame = buildFrame({
      date: currentTime,
      lat: (observer.latDeg * Math.PI) / 180,
      lon: (observer.lonDeg * Math.PI) / 180,
      elevationM: observer.elevationM,
    });
    const latRad = (observer.latDeg * Math.PI) / 180;

    return STARS.map((s) => {
      const tr = transformStar(s.ra, s.dec, frame, latRad);
      let alt = tr.horizontal.alt;
      if (layers.refraction && alt < Math.PI / 2) alt = refract(alt);
      const rs = riseSetCache.get(s.hip)!;
      return {
        ...s,
        altDeg: (alt * 180) / Math.PI,
        azDeg: (tr.horizontal.az * 180) / Math.PI,
        riseTime: rs.rise,
        transitTime: rs.transit,
        setTime: rs.set,
        visible: alt > 0,
      } as StarRow;
    });
  }, [currentTime, observer, layers.refraction, riseSetCache]);

  // Apply filters
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (r.mag > filters.maxMagnitude) return false;
      if (filters.constellation !== "all" && r.constellation !== filters.constellation) return false;
      if (filters.minAltitude > -90 && r.altDeg < filters.minAltitude) return false;
      if (filters.visibleOnly && !r.visible) return false;
      if (q.length > 0) {
        const hay = [
          r.name, r.bayer, String(r.hip), String(r.hd),
          r.flamsteed > 0 ? String(r.flamsteed) : "",
          r.constellation, constellationName(r.constellation),
        ].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, filters]);

  const columns = useMemo<ColumnDef<StarRow>[]>(() => {
    const ch = createColumnHelper<StarRow>();
    return [
      ch.accessor("name", {
        header: "Name",
        cell: (i) => (
          <div className="flex items-center gap-2">
            {i.row.original.spectral && (
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{
                  background: `rgb(${spectralColor(i.row.original.spectral).join(",")})`,
                  boxShadow: `0 0 4px rgb(${spectralColor(i.row.original.spectral).join(",")})`,
                }}
              />
            )}
            <span className="font-medium text-slate-100">
              {i.getValue() || i.row.original.bayer || `HIP ${i.row.original.hip}`}
            </span>
          </div>
        ),
      }) as ColumnDef<StarRow>,
      ch.accessor("bayer", {
        header: "Bayer",
        cell: (i) => <span className="font-mono text-xs text-slate-300">{i.getValue() || "—"}</span>,
      }) as ColumnDef<StarRow>,
      ch.accessor("flamsteed", {
        header: "Flam",
        cell: (i) => <span className="font-mono text-xs text-slate-400">{i.getValue() > 0 ? i.getValue() : "—"}</span>,
      }) as ColumnDef<StarRow>,
      ch.accessor("hip", {
        header: "HIP",
        cell: (i) => <span className="font-mono text-xs text-sky-300">{i.getValue()}</span>,
      }) as ColumnDef<StarRow>,
      ch.accessor("hd", {
        header: "HD",
        cell: (i) => <span className="font-mono text-xs text-slate-400">{i.getValue() > 0 ? i.getValue() : "—"}</span>,
      }) as ColumnDef<StarRow>,
      ch.accessor("mag", {
        header: "Mag",
        cell: (i) => (
          <span className={`font-mono text-xs ${i.getValue() < 1 ? "text-amber-300" : i.getValue() < 3 ? "text-slate-100" : "text-slate-400"}`}>
            {i.getValue().toFixed(2)}
          </span>
        ),
      }) as ColumnDef<StarRow>,
      ch.accessor("spectral", {
        header: "Spec",
        cell: (i) => <span className="font-mono text-xs text-slate-300">{i.getValue()}</span>,
      }) as ColumnDef<StarRow>,
      ch.accessor("distanceLy", {
        header: "Dist (ly)",
        cell: (i) => <span className="font-mono text-xs text-slate-400">{i.getValue() > 0 ? i.getValue().toLocaleString() : "—"}</span>,
      }) as ColumnDef<StarRow>,
      ch.accessor("ra", {
        header: "RA",
        cell: (i) => <span className="font-mono text-xs text-slate-300">{formatHMS(i.getValue())}</span>,
        sortingFn: (a, b) => a.original.ra - b.original.ra,
      }) as ColumnDef<StarRow>,
      ch.accessor("dec", {
        header: "Dec",
        cell: (i) => <span className="font-mono text-xs text-slate-300">{formatDMS(i.getValue())}</span>,
        sortingFn: (a, b) => a.original.dec - b.original.dec,
      }) as ColumnDef<StarRow>,
      ch.accessor("altDeg", {
        header: "Alt",
        cell: (i) => (
          <span className={`font-mono text-xs ${i.getValue() > 0 ? "text-emerald-300" : "text-slate-500"}`}>
            {i.getValue().toFixed(1)}°
          </span>
        ),
      }) as ColumnDef<StarRow>,
      ch.accessor("azDeg", {
        header: "Az",
        cell: (i) => <span className="font-mono text-xs text-slate-400">{i.getValue().toFixed(1)}°</span>,
      }) as ColumnDef<StarRow>,
      ch.accessor("riseTime", {
        header: "Rise",
        cell: (i) => <span className="font-mono text-xs text-slate-400">{i.getValue()}</span>,
        enableSorting: false,
      }) as ColumnDef<StarRow>,
      ch.accessor("transitTime", {
        header: "Transit",
        cell: (i) => <span className="font-mono text-xs text-amber-300">{i.getValue()}</span>,
        enableSorting: false,
      }) as ColumnDef<StarRow>,
      ch.accessor("setTime", {
        header: "Set",
        cell: (i) => <span className="font-mono text-xs text-slate-400">{i.getValue()}</span>,
        enableSorting: false,
      }) as ColumnDef<StarRow>,
      ch.accessor("visible", {
        header: "Vis",
        cell: (i) => (
          i.getValue()
            ? <Eye className="h-3.5 w-3.5 text-emerald-400" />
            : <EyeOff className="h-3.5 w-3.5 text-slate-600" />
        ),
      }) as ColumnDef<StarRow>,
      ch.accessor("constellation", {
        header: "Con",
        cell: (i) => (
          <Badge variant="outline" className="border-white/15 bg-white/5 text-[10px] text-slate-300">
            {i.getValue()}
          </Badge>
        ),
      }) as ColumnDef<StarRow>,
    ];
  }, []);

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 backdrop-blur">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-100">Star Catalog</span>
          <Badge variant="outline" className="border-white/15 bg-white/5 text-[10px] text-slate-300">
            {filteredRows.length} / {STARS.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/10 bg-transparent text-slate-400 hover:bg-white/10 hover:text-slate-100"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/10 bg-transparent text-slate-400 hover:bg-white/10 hover:text-slate-100"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 font-mono text-xs text-slate-400">
            {table.getState().pagination.pageIndex + 1}/{table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/10 bg-transparent text-slate-400 hover:bg-white/10 hover:text-slate-100"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 border-white/10 bg-transparent text-slate-400 hover:bg-white/10 hover:text-slate-100"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Table body — scrollable */}
      <div className="flex-1 overflow-auto" style={{ scrollbarWidth: "thin" }}>
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-white/10 hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer whitespace-nowrap px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-slate-500">
                          {header.column.getIsSorted() === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-slate-500">
                  No stars match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isSelected = row.original.hip === selectedHip;
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={`cursor-pointer border-white/5 text-xs ${
                      isSelected
                        ? "bg-amber-400/15 hover:bg-amber-400/20"
                        : "hover:bg-white/5"
                    }`}
                    onClick={() => setSelectedHip(row.original.hip)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap px-2 py-1.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
