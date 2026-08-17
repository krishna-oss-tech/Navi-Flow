"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { NetworkSummary, RouteCandidate } from "@/types";
import { Layers, Globe, Moon, Sun, Camera as CameraIcon } from "lucide-react";

export type BasemapMode = "DARK" | "STANDARD" | "SATELLITE" | "TRAFFIC";

interface MapViewerProps {
  data: NetworkSummary | null;
  selectedJunctionId: string | null;
  onSelectJunction: (junctionId: string) => void;
  activeRoute: RouteCandidate | null;
  activeLayers: {
    traffic: boolean;
    risk: boolean;
    incidents: boolean;
    police: boolean;
    cameras: boolean;
    routes: boolean;
  };
}

const BASEMAP_CONFIG: Record<
  BasemapMode,
  { tiles: string[]; maxBrightness: number; contrast: number; saturation: number; label: string; icon: any }
> = {
  DARK: {
    tiles: [
      "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
    ],
    maxBrightness: 0.55,
    contrast: 0.2,
    saturation: -0.3,
    label: "Dark Mode",
    icon: Moon,
  },
  STANDARD: {
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    maxBrightness: 0.85,
    contrast: 0.1,
    saturation: 0.0,
    label: "Standard OSM",
    icon: Sun,
  },
  SATELLITE: {
    tiles: [
      process.env.NEXT_PUBLIC_SATELLITE_TILE_URL ||
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    maxBrightness: 0.9,
    contrast: 0.15,
    saturation: 0.1,
    label: "Satellite Imagery",
    icon: Globe,
  },
  TRAFFIC: {
    tiles: [
      "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png",
      "https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png",
    ],
    maxBrightness: 0.45,
    contrast: 0.35,
    saturation: -0.6,
    label: "Traffic Focused",
    icon: Layers,
  },
};

export const MapViewer: React.FC<MapViewerProps> = ({
  data,
  selectedJunctionId,
  onSelectJunction,
  activeRoute,
  activeLayers,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [basemapMode, setBasemapMode] = useState<BasemapMode>("DARK");
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  // Initialize MapLibre GL JS
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialConfig = BASEMAP_CONFIG[basemapMode];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "basemap-source": {
            type: "raster",
            tiles: initialConfig.tiles,
            tileSize: 256,
            attribution: "© OpenStreetMap contributors © CARTO © Esri",
          },
        },
        layers: [
          {
            id: "basemap-layer",
            type: "raster",
            source: "basemap-source",
            paint: {
              "raster-brightness-max": initialConfig.maxBrightness,
              "raster-contrast": initialConfig.contrast,
              "raster-saturation": initialConfig.saturation,
            },
          },
        ],
      },
      center: [79.0834, 21.142], // Nagpur Zero Mile
      zoom: 13.6,
      pitch: 38,
      bearing: -10,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      "top-right"
    );

    map.current.on("load", () => {
      if (!map.current) return;

      // Add GeoJSON sources for Roads & Routes
      map.current.addSource("roads-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.current.addSource("route-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Road outer glow layer
      map.current.addLayer({
        id: "roads-glow",
        type: "line",
        source: "roads-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 10,
          "line-blur": 4,
          "line-opacity": 0.4,
          "line-color": ["get", "color"],
        },
      });

      // Road core line layer
      map.current.addLayer({
        id: "roads-core",
        type: "line",
        source: "roads-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 4,
          "line-color": ["get", "color"],
          "line-opacity": 0.92,
        },
      });

      // Route highlight outer glow
      map.current.addLayer({
        id: "route-glow",
        type: "line",
        source: "route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 14,
          "line-blur": 6,
          "line-color": "#38bdf8",
          "line-opacity": 0.45,
        },
      });

      // Route highlight core line
      map.current.addLayer({
        id: "route-highlight",
        type: "line",
        source: "route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 5.5,
          "line-color": "#38bdf8",
          "line-opacity": 0.98,
        },
      });

      setIsStyleLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Handle Dynamic Basemap Switching
  const handleSwitchBasemap = (mode: BasemapMode) => {
    setBasemapMode(mode);
    if (!map.current) return;

    const cfg = BASEMAP_CONFIG[mode];
    const source = map.current.getSource("basemap-source") as maplibregl.RasterTileSource;
    if (source && (source as any).tiles) {
      (source as any).tiles = cfg.tiles;
      // Reload source tiles cleanly
      if (map.current.getLayer("basemap-layer")) {
        map.current.setPaintProperty("basemap-layer", "raster-brightness-max", cfg.maxBrightness);
        map.current.setPaintProperty("basemap-layer", "raster-contrast", cfg.contrast);
        map.current.setPaintProperty("basemap-layer", "raster-saturation", cfg.saturation);
      }
    }
  };

  // Update Road GeoJSON when data or traffic layer toggle changes
  useEffect(() => {
    if (!map.current || !data) return;

    const roadFeatures = Object.values(data.liveStates).map((st) => {
      let color = "#22c55e"; // Green (normal)
      if (st.congestionScore >= 75) color = "#ef4444"; // Red (critical)
      else if (st.congestionScore >= 55) color = "#f97316"; // Orange (high)
      else if (st.congestionScore >= 35) color = "#eab308"; // Yellow (moderate)

      return {
        type: "Feature",
        properties: {
          id: st.segmentId,
          name: st.name,
          congestion: st.congestionScore,
          speed: st.currentSpeed,
          color: activeLayers.traffic ? color : "#334155",
        },
        geometry: {
          type: "LineString",
          coordinates: st.geometry,
        },
      };
    });

    const source = map.current.getSource("roads-source") as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: roadFeatures as any,
      });
    }
  }, [data, activeLayers.traffic]);

  // Update active route line
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource("route-source") as maplibregl.GeoJSONSource;
    if (!source) return;

    if (activeRoute && activeLayers.routes) {
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { id: activeRoute.routeId },
            geometry: {
              type: "LineString",
              coordinates: activeRoute.geometry,
            },
          },
        ] as any,
      });
    } else {
      source.setData({ type: "FeatureCollection", features: [] });
    }
  }, [activeRoute, activeLayers.routes]);

  // Update markers (Junctions, Incidents, Officers, CCTV Cameras)
  useEffect(() => {
    if (!map.current || !data) return;

    // 1. Junction Risk Markers
    Object.values(data.junctionRisks).forEach((jr) => {
      const markerKey = `junc_${jr.junctionId}`;
      let marker = markersRef.current[markerKey];

      if (!activeLayers.risk) {
        if (marker) {
          marker.remove();
          delete markersRef.current[markerKey];
        }
        return;
      }

      const isCritical = jr.severity === "CRITICAL";
      const isHigh = jr.severity === "HIGH";
      const isSelected = selectedJunctionId === jr.junctionId;

      const ringColor = isCritical
        ? "border-red-500"
        : isHigh
        ? "border-orange-500"
        : "border-emerald-500";

      const bgColor = isCritical
        ? "bg-red-500"
        : isHigh
        ? "bg-orange-500"
        : "bg-emerald-500";

      const glowStyle = isCritical
        ? "box-shadow: 0 0 16px rgba(239,68,68,0.6)"
        : isHigh
        ? "box-shadow: 0 0 12px rgba(249,115,22,0.5)"
        : "box-shadow: 0 0 8px rgba(34,197,94,0.35)";

      let el = marker?.getElement();
      if (!el) {
        el = document.createElement("div");
        el.className = "cursor-pointer transition-transform duration-200 hover:scale-115";
        el.onclick = () => onSelectJunction(jr.junctionId);

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([jr.lon, jr.lat])
          .addTo(map.current!);
        markersRef.current[markerKey] = marker;
      }

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${isCritical ? '<div class="absolute w-10 h-10 rounded-full bg-red-500/25 animate-ping"></div>' : ""}
          <div
            class="w-7 h-7 rounded-full border-2 ${ringColor} ${bgColor}/95 flex items-center justify-center text-[9px] font-black text-white backdrop-blur-sm ${
              isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-black" : ""
            }"
            style="${glowStyle}"
          >
            ${Math.round(jr.riskScore)}
          </div>
        </div>
      `;
    });

    // 2. Incident Markers
    data.incidents.forEach((inc) => {
      const markerKey = `inc_${inc.id}`;
      let marker = markersRef.current[markerKey];

      if (!activeLayers.incidents) {
        if (marker) {
          marker.remove();
          delete markersRef.current[markerKey];
        }
        return;
      }

      let el = marker?.getElement();
      if (!el) {
        el = document.createElement("div");
        el.className = "cursor-pointer";
        marker = new maplibregl.Marker({ element: el })
          .setLngLat([inc.lon, inc.lat])
          .addTo(map.current!);
        markersRef.current[markerKey] = marker;
      }

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-10 h-10 rounded-full bg-red-500/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-lg bg-red-600 border border-red-300/80 backdrop-blur-sm flex items-center justify-center text-white shadow-lg" style="box-shadow: 0 0 20px rgba(239,68,68,0.5); transform: rotate(45deg);">
            <span style="transform: rotate(-45deg); font-size: 13px;">⚠️</span>
          </div>
        </div>
      `;
    });

    // 3. Police Officer Markers
    data.officers.forEach((off) => {
      const markerKey = `off_${off.id}`;
      let marker = markersRef.current[markerKey];

      if (!activeLayers.police) {
        if (marker) {
          marker.remove();
          delete markersRef.current[markerKey];
        }
        return;
      }

      let el = marker?.getElement();
      if (!el) {
        el = document.createElement("div");
        el.className = "cursor-pointer hover:scale-115 transition-transform duration-200";
        marker = new maplibregl.Marker({ element: el })
          .setLngLat([off.lon, off.lat])
          .addTo(map.current!);
        markersRef.current[markerKey] = marker;
      }

      const isAssigned = !off.isAvailable;
      el.innerHTML = `
        <div class="w-7 h-7 rounded-lg ${
          isAssigned ? "bg-sky-500/95 border-sky-300" : "bg-slate-800/90 border-slate-600"
        } border backdrop-blur-sm flex items-center justify-center text-[12px] text-white shadow-md" style="${
        isAssigned ? "box-shadow: 0 0 12px rgba(56,189,248,0.4)" : ""
      }">
          👮
        </div>
      `;
    });

    // 4. CCTV Camera Markers
    if (data.cameras) {
      data.cameras.forEach((cam) => {
        const markerKey = `cam_${cam.cameraId}`;
        let marker = markersRef.current[markerKey];

        if (!activeLayers.cameras) {
          if (marker) {
            marker.remove();
            delete markersRef.current[markerKey];
          }
          return;
        }

        let el = marker?.getElement();
        if (!el) {
          el = document.createElement("div");
          el.className = "cursor-pointer hover:scale-115 transition-transform duration-200";
          marker = new maplibregl.Marker({ element: el })
            .setLngLat([cam.lon, cam.lat])
            .addTo(map.current!);
          markersRef.current[markerKey] = marker;
        }

        el.innerHTML = `
          <div class="w-6 h-6 rounded-full bg-indigo-600/90 border border-indigo-300/60 backdrop-blur-sm flex items-center justify-center text-[10px] text-white shadow-md" style="box-shadow: 0 0 10px rgba(99,102,241,0.4)">
            📹
          </div>
        `;
      });
    }
  }, [data, activeLayers, selectedJunctionId, onSelectJunction]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Basemap Selector Controls */}
      <div className="absolute top-4 right-14 z-20 flex items-center gap-1 bg-surface/90 backdrop-blur-md p-1 rounded-xl border border-border-subtle shadow-float select-none">
        {(Object.keys(BASEMAP_CONFIG) as BasemapMode[]).map((mode) => {
          const cfg = BASEMAP_CONFIG[mode];
          const Icon = cfg.icon;
          const isActive = basemapMode === mode;
          return (
            <button
              key={mode}
              onClick={() => handleSwitchBasemap(mode)}
              title={cfg.label}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 ${
                isActive
                  ? "bg-accent-blue text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{mode}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
