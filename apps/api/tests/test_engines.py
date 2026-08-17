import pytest
from app.domain.models import (
    RoadSegment,
    Junction,
    RiskSeverity,
    RouteCandidate,
    RouteClassification,
    Incident,
    IncidentType,
    TrafficScenario,
    AuditEventType,
)
from app.domain.nagpur_network import NAGPUR_JUNCTIONS, NAGPUR_ROAD_SEGMENTS
from app.engine.spatial_matcher import spatial_matcher
from app.engine.congestion import congestion_engine
from app.engine.risk import risk_engine
from app.engine.route_ranker import route_ranker
from app.engine.fusion import fusion_engine
from app.simulation.simulator import simulation_engine
from app.optimization.police_optimizer import police_optimizer
from app.audit.trail import audit_trail

def test_nagpur_road_network_integrity():
    assert len(NAGPUR_JUNCTIONS) >= 10
    assert "j_sitabuldi" in NAGPUR_JUNCTIONS
    assert "j_wardha_tpoint" in NAGPUR_JUNCTIONS
    assert len(NAGPUR_ROAD_SEGMENTS) >= 10

    # Verify geometries
    for sid, seg in NAGPUR_ROAD_SEGMENTS.items():
        assert len(seg.geometry) >= 2
        assert seg.lengthMeters > 100.0
        assert seg.speedLimitKmh >= 30.0

def test_spatial_matcher():
    # Test point near Sitabuldi Interchange (79.0834, 21.1466)
    res = spatial_matcher.match_point(lon=79.0835, lat=21.1467)
    assert res.internalRoadId is not None
    assert res.matchConfidence >= 0.70
    assert res.distanceMeters < 100.0

    # Test out-of-bounds point (e.g. Mumbai coordinates)
    oob = spatial_matcher.match_point(lon=72.8777, lat=19.0760)
    assert oob.internalRoadId is None
    assert oob.isLowConfidence is True

    stats = spatial_matcher.get_matching_stats()
    assert stats["totalQueries"] >= 2
    assert "matchedPct" in stats

def test_congestion_engine_calculations():
    # Free-flow conditions
    score_free, b_free = congestion_engine.calculate_congestion(
        current_speed=50.0,
        free_flow_speed=50.0,
        current_travel_time=100.0,
        free_flow_travel_time=100.0,
        capacity_vph=2400,
        estimated_vph=600.0,
        queue_length_meters=0.0,
    )
    assert score_free < 25.0
    assert b_free.speedDegradationScore == 0.0

    # Heavy congestion / gridlock
    score_heavy, b_heavy = congestion_engine.calculate_congestion(
        current_speed=8.0,
        free_flow_speed=50.0,
        current_travel_time=600.0,
        free_flow_travel_time=100.0,
        capacity_vph=2400,
        estimated_vph=2300.0,
        queue_length_meters=200.0,
    )
    assert score_heavy >= 75.0
    assert b_heavy.speedDegradationScore > 80.0

def test_risk_engine_factors_and_explanation():
    junc = NAGPUR_JUNCTIONS["j_sitabuldi"]
    
    # Severe incident at junction
    inc = Incident(
        id="test_inc_1",
        title="Major Accident",
        incidentType=IncidentType.ACCIDENT,
        severity=RiskSeverity.CRITICAL,
        lat=junc.lat,
        lon=junc.lon,
        affectedRoadIds=["seg_wardha_north"],
        blockedLanes=2,
    )

    risk_res = risk_engine.evaluate_junction_risk(
        junction=junc,
        connected_road_congestion=[85.0, 90.0],
        active_incidents=[inc],
        queue_length_meters=180.0,
        police_assigned=False,
    )

    assert risk_res.riskScore >= 75.0
    assert risk_res.severity == RiskSeverity.CRITICAL
    assert "Critical incident" in risk_res.whyExplanation
    assert "Uncovered police coverage gap" in risk_res.whyExplanation

