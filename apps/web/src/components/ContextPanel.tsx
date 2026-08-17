"use client";

import React, { useState } from "react";
import { NetworkSummary, JunctionRisk, DeploymentRecommendation } from "@/types";

interface ContextPanelProps {
  data: NetworkSummary | null;
  selectedJunctionId: string | null;
  onClose: () => void;
  onAcceptRecommendation: (recId: string) => void;
  onOverrideRecommendation: (recId: string, altOfficerId: string, reason: string) => void;
  onRejectRecommendation: (recId: string) => void;
  onSimulateJunction: (junctionId: string) => void;
}

const severityColorMap = {
  CRITICAL: {
    border: "border-status-critical",
    text: "text-status-critical",
    bar: "bg-status-critical",
    accent: "shadow-[0_0_16px_rgba(255,77,0,0.4)]",
    badge: "MODERATE Risk",
  },
  HIGH: {
    border: "border-status-danger",
    text: "text-status-danger",
    bar: "bg-status-danger",
    accent: "shadow-[0_0_16px_rgba(239,68,68,0.4)]",
    badge: "HIGH Risk",
  },
  MODERATE: {
    border: "border-status-warning",
    text: "text-status-warning",
    bar: "bg-status-warning",
    accent: "shadow-[0_0_16px_rgba(245,158,11,0.3)]",
    badge: "MODERATE Risk",
  },
  LOW: {
    border: "border-status-success",
    text: "text-status-success",
    bar: "bg-status-success",
    accent: "shadow-[0_0_16px_rgba(16,185,129,0.3)]",
    badge: "LOW Risk",
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
  const severity = (junctionRisk?.severity || "LOW") as keyof typeof severityColorMap;
  const styleConfig = severityColorMap[severity] || severityColorMap.LOW;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAccept = (recId: string) => {
    onAcceptRecommendation(recId);
    showToast("✓ Dispatch recommendation accepted & logged to immutable audit ledger.");
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
        {
          label: "Incident Impact",
          value: junctionRisk.incidentFactor,
          color: "bg-status-danger",
        },
        {
          label: "Congestion",
          value: junctionRisk.congestionFactor,
          color: "bg-status-warning",
        },
        {
          label: "Network Centrality",
          value: junctionRisk.criticalityFactor,
          color: "bg-primary-container",
        },
        {
          label: "Exposure",
          value: junctionRisk.exposureFactor,
          color: "bg-secondary-fixed-dim",
        },
      ]
    : [];

  return (
    <>
      <aside className="w-[400px] bg-surface-elevated border-l border-grid-line flex flex-col shrink-0 z-20 shadow-2xl relative select-none animate-slide-in-right">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-2.5 bg-status-success/15 border-b border-status-success/30 text-status-success text-body-sm font-bold text-center animate-fade-in flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            {toastMessage}
          </div>
        )}

        {/* ─── Panel Header ─── */}
        <div className="p-6 border-b border-grid-line bg-surface-container-low">
          <div className="flex items-center justify-between mb-4">
            <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase">
              Junction Intelligence
            </span>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 leading-tight">
            {junctionRisk?.name || selectedJunctionId}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center">
            <span className="material-symbols-outlined text-[16px] mr-1 text-primary">
              location_on
            </span>
            Nagpur LIVE
          </p>
        </div>

        {/* ─── Scrollable Body ─── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Risk Score Card */}
          {junctionRisk && (
            <div className="bg-surface border border-outline-variant rounded-lg p-5 relative overflow-hidden group">
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${styleConfig.bar} group-hover:glow-accent transition-all`}
              />
              <div className="flex justify-between items-start mb-4">
                <div className={`flex items-center ${styleConfig.text}`}>
                  <span className="material-symbols-outlined mr-2">
                    {severity === "CRITICAL" ? "emergency" : "warning"}
                  </span>
                  <span className="font-label-caps text-label-caps font-bold uppercase tracking-wider">
                    {junctionRisk.severity} Risk
                  </span>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end">
                    <span
                      className={`font-display-metrics text-display-metrics ${styleConfig.text}`}
                    >
                      {Math.round(junctionRisk.riskScore)}
                    </span>
                    <span className="font-data-mono text-data-mono text-on-surface-variant ml-1">
                      /100
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant font-body-sm text-body-sm">
                <span>Confidence: {Math.round(junctionRisk.confidence * 100)}%</span>
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
              </div>
            </div>
          )}

          {/* Risk Factor Analysis */}
          {junctionRisk && (
            <div>
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 uppercase tracking-wider border-b border-grid-line pb-2">
                Risk Factor Analysis
              </h3>
              <div className="space-y-4">
                {factors.map((f) => (
                  <div key={f.label}>
                    <div className="flex justify-between font-data-mono text-data-mono mb-1.5">
                      <span className="text-on-surface-variant">{f.label}</span>
                      <span className="text-on-surface font-bold">{Math.round(f.value)}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className={`h-full ${f.color} rounded-full relative transition-all duration-500`}
                        style={{ width: `${Math.min(Math.max(f.value, 2), 100)}%` }}
                      >
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-60" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnosis Panel */}
          {junctionRisk && (
            <div className="bg-surface-container rounded-lg p-4 border border-grid-line">
              <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                <span className="font-bold text-on-surface-variant">Diagnosis: </span>
                {junctionRisk.whyExplanation}
              </p>
            </div>
          )}

          {/* Police Dispatch Section */}
          {pendingRec ? (
            <div className="bg-surface-container rounded-lg p-5 border border-primary/40 space-y-4 shadow-lg shadow-cyan-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-primary font-label-caps text-label-caps uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px] mr-1.5 text-primary">
                    local_police
                  </span>
                  <span>OR-Tools Police Dispatch</span>
                </div>
                <span className="font-data-mono text-data-mono px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary">
                  ETA {pendingRec.estimatedArrivalMinutes}m
                </span>
              </div>

              <div className="space-y-1">
                <div className="font-headline-md text-headline-md text-on-surface font-bold">
                  {pendingRec.officerName}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {pendingRec.rationale}
                </p>
                <div className="font-data-mono text-data-mono text-status-success font-semibold pt-1">
                  Expected Benefit: -{pendingRec.expectedRiskReduction} risk pts
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => handleAccept(pendingRec.recommendationId)}
                  className="flex items-center justify-center py-2.5 px-3 rounded bg-status-success/20 border border-status-success text-status-success hover:bg-status-success/30 font-body-sm text-body-sm font-semibold transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] mr-1">check</span>
                  Accept
                </button>
                <button
                  onClick={() => setOverrideModalRec(pendingRec)}
                  className="flex items-center justify-center py-2.5 px-3 rounded bg-surface border border-outline-variant text-status-warning hover:bg-surface-variant font-body-sm text-body-sm font-semibold transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] mr-1">redo</span>
                  Override
                </button>
                <button
                  onClick={() => handleReject(pendingRec.recommendationId)}
                  className="flex items-center justify-center py-2.5 px-3 rounded bg-surface border border-outline-variant text-on-surface-variant hover:text-status-danger hover:border-status-danger/40 font-body-sm text-body-sm font-semibold transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] mr-1">close</span>
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-grid-line space-y-3">
              {junctionRisk?.policeAssigned ? (
                <button className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-surface border border-status-success/30 text-status-success hover:bg-status-success/10 transition-colors font-body-sm text-body-sm font-semibold">
                  <span className="material-symbols-outlined text-[20px] mr-2">person_pin</span>
                  Police Officer Active on Ground
                </button>
              ) : (
                <div className="p-3.5 rounded-lg bg-surface border border-grid-line text-center font-body-sm text-body-sm text-on-surface-variant">
                  No active incidents or pending police dispatch.
                </div>
              )}
            </div>
          )}

          {/* What-If Disruption Trigger Button */}
          <button
            onClick={() => onSimulateJunction(selectedJunctionId)}
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-surface-container-high border border-primary text-primary hover:bg-primary/10 transition-colors font-body-sm text-body-sm font-semibold relative overflow-hidden group active:scale-95"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="material-symbols-outlined text-[20px] mr-2 group-hover:glow-text transition-all">
              show_chart
            </span>
            <span className="group-hover:glow-text transition-all">
              Run What-If Disruption on Node
            </span>
          </button>
        </div>
      </aside>

      {/* ─── Override Modal ─── */}
      {overrideModalRec && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-surface-elevated p-6 rounded-xl border border-grid-line space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-grid-line pb-3">
              <h3 className="font-headline-md text-headline-md font-bold text-primary">
                Operator Dispatch Override
              </h3>
              <button
                onClick={() => setOverrideModalRec(null)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Reassign police resource for{" "}
              <span className="font-bold text-primary">
                {overrideModalRec.targetJunctionName}
              </span>
            </p>

            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block">
                Select Alternate Officer
              </label>
              <select
                value={selectedAltOfficer}
                onChange={(e) => setSelectedAltOfficer(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded p-2.5 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">— Choose Officer —</option>
                {availableOfficers.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.name} ({off.rank})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block">
                Override Rationale (Required for Audit Trail)
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Officer closer to spot via East corridor bypass..."
                className="w-full h-20 bg-surface border border-outline-variant rounded p-2.5 font-body-sm text-body-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOverrideModalRec(null)}
                className="px-4 py-2 rounded bg-surface text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOverride}
                disabled={!selectedAltOfficer || !overrideReason}
                className="px-4 py-2 rounded bg-status-warning/20 border border-status-warning text-status-warning hover:bg-status-warning/30 disabled:opacity-40 disabled:cursor-not-allowed font-body-sm text-body-sm font-bold transition-all"
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
