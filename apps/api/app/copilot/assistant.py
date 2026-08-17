from typing import Dict, List, Any
from app.state.system_state import system_state
from app.domain.models import RiskSeverity

class OperationsCopilot:
    """
    Operator Copilot & Natural Language Query Assistant.
    
    Principles:
    - Grounded strictly in structured real-time backend state.
    - Zero hallucination / no fabricated traffic numbers.
    - Explains deterministic risk factors, police dispatch rationales, and route tradeoffs.
    """

    @classmethod
    def answer_query(cls, query: str) -> Dict[str, Any]:
        q = query.lower()
        summary = system_state.get_summary()
        metrics = summary["metrics"]
        junction_risks = summary["junctionRisks"]
        incidents = summary["incidents"]
        recommendations = summary["recommendations"]

        grounding: Dict[str, Any] = {}
        suggested_actions: List[str] = []

        # 1. Query: Why is a junction critical/risky? (e.g. Sitabuldi)
        if "why" in q or "sitabuldi" in q or "critical" in q or "risk" in q:
            # Find most critical or queried junction
            target_j = None
            for j_id, jr in junction_risks.items():
                if ("sitabuldi" in q and "sitabuldi" in j_id) or jr["severity"] == "CRITICAL":
                    target_j = jr
                    break

            if target_j:
                grounding = {
                    "junction": target_j["name"],
                    "riskScore": target_j["riskScore"],
                    "severity": target_j["severity"],
                    "congestionFactor": target_j["congestionFactor"],
                    "incidentFactor": target_j["incidentFactor"],
                    "criticalityFactor": target_j["criticalityFactor"],
                    "whyExplanation": target_j["whyExplanation"],
                }
                answer = (
                    f"**{target_j['name']}** is currently flagged as **{target_j['severity']}** with a Risk Score of **{target_j['riskScore']}/100**.\n\n"
                    f"**Factor Breakdown**:\n"
                    f"• **Incident Disruption**: {target_j['incidentFactor']}/100\n"
                    f"• **Link Congestion**: {target_j['congestionFactor']}/100\n"
                    f"• **Network Centrality**: {target_j['criticalityFactor']}/100\n\n"
                    f"**Operational Diagnosis**: {target_j['whyExplanation']}"
                )
                suggested_actions = [
                    "Review pending police deployment recommendations",
                    "Simulate corridor traffic redistribution",
                    "Inspect CCTV flow at Sitabuldi North",
                ]
            else:
                answer = "All Nagpur network junctions are currently operating within nominal low-to-moderate risk parameters."

        # 2. Query: Police coverage gap / Uncovered locations
        elif "police" in q or "officer" in q or "uncovered" in q or "dispatch" in q or "coverage" in q:
            uncovered = [
                jr for jr in junction_risks.values()
                if jr["severity"] in ["HIGH", "CRITICAL"] and not jr["policeAssigned"]
            ]
            grounding = {
                "uncoveredHighRiskJunctions": [u["name"] for u in uncovered],
                "activeRecommendations": len(recommendations),
                "availableOfficers": metrics["availableOfficersCount"],
            }
            if uncovered:
                names = ", ".join(u["name"] for u in uncovered)
                answer = (
                    f"Identified **{len(uncovered)} high-risk junction(s)** without active on-ground police coverage: **{names}**.\n\n"
                    f"There are **{metrics['availableOfficersCount']} officers on duty** and available for immediate dispatch. "
                    f"The optimization engine has generated **{len(recommendations)} active deployment recommendation(s)**."
                )
                suggested_actions = ["Accept recommended officer dispatch", "View officer assignments"]
            else:
                answer = (
                    f"Police coverage is currently optimal. All high-risk corridors have active patrol units or pending assignments. "
                    f"Available patrol reserves: **{metrics['availableOfficersCount']} officers**."
                )

        # 3. Query: Network overview / status
        else:
            answer = (
                f"**Nagpur Traffic Command Status Overview**:\n"
                f"• Average Network Speed: **{metrics['averageSpeedKmh']} km/h**\n"
                f"• Network Congestion Index: **{metrics['averageCongestionScore']}/100**\n"
                f"• Active Incidents: **{metrics['activeIncidentsCount']}**\n"
                f"• Critical Junctions: **{metrics['criticalJunctions']}**\n"
                f"• Active Police Deployments: **{metrics['activeDeploymentsCount']}**"
            )
            grounding = metrics
            suggested_actions = [
                "Run What-If incident simulation",
                "Trigger Sitabuldi demonstration scenario",
                "Inspect live risk heatmap",
            ]

        return {
            "query": query,
            "answer": answer,
            "groundingData": grounding,
            "confidence": 0.98,
            "suggestedActions": suggested_actions,
        }

copilot = OperationsCopilot()
