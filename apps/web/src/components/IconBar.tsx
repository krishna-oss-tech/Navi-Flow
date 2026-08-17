"use client";

import React from "react";
import { NetworkSummary } from "@/types";

export type NavTab =
  | "overview"
  | "traffic"
  | "risk"
  | "incidents"
  | "cctv"
  | "routes"
  | "police"
  | "simulation"
  | "audit";

interface IconBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  data: NetworkSummary | null;
  onOpenSystemStatus?: () => void;
}

const navItems: {
  id: NavTab;
  label: string;
  iconName: string;
  badgeKey?: "incidents" | "recommendations";
  badgeColor?: string;
}[] = [
  { id: "overview", label: "Overview", iconName: "dashboard" },
  { id: "traffic", label: "Live Traffic", iconName: "traffic" },
  { id: "risk", label: "Risk Matrix", iconName: "warning" },
  {
    id: "incidents",
    label: "Incidents",
    iconName: "emergency",
    badgeKey: "incidents",
    badgeColor: "bg-status-critical",
  },
  { id: "cctv", label: "CCTV Vision", iconName: "videocam" },
  { id: "routes", label: "Route Planner", iconName: "directions" },
  {
    id: "police",
    label: "Police Dispatch",
    iconName: "local_police",
    badgeKey: "recommendations",
    badgeColor: "bg-primary-container text-on-primary-container",
  },
  { id: "simulation", label: "What-If Simulation", iconName: "query_stats" },
  { id: "audit", label: "Audit Ledger", iconName: "history" },
];

export const IconBar: React.FC<IconBarProps> = ({
  activeTab,
  onSelectTab,
  data,
  onOpenSystemStatus,
}) => {
  const getBadgeCount = (key?: "incidents" | "recommendations"): number => {
    if (!data || !key) return 0;
    if (key === "incidents") return data.incidents.length;
    if (key === "recommendations") return data.recommendations.length;
    return 0;
  };

  return (
    <aside className="bg-surface-elevated border-r border-grid-line h-full w-[64px] flex flex-col py-4 shrink-0 z-40 select-none">
      {/* Main Navigation Stack */}
      <nav className="flex flex-col items-center space-y-3 flex-1 w-full">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const badge = getBadgeCount(item.badgeKey);

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`w-12 h-12 rounded flex items-center justify-center transition-all duration-150 active:scale-95 group relative ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container border-l-2 border-primary"
                  : "text-on-surface-variant hover:bg-surface-variant hover:text-primary"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.iconName}
              </span>

              {/* Badge counter */}
              {badge > 0 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                    item.badgeColor || "bg-status-critical text-white"
                  }`}
                >
                  {badge}
                </span>
              )}

              {/* Hover Tooltip */}
              <span className="absolute left-full ml-3 px-2.5 py-1 rounded bg-surface-container-high text-xs font-medium text-on-surface whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-2xl border border-grid-line z-50">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Hardware Status */}
      <div className="mt-auto flex flex-col items-center space-y-3 pt-3 border-t border-grid-line w-full">
        <button
          onClick={onOpenSystemStatus}
          className="w-12 h-12 rounded text-status-success hover:bg-surface-variant transition-all duration-150 active:scale-95 flex items-center justify-center relative group"
          title="System Telemetry: Online & Synced"
        >
          <span className="material-symbols-outlined text-[22px]">memory</span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-status-success animate-pulse" />

          <span className="absolute left-full ml-3 px-2.5 py-1 rounded bg-surface-container-high text-xs font-medium text-status-success whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-2xl border border-grid-line z-50">
            System: Optimal (96% conf)
          </span>
        </button>
      </div>
    </aside>
  );
};
