"use client";

import React, { useEffect, useState } from "react";
import { AuditEvent } from "@/types";
import { API_BASE_URL } from "@/utils/api";

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const eventTypeColors: Record<string, { bg: string; text: string; dot: string }> = {
  DEPLOYMENT_ACCEPTED: {
    bg: "bg-status-success/15",
    text: "text-status-success",
    dot: "bg-status-success",
  },
  DEPLOYMENT_OVERRIDDEN: {
    bg: "bg-status-warning/15",
    text: "text-status-warning",
    dot: "bg-status-warning",
  },
  DEPLOYMENT_REJECTED: {
    bg: "bg-status-critical/15",
    text: "text-status-critical",
    dot: "bg-status-critical",
  },
  INCIDENT_CREATED: {
    bg: "bg-status-danger/15",
    text: "text-status-danger",
    dot: "bg-status-danger",
  },
  SIMULATION_RUN: {
    bg: "bg-primary/15",
    text: "text-primary",
    dot: "bg-primary",
  },
  STATE_RESET: {
    bg: "bg-surface-variant",
    text: "text-on-surface-variant",
    dot: "bg-outline",
  },
};

const defaultColor = {
  bg: "bg-surface-variant",
  text: "text-on-surface-variant",
  dot: "bg-outline",
};

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/audit/events?limit=50`);
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
      <div className="w-full max-w-3xl h-[560px] bg-surface-elevated rounded-xl border border-grid-line flex flex-col overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-grid-line bg-surface-container-low flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-surface border border-grid-line flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
                Immutable Audit Trail
                <span className="font-data-mono text-data-mono px-2 py-0.5 rounded-full bg-status-success/15 text-status-success border border-status-success/30">
                  VERIFIED LOG
                </span>
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Complete record of operator decisions, dispatches &amp; system state events
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

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 w-full rounded" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant font-body-sm text-body-sm">
              No audit events recorded in this session
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-grid-line" />

              <div className="space-y-2">
                {events.map((ev) => {
                  const colors = eventTypeColors[ev.eventType] || defaultColor;
                  return (
                    <div key={ev.eventId} className="relative pl-8 py-2 group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-1.5 top-3.5 w-2.5 h-2.5 rounded-full ${colors.dot} ring-4 ring-surface-elevated`}
                      />

                      <div className="p-3.5 rounded-lg bg-surface border border-outline-variant group-hover:bg-surface-container transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-label-caps text-label-caps uppercase tracking-wider ${colors.bg} ${colors.text}`}
                            >
                              {ev.eventType.replace(/_/g, " ")}
                            </span>
                            <span className="font-data-mono text-data-mono text-on-surface-variant">
                              by {ev.actor}
                            </span>
                          </div>
                          <span className="font-data-mono text-data-mono text-on-surface-variant">
                            {new Date(ev.timestamp).toLocaleTimeString("en-IN", {
                              hour12: false,
                            })}
                          </span>
                        </div>

                        <div className="text-on-surface font-body-sm text-body-sm font-medium mt-1.5">
                          {ev.summary}
                        </div>

                        {ev.details && Object.keys(ev.details).length > 0 && (
                          <div className="mt-2 p-2 rounded bg-surface-container font-data-mono text-data-mono text-on-surface-variant border border-grid-line overflow-x-auto">
                            <pre>{JSON.stringify(ev.details, null, 2)}</pre>
                          </div>
                        )}
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
