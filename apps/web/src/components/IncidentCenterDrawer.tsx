"use client";

import React from "react";
import { X, AlertTriangle, Play, MapPin, Clock, ShieldAlert } from "lucide-react";
import { Incident } from "@/types";

interface IncidentCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onSimulateIncident: (inc: Incident) => void;
}

const severityConfig: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  HIGH: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  MODERATE: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  LOW: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
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
      <div className="w-full max-w-2xl glass-raised rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-scale-in max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Active Incident Operations Center
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                  {incidents.length} Active
                </span>
              </h3>
              <p className="text-[10px] text-slate-500">
                Corridor chokepoints, collisions &amp; capacity reduction disruptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface hover:bg-surface-raised text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Incident List */}
        <div className="p-5 space-y-3 overflow-y-auto">
          {incidents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No active traffic incidents or bottlenecks detected in Nagpur.
            </div>
          ) : (
            incidents.map((inc) => {
              const cfg = severityConfig[inc.severity] || severityConfig.MODERATE;
              return (
                <div
                  key={inc.id}
                  className="p-4 rounded-xl bg-surface border border-border-subtle space-y-2.5 hover:bg-surface-raised transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        {inc.severity}
                      </span>
                      <span className="text-xs font-bold text-white">{inc.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {inc.isSimulated ? "SIMULATED" : "VERIFIED FEED"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono pt-1">
                    <div>
                      <span>Blocked Lanes</span>
                      <div className="text-white font-bold">{inc.blockedLanes} lane(s)</div>
                    </div>
                    <div>
                      <span>Capacity Shock</span>
                      <div className="text-red-400 font-bold">-{inc.capacityReductionPct}%</div>
                    </div>
                    <div>
                      <span>Source</span>
                      <div className="text-slate-300 font-bold uppercase">{inc.source}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                    <button
                      onClick={() => {
                        onSelectIncident(inc);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-surface-overlay hover:bg-surface text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 border border-border transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-accent-blue" />
                      Focus on Map
                    </button>
                    <button
                      onClick={() => {
                        onSimulateIncident(inc);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-accent-blue/15 hover:bg-accent-blue/25 text-accent-blue text-[11px] font-bold flex items-center gap-1.5 border border-accent-blue/20 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Simulate Impact
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
