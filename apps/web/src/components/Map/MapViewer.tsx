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
  onSelectCamera?: (cameraId: string) => void;
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
    tiles: [
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
    ],
    maxBrightness: 0.95,
    contrast: 0.05,
    saturation: 0.0,
    label: "Standard OSM",
    icon: Sun,
  },
  SATELLITE: {
    tiles: [
      process.env.NEXT_PUBLIC_SATELLITE_TILE_URL ||
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    maxBrightness: 1.0,
    contrast: 0.1,
    saturation: 0.05,
    label: "Satellite Imagery",
    icon: Globe,
  },
  TRAFFIC: {
    tiles: [
      "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png",
      "https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png",
    ],
    maxBrightness: 0.65,
    contrast: 0.25,
    saturation: -0.4,
    label: "Traffic Focused",
    icon: Layers,
  },
};

export const MapViewer: React.FC<MapViewerProps> = ({
  data,
  selectedJunctionId,
  onSelectJunction,
  onSelectCamera,
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
    try {
      if (map.current.getLayer("basemap-layer")) {
        map.current.removeLayer("basemap-layer");
      }
      if (map.current.getSource("basemap-source")) {
        map.current.removeSource("basemap-source");
      }

      map.current.addSource("basemap-source", {
        type: "raster",
        tiles: cfg.tiles,
        tileSize: 256,
        attribution: "© OpenStreetMap © CARTO © Esri",
      });

      const beforeLayer = map.current.getLayer("roads-glow") ? "roads-glow" : undefined;
      map.current.addLayer(
        {
          id: "basemap-layer",
          type: "raster",
          source: "basemap-source",
          paint: {
            "raster-brightness-max": cfg.maxBrightness,
            "raster-contrast": cfg.contrast,
            "raster-saturation": cfg.saturation,
          },
        },
        beforeLayer
      );
    } catch (e) {
      console.warn("Notice: Switching basemap:", e);
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
    Object.values(data.junctionRisks).forEach((junction) => {
      const markerKey = `junc_${junction.junctionId}`;
      let marker = markersRef.current[markerKey];

      if (!activeLayers.risk) {
        if (marker) {
          marker.remove();
          delete markersRef.current[markerKey];
        }
        return;
      }

      const isSelected = selectedJunctionId === junction.junctionId;
      const sevClass =
        junction.severity === "CRITICAL"
          ? "critical"
          : junction.severity === "HIGH" || junction.severity === "MODERATE"
          ? "moderate"
          : junction.policeAssigned
          ? "police"
          : "";

      const iconName =
        junction.severity === "CRITICAL"
          ? "emergency"
          : junction.severity === "HIGH" || junction.severity === "MODERATE"
          ? "warning"
          : junction.policeAssigned
          ? "local_police"
          : "adjust";

      const iconColor =
        junction.severity === "CRITICAL"
          ? "text-status-critical"
          : junction.severity === "HIGH" || junction.severity === "MODERATE"
          ? "text-status-warning"
          : junction.policeAssigned
          ? "text-primary"
          : "text-status-success";

      let el = marker?.getElement();
      if (!el) {
        el = document.createElement("div");
        el.className = "cursor-pointer transition-transform duration-150 hover:scale-110";
        el.onclick = () => onSelectJunction(junction.junctionId);
        marker = new maplibregl.Marker({ element: el })
          .setLngLat([junction.lon, junction.lat])
          .addTo(map.current!);
        markersRef.current[markerKey] = marker;
      } else {
        el.onclick = () => onSelectJunction(junction.junctionId);
      }

      el.innerHTML = `
        <div class="map-marker ${sevClass} ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-[#121317]" : ""}" title="${junction.name}">
          <span class="material-symbols-outlined text-[16px] ${iconColor}">${iconName}</span>
        </div>
      `;
    });

    // 2. Incident Markers
    if (activeLayers.incidents && data.incidents) {
      data.incidents.forEach((inc) => {
        const markerKey = `inc_${inc.id}`;
        let marker = markersRef.current[markerKey];

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
          <div class="map-marker critical" title="${inc.title}">
            <span class="material-symbols-outlined text-[16px] text-status-critical">warning</span>
          </div>
        `;
      });
    }

    // 3. Officer Markers
    if (activeLayers.police && data.officers) {
      data.officers.forEach((off) => {
        const markerKey = `off_${off.id}`;
        let marker = markersRef.current[markerKey];

        let el = marker?.getElement();
        if (!el) {
          el = document.createElement("div");
          el.className = "cursor-pointer";
          marker = new maplibregl.Marker({ element: el })
            .setLngLat([off.lon, off.lat])
            .addTo(map.current!);
          markersRef.current[markerKey] = marker;
        }

        el.innerHTML = `
          <div class="map-marker police" title="${off.name} (${off.rank})">
            <span class="material-symbols-outlined text-[16px] text-primary">local_police</span>
          </div>
        `;
      });
    }

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
          el.className = "cursor-pointer transition-transform duration-150 hover:scale-110";
          el.onclick = () => onSelectCamera?.(cam.cameraId);
          marker = new maplibregl.Marker({ element: el })
            .setLngLat([cam.lon, cam.lat])
            .addTo(map.current!);
          markersRef.current[markerKey] = marker;
        } else {
          el.onclick = () => onSelectCamera?.(cam.cameraId);
        }

        el.innerHTML = `
          <div class="map-marker" style="border-color: rgba(0, 242, 255, 0.4); box-shadow: 0 0 10px rgba(0, 242, 255, 0.3);" title="${cam.name}">
            <span class="material-symbols-outlined text-[15px] text-primary">videocam</span>
          </div>
        `;
      });
    }
  }, [data, activeLayers, selectedJunctionId, onSelectJunction, onSelectCamera]);

  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();
  const handleRecenter = () => {
    map.current?.flyTo({
      center: [79.0882, 21.1458],
      zoom: 13.2,
      pitch: 42,
      bearing: -15,
      essential: true,
    });
  };

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Map Controls — Stitch Top Right */}
      <div className="absolute top-6 right-6 flex flex-col space-y-2 z-10 select-none">
        {/* Basemap Pill Group */}
        <div className="glass-panel rounded-full p-1 border border-grid-line flex items-center">
          <button
            onClick={() => handleSwitchBasemap("DARK")}
            className={`px-4 py-1.5 rounded-full font-label-caps text-label-caps flex items-center justify-center min-w-[80px] transition-colors ${
              basemapMode === "DARK"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span
              className="material-symbols-outlined text-[16px] mr-1"
              style={{ fontVariationSettings: basemapMode === "DARK" ? "'FILL' 1" : "'FILL' 0" }}
            >
              dark_mode
            </span>
            DARK
          </button>

          <button
            onClick={() => handleSwitchBasemap("STANDARD")}
            className={`px-4 py-1.5 rounded-full font-label-caps text-label-caps flex items-center justify-center min-w-[80px] transition-colors ${
              basemapMode === "STANDARD"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px] mr-1">light_mode</span>
            STANDARD
          </button>

          <button
            onClick={() => handleSwitchBasemap("SATELLITE")}
            className={`px-4 py-1.5 rounded-full font-label-caps text-label-caps flex items-center justify-center min-w-[80px] transition-colors ${
              basemapMode === "SATELLITE"
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px] mr-1">satellite_alt</span>
            SATELLITE
          </button>
        </div>

        {/* Zoom & Recenter Controls */}
        <div className="flex justify-end mt-3">
          <div className="glass-panel rounded border border-grid-line flex flex-col overflow-hidden">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface border-b border-grid-line transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface border-b border-grid-line transition-colors"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button
              onClick={handleRecenter}
              title="Recenter Nagpur ITMS"
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
