import copy
import time
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from app.domain.models import (
    Junction,
    RoadSegment,
    LiveRoadState,
    Incident,
    IncidentType,
    RiskSeverity,
    JunctionRisk,
    Camera,
    Officer,
    Deployment,
    DeploymentStatus,
    DeploymentRecommendation,
    AuditEventType,
    SystemHealth,
)
from app.domain.nagpur_network import (
    NAGPUR_JUNCTIONS,
    NAGPUR_ROAD_SEGMENTS,
    NAGPUR_CAMERAS,
    NAGPUR_OFFICERS,
)
from app.providers.tomtom import tomtom_provider
from app.vision.pipeline import vision_pipeline
from app.engine.fusion import fusion_engine
from app.engine.risk import risk_engine
from app.optimization.police_optimizer import police_optimizer
from app.audit.trail import audit_trail
from app.realtime.events import ws_manager

logger = logging.getLogger("naviflow.state")

class SystemStateManager:
    """
    Central operational memory and state orchestrator for NAVI-FLOW.
    Maintains synchronized state across all engines and broadcasts delta updates.
    """

    def __init__(self):
        self.junctions: Dict[str, Junction] = copy.deepcopy(NAGPUR_JUNCTIONS)
        self.road_segments: Dict[str, RoadSegment] = copy.deepcopy(NAGPUR_ROAD_SEGMENTS)
        self.cameras: Dict[str, Camera] = copy.deepcopy(NAGPUR_CAMERAS)
        self.officers: Dict[str, Officer] = copy.deepcopy(NAGPUR_OFFICERS)

        self.live_states: Dict[str, LiveRoadState] = {}
        self.junction_risks: Dict[str, JunctionRisk] = {}
        self.active_incidents: Dict[str, Incident] = {}
        self.deployments: Dict[str, Deployment] = {}
        self.recommendations: Dict[str, DeploymentRecommendation] = {}

        self.start_time: float = time.time()
        self.last_update: datetime = datetime.now(timezone.utc)
        self._is_demo_mode: bool = False

    async def initialize(self):
        """Initial bootstrap of road states and junction risks."""
        logger.info("Initializing NAVI-FLOW System State...")
        await self.refresh_network_state()

    async def refresh_network_state(self):
        """Full pipeline refresh: Ingest -> Fuse -> Congestion -> Risk -> Optimize -> Broadcast."""
        now_dt = datetime.now(timezone.utc)
        
        # 1. Update Road States via Fusion (concurrent telemetry fetching)
        seg_items = list(self.road_segments.items())
        probe_tasks = []
        for seg_id, seg in seg_items:
            coords = seg.geometry
            mid_idx = len(coords) // 2
            mid_lon, mid_lat = coords[mid_idx]
            probe_tasks.append(tomtom_provider.fetch_flow_for_point(mid_lat, mid_lon, seg_id))

        tomtom_results = await asyncio.gather(*probe_tasks, return_exceptions=True)

        for (seg_id, seg), tomtom_obs in zip(seg_items, tomtom_results):
            if isinstance(tomtom_obs, Exception) or tomtom_obs is None:
                tomtom_obs = None

            # Check for camera observation on connected junction
            cctv_obs = None
            for cam in self.cameras.values():
                if cam.junctionId in [seg.fromJunction, seg.toJunction]:
                    cctv_obs = vision_pipeline.get_latest_observation(cam.cameraId)
                    break

            # Check for active incidents on this segment
            seg_incidents = [
                inc for inc in self.active_incidents.values() if seg_id in inc.affectedRoadIds
            ]

            fused_state = fusion_engine.fuse_segment_state(
                segment=seg,
                tomtom_obs=tomtom_obs,
                cctv_obs=cctv_obs,
                sim_multiplier=1.0,
                active_incidents=seg_incidents,
            )
            self.live_states[seg_id] = fused_state

        # 2. Recalculate Junction Risks
        for j_id, junc in self.junctions.items():
            # Get congestion of connected roads
            conn_cong = [
                self.live_states[sid].congestionScore
                for sid in junc.connectedRoads
                if sid in self.live_states
            ]
            # Incidents at this junction or connected roads
            junc_incidents = [
                inc for inc in self.active_incidents.values()
                if any(sid in inc.affectedRoadIds for sid in junc.connectedRoads)
            ]
            
            # Check if an officer is actively deployed to this junction
            police_assigned = any(
                d.junctionId == j_id and d.status in [DeploymentStatus.ACCEPTED, DeploymentStatus.PENDING]
                for d in self.deployments.values()
            )

            # Camera queue check
            queue_m = 0.0
            for cam in self.cameras.values():
                if cam.junctionId == j_id:
                    c_obs = vision_pipeline.get_latest_observation(cam.cameraId)
                    if c_obs:
                        queue_m = max(queue_m, c_obs.queueLengthEstimateMeters)

            j_risk = risk_engine.evaluate_junction_risk(
                junction=junc,
                connected_road_congestion=conn_cong,
                active_incidents=junc_incidents,
                queue_length_meters=queue_m,
                police_assigned=police_assigned,
            )
            self.junction_risks[j_id] = j_risk

        # 3. Generate Police Deployment Recommendations
        recs = police_optimizer.optimize_deployments(
            junction_risks=list(self.junction_risks.values()),
            available_officers=[o for o in self.officers.values() if o.isAvailable],
        )
        self.recommendations = {r.recommendationId: r for r in recs}

        self.last_update = now_dt

        # 4. Broadcast live state to WebSocket subscribers
        await ws_manager.broadcast("STATE_UPDATE", self.get_summary())

    def get_summary(self) -> Dict[str, Any]:
        """Aggregate snapshot of the entire traffic network for dashboard."""
        critical_count = sum(
            1 for jr in self.junction_risks.values() if jr.severity == RiskSeverity.CRITICAL
        )
        high_risk_count = sum(
            1 for jr in self.junction_risks.values() if jr.severity in [RiskSeverity.HIGH, RiskSeverity.CRITICAL]
        )
        avg_speed = (
            sum(st.currentSpeed for st in self.live_states.values()) / max(1, len(self.live_states))
        )
        avg_congestion = (
            sum(st.congestionScore for st in self.live_states.values()) / max(1, len(self.live_states))
        )

        return {
            "timestamp": self.last_update.isoformat(),
            "uptimeSeconds": round(time.time() - self.start_time, 1),
            "isDemoMode": self._is_demo_mode,
            "metrics": {
                "averageSpeedKmh": round(avg_speed, 1),
                "averageCongestionScore": round(avg_congestion, 1),
                "criticalJunctions": critical_count,
                "highRiskJunctions": high_risk_count,
                "activeIncidentsCount": len(self.active_incidents),
                "activeDeploymentsCount": len(self.deployments),
                "availableOfficersCount": sum(1 for o in self.officers.values() if o.isAvailable),
            },
            "liveStates": {k: v.model_dump() for k, v in self.live_states.items()},
            "junctionRisks": {k: v.model_dump() for k, v in self.junction_risks.items()},
            "incidents": [inc.model_dump() for inc in self.active_incidents.values()],
            "deployments": [d.model_dump() for d in self.deployments.values()],
            "recommendations": [r.model_dump() for r in self.recommendations.values()],
            "officers": [o.model_dump() for o in self.officers.values()],
            "cameras": [c.model_dump() for c in self.cameras.values()],
        }

    # --- Operator Actions (Human-in-the-loop) ---

    async def create_incident(self, incident: Incident) -> Incident:
        self.active_incidents[incident.id] = incident
        audit_trail.record_event(
            event_type=AuditEventType.INCIDENT_CREATED,
            summary=f"Incident '{incident.title}' registered at ({incident.lat}, {incident.lon})",
            actor="HUMAN_OPERATOR" if not incident.isSimulated else "SIMULATION_ENGINE",
            details=incident.model_dump(),
        )
        await self.refresh_network_state()
        return incident

    async def accept_recommendation(self, recommendation_id: str, notes: str = "") -> Deployment:
        rec = self.recommendations.get(recommendation_id)
        if not rec:
            raise ValueError(f"Recommendation '{recommendation_id}' not found.")

        officer = self.officers.get(rec.officerId)
        if officer:
            officer.isAvailable = False
            officer.currentJunctionId = rec.targetJunctionId

        deployment = Deployment(
            deploymentId=f"dep_{rec.officerId}_{int(time.time())}",
            recommendationId=rec.recommendationId,
            officerId=rec.officerId,
            officerName=rec.officerName,
            junctionId=rec.targetJunctionId,
            junctionName=rec.targetJunctionName,
            incidentId=rec.incidentId,
            status=DeploymentStatus.ACCEPTED,
            etaMinutes=rec.estimatedArrivalMinutes,
            riskReductionExpected=rec.expectedRiskReduction,
            operatorNotes=notes or "Accepted by Command Center Operator.",
        )
        self.deployments[deployment.deploymentId] = deployment
        self.recommendations.pop(recommendation_id, None)

        audit_trail.record_event(
            event_type=AuditEventType.DEPLOYMENT_ACCEPTED,
            summary=f"Dispatched {rec.officerName} to {rec.targetJunctionName} (ETA: {rec.estimatedArrivalMinutes}m)",
            actor="HUMAN_OPERATOR",
            details=deployment.model_dump(),
        )

        await self.refresh_network_state()
        return deployment

    async def override_recommendation(
        self,
        recommendation_id: str,
        alternate_officer_id: str,
        reason: str,
    ) -> Deployment:
        rec = self.recommendations.get(recommendation_id)
        if not rec:
            raise ValueError(f"Recommendation '{recommendation_id}' not found.")

        alt_officer = self.officers.get(alternate_officer_id)
        if not alt_officer:
            raise ValueError(f"Officer '{alternate_officer_id}' not found.")

        alt_officer.isAvailable = False
        alt_officer.currentJunctionId = rec.targetJunctionId

        target_junc = self.junctions.get(rec.targetJunctionId)
        eta = police_optimizer.calculate_eta_minutes(
            alt_officer.lat, alt_officer.lon, target_junc.lat if target_junc else 21.1458, target_junc.lon if target_junc else 79.0882
        )

        deployment = Deployment(
            deploymentId=f"dep_ovr_{alt_officer.id}_{int(time.time())}",
            recommendationId=rec.recommendationId,
            officerId=alt_officer.id,
            officerName=alt_officer.name,
            junctionId=rec.targetJunctionId,
            junctionName=rec.targetJunctionName,
            status=DeploymentStatus.OVERRIDDEN,
            etaMinutes=eta,
            riskReductionExpected=rec.expectedRiskReduction * 0.9,
            operatorNotes=f"Overridden by operator. Reassigned to {alt_officer.name}.",
            overrideReason=reason,
        )
        self.deployments[deployment.deploymentId] = deployment
        self.recommendations.pop(recommendation_id, None)

        audit_trail.record_event(
            event_type=AuditEventType.DEPLOYMENT_OVERRIDDEN,
            summary=f"Overrode dispatch to {rec.targetJunctionName}: Assigned {alt_officer.name} instead of {rec.officerName}. Reason: {reason}",
            actor="HUMAN_OPERATOR",
            details=deployment.model_dump(),
        )

        await self.refresh_network_state()
        return deployment

    async def reject_recommendation(self, recommendation_id: str, reason: str = ""):
        rec = self.recommendations.get(recommendation_id)
        if not rec:
            raise ValueError(f"Recommendation '{recommendation_id}' not found.")

        self.recommendations.pop(recommendation_id, None)
        audit_trail.record_event(
            event_type=AuditEventType.DEPLOYMENT_REJECTED,
            summary=f"Rejected deployment recommendation for {rec.targetJunctionName}. Reason: {reason or 'Not required.'}",
            actor="HUMAN_OPERATOR",
            details=rec.model_dump(),
        )
        await self.refresh_network_state()

    # --- Showcase Demo Scenario Trigger ---

    async def trigger_sitabuldi_demo_scenario(self) -> Dict[str, Any]:
        """
        Executes the deterministic Nagpur Showcase Disruption Scenario:
        1. Accident at Sitabuldi Interchange / Variety Sq (2 lanes blocked).
        2. Capacity reduced by 65%.
        3. Spillovers propagate into Wardha Road & Central Avenue.
        4. Recalculates risk (escalates to CRITICAL).
        5. Automatically generates high-priority officer recommendation (MP-04 / Rajesh Sharma).
        """
        self._is_demo_mode = True
        inc = Incident(
            id="demo_inc_sitabuldi_01",
            title="Multi-Vehicle Collision at Sitabuldi Interchange (Variety Sq)",
            incidentType=IncidentType.ACCIDENT,
            severity=RiskSeverity.CRITICAL,
            lat=21.1466,
            lon=79.0834,
            affectedRoadIds=["seg_wardha_north", "seg_central_west", "seg_west_dharampeth"],
            blockedLanes=2,
            capacityReductionPct=65.0,
            source="emergency_cctv_cad",
            confidence=0.98,
            description="Major 3-vehicle collision blocking two inbound lanes at Variety Sq flyover descent. Heavy queuing developing.",
            isSimulated=True,
        )
        await self.create_incident(inc)
        
        audit_trail.record_event(
            event_type=AuditEventType.RISK_ESCALATED,
            summary="Sitabuldi Interchange escalated to CRITICAL risk (Risk Score: 92.4). Queues forming on Wardha Rd.",
            actor="SYSTEM_AUTO",
            details={"incidentId": inc.id, "riskScore": 92.4},
        )

        return self.get_summary()

    async def reset_demo_scenario(self):
        """Resets network to normal baseline state."""
        self._is_demo_mode = False
        self.active_incidents.clear()
        self.deployments.clear()
        for off in self.officers.values():
            off.isAvailable = True
        audit_trail.clear()
        await self.refresh_network_state()
        return self.get_summary()

system_state = SystemStateManager()
