"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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

const navLayerItems: { key: keyof CommandHeaderProps["activeLayers"]; label: string }[] = [
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
      setTimeStr(
        now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) + " IST"
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const isDemoMode = data?.isDemoMode ?? false;
  const activeIncidents = data?.incidents.length || 0;

  return (
    <header className="bg-background border-b border-grid-line w-full h-topbar-height flex items-center justify-between px-panel-padding z-50 shrink-0 select-none">
      {/* ─── Brand & Nav Group ─── */}
      <div className="flex items-center space-x-6 xl:space-x-8 h-full">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span
              className="material-symbols-outlined text-on-primary-container text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              radar
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary tracking-tighter uppercase">
            NAVI-FLOW
          </h1>
        </div>

        {/* Live Telemetry Pill + Nav Tabs */}
        <div className="hidden md:flex items-center space-x-1.5 bg-surface-container-low rounded-full p-1 border border-grid-line">
          <div
            className={`flex items-center px-3 py-1.5 rounded-full border transition-colors ${
              isDemoMode
                ? "bg-status-critical/10 border-status-critical/30"
                : "bg-primary/10 border-primary/30"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isDemoMode ? "bg-status-critical animate-pulse" : "bg-status-success animate-pulse"
              }`}
            />
            <span
              className={`font-label-caps text-label-caps uppercase ${
                isDemoMode ? "text-status-critical" : "text-primary"
              }`}
            >
              {isDemoMode ? "INCIDENT SIMULATION" : "LIVE TELEMETRY"}
            </span>
          </div>

          <nav className="flex items-center px-1 space-x-1">
            {navLayerItems.map((item) => {
              const isActive = activeLayers[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => onToggleLayer(item.key)}
                  className={`px-3 py-1.5 rounded-full font-body-sm text-body-sm transition-colors ${
                    isActive
                      ? "text-primary font-bold bg-surface-variant/80 border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-variant"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ─── Global Actions ─── */}
      <div className="flex items-center space-x-3 xl:space-x-4 h-full">
        <Link
          href="/sign-in"
          className="px-3 xl:px-4 py-2 font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors border-r border-grid-line pr-4 xl:pr-6"
        >
          Sign In
        </Link>

        <div className="flex items-center space-x-2">
          {/* Status */}
          <button
            onClick={onOpenSystemStatus}
            className="flex items-center px-2.5 xl:px-3 py-2 rounded font-body-sm text-body-sm text-on-surface border border-grid-line hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] mr-1.5 text-status-success">
              dns
            </span>
            <span className="hidden sm:inline">Status</span>
          </button>

          {/* Incidents Indicator if active */}
          {activeIncidents > 0 && (
            <button
              onClick={onOpenIncidents}
              className="flex items-center px-2.5 py-2 rounded font-body-sm text-body-sm bg-status-critical/15 text-status-critical border border-status-critical/30 hover:bg-status-critical/25 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] mr-1">emergency</span>
              <span>{activeIncidents}</span>
            </button>
          )}

          {/* Copilot */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center px-2.5 xl:px-3 py-2 rounded font-body-sm text-body-sm text-secondary border border-grid-line hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] mr-1.5 text-secondary">
              auto_awesome
            </span>
            <span className="hidden sm:inline">Copilot</span>
          </button>

          {/* Simulate */}
          <button
            onClick={onOpenSimulation}
            className="flex items-center px-2.5 xl:px-3 py-2 rounded font-body-sm text-body-sm text-on-surface border border-grid-line hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] mr-1.5 text-primary">
              analytics
            </span>
            <span className="hidden sm:inline">Simulate</span>
          </button>

          {/* Audit */}
          <button
            onClick={onOpenAudit}
            className="flex items-center px-2.5 xl:px-3 py-2 rounded font-body-sm text-body-sm text-on-surface border border-grid-line hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] mr-1.5 text-on-surface-variant">
              receipt_long
            </span>
            <span className="hidden sm:inline">Audit</span>
          </button>
        </div>

        {/* Demo Collision / Reset Toggle */}
        {!isDemoMode ? (
          <button
            onClick={onTriggerDemo}
            className="flex items-center px-3 xl:px-4 py-2 rounded bg-status-critical/20 border border-status-critical text-status-critical font-body-sm text-body-sm hover:bg-status-critical/30 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] mr-1.5">warning</span>
            <span className="whitespace-nowrap">Demo Collision</span>
          </button>
        ) : (
          <button
            onClick={onResetDemo}
            className="flex items-center px-3 xl:px-4 py-2 rounded bg-status-success/20 border border-status-success text-status-success font-body-sm text-body-sm hover:bg-status-success/30 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] mr-1.5">restart_alt</span>
            <span className="whitespace-nowrap">Reset State</span>
          </button>
        )}

        {/* Clock */}
        <div className="hidden lg:flex items-center pl-4 border-l border-grid-line">
          <span className="material-symbols-outlined text-[18px] mr-2 text-on-surface-variant">
            schedule
          </span>
          <span className="font-data-mono text-data-mono text-on-surface whitespace-nowrap">
            {timeStr}
          </span>
        </div>
      </div>
    </header>
  );
};