def test_route_ranker_multi_objective():
    cand1 = RouteCandidate(
        routeId="r1",
        label="Route 1 (Short but Congested)",
        summary="Via Wardha Rd",
        distanceMeters=2400.0,
        baseDurationSeconds=200.0,
        trafficDurationSeconds=200.0,
        averageCongestion=20.0,
        maxRiskScore=20.0,
        incidentCount=0,
        reliabilityScore=0.9,
        confidence=0.95,
        classification=RouteClassification.FASTEST,
        recommendationReason="",
        geometry=[[79.0754, 21.1278], [79.0834, 21.1466]],
        roadSegmentIds=["seg_wardha_north"],
    )

    cand2 = RouteCandidate(
        routeId="r2",
        label="Route 2 (Slightly Longer but Clear)",
        summary="Via Ambazari Bypass",
        distanceMeters=3100.0,
        baseDurationSeconds=250.0,
        trafficDurationSeconds=250.0,
        averageCongestion=15.0,
        maxRiskScore=15.0,
        incidentCount=0,
        reliabilityScore=0.95,
        confidence=0.95,
        classification=RouteClassification.BACKUP,
        recommendationReason="",
        geometry=[[79.0754, 21.1278], [79.0621, 21.1442], [79.0834, 21.1466]],
        roadSegmentIds=["seg_shankarnagar_north", "seg_west_dharampeth"],
    )

    ranked = route_ranker.rank_routes([cand1, cand2], {})
    assert len(ranked) == 2
    assert any(r.classification == RouteClassification.RECOMMENDED for r in ranked)

def test_police_optimizer():
    junc = NAGPUR_JUNCTIONS["j_sitabuldi"]
    j_risk = risk_engine.evaluate_junction_risk(
        junction=junc,
        connected_road_congestion=[85.0],
        active_incidents=[],
        queue_length_meters=100.0,
        police_assigned=False,
    )

    recs = police_optimizer.optimize_deployments([j_risk])
    assert len(recs) >= 1
    assert recs[0].targetJunctionId == "j_sitabuldi"
    assert recs[0].expectedRiskReduction > 0.0
    assert recs[0].estimatedArrivalMinutes > 0.0

def test_simulation_engine():
    scenario = TrafficScenario(
        scenarioId="scen_test",
        name="Sitabuldi Closure Test",
        description="Testing capacity shock",
        incidents=[
            Incident(
                id="inc_scen",
                title="Lane Blockage",
                incidentType=IncidentType.LANE_BLOCKAGE,
                severity=RiskSeverity.HIGH,
                lat=21.1466,
                lon=79.0834,
                affectedRoadIds=["seg_wardha_north"],
                blockedLanes=1,
                capacityReductionPct=50.0,
                isSimulated=True,
            )
        ],
        isSimulated=True,
    )

    res = simulation_engine.run_scenario(scenario, {})
    assert res.mode == "SIMULATED"
    assert res.simulatedAverageEtaSeconds >= res.baselineAverageEtaSeconds
    assert "projectedRiskReductionWithPolicePct" in res.beforeAfterDelta

def test_audit_trail():
    audit_trail.clear()
    ev = audit_trail.record_event(
        event_type=AuditEventType.MANUAL_OVERRIDE,
        summary="Operator overrode signal timing at Variety Sq",
        actor="HUMAN_OPERATOR",
        details={"junctionId": "j_sitabuldi", "action": "extend_green_phase_30s"},
    )
    assert ev.eventId.startswith("audit_")
    events = audit_trail.get_events()
    assert len(events) == 1
    assert events[0].summary == "Operator overrode signal timing at Variety Sq"

import pytest

@pytest.mark.anyio
async def test_geocoding_search():
    from app.providers.geocoding import geocoding_provider
    results = await geocoding_provider.search("sitabuldi", limit=5)
    assert len(results) >= 1
    assert any("Sitabuldi" in r["name"] for r in results)

    results_empty = await geocoding_provider.search("", limit=5)
    assert len(results_empty) >= 1

def test_vision_pipeline_and_frame_generation():
    from app.vision.pipeline import vision_pipeline
    obs = vision_pipeline.process_camera_feed("cam_sitabuldi_01")
    assert obs.cameraId == "cam_sitabuldi_01"
    assert obs.vehiclesPerMinute > 0.0
    assert obs.confidence >= 0.85
    assert sum(obs.classDistribution.values()) > 0

    frame_bytes = vision_pipeline.generate_jpeg_frame("cam_sitabuldi_01")
    assert len(frame_bytes) > 500  # valid JPEG image binary

