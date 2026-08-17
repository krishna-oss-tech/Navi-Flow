import heapq
import logging
from typing import Dict, List, Optional, Tuple, Any
import httpx
from app.config import settings
from app.domain.models import RouteCandidate, RouteStep, RouteClassification
from app.domain.nagpur_network import NAGPUR_JUNCTIONS, NAGPUR_ROAD_SEGMENTS

logger = logging.getLogger("naviflow.osrm")

class OSRMProvider:
    """
    Adapter for OSRM Route Candidate Generation.
    Features:
    - OSRM HTTP routing query
    - Graph-based deterministic fallback routing (Nagpur Corridor Graph Dijkstra/K-Shortest Paths)
    - Returns multiple structured RouteCandidates with geometries and step descriptions.
    """

    def __init__(self):
        self.base_url = settings.OSRM_BASE_URL
        self.junctions = NAGPUR_JUNCTIONS
        self.segments = NAGPUR_ROAD_SEGMENTS

    async def generate_route_candidates(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
    ) -> List[RouteCandidate]:
        # Try external OSRM if reachable
        try:
            url = f"{self.base_url}/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}?overview=full&geometries=geojson&alternatives=true&steps=true"
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    routes_data = data.get("routes", [])
                    if routes_data:
                        candidates = []
                        for i, r in enumerate(routes_data):
                            coords = r.get("geometry", {}).get("coordinates", [])
                            dist = float(r.get("distance", 3000.0))
                            dur = float(r.get("duration", 400.0))
                            steps = []
                            for leg in r.get("legs", []):
                                for step in leg.get("steps", []):
                                    steps.append(
                                        RouteStep(
                                            instruction=step.get("maneuver", {}).get("instruction", "Continue"),
                                            distanceMeters=float(step.get("distance", 100.0)),
                                            durationSeconds=float(step.get("duration", 20.0)),
                                            roadName=step.get("name", "Arterial Road"),
                                        )
                                    )
                            candidates.append(
                                RouteCandidate(
                                    routeId=f"osrm_cand_{i+1}",
                                    label=f"Route Option {chr(65+i)}",
                                    summary=f"Via {steps[0].roadName if steps else 'Nagpur Arterials'}",
                                    distanceMeters=dist,
                                    baseDurationSeconds=dur,
                                    trafficDurationSeconds=dur,
                                    averageCongestion=25.0,
                                    maxRiskScore=30.0,
                                    incidentCount=0,
                                    reliabilityScore=0.90,
                                    confidence=0.95,
                                    classification=RouteClassification.FASTEST if i == 0 else RouteClassification.BACKUP,
                                    recommendationReason="Standard OSRM candidate",
                                    geometry=coords,
                                    roadSegmentIds=[],
                                    steps=steps,
                                )
                            )
                        return candidates
        except Exception as e:
            logger.info(f"OSRM external request bypassed ({e}). Using Nagpur Graph Routing.")

        # Deterministic Multi-Path Graph Routing Fallback
        return self._generate_graph_candidates(start_lat, start_lon, end_lat, end_lon)

    def _find_nearest_junction(self, lat: float, lon: float) -> str:
        best_id = "j_sitabuldi"
        min_dist = float("inf")
        for j_id, j in self.junctions.items():
            d = (j.lat - lat) ** 2 + (j.lon - lon) ** 2
            if d < min_dist:
                min_dist = d
                best_id = j_id
        return best_id

    def _generate_graph_candidates(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
    ) -> List[RouteCandidate]:
        start_j = self._find_nearest_junction(start_lat, start_lon)
        end_j = self._find_nearest_junction(end_lat, end_lon)

        # Build adjacency graph
        adj: Dict[str, List[Tuple[str, str, float]]] = {j: [] for j in self.junctions}  # u -> (v, seg_id, length)
        for seg_id, seg in self.segments.items():
            adj[seg.fromJunction].append((seg.toJunction, seg_id, seg.lengthMeters))

        # Find 2-3 distinct paths using penalized path search
        paths = []
        for penalty_factor in [1.0, 1.3, 1.6]:
            dist_map: Dict[str, float] = {j: float("inf") for j in self.junctions}
            prev: Dict[str, Tuple[Optional[str], Optional[str]]] = {j: (None, None) for j in self.junctions}
            dist_map[start_j] = 0.0
            pq = [(0.0, start_j)]

            while pq:
                d, u = heapq.heappop(pq)
                if d > dist_map[u]:
                    continue
                if u == end_j:
                    break
                for v, seg_id, length in adj.get(u, []):
                    # add diversity penalty if segment was used in earlier path
                    pen = penalty_factor if (paths and seg_id in paths[-1]["segment_ids"]) else 1.0
                    cost = d + (length * pen)
                    if cost < dist_map[v]:
                        dist_map[v] = cost
                        prev[v] = (u, seg_id)
                        heapq.heappush(pq, (cost, v))

            # Reconstruct path
            if dist_map[end_j] < float("inf"):
                curr = end_j
                seg_ids = []
                while curr != start_j:
                    p_node, p_seg = prev[curr]
                    if not p_seg:
                        break
                    seg_ids.insert(0, p_seg)
                    curr = p_node

                if seg_ids and not any(p["segment_ids"] == seg_ids for p in paths):
                    paths.append({"segment_ids": seg_ids, "distance": dist_map[end_j]})

        # If start and end are same or adjacent
        if not paths:
            # direct synthetic corridor
            paths = [{"segment_ids": ["seg_wardha_north"], "distance": 2400.0}]

        candidates = []
        labels = ["Primary Arterial", "Secondary Bypass", "Ring Road / Link Alternative"]
        
        for idx, p in enumerate(paths[:3]):
            seg_ids = p["segment_ids"]
            total_dist = 0.0
            total_base_time = 0.0
            full_geometry: List[List[float]] = []
            steps: List[RouteStep] = []

            for sid in seg_ids:
                seg = self.segments.get(sid)
                if seg:
                    total_dist += seg.lengthMeters
                    free_speed_mps = (seg.speedLimitKmh * 1000.0) / 3600.0
                    total_base_time += seg.lengthMeters / free_speed_mps
                    full_geometry.extend(seg.geometry)
                    steps.append(
                        RouteStep(
                            instruction=f"Proceed on {seg.name}",
                            distanceMeters=seg.lengthMeters,
                            durationSeconds=round(seg.lengthMeters / free_speed_mps, 1),
                            roadName=seg.name,
                        )
                    )

            if not full_geometry:
                full_geometry = [[start_lon, start_lat], [end_lon, end_lat]]

            candidates.append(
                RouteCandidate(
                    routeId=f"cand_route_{idx+1}",
                    label=f"Route {chr(65+idx)}: {labels[min(idx, len(labels)-1)]}",
                    summary=f"Via {steps[0].roadName if steps else 'Nagpur Corridor'}",
                    distanceMeters=round(total_dist, 1),
                    baseDurationSeconds=round(total_base_time, 1),
                    trafficDurationSeconds=round(total_base_time, 1),
                    averageCongestion=20.0 + idx * 5.0,
                    maxRiskScore=25.0 + idx * 4.0,
                    incidentCount=0,
                    reliabilityScore=0.92 - idx * 0.05,
                    confidence=0.95,
                    classification=RouteClassification.FASTEST if idx == 0 else RouteClassification.BACKUP,
                    recommendationReason="Deterministic road network route",
                    geometry=full_geometry,
                    roadSegmentIds=seg_ids,
                    steps=steps,
                )
            )

        return candidates

osrm_provider = OSRMProvider()
