"use client";

import React from "react";
import { Gauge, Flame, AlertOctagon, ShieldCheck, Zap } from "lucide-react";
import { SystemMetrics } from "@/types";

interface BottomMetricsProps {
  metrics: SystemMetrics | undefined;
}

const MetricPill: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  iconColor: string;
  valueColor?: string;
}> = ({ icon: Icon, label, value, unit, iconColor, valueColor = "text-white" }) => (
  <div className="flex items-center gap-2 px-3">
    <Icon className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
    <div className="flex items-baseline gap-1">
      <span className={`text-xs font-mono font-bold ${valueColor}`}>{value}</span>
      {unit && <span className="text-[9px] text-slate-500">{unit}</span>}
    </div>
  </div>
);

const Divider = () => <div className="w-px h-4 bg-white/8" />;

export const BottomMetrics: React.FC<BottomMetricsProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="glass-raised rounded-2xl shadow-float flex items-center h-10 px-1 select-none">
      <MetricPill
        icon={Gauge}
        label="Speed"
        value={metrics.averageSpeedKmh}
        unit="km/h"
        iconColor="text-accent-blue"
      />
      <Divider />
      <MetricPill
        icon={Zap}
        label="Congestion"
        value={metrics.averageCongestionScore}
        unit="/100"
        iconColor="text-amber-400"
        valueColor="text-amber-300"
      />
      <Divider />
      <MetricPill
        icon={Flame}
        label="Critical"
        value={metrics.criticalJunctions}
        iconColor="text-red-400"
        valueColor={metrics.criticalJunctions > 0 ? "text-red-400" : "text-white"}
      />
      <Divider />
      <MetricPill
        icon={AlertOctagon}
        label="Incidents"
        value={metrics.activeIncidentsCount}
        iconColor="text-rose-400"
        valueColor={metrics.activeIncidentsCount > 0 ? "text-rose-400" : "text-white"}
      />
      <Divider />
      <MetricPill
        icon={ShieldCheck}
        label="Officers"
        value={metrics.availableOfficersCount}
        iconColor="text-emerald-400"
        valueColor="text-emerald-300"
      />

      <Divider />
      <div className="flex items-center gap-1.5 px-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">Nagpur ITMS</span>
      </div>
    </div>
  );
};
