"use client";

import React from "react";
import {
  LayoutDashboard,
  Activity,
  Flame,
  Navigation,
  AlertTriangle,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { NetworkSummary } from "@/types";

export type NavTab =
  | "overview"
  | "traffic"
  | "risk"
  | "routes"
  | "incidents"
  | "police"
  | "simulation"
  | "audit";

interface IconBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  data: NetworkSummary | null;
}

const navItems: {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  badgeKey?: "incidents" | "recommendations";
  badgeColor?: string;
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "traffic", label: "Traffic", icon: Activity },
  { id: "risk", label: "Risk", icon: Flame },
  { id: "routes", label: "Routes", icon: Navigation },
  {
    id: "incidents",
    label: "Incidents",
    icon: AlertTriangle,
    badgeKey: "incidents",
    badgeColor: "bg-red-500",
  },
  {
    id: "police",
    label: "Dispatch",
    icon: ShieldCheck,
    badgeKey: "recommendations",
    badgeColor: "bg-sky-500",
  },
  { id: "audit", label: "Audit", icon: FileText },
];

export const IconBar: React.FC<IconBarProps> = ({
  activeTab,
  onSelectTab,
  data,
}) => {
  const getBadgeCount = (key?: "incidents" | "recommendations"): number => {
    if (!data || !key) return 0;
    if (key === "incidents") return data.incidents.length;
    if (key === "recommendations") return data.recommendations.length;
    return 0;
  };

  return (
    <aside className="w-iconbar flex flex-col items-center justify-between py-3 glass border-r border-border-subtle z-30 select-none shrink-0">
      {/* Navigation Icons */}
      <div className="flex flex-col items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badge = getBadgeCount(item.badgeKey);

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group ${
                isActive
                  ? "bg-accent-blue/15 text-accent-blue shadow-glow-blue"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent-blue" />
              )}

              <Icon className="w-[18px] h-[18px]" />

              {/* Badge */}
              {badge > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${item.badgeColor}`}
                >
                  {badge}
                </span>
              )}

              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-surface-overlay text-xs font-medium text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-panel border border-border-subtle z-50">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom — Status Indicator */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-px bg-white/10" />
        <div className="relative group">
          <div className="status-dot status-dot-live" />
          <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-surface-overlay text-[10px] font-mono text-emerald-400 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-panel border border-border-subtle z-50">
            Nagpur LIVE
          </span>
        </div>
      </div>
    </aside>
  );
};
