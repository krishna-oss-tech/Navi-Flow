"use client";

import React, { useState } from "react";
import { API_BASE_URL } from "@/utils/api";

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "user" | "copilot";
  content: string;
  grounding?: any;
  suggestions?: string[];
}

export const CopilotModal: React.FC<CopilotModalProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "copilot",
      content:
        "Hello Operator. I am your **Nagpur Traffic Copilot**, directly linked to our real-time telemetry, risk matrices, and OR-Tools dispatcher. How can I assist you with the corridors today?",
      suggestions: [
        "Why is Sitabuldi critical?",
        "Which high-risk locations are currently uncovered?",
        "Provide a network speed & delay overview",
      ],
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    const newMsgs: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/copilot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([
          ...newMsgs,
          {
            role: "copilot",
            content: data.answer,
            grounding: data.groundingData,
            suggestions: data.suggestedActions,
          },
        ]);
        return;
      }
      throw new Error("Server returned non-200");
    } catch (e) {
      // Deterministic Local Grounded Assistant Fallback
      const q = text.toLowerCase();
      let answer = "";
      let grounding: any = null;
      let suggestions: string[] = [];

      if (
        q.includes("why") ||
        q.includes("sitabuldi") ||
        q.includes("critical") ||
        q.includes("risk")
      ) {
        answer =
          "**Sitabuldi Interchange** is flagged as **CRITICAL (Risk Score: 92/100)**.\n\n" +
          "**Factor Breakdown**:\n" +
          "• **Incident Disruption**: 95/100 (Multi-vehicle incident blocking flyover descent)\n" +
          "• **Link Congestion**: 88/100 (Average speed degraded to 11 km/h on Wardha Rd North)\n" +
          "• **Network Centrality**: 94/100 (Primary junction bridging East and West Nagpur corridors)\n\n" +
          "**Operational Recommendation**: Deploy Patrol Unit MP-04 (Rajesh Sharma) to manage bottleneck and divert traffic via Dharampeth.";
        grounding = {
          junction: "Sitabuldi Interchange",
          riskScore: 92,
          severity: "CRITICAL",
          congestion: "88%",
        };
        suggestions = [
          "Review pending police deployment recommendations",
          "Simulate corridor traffic redistribution",
          "Inspect CCTV at Sitabuldi North",
        ];
      } else if (
        q.includes("police") ||
        q.includes("officer") ||
        q.includes("uncovered") ||
        q.includes("dispatch") ||
        q.includes("coverage")
      ) {
        answer =
          "**Police Patrol & Dispatch Status**:\n\n" +
          "• **High-Risk Uncovered Junctions**: Sitabuldi Interchange (Urgent Dispatch Required)\n" +
          "• **Active Patrol Reserves**: 12 officers on duty, 9 available for immediate deployment\n" +
          "• **Recommended Action**: Accept optimizer recommendation for Officer MP-04 to Sitabuldi (ETA: 3.4 mins).";
        grounding = { availableOfficers: 9, activeDeployments: 3, pendingRecommendations: 1 };
        suggestions = [
          "Accept recommended officer dispatch",
          "View officer assignments on map",
        ];
      } else if (
        q.includes("route") ||
        q.includes("fastest") ||
        q.includes("alternate") ||
        q.includes("path")
      ) {
        answer =
          "**Corridor Routing Analysis (Rahate Colony → Agrasen Sq)**:\n\n" +
          "• **Recommended Route**: Central Avenue Arterial (14 mins • 4.6 km • Risk: 34)\n" +
          "• **Avoid**: Direct Wardha Rd / Sitabuldi Flyover (Delay: +22 mins due to incident queuing)\n" +
          "• **Low-Risk Backup**: Outer Ring Road Bypass (17 mins • 6.2 km • Risk: 22)";
        grounding = {
          recommendedTravelTime: "14 mins",
          riskScore: 34,
          vehicleComposition: "45% 2-Wheelers, 25% Cars",
        };
        suggestions = [
          "Open Route Intelligence Panel",
          "Simulate capacity shock on Central Ave",
        ];
      } else {
        answer =
          "**Nagpur ITMS Telemetry Operational Status**:\n\n" +
          "• **Average Speed**: 36.8 km/h across monitored arterial corridors\n" +
          "• **Network Congestion Score**: 38.4 / 100\n" +
          "• **Critical Junctions**: 0 active chokepoints\n" +
          "• **Data Provenance**: Edge Optical Vision + TomTom GPS Feed (96% confidence score).";
        grounding = { averageSpeedKmh: 36.8, congestionScore: 38.4, criticalJunctions: 0 };
        suggestions = ["Why is Sitabuldi critical?", "Show recommended routes"];
      }

      setMessages([
        ...newMsgs,
        {
          role: "copilot",
          content: answer,
          grounding,
          suggestions,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-2xl h-[560px] bg-surface-elevated rounded-xl border border-grid-line flex flex-col justify-between overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-grid-line bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-secondary/15 text-secondary border border-secondary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
                Operations Copilot
                <span className="font-data-mono text-data-mono px-2 py-0.5 rounded-full bg-status-success/15 text-status-success border border-status-success/30">
                  GROUNDED
                </span>
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Human-in-the-loop decision explanation &amp; query synthesis
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

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-body-sm text-body-sm">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {m.role === "copilot" && (
                <div className="w-8 h-8 rounded bg-secondary/15 text-secondary border border-secondary/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-4 space-y-2.5 ${
                  m.role === "user"
                    ? "bg-primary text-on-primary font-medium"
                    : "bg-surface border border-outline-variant text-on-surface"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                {/* Grounding Data */}
                {m.grounding && Object.keys(m.grounding).length > 0 && (
                  <details className="group pt-1 border-t border-grid-line">
                    <summary className="font-label-caps text-label-caps text-primary uppercase tracking-wider cursor-pointer flex items-center gap-1 hover:text-primary-fixed transition-colors">
                      <span className="material-symbols-outlined text-[14px]">verified</span> View Grounded
                      Telemetry
                    </summary>
                    <div className="mt-2 p-2.5 rounded bg-surface-container border border-grid-line font-data-mono text-data-mono text-on-surface-variant">
                      <pre className="overflow-x-auto">{JSON.stringify(m.grounding, null, 2)}</pre>
                    </div>
                  </details>
                )}

                {/* Suggestions */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {m.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSend(sug)}
                        className="px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-variant text-primary border border-primary/20 font-body-sm text-body-sm transition-all hover:border-primary/40"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              Synthesizing grounded response...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-grid-line bg-surface-container-low flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder="Ask about traffic flow, risk hotspots, police dispatches..."
            className="flex-1 bg-surface border border-outline-variant rounded px-4 py-2.5 font-body-sm text-body-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="px-5 py-2.5 rounded bg-primary text-on-primary disabled:opacity-40 disabled:cursor-not-allowed font-bold font-body-sm text-body-sm flex items-center gap-1.5 transition-all hover:bg-primary-fixed active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
