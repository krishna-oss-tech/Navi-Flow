"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { NetworkSummary, RouteCandidate, LocationPlace } from "@/types";

interface MapViewerProps {
  data: NetworkSummary | null;
  selectedJunctionId: string | null;
  onSelectJunction: (junctionId: string) => void;
  activeLayers: {
    traffic: boolean;
    incidents: boolean;
    police: boolean;
    cameras: boolean;
    risk: boolean;
    routes: boolean;
  };
  activeRoute?: RouteCandidate | null;
  allRoutes?: RouteCandidate[];
  originPlace?: LocationPlace | null;
  destPlace?: LocationPlace | null;
  onSelectRoute?: (route: RouteCandidate) => void;
  onSelectCamera?: (cameraId: string) => void;
}

type BasemapMode = "DARK" | "STANDARD" | "SATELLITE";

const BASEMAP_CONFIG: Record<
  BasemapMode,
  { tiles: string[]; maxBrightness: number; contrast: number; saturation: number }
> = {
  DARK: {
    tiles: [
      "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
      "https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
    ],
    maxBrightness: 0.9,
    contrast: 0.15,
    saturation: -0.2,
  },
  STANDARD: {
    tiles: [
      "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
    ],
    maxBrightness: 1.0,
    contrast: 0.0,
    saturation: 0.0,
  },
  SATELLITE: {
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    maxBrightness: 1.0,
    contrast: 0.1,
    saturation: 0.1,
  },
};

