"use client";

import React, { useState, useEffect, useRef } from "react";
import { CommandHeader } from "@/components/CommandHeader";
import { IconBar, NavTab } from "@/components/IconBar";
import { MapViewer } from "@/components/Map/MapViewer";
import { ContextPanel } from "@/components/ContextPanel";
import { BottomMetrics } from "@/components/BottomMetrics";
import { CopilotModal } from "@/components/CopilotModal";
import { SimulationModal } from "@/components/SimulationModal";
import { AuditModal } from "@/components/AuditModal";
import { RoutesPanel } from "@/components/RoutesPanel";
import { NetworkSummary, RouteCandidate } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<NetworkSummary | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [selectedJunctionId, setSelectedJunctionId] = useState<string | null>("j_sitabuldi");
  const [activeRoute, setActiveRoute] = useState<RouteCandidate | null>(null);

  // Modals
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Layer toggles
  const [activeLayers, setActiveLayers] = useState({
    traffic: true,
    risk: true,
    incidents: true,
    police: true,
    cameras: true,
    routes: true,
  });

  const wsRef = useRef<WebSocket | null>(null);

  // 1. Initial REST Fetch & WebSocket Connection
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/network/summary");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.warn("Backend not reached yet, waiting for WebSocket connect...", err);
      }
    };

    fetchInitialData();

    // Setup live WebSocket
    let ws: WebSocket;
    const connectWs = () => {
      ws = new WebSocket("ws://localhost:8000/ws/live");
      ws.onopen = () => {
        console.log("WebSocket connected to NAVI-FLOW backend.");
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "STATE_UPDATE" || msg.type === "INITIAL_STATE") {
            setData(msg.data);
          }
        } catch (e) {
          console.error("Error parsing WS payload", e);
        }
      };
      ws.onclose = () => {
        setTimeout(connectWs, 3000); // Auto reconnect
      };
      wsRef.current = ws;
    };

    connectWs();

    return () => {
      ws?.close();
    };
  }, []);

  const handleToggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Human-in-the-loop Dispatch Actions
  const handleAcceptRecommendation = async (recId: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/police/deployments/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: recId }),
      });
      if (res.ok) {
        const summaryRes = await fetch("http://localhost:8000/api/network/summary");
        if (summaryRes.ok) setData(await summaryRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOverrideRecommendation = async (recId: string, altOfficerId: string, reason: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/police/deployments/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: recId,
          alternateOfficerId: altOfficerId,
          overrideReason: reason,
        }),
      });
      if (res.ok) {
        const summaryRes = await fetch("http://localhost:8000/api/network/summary");
        if (summaryRes.ok) setData(await summaryRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectRecommendation = async (recId: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/police/deployments/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: recId }),
      });
      if (res.ok) {
        const summaryRes = await fetch("http://localhost:8000/api/network/summary");
        if (summaryRes.ok) setData(await summaryRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Demo Showcase Triggers
  const handleTriggerDemo = async () => {
    try {
      setSelectedJunctionId("j_sitabuldi");
      const res = await fetch("http://localhost:8000/api/demo/sitabuldi-accident", {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        setData(result.summary);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/demo/reset", {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        setData(result.summary);
        setActiveRoute(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070a0f] text-slate-100 font-sans">
      {/* ─── Top Command Strip ─── */}
      <CommandHeader
        data={data}
        onTriggerDemo={handleTriggerDemo}
        onResetDemo={handleResetDemo}
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayer}
      />

      {/* ─── Main Stage ─── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Icon Bar */}
        <IconBar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === "audit") setIsAuditOpen(true);
            if (tab === "simulation") setIsSimulationOpen(true);
          }}
          data={data}
        />

        {/* Center — Full-Bleed Map Canvas */}
        <div className="flex-1 relative h-full">
          <MapViewer
            data={data}
            selectedJunctionId={selectedJunctionId}
            onSelectJunction={(jId) => setSelectedJunctionId(jId)}
            activeRoute={activeRoute}
            activeLayers={activeLayers}
          />

          {/* Floating Route Intelligence Panel */}
          {activeTab === "routes" && (
            <div className="absolute top-4 left-4 w-[360px] glass-raised rounded-2xl shadow-panel z-30 max-h-[80vh] overflow-y-auto animate-slide-in-left">
              <RoutesPanel
                onSelectRoute={(route) => setActiveRoute(route)}
                activeRoute={activeRoute}
              />
            </div>
          )}

          {/* Floating Bottom Metrics */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-slide-in-up">
            <BottomMetrics metrics={data?.metrics} />
          </div>
        </div>

        {/* Right — Context Intelligence Drawer */}
        <ContextPanel
          data={data}
          selectedJunctionId={selectedJunctionId}
          onClose={() => setSelectedJunctionId(null)}
          onAcceptRecommendation={handleAcceptRecommendation}
          onOverrideRecommendation={handleOverrideRecommendation}
          onRejectRecommendation={handleRejectRecommendation}
          onSimulateJunction={(jId) => {
            setSelectedJunctionId(jId);
            setIsSimulationOpen(true);
          }}
        />
      </div>

      {/* ─── Dialog Modals ─── */}
      <CopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        data={data}
        targetJunctionId={selectedJunctionId}
      />
      <AuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
    </div>
  );
}
