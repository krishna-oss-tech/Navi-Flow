"use client";

import React from "react";
import { SystemMetrics } from "@/types";

interface BottomMetricsProps {
  metrics: SystemMetrics | undefined;
}

export const BottomMetrics: React.FC<BottomMetricsProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="glass-panel rounded-full border border-grid-line px-6 py-2.5 flex items-center space-x-6 xl:space-x-8 z-10 shadow-2xl select-none">
      {/* Speed */}
      <div className="flex items-center">
        <span className="material-symbols-outlined text-[20px] text-primary mr-2">speed</span>
        <span className="font-data-mono text-data-mono text-on-surface font-bold text-lg">
          {metrics.averageSpeedKmh}
        </span>
        <span className="font-label-caps text-label-caps text-on-surface-variant ml-1">km/h</span>
      </div>

      {/* Congestion */}
      <div className="flex items-center">
        <span className="material-symbols-outlined text-[20px] text-status-warning mr-2">bolt</span>
        <span className="font-data-mono text-data-mono text-status-warning font-bold text-lg">
          {metrics.averageCongestionScore}
        </span>
        <span className="font-label-caps text-label-caps text-on-surface-variant ml-1">/100</span>
      </div>

      {/* Critical Junctions */}
      <div className="flex items-center">
        <span
          className={`material-symbols-outlined text-[20px] mr-2 ${
            metrics.criticalJunctions > 0 ? "text-status-critical" : "text-on-surface-variant"
          }`}
        >
          local_fire_department
        </span>
        <span
          className={`font-data-mono text-data-mono font-bold text-lg ${
            metrics.criticalJunctions > 0 ? "text-status-critical" : "text-on-surface"
          }`}
        >
          {metrics.criticalJunctions}
        </span>
      </div>

      {/* Active Incidents */}
      <div className="flex items-center">
        <span
          className={`material-symbols-outlined text-[20px] mr-2 ${
            metrics.activeIncidentsCount > 0 ? "text-status-danger" : "text-on-surface-variant"
          }`}
        >
          error
        </span>
        <span
          className={`font-data-mono text-data-mono font-bold text-lg ${
            metrics.activeIncidentsCount > 0 ? "text-status-danger" : "text-on-surface"
          }`}
        >
          {metrics.activeIncidentsCount}
        </span>
      </div>

      {/* Available Officers */}
      <div className="flex items-center">
        <span className="material-symbols-outlined text-[20px] text-status-success mr-2">
          check_circle
        </span>
        <span className="font-data-mono text-data-mono text-status-success font-bold text-lg">
          {metrics.availableOfficersCount}
        </span>
      </div>

      {/* ITMS Status */}
      <div className="h-4 w-px bg-grid-line" />
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-status-success mr-2 animate-pulse" />
        <span className="font-data-mono text-data-mono text-on-surface-variant text-xs">
          Nagpur ITMS
        </span>
      </div>
    </div>
  );
};
