import math
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field
from shapely.geometry import Point, LineString
from app.domain.models import RoadSegment
from app.domain.nagpur_network import NAGPUR_ROAD_SEGMENTS

class SpatialMatchResult(BaseModel):
    internalRoadId: Optional[str]
    providerPoint: List[float] = Field(..., description="[lon, lat]")
    distanceMeters: float
    matchConfidence: float = Field(ge=0.0, le=1.0)
    matchMethod: str = "euclidean_linestring_projection"
    isLowConfidence: bool = False
    matchedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SpatialMatcher:
    """
    Geospatial matcher matching external GPS coordinates/points to OSM road segments.
    Uses Shapely LineStrings and geodesic projection approximations.
    """

    def __init__(self, segments: Optional[Dict[str, RoadSegment]] = None):
        self.segments = segments or NAGPUR_ROAD_SEGMENTS
        self._linestrings: Dict[str, LineString] = {
            seg_id: LineString(seg.geometry) for seg_id, seg in self.segments.items()
        }
        self.total_matches: int = 0
        self.successful_matches: int = 0
        self.unmatched_count: int = 0
        self.low_confidence_count: int = 0

    @staticmethod
    def haversine_distance_meters(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
        """Calculate great-circle distance between two points in meters."""
        r = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    def match_point(self, lon: float, lat: float, max_distance_meters: float = 350.0) -> SpatialMatchResult:
        """
        Match a (lon, lat) point to the nearest road segment.
        Returns matchConfidence based on proximity.
        """
        self.total_matches += 1
        query_pt = Point(lon, lat)
        best_segment_id: Optional[str] = None
        min_dist_meters = float("inf")

        for seg_id, line in self._linestrings.items():
            # Project point onto line string
            proj_dist_deg = line.distance(query_pt)
            # Approx 1 deg lat ~ 111,000 meters
            dist_meters = proj_dist_deg * 111320.0
            if dist_meters < min_dist_meters:
                min_dist_meters = dist_meters
                best_segment_id = seg_id

        if min_dist_meters > max_distance_meters or not best_segment_id:
            self.unmatched_count += 1
            return SpatialMatchResult(
                internalRoadId=None,
                providerPoint=[lon, lat],
                distanceMeters=min_dist_meters if min_dist_meters != float("inf") else 9999.0,
                matchConfidence=0.0,
                matchMethod="unmatched_out_of_bounds",
                isLowConfidence=True,
            )

        # Confidence decays with distance (1.0 at 0m, 0.5 at 150m, 0.2 at 350m)
        confidence = max(0.0, min(1.0, 1.0 - (min_dist_meters / max_distance_meters)))
        is_low_conf = confidence < 0.60

        if is_low_conf:
            self.low_confidence_count += 1
        else:
            self.successful_matches += 1

        return SpatialMatchResult(
            internalRoadId=best_segment_id,
            providerPoint=[lon, lat],
            distanceMeters=round(min_dist_meters, 2),
            matchConfidence=round(confidence, 3),
            matchMethod="euclidean_linestring_projection",
            isLowConfidence=is_low_conf,
        )

    def get_matching_stats(self) -> Dict[str, Any]:
        """Expose matched %, unmatched %, low-confidence % metrics."""
        total = max(1, self.total_matches)
        return {
            "totalQueries": self.total_matches,
            "matchedCount": self.successful_matches,
            "matchedPct": round((self.successful_matches / total) * 100.0, 1),
            "unmatchedCount": self.unmatched_count,
            "unmatchedPct": round((self.unmatched_count / total) * 100.0, 1),
            "lowConfidenceCount": self.low_confidence_count,
            "lowConfidencePct": round((self.low_confidence_count / total) * 100.0, 1),
        }

spatial_matcher = SpatialMatcher()
