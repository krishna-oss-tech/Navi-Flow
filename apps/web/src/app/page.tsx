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
import { SystemStatusDrawer } from "@/components/SystemStatusDrawer";
import { IncidentCenterDrawer } from "@/components/IncidentCenterDrawer";
import { CctvDrawer } from "@/components/CctvDrawer";
import { NetworkSummary, RouteCandidate, Incident, LocationPlace } from "@/types";
import { API_BASE_URL, WS_BASE_URL } from "@/utils/api";
import { getNagpurFallbackSummary, getNagpurDisruptedSummary } from "@/utils/fallbackData";

export default function DashboardPage() {
  const [data, setData] = useState<NetworkSummary>(getNagpurFallbackSummary());
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [selectedJunctionId, setSelectedJunctionId] = useState<string | null>("j_sitabuldi");
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  // Multi-Route State
  const [activeRoute, setActiveRoute] = useState<RouteCandidate | null>(null);
  const [allRoutes, setAllRoutes] = useState<RouteCandidate[]>([]);
  const [originPlace, setOriginPlace] = useState<LocationPlace | null>(null);
  const [destPlace, setDestPlace] = useState<LocationPlace | null>(null);

  // Modals & Drawers
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isSystemStatusOpen, setIsSystemStatusOpen] = useState(false);
  const [isIncidentsOpen, setIsIncidentsOpen] = useState(false);
  const [isCctvOpen, setIsCctvOpen] = useState(false);
  const [simulationTargetJunction, setSimulationTargetJunction] = useState<string | null>(null);
  const [isLiveWsConnected, setIsLiveWsConnected] = useState(false);

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
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/network/summary`);
        if (res.ok && isMounted) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.warn("Backend deferred, running on deterministic local baseline state...", err);
      }
    };

    fetchInitialData();

    // Setup live WebSocket with auto-reconnect
    let ws: WebSocket;
    const connectWs = () => {
      try {
        ws = new WebSocket(WS_BASE_URL);
        ws.onopen = () => {
          console.log("WebSocket connected to NAVI-FLOW backend.");
          if (isMounted) setIsLiveWsConnected(true);
        };
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "STATE_UPDATE" || msg.type === "INITIAL_STATE") {
              if (isMounted) setData(msg.data);
            }
          } catch (e) {
            console.error("Error parsing WS payload", e);
          }
        };
        ws.onclose = () => {
          if (isMounted) setIsLiveWsConnected(false);
          setTimeout(connectWs, 4000);
        };
        wsRef.current = ws;
      } catch (e) {
        console.warn("WebSocket init deferred:", e);
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      ws?.close();
    };
  }, []);

  const handleToggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Comprehensive View & Tab Navigation Handler
  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);

    if (tab === "overview") {
      // Nominal map overview
    } else if (tab === "traffic") {
      setActiveLayers((prev) => ({ ...prev, traffic: true }));
    } else if (tab === "risk") {
      setActiveLayers((prev) => ({ ...prev, risk: true }));
      setSelectedJunctionId((prev) => prev || "j_sitabuldi");
    } else if (tab === "routes") {
      setActiveLayers((prev) => ({ ...prev, routes: true }));
    } else if (tab === "incidents") {
      setActiveLayers((prev) => ({ ...prev, incidents: true }));
      setIsIncidentsOpen(true);
    } else if (tab === "police") {
      setActiveLayers((prev) => ({ ...prev, police: true }));
      const recJunc = data?.recommendations[0]?.targetJunctionId || "j_sitabuldi";
      setSelectedJunctionId(recJunc);
    } else if (tab === "cctv") {
      setActiveLayers((prev) => ({ ...prev, cctv: true }));
      setIsCctvOpen(true);
    } else if (tab === "simulation") {
      setSimulationTargetJunction(selectedJunctionId || "j_sitabuldi");
      setIsSimulationOpen(true);
    } else if (tab === "audit") {
      setIsAuditOpen(true);
    }
  };

  // Human-in-the-loop Dispatch Actions
  const handleAcceptRecommendation = async (recId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/police/deployments/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: recId }),
      });
      if (res.ok) {
        const summaryRes = await fetch(`${API_BASE_URL}/api/network/summary`);
        if (summaryRes.ok) setData(await summaryRes.json());
        return;
      }
    } catch (e) {
      console.warn("Backend offline, updating local state for dispatch acceptance", e);
    }

    setData((prev) => {
      const updated = { ...prev };
      const rec = updated.recommendations.find((r) => r.recommendationId === recId);
      if (rec) {
        updated.recommendations = updated.recommendations.filter((r) => r.recommendationId !== recId);
        updated.deployments.push({
          deploymentId: `dep_${Date.now()}`,
          recommendationId: recId,
          officerId: rec.officerId,
          officerName: rec.officerName,
          junctionId: rec.targetJunctionId,
          junctionName: rec.targetJunctionName,
          status: "ACCEPTED",
          assignedAt: new Date().toISOString(),
          etaMinutes: rec.estimatedArrivalMinutes,
          riskReductionExpected: rec.expectedRiskReduction,
          operatorNotes: "Accepted via Command Center",
        });
      }
      return updated;
    });
  };

  const handleOverrideRecommendation = async (
    recId: string,
    altOfficerId: string,
    reason: string
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/police/deployments/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: recId,
          alternateOfficerId: altOfficerId,
          overrideReason: reason,
        }),
      });
      if (res.ok) {
        const summaryRes = await fetch(`${API_BASE_URL}/api/network/summary`);
        if (summaryRes.ok) setData(await summaryRes.json());
        return;
      }
    } catch (e) {
      console.warn("Backend offline, updating local state for dispatch override", e);
    }

    setData((prev) => {
      const updated = { ...prev };
      const rec = updated.recommendations.find((r) => r.recommendationId === recId);
      const officer = updated.officers.find((o) => o.id === altOfficerId);
      if (rec && officer) {
        updated.recommendations = updated.recommendations.filter((r) => r.recommendationId !== recId);
        updated.deployments.push({
          deploymentId: `dep_ovr_${Date.now()}`,
          recommendationId: recId,
          officerId: altOfficerId,
          officerName: officer.name,
          junctionId: rec.targetJunctionId,
          junctionName: rec.targetJunctionName,
          status: "OVERRIDDEN",
          assignedAt: new Date().toISOString(),
          etaMinutes: 6.5,
          riskReductionExpected: rec.expectedRiskReduction * 0.85,
          operatorNotes: "Manually overridden by operator",
          overrideReason: reason,
        });
      }
      return updated;
    });
  };

  const handleRejectRecommendation = async (recId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/police/deployments/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: recId, reason: "Operator decision" }),
      });
      if (res.ok) {
        const summaryRes = await fetch(`${API_BASE_URL}/api/network/summary`);
        if (summaryRes.ok) setData(await summaryRes.json());
        return;
      }
    } catch (e) {
      console.warn("Backend offline, updating local state for dispatch reject", e);
    }

    setData((prev) => ({
      ...prev,
      recommendations: prev.recommendations.filter((r) => r.recommendationId !== recId),
    }));
  };

  // Demo Showcase Triggers
  const handleTriggerDemo = async () => {
    setSelectedJunctionId("j_sitabuldi");
    try {
      const res = await fetch(`${API_BASE_URL}/api/demo/sitabuldi-accident`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        setData(result.summary);
        return;
      }
    } catch (e) {
      console.warn("Using deterministic client fallback for Sitabuldi accident scenario", e);
    }

    setData(getNagpurDisruptedSummary());
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/demo/reset`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        setData(result.summary);
        setActiveRoute(null);
        setAllRoutes([]);
        return;
      }
    } catch (e) {
      console.warn("Using deterministic client fallback for demo reset", e);
    }

    setData(getNagpurFallbackSummary());
    setActiveRoute(null);
    setAllRoutes([]);
  };

  const handleSelectIncident = (inc: Incident) => {
    if (inc.affectedRoadIds.length > 0) {
      const junctionId = inc.affectedRoadIds[0].includes("wardha") ? "j_wardha_rd" : "j_sitabuldi";
      setSelectedJunctionId(junctionId);
    }
  };

  const handleSimulateIncident = (inc: Incident) => {
    const junctionId = inc.affectedRoadIds[0]?.includes("wardha") ? "j_wardha_rd" : "j_sitabuldi";
    setSimulationTargetJunction(junctionId);
    setIsSimulationOpen(true);
  };

  return (
    <div className="bg-background text-on-surface h-screen w-screen overflow-hidden flex flex-col font-body-lg">
      {/* ─── Top App Bar ─── */}
      <CommandHeader
        data={data}
        onTriggerDemo={handleTriggerDemo}
        onResetDemo={handleResetDemo}
        onOpenSimulation={() => {
          setSimulationTargetJunction(selectedJunctionId || "j_sitabuldi");
          setIsSimulationOpen(true);
        }}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenSystemStatus={() => setIsSystemStatusOpen(true)}
        onOpenIncidents={() => setIsIncidentsOpen(true)}
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayer}
      />

      {/* ─── Main Workspace Canvas ─── */}
      <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Left Side Navigation */}
        <IconBar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          data={data}
          onOpenSystemStatus={() => setIsSystemStatusOpen(true)}
        />

        {/* Center — Full-Bleed Map Canvas */}
        <main className="flex-1 relative h-full bg-surface-container-lowest flex">
          <MapViewer
            data={data}
            selectedJunctionId={selectedJunctionId}
            onSelectJunction={(jId) => setSelectedJunctionId(jId)}
            onSelectCamera={(camId) => {
              setSelectedCameraId(camId);
              setIsCctvOpen(true);
            }}
            activeRoute={activeRoute}
            allRoutes={allRoutes}
            originPlace={originPlace}
            destPlace={destPlace}
            onSelectRoute={(r) => setActiveRoute(r)}
            activeLayers={activeLayers}
          />

          {/* Floating Route Intelligence Panel */}
          {activeTab === "routes" && (
            <div className="absolute top-4 left-4 w-[420px] glass-raised rounded-xl shadow-2xl z-30 max-h-[82vh] overflow-y-auto animate-slide-in-left border border-grid-line">
              <RoutesPanel
                onSelectRoute={(route) => setActiveRoute(route)}
                activeRoute={activeRoute}
                allRoutes={allRoutes}
                onUpdateAllRoutes={(routes) => setAllRoutes(routes)}
                onUpdateEndpoints={(orig, dest) => {
                  setOriginPlace(orig);
                  setDestPlace(dest);
                }}
                onClearRoutes={() => {
                  setAllRoutes([]);
                  setActiveRoute(null);
                  setOriginPlace(null);
                  setDestPlace(null);
                }}
              />
            </div>
          )}

          {/* Bottom Telemetry Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-slide-in-up">
            <BottomMetrics
              metrics={data?.metrics}
              onSelectMetric={(tabKey) => handleSelectTab(tabKey as NavTab)}
              isLiveConnected={isLiveWsConnected}
            />
          </div>
        </main>

        {/* Right — Context Intelligence Drawer */}
        <ContextPanel
          data={data}
          selectedJunctionId={selectedJunctionId}
          onClose={() => setSelectedJunctionId(null)}
          onAcceptRecommendation={handleAcceptRecommendation}
          onOverrideRecommendation={handleOverrideRecommendation}
          onRejectRecommendation={handleRejectRecommendation}
          onSimulateJunction={(jId) => {
            setSimulationTargetJunction(jId);
            setIsSimulationOpen(true);
          }}
        />
      </div>

      {/* ─── Dialog Modals & Drawers ─── */}
      <CopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        data={data}
        targetJunctionId={simulationTargetJunction || selectedJunctionId}
      />
      <AuditModal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />
      <SystemStatusDrawer
        isOpen={isSystemStatusOpen}
        onClose={() => setIsSystemStatusOpen(false)}
        data={data}
      />
      <IncidentCenterDrawer
        isOpen={isIncidentsOpen}
        onClose={() => setIsIncidentsOpen(false)}
        incidents={data?.incidents || []}
        onSelectIncident={handleSelectIncident}
        onSimulateIncident={handleSimulateIncident}
      />
      <CctvDrawer
        isOpen={isCctvOpen}
        onClose={() => setIsCctvOpen(false)}
        cameras={data?.cameras || []}
        selectedCameraId={selectedCameraId}
        onSelectCamera={(camId) => setSelectedCameraId(camId)}
      />
    </div>
  );
}
