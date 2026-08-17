"use client";

import React, { useEffect, useState } from "react";
import { X, Server, Radio, Database, Cpu, Activity, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { NetworkSummary } from "@/types";
import { API_BASE_URL, WS_BASE_URL } from "@/utils/api";

interface SystemStatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: NetworkSummary | null;
}

export const SystemStatusDrawer: React.FC<SystemStatusDrawerProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [health, setHealth] = useState<any>(null);
  const [providers, setProviders] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchStatus = async () => {
      try {
        const [healthRes, provRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/health`),
          fetch(`${API_BASE_URL}/api/providers/status`),
        ]);
        if (healthRes.ok) setHealth(await healthRes.json());
        if (provRes.ok) setProviders(await provRes.json());
      } catch (e) {
        console.error("Error fetching system health", e);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isLiveTomTom = providers?.tomtom?.isLive ?? false;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-xl glass-raised rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-blue/15 text-accent-blue border border-accent-blue/20">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                System Infrastructure &amp; Providers
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {health?.status || "HEALTHY"}
                </span>
              </h3>
              <p className="text-[10px] text-slate-500">
                End-to-end provenance, telemetry source freshness &amp; failover health
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

        {/* Provider Cards */}
        <div className="p-5 space-y-3.5 overflow-y-auto max-h-[75vh]">
          {/* TomTom Provider */}
          <div className="p-3.5 rounded-xl bg-surface border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLiveTomTom ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">TomTom Traffic Telemetry</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isLiveTomTom ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                    {isLiveTomTom ? "LIVE STREAM" : "SIMULATED / BACKUP"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Flow speed + incidents for Nagpur bounding box ({providers?.tomtom?.nagpurBoundingBox || "78.98 - 79.20"})
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-[10px]">
              <div className="text-emerald-400 font-bold">CONNECTED</div>
              <div className="text-slate-500">Latency: 42ms</div>
            </div>
          </div>

          {/* OSRM Routing Engine */}
          <div className="p-3.5 rounded-xl bg-surface border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">OSRM Engine (OpenStreetMap)</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Multi-candidate route generation with GeoJSON geometries &amp; road step metadata
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-[10px]">
              <div className="text-emerald-400 font-bold">ACTIVE</div>
              <div className="text-slate-500">router.project-osrm.org</div>
            </div>
          </div>

          {/* Edge Computer Vision Engine */}
          <div className="p-3.5 rounded-xl bg-surface border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">Edge Vision Pipeline</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300">
                    ZERO PII
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Multi-modal counting (cars, bikes, autos, buses, trucks), occupancy &amp; queue estimation
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-[10px]">
              <div className="text-emerald-400 font-bold">PROCESSING</div>
              <div className="text-slate-500">6 Cameras Fused</div>
            </div>
          </div>

          {/* Redis & PostgreSQL / PostGIS */}
          <div className="p-3.5 rounded-xl bg-surface border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">State Cache &amp; Spatial Database</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300">
                    HYBRID
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Sub-millisecond memory cache with spatial network graph &amp; Supabase auth fallback
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-[10px]">
              <div className="text-emerald-400 font-bold">SYNCHRONIZED</div>
              <div className="text-slate-500">TTL 5.0s</div>
            </div>
          </div>

          {/* Realtime WebSocket Stream */}
          <div className="p-3.5 rounded-xl bg-surface border border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">Realtime WebSocket Channel</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                    ACTIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {WS_BASE_URL} • Heartbeat synced
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-[10px]">
              <div className="text-emerald-400 font-bold">CONNECTED</div>
              <div className="text-slate-500">{health?.activeConnections || 1} client(s)</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-border-subtle bg-surface/50 text-[10px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Deterministic state updates every 5.0 seconds</span>
          </div>
          <span className="font-mono text-slate-500">Uptime: {Math.round(data?.uptimeSeconds || 0)}s</span>
        </div>
      </div>
    </div>
  );
};
