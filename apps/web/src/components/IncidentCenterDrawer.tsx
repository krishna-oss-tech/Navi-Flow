"use client";

import React from "react";
import { Incident } from "@/types";

interface IncidentCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onSimulateIncident: (inc: Incident) => void;
}

const severityConfig: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: {
    bg: "bg-status-critical/15",
    text: "text-status-critical",
    border: "border-status-critical/30",
  },
  HIGH: {
    bg: "bg-status-danger/15",
    text: "text-status-danger",
    border: "border-status-danger/30",
  },
  MODERATE: {
    bg: "bg-status-warning/15",
    text: "text-status-warning",
    border: "border-status-warning/30",
  },
  LOW: {
    bg: "bg-status-success/15",
    text: "text-status-success",
    border: "border-status-success/30",
  },
};

export const IncidentCenterDrawer: React.FC<IncidentCenterDrawerProps> = ({
  isOpen,
  onClose,
  incidents,
  onSelectIncident,
  onSimulateIncident,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-2xl bg-surface-elevated rounded-xl border border-grid-line flex flex-col overflow-hidden shadow-2xl animate-scale-in max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-grid-line bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-status-critical/15 text-status-critical border border-status-critical/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">emergency</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
                Active Incident Operations Center
                <span className="font-data-mono text-data-mono px-2 py-0.5 rounded-full bg-status-critical/15 text-status-critical border border-status-critical/30">
                  {incidents.length} Active
                </span>
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Corridor chokepoints, collisions &amp; capacity reduction disruptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Incident List */}
        <div className="p-6 space-y-3.5 overflow-y-auto">
          {incidents.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant font-body-sm text-body-sm">
              No active traffic incidents or bottlenecks detected in Nagpur.
            </div>
          ) : (
            incidents.map((inc) => {
              const cfg = severityConfig[inc.severity] || severityConfig.MODERATE;
              return (
                <div
                  key={inc.id}
                  className="p-4 rounded-lg bg-surface border border-outline-variant space-y-3 hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-label-caps text-label-caps uppercase tracking-wider ${cfg.bg} ${cfg.text} border ${cfg.border}`}
                      >
                        {inc.severity}
                      </span>
                      <span className="font-bold text-on-surface text-sm">{inc.title}</span>
                    </div>
                    <span className="font-data-mono text-data-mono text-on-surface-variant">
                      {inc.isSimulated ? "SIMULATED" : "VERIFIED FEED"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-data-mono text-data-mono text-on-surface-variant pt-1 border-t border-grid-line">
                    <div>
                      <span>Blocked Lanes</span>
                      <div className="text-on-surface font-bold">{inc.blockedLanes} lane(s)</div>
                    </div>
                    <div>
                      <span>Capacity Shock</span>
                      <div className="text-status-critical font-bold">
                        -{inc.capacityReductionPct}%
                      </div>
                    </div>
                    <div>
                      <span>Source</span>
                      <div className="text-primary font-bold uppercase">{inc.source}</div>
                    </div>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {inc.description}
                  </p>

                  <div className="flex justify-end gap-2 pt-2 border-t border-grid-line">
                    <button
                      onClick={() => {
                        onSelectIncident(inc);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded bg-surface border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary font-body-sm text-body-sm flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      Focus Map
                    </button>
                    <button
                      onClick={() => {
                        onSimulateIncident(inc);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded bg-primary text-on-primary font-bold font-body-sm text-body-sm flex items-center gap-1.5 transition-all hover:bg-primary-fixed"
                    >
                      <span className="material-symbols-outlined text-[16px]">show_chart</span>
                      Simulate Shockwave
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
