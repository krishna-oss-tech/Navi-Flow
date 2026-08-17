import math
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from app.domain.models import (
    Officer,
    JunctionRisk,
    RiskSeverity,
    DeploymentRecommendation,
    Junction,
)
from app.domain.nagpur_network import NAGPUR_OFFICERS, NAGPUR_JUNCTIONS

logger = logging.getLogger("naviflow.optimizer")

class PoliceResourceOptimizer:
    """
    Constrained Resource Optimization for Nagpur Traffic Police Deployments.
    
    Objective:
    Maximize total risk reduction across critical junctions while minimizing officer ETA / travel time.
    
    Constraints:
    - 1 officer assigned to <= 1 junction.
    - Only available, on-duty officers are assigned.
    - Critical/High-risk locations receive highest priority.
    """

    def __init__(
        self,
        officers: Optional[Dict[str, Officer]] = None,
        junctions: Optional[Dict[str, Junction]] = None,
    ):
        self.officers = officers or NAGPUR_OFFICERS
        self.junctions = junctions or NAGPUR_JUNCTIONS

    @staticmethod
    def calculate_eta_minutes(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Estimate emergency response travel time in minutes assuming 35 km/h urban speed."""
        # 1 deg ~ 111 km
        dx = (lon2 - lon1) * 111.0 * math.cos(math.radians((lat1 + lat2) / 2))
        dy = (lat2 - lat1) * 111.0
        dist_km = math.sqrt(dx * dx + dy * dy)
        speed_kmh = 32.0  # Urban emergency speed in Nagpur
        travel_hours = dist_km / speed_kmh
        return round(max(2.0, travel_hours * 60.0), 1)

    def optimize_deployments(
        self,
        junction_risks: List[JunctionRisk],
        available_officers: Optional[List[Officer]] = None,
    ) -> List[DeploymentRecommendation]:
        # Filter officers who are available and on duty
        officers_pool = available_officers or [
            o for o in self.officers.values() if o.isAvailable and o.shiftStatus == "ON_DUTY"
        ]
        
        # Filter junctions requiring police intervention (Risk >= 40.0 and no police assigned yet)
        candidate_junctions = [
            jr for jr in junction_risks if jr.riskScore >= 40.0 and not jr.policeAssigned
        ]

        # Sort candidate junctions by risk descending
        candidate_junctions.sort(key=lambda x: x.riskScore, reverse=True)

        if not officers_pool or not candidate_junctions:
            return []

        # Try Google OR-Tools CP-SAT Assignment first
        try:
            from ortools.sat.python import cp_model
            return self._solve_with_ortools(candidate_junctions, officers_pool)
        except Exception as e:
            logger.info(f"OR-Tools CP-SAT optimizer solver fallback ({e}). Using deterministic Hungarian/Greedy.")
            return self._solve_greedy_fallback(candidate_junctions, officers_pool)

    def _solve_with_ortools(
        self,
        junctions: List[JunctionRisk],
        officers: List[Officer],
    ) -> List[DeploymentRecommendation]:
        from ortools.sat.python import cp_model

        model = cp_model.CpModel()
        num_j = len(junctions)
        num_o = len(officers)

        # Decision variables: x[i][j] = 1 if officer i assigned to junction j
        x = {}
        for i in range(num_o):
            for j in range(num_j):
                x[i, j] = model.NewBoolVar(f"x_{i}_{j}")

        # Constraint 1: Each officer assigned to at most 1 junction
        for i in range(num_o):
            model.Add(sum(x[i, j] for j in range(num_j)) <= 1)

        # Constraint 2: Each junction assigned to at most 1 primary officer
        for j in range(num_j):
            model.Add(sum(x[i, j] for i in range(num_o)) <= 1)

        # Objective: Maximize (RiskScore * 10 - ETA_minutes * 4)
        objective_terms = []
        for i, off in enumerate(officers):
            for j, junc in enumerate(junctions):
                eta = self.calculate_eta_minutes(off.lat, off.lon, junc.lat, junc.lon)
                # Scaled integer utility: higher risk = higher reward, higher ETA = penalty
                utility = int(junc.riskScore * 100 - eta * 30)
                objective_terms.append(utility * x[i, j])

        model.Maximize(sum(objective_terms))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 1.0
        status = solver.Solve(model)

        recommendations = []
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            for i, off in enumerate(officers):
                for j, junc in enumerate(junctions):
                    if solver.Value(x[i, j]) == 1:
                        eta = self.calculate_eta_minutes(off.lat, off.lon, junc.lat, junc.lon)
                        expected_reduction = round(min(38.0, junc.riskScore * 0.35 + 10.0), 1)
                        recommendations.append(
                            DeploymentRecommendation(
                                recommendationId=f"rec_{off.id}_{junc.junctionId}_{int(datetime.now().timestamp())}",
                                officerId=off.id,
                                officerName=off.name,
                                targetJunctionId=junc.junctionId,
                                targetJunctionName=junc.name,
                                priority=junc.severity,
                                expectedRiskReduction=expected_reduction,
                                estimatedArrivalMinutes=eta,
                                rationale=(
                                    f"Deploy {off.name} ({off.rank}) to {junc.name} to mitigate "
                                    f"{junc.severity.value} risk ({round(junc.riskScore)}). Expected ETA: {eta} mins. "
                                    f"Projected risk reduction: -{expected_reduction} pts."
                                ),
                                confidence=0.96,
                                timestamp=datetime.now(timezone.utc),
                            )
                        )
            return recommendations

        return self._solve_greedy_fallback(junctions, officers)

    def _solve_greedy_fallback(
        self,
        junctions: List[JunctionRisk],
        officers: List[Officer],
    ) -> List[DeploymentRecommendation]:
        assigned_officers = set()
        recommendations = []

        for junc in junctions:
            best_officer = None
            best_eta = float("inf")

            for off in officers:
                if off.id in assigned_officers:
                    continue
                eta = self.calculate_eta_minutes(off.lat, off.lon, junc.lat, junc.lon)
                if eta < best_eta:
                    best_eta = eta
                    best_officer = off

            if best_officer:
                assigned_officers.add(best_officer.id)
                expected_reduction = round(min(38.0, junc.riskScore * 0.35 + 10.0), 1)
                recommendations.append(
                    DeploymentRecommendation(
                        recommendationId=f"rec_{best_officer.id}_{junc.junctionId}_{int(datetime.now().timestamp())}",
                        officerId=best_officer.id,
                        officerName=best_officer.name,
                        targetJunctionId=junc.junctionId,
                        targetJunctionName=junc.name,
                        priority=junc.severity,
                        expectedRiskReduction=expected_reduction,
                        estimatedArrivalMinutes=best_eta,
                        rationale=(
                            f"Deploy {best_officer.name} to {junc.name}. "
                            f"ETA: {best_eta} mins. Projected risk reduction: -{expected_reduction} pts."
                        ),
                        confidence=0.93,
                        timestamp=datetime.now(timezone.utc),
                    )
                )

        return recommendations

police_optimizer = PoliceResourceOptimizer()
