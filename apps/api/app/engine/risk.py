from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from app.domain.models import RiskSeverity, JunctionRisk, Incident, Junction, RoadSegment

class RiskEngine:
    """
    Multi-Factor Traffic Risk & Criticality Assessment Engine.
    Distinguishes structural risk and operational vulnerability from pure congestion.
    
    Factors:
    - Congestion Level (Weight: 0.25)
    - Incident Severity (Weight: 0.30)
    - Network Criticality & Betweenness (Weight: 0.20)
    - Queue Pressure / Spillover Vulnerability (Weight: 0.15)
    - Police Response Gap (Weight: 0.10)
    """

    WEIGHT_CONGESTION: float = 0.25
    WEIGHT_INCIDENT: float = 0.30
    WEIGHT_CRITICALITY: float = 0.20
    WEIGHT_QUEUE: float = 0.15
    WEIGHT_RESPONSE_GAP: float = 0.10

    @classmethod
    def evaluate_junction_risk(
        cls,
        junction: Junction,
        connected_road_congestion: List[float],
        active_incidents: List[Incident],
        queue_length_meters: float = 0.0,
        police_assigned: bool = False,
    ) -> JunctionRisk:
        # 1. Congestion Factor (0 - 100)
        avg_congestion = (
            sum(connected_road_congestion) / len(connected_road_congestion)
            if connected_road_congestion
            else 20.0
        )
        congestion_factor = min(100.0, avg_congestion)

        # 2. Incident Factor (0 - 100)
        incident_score = 0.0
        incident_reasons = []
        for inc in active_incidents:
            if inc.severity == RiskSeverity.CRITICAL:
                incident_score += 90.0
                incident_reasons.append(f"Critical incident ({inc.title})")
            elif inc.severity == RiskSeverity.HIGH:
                incident_score += 65.0
                incident_reasons.append(f"High-severity incident ({inc.title})")
            elif inc.severity == RiskSeverity.MODERATE:
                incident_score += 35.0
                incident_reasons.append(f"Moderate disruption ({inc.title})")
            else:
                incident_score += 15.0
                incident_reasons.append(f"Minor advisory ({inc.title})")
        incident_factor = min(100.0, incident_score)

        # 3. Criticality Factor (0 - 100) based on junction importance & betweenness centrality
        criticality_factor = min(100.0, (junction.importance / 5.0) * 60.0 + (junction.betweennessCentrality * 40.0))

        # 4. Queue Factor (0 - 100)
        queue_factor = min(100.0, (queue_length_meters / 250.0) * 100.0)

        # 5. Response Gap Factor (0 - 100): High when risk is rising but no police officer is deployed
        needs_attention = (congestion_factor > 50.0 or incident_factor > 30.0)
        if needs_attention and not police_assigned:
            response_gap_factor = 85.0
        elif needs_attention and police_assigned:
            response_gap_factor = 20.0
        else:
            response_gap_factor = 0.0

        # Weighted calculation
        total_risk = (
            cls.WEIGHT_CONGESTION * congestion_factor
            + cls.WEIGHT_INCIDENT * incident_factor
            + cls.WEIGHT_CRITICALITY * criticality_factor
            + cls.WEIGHT_QUEUE * queue_factor
            + cls.WEIGHT_RESPONSE_GAP * response_gap_factor
        )

        final_risk_score = round(max(0.0, min(100.0, total_risk)), 1)

        # Classify Severity
        if final_risk_score >= 80.0:
            severity = RiskSeverity.CRITICAL
        elif final_risk_score >= 60.0:
            severity = RiskSeverity.HIGH
        elif final_risk_score >= 35.0:
            severity = RiskSeverity.MODERATE
        else:
            severity = RiskSeverity.LOW

        # Generate deterministic "Why" explanation
        explanation_parts = []
        if incident_reasons:
            explanation_parts.append("; ".join(incident_reasons))
        if congestion_factor >= 70.0:
            explanation_parts.append(f"Severe link saturation ({round(congestion_factor)}% congestion)")
        elif congestion_factor >= 45.0:
            explanation_parts.append(f"Moderate link slowdown ({round(congestion_factor)}% congestion)")
        if junction.betweennessCentrality >= 0.85:
            explanation_parts.append("Key arterial choke point with high betweenness centrality")
        if queue_factor >= 60.0:
            explanation_parts.append(f"Extended queue length (~{round(queue_length_meters)}m)")
        if needs_attention and not police_assigned:
            explanation_parts.append("Uncovered police coverage gap requiring on-ground intervention")
        elif police_assigned:
            explanation_parts.append("Traffic officer deployed and actively managing flow")

        why_explanation = ". ".join(explanation_parts) if explanation_parts else "Normal arterial flow; low risk profile."

        return JunctionRisk(
            junctionId=junction.id,
            name=junction.name,
            lat=junction.lat,
            lon=junction.lon,
            riskScore=final_risk_score,
            severity=severity,
            congestionFactor=round(congestion_factor, 1),
            incidentFactor=round(incident_factor, 1),
            criticalityFactor=round(criticality_factor, 1),
            exposureFactor=round(criticality_factor * 0.8, 1),
            queueFactor=round(queue_factor, 1),
            responseGapFactor=round(response_gap_factor, 1),
            whyExplanation=why_explanation,
            policeAssigned=police_assigned,
            confidence=0.92,
            timestamp=datetime.now(timezone.utc),
        )

risk_engine = RiskEngine()
