from typing import Dict, List, Tuple
from app.domain.models import RouteCandidate, RouteClassification, LiveRoadState, RiskSeverity
from app.domain.nagpur_network import NAGPUR_ROAD_SEGMENTS

class RouteRankingEngine:
    """
    Traffic-Aware Multi-Objective Route Ranker.
    Combines travel time, congestion variance, incident risk, and corridor reliability.
    
    Scoring Formula:
    Score = (TimePenalty * 0.45) + (AvgCongestion * 0.25) + (MaxRisk * 0.20) + (IncidentPenalty * 0.10)
    (Lower Score is Better)
    """

    @classmethod
    def rank_routes(
        cls,
        candidates: List[RouteCandidate],
        live_states: Dict[str, LiveRoadState],
    ) -> List[RouteCandidate]:
        if not candidates:
            return []

        evaluated: List[Tuple[float, float, float, RouteCandidate]] = []

        # Find min base duration across candidates for normalization
        min_base_duration = min(c.baseDurationSeconds for c in candidates) if candidates else 1.0

        for cand in candidates:
            seg_ids = cand.roadSegmentIds
            
            # Compute actual traffic-adjusted duration
            total_traffic_duration = 0.0
            congestion_scores = []
            risk_scores = []
            incident_count = 0

            for sid in seg_ids:
                st = live_states.get(sid)
                if st:
                    total_traffic_duration += st.currentTravelTime
                    congestion_scores.append(st.congestionScore)
                    risk_scores.append(st.riskScore)
                    if st.incidentState:
                        incident_count += 1
                else:
                    seg = NAGPUR_ROAD_SEGMENTS.get(sid)
                    if seg:
                        speed_mps = (seg.speedLimitKmh * 1000.0) / 3600.0
                        total_traffic_duration += seg.lengthMeters / speed_mps
                        congestion_scores.append(20.0)
                        risk_scores.append(20.0)

            avg_congestion = sum(congestion_scores) / len(congestion_scores) if congestion_scores else 20.0
            max_risk = max(risk_scores) if risk_scores else 20.0
            
            if total_traffic_duration == 0:
                total_traffic_duration = cand.baseDurationSeconds

            # Normalized travel time score (0 - 100)
            time_penalty = (total_traffic_duration / max(1.0, min_base_duration)) * 40.0
            incident_penalty = incident_count * 30.0

            # Composite cost (Lower is better)
            composite_cost = (
                time_penalty * 0.45
                + avg_congestion * 0.25
                + max_risk * 0.20
                + incident_penalty * 0.10
            )

            # Reliability score (0.0 to 1.0)
            reliability = max(0.2, min(0.99, 1.0 - (avg_congestion / 200.0) - (incident_count * 0.15)))

            cand.trafficDurationSeconds = round(total_traffic_duration, 1)
            cand.averageCongestion = round(avg_congestion, 1)
            cand.maxRiskScore = round(max_risk, 1)
            cand.incidentCount = incident_count
            cand.reliabilityScore = round(reliability, 2)

            evaluated.append((composite_cost, total_traffic_duration, max_risk, cand))

        # Sort primarily by composite cost
        evaluated.sort(key=lambda x: x[0])

        # Assign smart classifications
        ranked_candidates: List[RouteCandidate] = []
        
        # 1. Best overall composite score -> RECOMMENDED
        best_overall = evaluated[0][3]
        best_overall.classification = RouteClassification.RECOMMENDED
        best_overall.recommendationReason = (
            f"Optimal balance of travel time ({round(best_overall.trafficDurationSeconds/60, 1)}m) "
            f"and low corridor risk ({round(best_overall.maxRiskScore)})."
        )
        ranked_candidates.append(best_overall)

        # 2. Fastest by raw duration (if different from recommended)
        fastest_by_time = min(evaluated, key=lambda x: x[1])[3]
        if fastest_by_time.routeId != best_overall.routeId:
            fastest_by_time.classification = RouteClassification.FASTEST
            fastest_by_time.recommendationReason = (
                f"Absolute shortest ETA ({round(fastest_by_time.trafficDurationSeconds/60, 1)}m), "
                f"but carries {round(fastest_by_time.averageCongestion)}% congestion."
            )
            ranked_candidates.append(fastest_by_time)

        # 3. Lowest risk route (if different)
        lowest_risk = min(evaluated, key=lambda x: x[2])[3]
        if lowest_risk.routeId not in [c.routeId for c in ranked_candidates]:
            lowest_risk.classification = RouteClassification.LOW_RISK_ALTERNATIVE
            lowest_risk.recommendationReason = (
                f"Lowest risk corridor ({round(lowest_risk.maxRiskScore)} risk), avoiding active bottlenecks."
            )
            ranked_candidates.append(lowest_risk)

        # 4. Remaining candidates as BACKUP
        for _, _, _, cand in evaluated:
            if cand.routeId not in [c.routeId for c in ranked_candidates]:
                cand.classification = RouteClassification.BACKUP
                cand.recommendationReason = "Standard backup corridor."
                ranked_candidates.append(cand)

        return ranked_candidates

route_ranker = RouteRankingEngine()
