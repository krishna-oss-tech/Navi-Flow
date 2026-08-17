"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { NetworkSummary, RouteCandidate } from "@/types";

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

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize MapLibre GL JS with dark tiles centered on Nagpur
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors © CARTO",
          },
        },
        layers: [
          {
            id: "carto-tiles",
            type: "raster",
            source: "carto",
            paint: {
              "raster-brightness-max": 0.55,
              "raster-contrast": 0.2,
              "raster-saturation": -0.3,
            },
          },
        ],
      },
      center: [79.0834, 21.142],
      zoom: 13.6,
      pitch: 40,
      bearing: -10,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      "top-right"
    );

    map.current.on("load", () => {
      if (!map.current) return;

      // GeoJSON sources for roads and routes
      map.current.addSource("roads-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.current.addSource("route-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Road outer glow
      map.current.addLayer({
        id: "roads-glow",
        type: "line",
        source: "roads-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 10,
          "line-blur": 4,
          "line-opacity": 0.35,
          "line-color": ["get", "color"],
        },
      });

      // Road core line
      map.current.addLayer({
        id: "roads-core",
        type: "line",
        source: "roads-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 4,
          "line-color": ["get", "color"],
          "line-opacity": 0.9,
        },
      });

      // Route highlight
      map.current.addLayer({
        id: "route-glow",
        type: "line",
        source: "route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 12,
          "line-blur": 5,
          "line-color": "#38bdf8",
          "line-opacity": 0.3,
        },
      });

      map.current.addLayer({
        id: "route-highlight",
        type: "line",
        source: "route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 5,
          "line-color": "#38bdf8",
          "line-opacity": 0.95,
        },
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update road GeoJSON when data changes
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

  // Update markers (junctions, incidents, officers)
  useEffect(() => {
    if (!map.current || !data) return;

    // 1. Junction Risk Markers
    if (activeLayers.risk) {
      Object.values(data.junctionRisks).forEach((jr) => {
        const markerKey = `junc_${jr.junctionId}`;
        let el = markersRef.current[markerKey]?.getElement();

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
          ? "box-shadow: 0 0 16px rgba(239,68,68,0.5)"
          : isHigh
          ? "box-shadow: 0 0 12px rgba(249,115,22,0.4)"
          : "box-shadow: 0 0 8px rgba(34,197,94,0.3)";

        if (!el) {
          el = document.createElement("div");
          el.className = "cursor-pointer transition-transform duration-200 hover:scale-110";
          el.onclick = () => onSelectJunction(jr.junctionId);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([jr.lon, jr.lat])
            .addTo(map.current!);
          markersRef.current[markerKey] = marker;
        }

        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            ${isCritical ? '<div class="absolute w-10 h-10 rounded-full bg-red-500/20 animate-ping"></div>' : ""}
            <div
              class="w-7 h-7 rounded-full border-2 ${ringColor} ${bgColor}/90 flex items-center justify-center text-[9px] font-black text-white backdrop-blur-sm ${isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-transparent" : ""}"
              style="${glowStyle}"
            >
              ${Math.round(jr.riskScore)}
            </div>
          </div>
        `;
      });
    }

    // 2. Incident Markers
    if (activeLayers.incidents) {
      data.incidents.forEach((inc) => {
        const markerKey = `inc_${inc.id}`;
        let el = markersRef.current[markerKey]?.getElement();

        if (!el) {
          el = document.createElement("div");
          el.className = "cursor-pointer";
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([inc.lon, inc.lat])
            .addTo(map.current!);
          markersRef.current[markerKey] = marker;
        }

        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 rounded-full bg-red-500/15 animate-ping"></div>
            <div class="w-8 h-8 rounded-lg bg-red-600/90 border border-red-400/50 backdrop-blur-sm flex items-center justify-center text-white shadow-lg" style="box-shadow: 0 0 20px rgba(239,68,68,0.4); transform: rotate(45deg);">
              <span style="transform: rotate(-45deg); font-size: 12px;">⚠</span>
            </div>
          </div>
        `;
      });
    }

    // 3. Police Officer Markers
    if (activeLayers.police) {
      data.officers.forEach((off) => {
        const markerKey = `off_${off.id}`;
        let el = markersRef.current[markerKey]?.getElement();

        if (!el) {
          el = document.createElement("div");
          el.className = "cursor-pointer hover:scale-110 transition-transform duration-200";
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([off.lon, off.lat])
            .addTo(map.current!);
          markersRef.current[markerKey] = marker;
        }

        const isAssigned = !off.isAvailable;
        el.innerHTML = `
          <div class="w-6 h-6 rounded-lg ${isAssigned ? "bg-sky-500/90 border-sky-400/50" : "bg-slate-700/80 border-slate-600/50"} border backdrop-blur-sm flex items-center justify-center text-[10px] text-white" style="${isAssigned ? "box-shadow: 0 0 10px rgba(56,189,248,0.3)" : ""}">
            🛡
          </div>
        `;
      });
    }
  }, [data, activeLayers, selectedJunctionId, onSelectJunction]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
