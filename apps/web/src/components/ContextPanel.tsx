"use client";

import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Activity,
  Check,
  CornerDownRight,
  TrendingUp,
  Ban,
} from "lucide-react";
import { NetworkSummary, JunctionRisk, DeploymentRecommendation, Officer } from "@/types";

interface ContextPanelProps {
  data: NetworkSummary | null;
  selectedJunctionId: string | null;
  onClose: () => void;
  onAcceptRecommendation: (recId: string) => void;
  onOverrideRecommendation: (recId: string, altOfficerId: string, reason: string) => void;
  onRejectRecommendation: (recId: string) => void;
  onSimulateJunction: (junctionId: string) => void;
}

const severityConfig = {
  CRITICAL: {
    bg: "bg-red-500/8",
    border: "border-red-500/25",
    text: "text-red-400",
    glow: "shadow-glow-rose",
  },
  HIGH: {
    bg: "bg-orange-500/8",
    border: "border-orange-500/25",
    text: "text-orange-400",
    glow: "shadow-glow-amber",
  },
  MODERATE: {
    bg: "bg-yellow-500/8",
    border: "border-yellow-500/25",
    text: "text-yellow-400",
    glow: "",
  },
  LOW: {
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/25",
    text: "text-emerald-400",
    glow: "",
  },
};

