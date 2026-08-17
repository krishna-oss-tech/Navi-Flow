"use client";

import React, { useState, useEffect } from "react";
import { Activity, X, Play, TrendingUp, CheckCircle2 } from "lucide-react";
import { NetworkSummary } from "@/types";
import { API_BASE_URL } from "@/utils/api";

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NetworkSummary | null;
  targetJunctionId?: string | null;
}

const FALLBACK_JUNCTIONS = [
  { junctionId: "j_sitabuldi", name: "Sitabuldi Interchange (Variety Sq)", riskScore: 82 },
  { junctionId: "j_wardha_rd", name: "Wardha Road T-Point (Rahate Colony)", riskScore: 48 },
  { junctionId: "j_medical_sq", name: "Medical Square (Ajni Approach)", riskScore: 54 },
  { junctionId: "j_agrasen_sq", name: "Central Avenue (Agrasen Sq)", riskScore: 42 },
  { junctionId: "j_sadar", name: "Sadar Residency Road (Katol Naka)", riskScore: 36 },
  { junctionId: "j_dharampeth", name: "Dharampeth Coffee House Sq", riskScore: 38 },
  { junctionId: "j_cotton_mkt", name: "Cotton Market Sq (Railway Station)", riskScore: 68 },
];

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  data,
  targetJunctionId,
}) => {
  const [selectedJunction, setSelectedJunction] = useState<string>(targetJunctionId || "j_sitabuldi");
  const [incidentType, setIncidentType] = useState<string>("accident");
  const [blockedLanes, setBlockedLanes] = useState<number>(2);
  const [capacityReduction, setCapacityReduction] = useState<number>(65);
  const [duration, setDuration] = useState<number>(45);
  const [loading, setLoading] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  useEffect(() => {
    if (targetJunctionId) {
      setSelectedJunction(targetJunctionId);
    }
  }, [targetJunctionId]);

  if (!isOpen) return null;

  const junctionOptions =
    data && Object.keys(data.junctionRisks).length > 0
      ? Object.values(data.junctionRisks).map((j) => ({
          junctionId: j.junctionId,
          name: j.name,
          riskScore: j.riskScore,
        }))
      : FALLBACK_JUNCTIONS;

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulation/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetJunctionId: selectedJunction,
          incidentType,
          blockedLanes,
          capacityReductionPct: capacityReduction,
          durationMinutes: duration,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setSimResult(result);
        return;
      }
      throw new Error("Server returned non-200");
    } catch (e) {
      // Deterministic client-side shockwave propagation fallback
      const targetJ = junctionOptions.find((j) => j.junctionId === selectedJunction) || junctionOptions[0];
      const shockFactor = capacityReduction / 100.0;
      const baselineSpeed = 38.0;
      const simulatedSpeed = Math.max(8.0, Math.round(baselineSpeed * (1.0 - shockFactor * 0.75)));
      const baselineCong = Math.round(targetJ.riskScore);
      const simCong = Math.min(98, Math.round(baselineCong + shockFactor * 45));

      setSimResult({
        scenarioId: `sim_local_${Date.now()}`,
        scenarioName: `What-If: ${incidentType.toUpperCase()} at ${targetJ.name}`,
        targetJunctionName: targetJ.name,
        blockedLanes,
        durationMinutes: duration,
        baselineAverageSpeedKmh: baselineSpeed,
        simulatedAverageSpeedKmh: simulatedSpeed,
        baselineCongestionScore: baselineCong,
        simulatedCongestionScore: simCong,
        delayIncreaseSeconds: Math.round(duration * shockFactor * 18),
        affectedSegmentsCount: blockedLanes + 2,
        spillbackQueueMeters: Math.round(blockedLanes * 85 * shockFactor),
        shockwaveRadiusKm: (0.8 + shockFactor * 1.4).toFixed(1),
        impactAssessment: `Capacity reduced by ${capacityReduction}%. BPR shockwave propagates upstream with an estimated queue spillback of ${Math.round(
          blockedLanes * 85 * shockFactor
        )}m. Alternate diversion corridors recommended.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-3xl glass-accent rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-blue/15 text-accent-blue border border-accent-blue/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                What-If Simulator
                <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  SIMULATED
                </span>
              </h3>
              <p className="text-[10px] text-slate-500">
                Evaluate capacity shocks &amp; shockwave propagation
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface p-4 rounded-xl border border-border-subtle text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                Target Junction
              </label>
              <select
                value={selectedJunction}
                onChange={(e) => setSelectedJunction(e.target.value)}
                className="w-full bg-surface-overlay border border-border rounded-lg p-2 text-white text-xs focus:outline-none focus:border-accent-blue transition-colors"
              >
                {junctionOptions.map((j) => (
                  <option key={j.junctionId} value={j.junctionId}>
                    {j.name} (Risk: {Math.round(j.riskScore)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                Incident Type
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full bg-surface-overlay border border-border rounded-lg p-2 text-white text-xs focus:outline-none focus:border-accent-blue transition-colors"
              >
                <option value="accident">Multi-Vehicle Accident</option>
                <option value="lane_blockage">Stalled Vehicle / Lane Blockage</option>
                <option value="closure">Emergency Road Closure</option>
                <option value="waterlogging">Monsoon Waterlogging</option>
                <option value="roadworks">Metro Rail Construction</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                <span>Blocked Lanes: {blockedLanes}</span>
                <span>Capacity Shock: {capacityReduction}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={capacityReduction}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setCapacityReduction(val);
                  setBlockedLanes(val > 50 ? 2 : 1);
                }}
                className="w-full accent-sky-400"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRun}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 font-bold text-white text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/15 transition-all active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {loading ? "Computing..." : "Execute Simulation"}
              </button>
            </div>
          </div>

          {/* Results */}
          {simResult && (
            <div className="space-y-4 animate-slide-in-up">
              <div className="flex items-center gap-2 text-[10px] font-bold text-accent-blue uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Baseline vs Disruption Comparison
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Baseline ETA",
                    value: `${Math.round(simResult.baselineAverageEtaSeconds)}s`,
                    color: "text-emerald-400",
                    sub: "Normal flow",
                  },
                  {
                    label: "Disrupted ETA",
                    value: `${Math.round(simResult.simulatedAverageEtaSeconds)}s`,
                    color: "text-red-400",
                    sub: `+${simResult.beforeAfterDelta.travelTimeInflationPct}% inflation`,
                  },
                  {
                    label: "Network Delay",
                    value: `${Math.round(simResult.networkDelaySeconds)}s`,
                    color: "text-amber-400",
                    sub: "Cumulative",
                  },
                  {
                    label: "Police Recovery",
                    value: `-${simResult.beforeAfterDelta.projectedRiskReductionWithPolicePct}%`,
                    color: "text-sky-400",
                    sub: "Projected risk reduction",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-3.5 rounded-xl bg-surface border border-border-subtle"
                  >
                    <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                      {stat.label}
                    </div>
                    <div className={`text-lg font-black font-mono mt-1 ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Affected Corridors */}
              <div className="p-3.5 rounded-xl bg-surface border border-border-subtle">
                <div className="text-[10px] font-bold text-slate-400 mb-2">
                  Shockwave Propagated Corridors
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {simResult.affectedCorridors.map((c: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-lg bg-red-500/8 text-red-400 border border-red-500/15 text-[10px] font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
