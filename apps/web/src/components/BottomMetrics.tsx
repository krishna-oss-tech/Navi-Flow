"use client";

import React from "react";
import { SystemMetrics } from "@/types";

interface BottomMetricsProps {
  metrics: SystemMetrics | null;
  onSelectMetric?: (
    metricKey: "traffic" | "risk" | "incidents" | "police" | "cctv" | "overview"
  ) => void;
  isLiveConnected?: boolean;
}

export const BottomMetrics: React.FC<BottomMetricsProps> = ({
  metrics,
  onSelectMetric,
  isLiveConnected = true,
}) => {
  if (!metrics) {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 select-none">
        <div className="glass-panel px-6 py-2.5 rounded-full border border-grid-line shadow-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-status-warning animate-pulse" />
          <span className="font-data-mono text-data-mono text-on-surface-variant">
            Initializing Live Telemetry Stream...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 select-none max-w-[95vw]">
      <div className="glass-panel px-4 py-2 rounded-full border border-grid-line shadow-2xl flex items-center gap-3 font-data-mono text-data-mono overflow-x-auto scrollbar-none">
        {/* Speed Metric */}
        <button
          onClick={() => onSelectMetric?.("traffic")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer group"
          title="Click to focus Traffic Flow layer"
        >
          <span className="material-symbols-outlined text-[16px] text-primary group-hover:scale-110 transition-transform">
            speed
          </span>
          <span className="text-on-surface-variant font-label-caps text-[10px]">AVG SPEED</span>
          <span className="text-on-surface font-bold text-xs">
            {metrics.averageSpeedKmh.toFixed(1)}
            <span className="text-[10px] text-on-surface-variant font-normal ml-0.5">km/h</span>
          </span>
        </button>

        <div className="h-4 w-px bg-grid-line" />

        {/* Congestion Index */}
        <button
          onClick={() => onSelectMetric?.("risk")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer group"
          title="Click to focus Congestion & Risk Heatmap"
        >
          <span className="material-symbols-outlined text-[16px] text-status-warning group-hover:scale-110 transition-transform">
            bolt
          </span>
          <span className="text-on-surface-variant font-label-caps text-[10px]">CONGESTION</span>
          <span className="text-status-warning font-bold text-xs">
            {metrics.averageCongestionScore.toFixed(1)}
            <span className="text-[10px] text-on-surface-variant font-normal ml-0.5">%</span>
          </span>
        </button>

        <div className="h-4 w-px bg-grid-line" />

        {/* Critical Locations */}
        <button
          onClick={() => onSelectMetric?.("risk")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer group"
          title="Click to inspect Critical Junctions"
        >
          <span className="material-symbols-outlined text-[16px] text-status-critical group-hover:scale-110 transition-transform">
            local_fire_department
          </span>
          <span className="text-on-surface-variant font-label-caps text-[10px]">CRITICAL</span>
          <span
            className={`font-bold text-xs ${
              metrics.criticalJunctions > 0 ? "text-status-critical" : "text-status-success"
            }`}
          >
            {metrics.criticalJunctions}
          </span>
        </button>

        <div className="h-4 w-px bg-grid-line" />

        {/* Active Incidents */}
        <button
          onClick={() => onSelectMetric?.("incidents")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer group"
          title="Click to open Incident Center Drawer"
        >
          <span className="material-symbols-outlined text-[16px] text-status-danger group-hover:scale-110 transition-transform">
            car_crash
          </span>
          <span className="text-on-surface-variant font-label-caps text-[10px]">INCIDENTS</span>
          <span
            className={`font-bold text-xs ${
              metrics.activeIncidentsCount > 0 ? "text-status-danger" : "text-status-success"
            }`}
          >
            {metrics.activeIncidentsCount}
          </span>
        </button>

        <div className="h-4 w-px bg-grid-line" />

        {/* Police Coverage */}
        <button
          onClick={() => onSelectMetric?.("police")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer group"
          title="Click to view Police Allocations"
        >
          <span className="material-symbols-outlined text-[16px] text-primary group-hover:scale-110 transition-transform">
            local_police
          </span>
          <span className="text-on-surface-variant font-label-caps text-[10px]">OFFICERS</span>
          <span className="text-on-surface font-bold text-xs">
            {metrics.availableOfficersCount}
            <span className="text-[10px] text-on-surface-variant font-normal ml-0.5">Avail</span>
          </span>
        </button>

        <div className="h-4 w-px bg-grid-line" />

        {/* CCTV Vision Cameras */}
        <button
          onClick={() => onSelectMetric?.("cctv")}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-surface-variant transition-colors cursor-pointer group"
          title="Click to open Live CCTV Video Drawer"
        >
          <span className="material-symbols-outlined text-[16px] text-primary group-hover:scale-110 transition-transform">
            videocam
          </span>
          <span className="text-on-surface-variant font-label-caps text-[10px]">CCTV</span>
          <span className="text-status-success font-bold text-xs">6 Online</span>
        </button>

        <div className="h-4 w-px bg-grid-line" />

        {/* Live / Simulated Freshness Indicator */}
        <div className="flex items-center gap-1.5 pl-1 pr-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isLiveConnected ? "bg-status-success animate-pulse" : "bg-status-warning"
            }`}
          />
          <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase">
            {isLiveConnected ? "LIVE • 5s ago" : "SIMULATED"}
          </span>
        </div>
      </div>
    </div>
  );
};
