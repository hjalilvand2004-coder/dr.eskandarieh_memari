"use client";

/**
 * Atlas3DView — نمای سه‌بعدی بافت با MapLibre GL (fill-extrusion)
 * - کاملاً آفلاین: استایل سفارشی بدون کاشی اینترنتی/گلیف
 * - مختصات محلی (متر) به مختصات جغرافیایی بافت تاریخی شیراز نگاشت می‌شود (نمایشی)
 * - ارتفاع واقعی بناها (با ضریب نمایشی اختیاری)، رنگ شاخص‌محور هماهنگ با نمای دوبعدی
 * - انتخاب بنا با کلیک — همگام با پنل مشخصات و نمودارها
 */
import * as React from "react";
import { Map as MapLibreMap, NavigationControl, ScaleControl, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// کارگر MapLibre از فایل همراه سامانه (public) بارگذاری می‌شود تا باندلر/آفلاین مشکلی نداشته باشد
setWorkerUrl("/maplibre-gl-worker.js");

// ── پارامترهای نگاشت نمایشی به بافت تاریخی شیراز ──
const LAT0 = 29.6103; // نزدیک ارگ کریم‌خان — محل نمایشی
const LNG0 = 52.5350;
const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LNG = 111320 * Math.cos((LAT0 * Math.PI) / 180);

export interface Atlas3DBuilding {
  code: string;
  polygon: [number, number][];
  courtyard: [number, number][] | null;
  heightM: number;
  color: string; // hex نهایی (شامل حالت انتخاب/کم‌رنگ)
}

export interface Atlas3DBlock {
  code: string;
  polygon: [number, number][];
}

export interface Atlas3DViewProps {
  buildings: Atlas3DBuilding[];
  blocks: Atlas3DBlock[];
  selected: string | null;
  onSelect: (code: string) => void;
  showBlocks: boolean;
  showCourtyards: boolean;
  bg: string;
  ariaLabel?: string;
}

const toLngLat = (x: number, y: number): [number, number] => [LNG0 + x / M_PER_DEG_LNG, LAT0 + y / M_PER_DEG_LAT];

function closeRing(ring: [number, number][]) {
  if (!ring.length) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  const closed = ring.map(([x, y]) => toLngLat(x, y));
  if (first[0] !== last[0] || first[1] !== last[1]) closed.push(closed[0]);
  return closed;
}

export default function Atlas3DView({ buildings, blocks, selected, onSelect, showBlocks, showCourtyards, bg, ariaLabel }: Atlas3DViewProps) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const bootedRef = React.useRef(false);
  const [exaggeration, setExaggeration] = React.useState("2");
  const exaggerationRef = React.useRef(2);
  const onSelectRef = React.useRef(onSelect);
  React.useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const buildingGeoJSON = React.useCallback(
    (exag: number) => ({
      type: "FeatureCollection" as const,
      features: buildings.map((b) => ({
        type: "Feature" as const,
        properties: { code: b.code, color: b.color, height: Math.max(2.2, b.heightM * exag) },
        geometry: { type: "Polygon" as const, coordinates: [closeRing(b.polygon)] },
      })),
    }),
    [buildings]
  );

  // ── راه‌اندازی نقشه (یک‌بار) ──
  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount || mapRef.current) return;

    const map = new MapLibreMap({
      container: mount,
      attributionControl: false,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "bg", type: "background", paint: { "background-color": bg } }],
      },
      center: [LNG0, LAT0],
      zoom: 16,
      pitch: 52,
      bearing: -18,
      maxPitch: 75,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new ScaleControl({ unit: "metric" }), "bottom-left");

    const boot = () => {
      if (bootedRef.current || !map.isStyleLoaded()) return;
      bootedRef.current = true;

      map.addSource("courtyards", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: buildings
            .filter((b) => b.courtyard)
            .map((b) => ({
              type: "Feature" as const,
              properties: { code: b.code },
              geometry: { type: "Polygon" as const, coordinates: [closeRing(b.courtyard!)] },
            })),
        },
      });
      map.addLayer({
        id: "courtyard-fill",
        type: "fill",
        source: "courtyards",
        paint: { "fill-color": "#7a8c5c", "fill-opacity": 0.55 },
      });

      map.addSource("blocks", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: blocks.map((bl) => ({
            type: "Feature" as const,
            properties: { code: bl.code },
            geometry: { type: "LineString" as const, coordinates: closeRing(bl.polygon) },
          })),
        },
      });
      map.addLayer({
        id: "block-line",
        type: "line",
        source: "blocks",
        paint: { "line-color": "#b4693b", "line-width": 1.4, "line-dasharray": [2, 1.5] },
      });

      map.addSource("buildings", { type: "geojson", data: buildingGeoJSON(exaggerationRef.current) });
      map.addLayer({
        id: "building-3d",
        type: "fill-extrusion",
        source: "buildings",
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.96,
        },
      });

      // فیت کردن دوربین روی محدوده
      const lngs = buildings.flatMap((b) => b.polygon.map(([x]) => LNG0 + x / M_PER_DEG_LNG));
      const lats = buildings.flatMap((b) => b.polygon.map(([, y]) => LAT0 + y / M_PER_DEG_LAT));
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 56, duration: 0, maxZoom: 17.5 }
      );
      map.jumpTo({ center: map.getCenter(), zoom: map.getZoom(), pitch: 52, bearing: -18 });

      map.on("click", "building-3d", (e) => {
        const f = e.features?.[0];
        if (f) onSelectRef.current(String(f.properties?.code ?? ""));
      });
      map.on("mouseenter", "building-3d", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "building-3d", () => (map.getCanvas().style.cursor = ""));
    };

    map.on("load", boot);
    if (map.isStyleLoaded()) boot();

    return () => {
      bootedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── به‌روزرسانی رنگ/ارتفاع بناها ──
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !bootedRef.current) return;
    const src = map.getSource("buildings") as GeoJSONSource | undefined;
    const exag = Number(exaggeration);
    exaggerationRef.current = exag;
    src?.setData(buildingGeoJSON(exag));
  }, [buildingGeoJSON, exaggeration]);

  // ── نمایش/پنهان‌سازی لایه‌ها ──
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !bootedRef.current) return;
    if (map.getLayer("block-line")) map.setLayoutProperty("block-line", "visibility", showBlocks ? "visible" : "none");
    if (map.getLayer("courtyard-fill")) map.setLayoutProperty("courtyard-fill", "visibility", showCourtyards ? "visible" : "none");
  }, [showBlocks, showCourtyards]);

  // ── رنگ پس‌زمینه هماهنگ با تم ──
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !bootedRef.current) return;
    if (map.getLayer("bg")) map.setPaintProperty("bg", "background-color", bg);
  }, [bg]);

  return (
    <div className="relative w-full h-[420px] md:h-[520px]" aria-label={ariaLabel ?? "نمای سه‌بعدی بافت"}>
      {/* کانتینر نقشه: maplibre خودش کلاس maplibregl-map (relative) را به همین div اضافه می‌کند */}
      <div ref={mountRef} className="h-full w-full" />
      <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none">
        <div className="flex flex-wrap gap-1.5 pointer-events-auto">
          <Badge variant="outline" className="text-[10px] bg-background/85 backdrop-blur">هندسه: داده نمایشی سامانه</Badge>
          <Badge variant="outline" className="text-[10px] bg-background/85 backdrop-blur">موقعیت نمایشی در بافت تاریخی شیراز</Badge>
        </div>
        <div className="pointer-events-auto rounded-lg border bg-background/85 backdrop-blur px-2 py-1.5 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">ضریب ارتفاع (نمایشی):</span>
          <Select value={exaggeration} onValueChange={setExaggeration}>
            <SelectTrigger className="h-7 w-[74px] text-[11px]" aria-label="ضریب ارتفاع"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">×۱ واقعی</SelectItem>
              <SelectItem value="2">×۲</SelectItem>
              <SelectItem value="3">×۳</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <span className="absolute bottom-2 right-3 text-[9px] text-muted-foreground/80 pointer-events-none select-none">
        MapLibre GL — درگ: چرخش • راست‌کلیک: شیب • آفلاین بدون کاشی پایه
      </span>
    </div>
  );
}
