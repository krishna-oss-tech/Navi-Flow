import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from app.domain.models import (
    LiveRoadState,
    TrafficObservation,
    VehicleObservation,
    Incident,
    RiskSeverity,
    RoadSegment,
)
from app.domain.nagpur_network import NAGPUR_ROAD_SEGMENTS
from app.engine.congestion import congestion_engine
from app.engine.risk import risk_engine

class MultiSourceFusionEngine:
    """
    Synthesizes multiple heterogeneous traffic inputs:
    - TomTom Traffic Flow
    - CCTV Edge Vision Metrics (Vehicle counts, speeds)
    - What-If Active Simulations
    - Historical Baseline Models
    
    Produces canonical, source-attributed LiveRoadState records.
    """

    def __init__(self, segments: Optional[Dict[str, RoadSegment]] = None):
        self.segments = segments or NAGPUR_ROAD_SEGMENTS
        self._current_states: Dict[str, LiveRoadState] = {}
        self._source_conflicts: List[Dict[str, Any]] = []

    def fuse_segment_state(
        self,
        segment: RoadSegment,
        tomtom_obs: Optional[TrafficObservation] = None,
        cctv_obs: Optional[VehicleObservation] = None,
        sim_multiplier: float = 1.0,
        active_incidents: Optional[List[Incident]] = None,
    ) -> LiveRoadState:
        now_dt = datetime.now(timezone.utc)
        active_incidents = active_incidents or []
        
        # 1. Base free-flow metrics
        free_flow_speed = segment.speedLimitKmh
        length_km = segment.lengthMeters / 1000.0
        free_flow_time = (length_km / free_flow_speed) * 3600.0

        # 2. Gather speeds from different sources
        speed_sources: List[Tuple[float, float, str]] = []  # (speed, weight, source_name)

        if tomtom_obs:
            tt_weight = 0.60 * tomtom_obs.confidence
            speed_sources.append((tomtom_obs.currentSpeed, tt_weight, tomtom_obs.source))

        if cctv_obs and cctv_obs.estimatedSpeed > 0:
            cctv_weight = 0.35 * cctv_obs.confidence
            speed_sources.append((cctv_obs.estimatedSpeed, cctv_weight, "cctv_vision"))

        # If no real-time telemetry, use baseline speed
        if not speed_sources:
            speed_sources.append((free_flow_speed * 0.85, 0.50, "historical_baseline"))

        # Calculate weighted fused speed
        total_weight = sum(w for _, w, _ in speed_sources)
        fused_speed = sum(s * w for s, w, _ in speed_sources) / max(0.01, total_weight)

        # Check for source conflict (e.g. >15 km/h discrepancy between TomTom and CCTV)
        if len(speed_sources) > 1:
            speeds = [s for s, _, _ in speed_sources]
            max_diff = max(speeds) - min(speeds)
            if max_diff > 15.0:
                self._source_conflicts.append({
                    "segmentId": segment.id,
                    "maxDiffKmh": round(max_diff, 1),
                    "sources": [src for _, _, src in speed_sources],
                    "timestamp": now_dt.isoformat(),
                })

        # Apply incident or simulation capacity reduction multiplier
        # (e.g. sim_multiplier = 0.40 implies 60% capacity drop)
        has_incident = len(active_incidents) > 0
        incident_capacity_factor = 1.0
        for inc in active_incidents:
            incident_capacity_factor *= (1.0 - (inc.capacityReductionPct / 100.0))

        effective_speed = fused_speed * min(sim_multiplier, incident_capacity_factor)
        effective_speed = max(5.0, min(free_flow_speed, effective_speed))

        # Calculate travel time and delay
        current_travel_time = (length_km / effective_speed) * 3600.0
        delay_seconds = max(0.0, current_travel_time - free_flow_time)
        delay_percent = round((delay_seconds / max(1.0, free_flow_time)) * 100.0, 1)

        # Calculate flow rate and queue length
        vpm = cctv_obs.vehiclesPerMinute if cctv_obs else (segment.capacityVehiclesPerHour / 60.0) * (effective_speed / free_flow_speed)
        queue_m = cctv_obs.queueLengthEstimateMeters if cctv_obs else (delay_seconds * 1.5 if delay_seconds > 30 else 0.0)

        # 3. Calculate deterministic Congestion Score
        congestion_score, breakdown = congestion_engine.calculate_congestion(
            current_speed=effective_speed,
            free_flow_speed=free_flow_speed,
            current_travel_time=current_travel_time,
            free_flow_travel_time=free_flow_time,
            capacity_vph=segment.capacityVehiclesPerHour,
            estimated_vph=vpm * 60.0,
            queue_length_meters=queue_m,
            freshness_seconds=0.0,
        )

        # 4. Determine Risk Score & Severity
        risk_score = round(min(100.0, congestion_score * 0.60 + (80.0 if has_incident else 0.0) * 0.40 + segment.betweennessCentrality * 15.0), 1)
        if risk_score >= 80.0 or (has_incident and any(i.severity == RiskSeverity.CRITICAL for i in active_incidents)):
            severity = RiskSeverity.CRITICAL
        elif risk_score >= 60.0:
            severity = RiskSeverity.HIGH
        elif risk_score >= 35.0:
            severity = RiskSeverity.MODERATE
        else:
            severity = RiskSeverity.LOW

        primary_source = speed_sources[0][2] if speed_sources else "fusion"

        live_state = LiveRoadState(
            segmentId=segment.id,
            name=segment.name,
            fromJunction=segment.fromJunction,
            toJunction=segment.toJunction,
            currentSpeed=round(effective_speed, 1),
            freeFlowSpeed=round(free_flow_speed, 1),
            currentTravelTime=round(current_travel_time, 1),
            freeFlowTravelTime=round(free_flow_time, 1),
            delaySeconds=round(delay_seconds, 1),
            delayPercent=delay_percent,
            congestionScore=congestion_score,
            riskScore=risk_score,
            riskSeverity=severity,
            vehiclesPerMinute=round(vpm, 1),
            confidence=0.92,
            freshnessSeconds=0.0,
            closure=(effective_speed < 6.0 and has_incident),
            incidentState=has_incident,
            source=primary_source,
            geometry=segment.geometry,
            updatedAt=now_dt,
        )

        self._current_states[segment.id] = live_state
        return live_state

    def get_latest_states(self) -> Dict[str, LiveRoadState]:
        return self._current_states

fusion_engine = MultiSourceFusionEngine()
