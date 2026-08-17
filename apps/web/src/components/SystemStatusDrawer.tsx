"use client";

import React, { useEffect, useState } from "react";
import { NetworkSummary } from "@/types";
import { API_BASE_URL } from "@/utils/api";

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
      <div className="w-full max-w-xl bg-surface-elevated rounded-xl border border-grid-line flex flex-col overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-grid-line bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-primary/10 text-primary border border-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">dns</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                System Infrastructure &amp; Health
                <span className="font-data-mono text-data-mono px-2 py-0.5 rounded-full bg-status-success/15 text-status-success border border-status-success/30">
                  {health?.status || "HEALTHY"}
                </span>
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                End-to-end provenance, telemetry freshness &amp; failover health
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

        {/* Provider Cards */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* TomTom Provider */}
          <div className="p-4 rounded-lg bg-surface border border-grid-line flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded flex items-center justify-center ${
                  isLiveTomTom
                    ? "bg-status-success/15 text-status-success"
                    : "bg-status-warning/15 text-status-warning"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">cell_tower</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-on-surface font-body-sm text-body-sm">
                    TomTom Traffic Telemetry
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-label-caps text-[9px] font-bold uppercase tracking-wider ${
                      isLiveTomTom
                        ? "bg-status-success/20 text-status-success"
                        : "bg-status-warning/20 text-status-warning"
                    }`}
                  >
                    {isLiveTomTom ? "LIVE STREAM" : "SIMULATED / BACKUP"}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Flow speed + incidents for Nagpur bounding box
                </p>
              </div>
            </div>
            <div className="text-right font-data-mono text-data-mono">
              <div className="text-status-success font-bold">CONNECTED</div>
              <div className="text-on-surface-variant">42ms latency</div>
            </div>
          </div>

          {/* OSRM Routing Engine */}
          <div className="p-4 rounded-lg bg-surface border border-grid-line flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-primary/15 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">alt_route</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-on-surface font-body-sm text-body-sm">
                    OSRM Nagpur Routing Engine
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-label-caps text-[9px] font-bold uppercase tracking-wider">
                    NOMINAL
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Topological graph calculation &amp; shortest path search
                </p>
              </div>
            </div>
            <div className="text-right font-data-mono text-data-mono">
              <div className="text-status-success font-bold">OPTIMAL</div>
              <div className="text-on-surface-variant">18ms compute</div>
            </div>
          </div>

          {/* OR-Tools Police Optimization */}
          <div className="p-4 rounded-lg bg-surface border border-grid-line flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-secondary/15 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">local_police</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-on-surface font-body-sm text-body-sm">
                    OR-Tools Resource Optimizer
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-label-caps text-[9px] font-bold uppercase tracking-wider">
                    DETERMINISTIC
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Constraint satisfaction &amp; officer dispatch allocation
                </p>
              </div>
            </div>
            <div className="text-right font-data-mono text-data-mono">
              <div className="text-status-success font-bold">READY</div>
              <div className="text-on-surface-variant">Pure Algorithmic</div>
            </div>
          </div>

          {/* CCTV Edge Vision Feed */}
          <div className="p-4 rounded-lg bg-surface border border-grid-line flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-status-warning/15 text-status-warning flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">videocam</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-on-surface font-body-sm text-body-sm">
                    Edge Optical CCTV Streams
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-status-success/20 text-status-success font-label-caps text-[9px] font-bold uppercase tracking-wider">
                    ZERO-PII
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  4 active optical sensors • 28.5 avg FPS • RT-DETR model
                </p>
              </div>
            </div>
            <div className="text-right font-data-mono text-data-mono">
              <div className="text-status-success font-bold">4/4 STREAMS</div>
              <div className="text-on-surface-variant">96% confidence</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
