"use client";

import React, { useEffect, useState } from "react";
import { X, FileText } from "lucide-react";
import { AuditEvent } from "@/types";

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const eventTypeColors: Record<string, { bg: string; text: string; dot: string }> = {
  DEPLOYMENT_ACCEPTED: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  DEPLOYMENT_OVERRIDDEN: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
  DEPLOYMENT_REJECTED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  INCIDENT_CREATED: { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-500" },
  SIMULATION_RUN: { bg: "bg-sky-500/10", text: "text-sky-400", dot: "bg-sky-500" },
  STATE_RESET: { bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-500" },
};

const defaultColor = { bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-500" };

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/api/audit/events?limit=50");
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (e) {
        console.error("Error fetching audit events", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-3xl h-[560px] glass-raised rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-surface text-slate-400 border border-border-subtle">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Audit Trail
                <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Immutable
                </span>
              </h3>
              <p className="text-[10px] text-slate-500">
                Complete record of operator decisions &amp; system events
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

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No audit events recorded in this session
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border-subtle" />

              <div className="space-y-1">
                {events.map((ev) => {
                  const colors = eventTypeColors[ev.eventType] || defaultColor;
                  return (
                    <div key={ev.eventId} className="relative pl-8 py-2 group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-[7px] top-[14px] w-[9px] h-[9px] rounded-full border-2 border-[#070a0f] ${colors.dot} z-10`}
                      />

                      <div className="p-3 rounded-xl bg-surface border border-border-subtle group-hover:bg-surface-raised transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}
                          >
                            {ev.eventType.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(ev.timestamp).toLocaleTimeString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              hour12: false,
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-200">{ev.summary}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-1">
                          Actor: <span className="text-slate-400">{ev.actor}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