export const ContextPanel: React.FC<ContextPanelProps> = ({
  data,
  selectedJunctionId,
  onClose,
  onAcceptRecommendation,
  onOverrideRecommendation,
  onRejectRecommendation,
  onSimulateJunction,
}) => {
  const [overrideModalRec, setOverrideModalRec] = useState<DeploymentRecommendation | null>(null);
  const [selectedAltOfficer, setSelectedAltOfficer] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!data || !selectedJunctionId) {
    return null;
  }

  const junctionRisk: JunctionRisk | undefined = data.junctionRisks[selectedJunctionId];
  const pendingRec = data.recommendations.find((r) => r.targetJunctionId === selectedJunctionId);
  const availableOfficers = data.officers.filter((o) => o.isAvailable);
  const severity = (junctionRisk?.severity || "LOW") as keyof typeof severityConfig;
  const config = severityConfig[severity] || severityConfig.LOW;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAccept = (recId: string) => {
    onAcceptRecommendation(recId);
    showToast("✓ Dispatch recommendation accepted & logged to audit ledger.");
  };

  const handleReject = (recId: string) => {
    onRejectRecommendation(recId);
    showToast("✕ Recommendation rejected. Audit event registered.");
  };

  const handleConfirmOverride = () => {
    if (!overrideModalRec || !selectedAltOfficer || !overrideReason) return;
    onOverrideRecommendation(overrideModalRec.recommendationId, selectedAltOfficer, overrideReason);
    showToast("⚠ Officer deployment overridden by human operator.");
    setOverrideModalRec(null);
    setSelectedAltOfficer("");
    setOverrideReason("");
  };

  const factors = junctionRisk
    ? [
        { label: "Incident Impact", value: junctionRisk.incidentFactor, color: "bg-red-500" },
        { label: "Congestion", value: junctionRisk.congestionFactor, color: "bg-amber-500" },
        { label: "Network Centrality", value: junctionRisk.criticalityFactor, color: "bg-sky-500" },
        { label: "Exposure", value: junctionRisk.exposureFactor, color: "bg-purple-500" },
      ]
    : [];

  return (
    <>
      <aside className="w-drawer glass-raised border-l border-border-subtle flex flex-col overflow-y-auto select-none z-20 animate-slide-in-right shrink-0">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-2.5 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-[11px] font-bold text-center animate-fade-in flex items-center justify-center gap-1.5">
            {toastMessage}
          </div>
        )}

        {/* ─── Header ─── */}
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-accent-blue">
                Junction Intelligence
              </span>
              <h2 className="text-base font-bold text-white leading-tight mt-0.5 truncate">
                {junctionRisk?.name || selectedJunctionId}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface hover:bg-surface-raised text-slate-500 hover:text-white transition-colors duration-150 shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Severity + Score Banner */}
          {junctionRisk && (
            <div
              className={`mt-3 p-3 rounded-xl border flex items-center justify-between ${config.bg} ${config.border}`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${config.text}`} />
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
                    {junctionRisk.severity} Risk
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    Confidence: {Math.round(junctionRisk.confidence * 100)}%
                  </div>
                </div>
              </div>

              {/* Large Score */}
              <div className={`text-right ${config.text}`}>
                <div className="text-2xl font-black font-mono leading-none">
                  {Math.round(junctionRisk.riskScore)}
                </div>
                <div className="text-[9px] font-medium text-slate-500">/100</div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Factor Breakdown ─── */}
        {junctionRisk && (
          <div className="p-4 border-b border-border-subtle space-y-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Risk Factor Analysis
            </div>

            <div className="space-y-2.5">
              {factors.map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] text-slate-400">{f.label}</span>
                    <span className="text-[11px] font-mono font-bold text-slate-200">
                      {Math.round(f.value)}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-surface-overlay rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${f.color}`}
                      style={{ width: `${Math.min(f.value, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Diagnosis */}
            <div className="pt-2 border-t border-border-subtle">
              <div className="text-[10px] text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-200">Diagnosis: </span>
                {junctionRisk.whyExplanation}
              </div>
            </div>
          </div>
        )}

        {/* ─── Police Dispatch Card ─── */}
        <div className="p-4 space-y-3 flex-1">
          {pendingRec ? (
            <div className="p-4 rounded-xl bg-gradient-to-b from-sky-950/30 to-surface border border-accent-blue/20 space-y-3 shadow-glow-blue">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-accent-blue">
                  <ShieldCheck className="w-4 h-4" />
                  <span>OR-Tools Police Dispatch</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/20">
                  ETA {pendingRec.estimatedArrivalMinutes}m
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-white">{pendingRec.officerName}</div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{pendingRec.rationale}</p>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Expected Benefit: -{pendingRec.expectedRiskReduction} risk pts
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={() => handleAccept(pendingRec.recommendationId)}
                  className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all duration-150 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </button>
                <button
                  onClick={() => setOverrideModalRec(pendingRec)}
                  className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-surface hover:bg-surface-raised text-slate-200 text-[11px] font-semibold border border-border transition-all duration-150"
                >
                  <CornerDownRight className="w-3.5 h-3.5 text-amber-400" />
                  Override
                </button>
                <button
                  onClick={() => handleReject(pendingRec.recommendationId)}
                  className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-surface hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-[11px] font-semibold border border-border transition-all duration-150"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-surface border border-border-subtle text-[11px] text-slate-500 text-center">
              {junctionRisk?.policeAssigned ? (
                <div className="text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Police Officer Active on Ground
                </div>
              ) : (
                "No pending dispatch recommendations for this junction."
              )}
            </div>
          )}

          {/* Simulate Button */}
          <button
            onClick={() => onSimulateJunction(selectedJunctionId)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-surface hover:bg-surface-raised text-slate-300 text-[11px] font-bold border border-border-subtle transition-all duration-150 active:scale-[0.98]"
          >
            <Activity className="w-4 h-4 text-accent-blue" />
            Run What-If Disruption on Node
          </button>
        </div>
      </aside>

      {/* ─── Override Modal ─── */}
      {overrideModalRec && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md glass-raised p-5 rounded-2xl border border-border space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Human Operator Dispatch Override</h3>
              <button
                onClick={() => setOverrideModalRec(null)}
                className="p-1 rounded-lg bg-surface hover:bg-surface-raised text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Override assignment for{" "}
              <span className="font-bold text-accent-blue">{overrideModalRec.targetJunctionName}</span>
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Select Alternate Officer
              </label>
              <select
                value={selectedAltOfficer}
                onChange={(e) => setSelectedAltOfficer(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg p-2 text-xs text-white focus:outline-none focus:border-accent-blue transition-colors"
              >
                <option value="">— Choose Officer —</option>
                {availableOfficers.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.name} ({off.rank})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Override Reason (Required for Audit Trail)
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Officer closer to spot via East corridor bypass..."
                className="w-full h-20 bg-surface border border-border rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-accent-blue transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setOverrideModalRec(null)}
                className="px-3 py-1.5 rounded-lg bg-surface text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOverride}
                disabled={!selectedAltOfficer || !overrideReason}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-all"
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
