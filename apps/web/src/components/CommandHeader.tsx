"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Activity,
  Clock,
  Server,
  FileText,
  AlertOctagon,
} from "lucide-react";
import AuthButton from "@/components/header-auth";
import { NetworkSummary } from "@/types";

interface CommandHeaderProps {
  data: NetworkSummary | null;
  onTriggerDemo: () => void;
  onResetDemo: () => void;
  onOpenSimulation: () => void;
  onOpenCopilot: () => void;
  onOpenAudit: () => void;
  onOpenSystemStatus: () => void;
  onOpenIncidents: () => void;
  activeLayers: {
    traffic: boolean;
    risk: boolean;
    incidents: boolean;
    police: boolean;
    cameras: boolean;
    routes: boolean;
  };
  onToggleLayer: (layer: keyof CommandHeaderProps["activeLayers"]) => void;
}

const layerItems: { key: keyof CommandHeaderProps["activeLayers"]; label: string }[] = [
  { key: "traffic", label: "Flow" },
  { key: "risk", label: "Risk" },
  { key: "incidents", label: "Incidents" },
  { key: "police", label: "Police" },
  { key: "cameras", label: "CCTV" },
  { key: "routes", label: "Routes" },
];

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  data,
  onTriggerDemo,
  onResetDemo,
  onOpenSimulation,
  onOpenCopilot,
  onOpenAudit,
  onOpenSystemStatus,
  onOpenIncidents,
  activeLayers,
  onToggleLayer,
}) => {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) + " IST");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const isDemoMode = data?.isDemoMode ?? false;
  const activeIncidents = data?.incidents.length || 0;

  return (
    <header className="h-header w-full glass border-b border-border-subtle flex items-center justify-between px-4 z-30 select-none shrink-0">
      {/* ─── Left: Brand + Status ─── */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
          <Radio className="w-4 h-4 text-white" />
        </div>

        <div className="flex items-center gap-2.5">
          <span className="font-black text-sm tracking-wider text-white">NAVI-FLOW</span>

          {/* Live / Simulated Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
              isDemoMode
                ? "bg-red-500/10 text-red-400 border-red-500/25"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDemoMode ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-pulse"
              }`}
            />
            {isDemoMode ? "INCIDENT ACTIVE" : "LIVE TELEMETRY"}
          </span>
        </div>
      </div>

      {/* ─── Center: Layer Toggles ─── */}
      <div className="hidden lg:flex items-center gap-0.5 bg-surface/80 p-0.5 rounded-lg border border-border-subtle">
        {layerItems.map((l) => {
          const isOn = activeLayers[l.key];
          return (
            <button
              key={l.key}
              onClick={() => onToggleLayer(l.key)}
              title={`Toggle ${l.label} layer`}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                isOn
                  ? "bg-accent-blue/15 text-accent-blue"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>

      {/* ─── Right: Actions ─── */}
      <div className="flex items-center gap-2">
        <AuthButton />

        {/* System Status */}
        <button
          onClick={onOpenSystemStatus}
          title="System Health & Data Sources"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised text-slate-300 border border-border-subtle text-[11px] font-semibold transition-all duration-150"
        >
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline">Status</span>
        </button>

        {/* Incidents Quick Button */}
        {activeIncidents > 0 && (
          <button
            onClick={onOpenIncidents}
            title="View Active Incidents"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 text-[11px] font-bold transition-all duration-150"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{activeIncidents}</span>
          </button>
        )}

        {/* Copilot */}
        <button
          onClick={onOpenCopilot}
          title="AI Operations Copilot"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20 text-[11px] font-semibold transition-all duration-150"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Copilot</span>
        </button>

        {/* Simulator */}
        <button
          onClick={onOpenSimulation}
          title="What-If Disruption Simulator"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised text-slate-300 border border-border-subtle text-[11px] font-semibold transition-all duration-150"
        >
          <Activity className="w-3.5 h-3.5 text-accent-blue" />
          <span className="hidden xl:inline">Simulate</span>
        </button>

        {/* Audit */}
        <button
          onClick={onOpenAudit}
          title="Immutable Audit Ledger"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised text-slate-300 border border-border-subtle text-[11px] font-semibold transition-all duration-150"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden xl:inline">Audit</span>
        </button>

        {/* Demo Trigger */}
        {!isDemoMode ? (
          <button
            onClick={onTriggerDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-[11px] font-bold shadow-lg shadow-rose-600/15 transition-all duration-150 active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Demo Collision</span>
          </button>
        ) : (
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}

        {/* Clock */}
        <div className="hidden sm:flex items-center gap-2 pl-2.5 border-l border-border-subtle">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-mono font-medium text-slate-300">{timeStr}</span>
        </div>
      </div>
    </header>
  );
};