export const MapViewer: React.FC<MapViewerProps> = ({
  data,
  selectedJunctionId,
  onSelectJunction,
  activeLayers,
  activeRoute,
  allRoutes = [],
  originPlace,
  destPlace,
  onSelectRoute,
  onSelectCamera,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [basemapMode, setBasemapMode] = useState<BasemapMode>("DARK");
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "basemap-source": {
            type: "raster",
            tiles: BASEMAP_CONFIG.DARK.tiles,
            tileSize: 256,
            attribution: "© OpenStreetMap © CARTO",
          },
        },
        layers: [
          {
            id: "basemap-layer",
            type: "raster",
            source: "basemap-source",
            paint: {
              "raster-brightness-max": 0.9,
              "raster-contrast": 0.15,
              "raster-saturation": -0.2,
            },
          },
        ],
      },
      center: [79.0882, 21.1458], // Nagpur Center (Zero Mile)
      zoom: 13.2,
      pitch: 42,
      bearing: -15,
      antialias: true,
    });

    map.current.on("load", () => {
      if (!map.current) return;

      // Sources
      map.current.addSource("roads-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.current.addSource("multi-routes-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.current.addSource("route-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Road glow & core layers
      map.current.addLayer({
        id: "roads-glow",
        type: "line",
        source: "roads-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 9,
          "line-blur": 4,
          "line-opacity": 0.35,
          "line-color": ["get", "color"],
        },
      });

      map.current.addLayer({
        id: "roads-core",
        type: "line",
        source: "roads-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 3.8,
          "line-color": ["get", "color"],
          "line-opacity": 0.92,
        },
      });

      // Multi-Route Alternative lines (distinguishable hierarchy)
      map.current.addLayer({
        id: "multi-routes-glow",
        type: "line",
        source: "multi-routes-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": ["get", "glowWidth"],
          "line-blur": 5,
          "line-color": ["get", "color"],
          "line-opacity": ["get", "glowOpacity"],
        },
      });

      map.current.addLayer({
        id: "multi-routes-line",
        type: "line",
        source: "multi-routes-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": ["get", "lineWidth"],
          "line-color": ["get", "color"],
          "line-opacity": 0.95,
        },
      });

      // Route highlight outer glow for active route
      map.current.addLayer({
        id: "route-glow",
        type: "line",
        source: "route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 16,
          "line-blur": 7,
          "line-color": "#00f2ff",
          "line-opacity": 0.5,
        },
      });

      map.current.addLayer({
        id: "route-highlight",
        type: "line",
        source: "route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 6.5,
          "line-color": "#00f2ff",
          "line-opacity": 1.0,
        },
      });

      // Click on candidate routes
      map.current.on("click", "multi-routes-line", (e) => {
        if (!e.features || e.features.length === 0) return;
        const clickedId = e.features[0].properties?.id;
        const matched = allRoutes.find((r) => r.routeId === clickedId);
        if (matched) {
          onSelectRoute?.(matched);
        }
      });

      map.current.on("mouseenter", "multi-routes-line", () => {
        if (map.current) map.current.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "multi-routes-line", () => {
        if (map.current) map.current.getCanvas().style.cursor = "";
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

  // Update Multi-Route Candidates on Map
  useEffect(() => {
    if (!map.current) return;
    const multiSource = map.current.getSource("multi-routes-source") as maplibregl.GeoJSONSource;
    const activeSource = map.current.getSource("route-source") as maplibregl.GeoJSONSource;

    if (!multiSource || !activeSource) return;

    if (!activeLayers.routes || allRoutes.length === 0) {
      multiSource.setData({ type: "FeatureCollection", features: [] });
      activeSource.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    // Build features for all alternative routes
    const features = allRoutes.map((r, idx) => {
      const isSelected = activeRoute?.routeId === r.routeId;
      let color = "#64748b"; // Muted fallback
      let lineWidth = 3.5;
      let glowWidth = 8;
      let glowOpacity = 0.2;

      if (r.classification === "RECOMMENDED") {
        color = "#00f2ff"; // Bright Cyan
        lineWidth = isSelected ? 6.5 : 5.0;
        glowWidth = 14;
        glowOpacity = 0.45;
      } else if (r.classification === "FASTEST") {
        color = "#818cf8"; // Secondary Indigo
        lineWidth = isSelected ? 6.0 : 4.5;
        glowWidth = 12;
        glowOpacity = 0.35;
      } else if (r.classification === "LOW_RISK_ALTERNATIVE") {
        color = "#10b981"; // Emerald
        lineWidth = isSelected ? 6.0 : 4.5;
        glowWidth = 12;
        glowOpacity = 0.35;
      }

      return {
        type: "Feature",
        properties: {
          id: r.routeId,
          label: r.label,
          classification: r.classification,
          color,
          lineWidth,
          glowWidth,
          glowOpacity,
          isSelected,
        },
        geometry: {
          type: "LineString",
          coordinates: r.geometry,
        },
      };
    });

    multiSource.setData({
      type: "FeatureCollection",
      features: features as any,
    });

    // Active route top highlight
    if (activeRoute) {
      activeSource.setData({
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

      // Fit map bounds to encompass active route coordinates
      if (activeRoute.geometry && activeRoute.geometry.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        activeRoute.geometry.forEach((coord) => bounds.extend(coord as [number, number]));
        map.current.fitBounds(bounds, { padding: 90, maxZoom: 14.5, duration: 800 });
      }
    } else {
      activeSource.setData({ type: "FeatureCollection", features: [] });
    }
  }, [allRoutes, activeRoute, activeLayers.routes]);

  // Origin (FROM) and Destination (TO) Map Markers
  useEffect(() => {
    if (!map.current) return;

    // Origin Marker (Green Pin)
    const originKey = "marker_origin_pin";
    if (originPlace && activeLayers.routes) {
      let m = markersRef.current[originKey];
      if (!m) {
        const el = document.createElement("div");
        el.className = "cursor-pointer animate-bounce";
        el.innerHTML = `
          <div style="background: #10b981; color: #000; padding: 4px 8px; border-radius: 9999px; font-weight: bold; font-size: 11px; box-shadow: 0 0 14px rgba(16, 185, 129, 0.7); display: flex; items-center: center; gap: 3px; border: 1.5px solid #fff;">
            <span>A</span> <span>${originPlace.name.split(" ")[0]}</span>
          </div>
        `;
        m = new maplibregl.Marker({ element: el })
          .setLngLat([originPlace.lon, originPlace.lat])
          .addTo(map.current);
        markersRef.current[originKey] = m;
      } else {
        m.setLngLat([originPlace.lon, originPlace.lat]);
      }
    } else if (markersRef.current[originKey]) {
      markersRef.current[originKey].remove();
      delete markersRef.current[originKey];
    }

    // Destination Marker (Red Pin)
    const destKey = "marker_dest_pin";
    if (destPlace && activeLayers.routes) {
      let m = markersRef.current[destKey];
      if (!m) {
        const el = document.createElement("div");
        el.className = "cursor-pointer animate-bounce";
        el.innerHTML = `
          <div style="background: #ef4444; color: #fff; padding: 4px 8px; border-radius: 9999px; font-weight: bold; font-size: 11px; box-shadow: 0 0 14px rgba(239, 68, 68, 0.7); display: flex; items-center: center; gap: 3px; border: 1.5px solid #fff;">
            <span>B</span> <span>${destPlace.name.split(" ")[0]}</span>
          </div>
        `;
        m = new maplibregl.Marker({ element: el })
          .setLngLat([destPlace.lon, destPlace.lat])
          .addTo(map.current);
        markersRef.current[destKey] = m;
      } else {
        m.setLngLat([destPlace.lon, destPlace.lat]);
      }
    } else if (markersRef.current[destKey]) {
      markersRef.current[destKey].remove();
      delete markersRef.current[destKey];
    }
  }, [originPlace, destPlace, activeLayers.routes]);

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
        <div class="map-marker ${sevClass} ${isSelected ? "ring-2 ring-primary scale-125" : ""}">
          <span class="material-symbols-outlined text-[15px] ${iconColor}">${iconName}</span>
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
        el.className = "cursor-pointer transition-transform duration-150 hover:scale-110";
        marker = new maplibregl.Marker({ element: el })
          .setLngLat([inc.lon, inc.lat])
          .addTo(map.current!);
        markersRef.current[markerKey] = marker;
      }

      el.innerHTML = `
        <div class="map-marker critical" style="background: rgba(255, 77, 0, 0.25); border-color: #ff4d00;" title="${inc.title}">
          <span class="material-symbols-outlined text-[15px] text-status-critical">car_crash</span>
        </div>
      `;
    });

    // 3. Police Officers
    data.officers.forEach((officer) => {
      const markerKey = `off_${officer.id}`;
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
        el.className = "cursor-pointer transition-transform duration-150 hover:scale-110";
        marker = new maplibregl.Marker({ element: el })
          .setLngLat([officer.lon, officer.lat])
          .addTo(map.current!);
        markersRef.current[markerKey] = marker;
      }

      el.innerHTML = `
        <div class="map-marker police" title="${officer.name} (${officer.rank})">
          <span class="material-symbols-outlined text-[14px] text-primary">local_police</span>
        </div>
      `;
    });

    // 4. CCTV Cameras
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
