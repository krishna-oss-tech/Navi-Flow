"use client";

import React, { useState } from "react";
import { Navigation, Sliders, Shield, Zap, Check } from "lucide-react";
import { RouteCandidate } from "@/types";

interface RoutesPanelProps {
  onSelectRoute: (route: RouteCandidate | null) => void;
  activeRoute: RouteCandidate | null;
}

const classificationConfig: Record<string, { color: string; bg: string; border: string; accent: string }> = {
  RECOMMENDED: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    accent: "border-l-emerald-500",
  },
  FASTEST: {
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    accent: "border-l-sky-500",
  },
  LOW_RISK_ALTERNATIVE: {
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    accent: "border-l-purple-500",
  },
  BACKUP: {
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    accent: "border-l-slate-600",
  },
};

export const RoutesPanel: React.FC<RoutesPanelProps> = ({ onSelectRoute, activeRoute }) => {
  const [startPoint] = useState("Rahate Colony (Wardha Rd)");
  const [endPoint] = useState("Agrasen Sq (Central Ave)");
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteCandidate[]>([]);

  const handleQueryRoutes = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/routes/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startLat: 21.1278,
          startLon: 79.0754,
          endLat: 21.1532,
          endLon: 79.1055,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
        if (data.length > 0) {
          onSelectRoute(data[0]);
        }
      }
    } catch (e) {
      console.error("Error querying routes", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 text-xs select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Navigation className="w-4 h-4 text-accent-blue" />
          <h3 className="font-bold text-white text-sm">Route Intelligence</h3>
        </div>
        <p className="text-[10px] text-slate-500">
          Multi-objective ranking with real-time traffic awareness
        </p>
      </div>

      {/* Origin / Destination */}
      <div className="bg-surface rounded-xl border border-border-subtle p-3 space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-[11px] text-white font-medium truncate">{startPoint}</span>
        </div>
        <div className="w-px h-3 bg-slate-700 ml-[3px]" />
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          <span className="text-[11px] text-white font-medium truncate">{endPoint}</span>
        </div>

        <button
          onClick={handleQueryRoutes}
          disabled={loading}
          className="w-full mt-2 py-2 rounded-lg bg-accent-blue/15 hover:bg-accent-blue/25 text-accent-blue font-bold text-[11px] flex items-center justify-center gap-1.5 border border-accent-blue/20 transition-all duration-150 active:scale-[0.98]"
        >
          <Sliders className="w-3.5 h-3.5" />
          {loading ? "Ranking..." : "Calculate Routes"}
        </button>
      </div>

      {/* Route Candidates */}
      <div className="space-y-2">
        {routes.map((r) => {
          const isSelected = activeRoute?.routeId === r.routeId;
          const cfg = classificationConfig[r.classification] || classificationConfig.BACKUP;

          return (
            <div
              key={r.routeId}
              onClick={() => onSelectRoute(r)}
              className={`p-3 rounded-xl border-l-[3px] cursor-pointer transition-all duration-200 ${
                cfg.accent
              } ${
                isSelected
                  ? "bg-accent-blue/8 border border-l-[3px] border-accent-blue/30 shadow-glow-blue"
                  : "bg-surface border border-l-[3px] border-border-subtle hover:bg-surface-raised"
              }`}
            >
              {/* Classification + Duration */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                >
                  {r.classification.replace(/_/g, " ")}
                </span>
                <span className="text-white font-mono font-bold text-sm">
                  {Math.round(r.trafficDurationSeconds / 60)}
                  <span className="text-[9px] text-slate-500 font-normal ml-0.5">min</span>
                </span>
              </div>

              {/* Route Label */}
              <div className="font-bold text-white text-[11px]">{r.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate-2">{r.summary}</div>

              {/* Stats Grid */}
              <div className="mt-2 pt-2 border-t border-border-subtle grid grid-cols-3 gap-2 text-[9px] font-mono">
                <div>
                  <span className="text-slate-500">Dist</span>
                  <div className="text-slate-200 font-bold">{(r.distanceMeters / 1000).toFixed(1)}km</div>
                </div>
                <div>
                  <span className="text-slate-500">Cong</span>
                  <div className="text-amber-400 font-bold">{Math.round(r.averageCongestion)}%</div>
                </div>
                <div>
                  <span className="text-slate-500">Risk</span>
                  <div className="text-red-400 font-bold">{Math.round(r.maxRiskScore)}</div>
                </div>
              </div>

              {/* Recommendation Reason */}
              <div className="mt-2 text-[9px] text-accent-blue/80 leading-tight">
                {r.recommendationReason}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
