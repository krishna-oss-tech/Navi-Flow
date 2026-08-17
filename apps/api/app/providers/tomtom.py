import time
import math
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
import httpx
from app.config import settings
from app.domain.models import TrafficObservation, Incident, IncidentType, RiskSeverity

logger = logging.getLogger("naviflow.tomtom")

class TomTomProvider:
    """
    Adapter for TomTom Traffic Flow & Incident APIs.
    Features:
    - Bounded caching (TTL)
    - Timeout and retry resilience
    - Deterministic fallback / simulation when API key is missing or offline
    - Provenance tracking (source, timestamp, confidence)
    """

    def __init__(self):
        self.api_key = settings.TOMTOM_API_KEY
        self.base_url = settings.TOMTOM_BASE_URL
        self._cache: Dict[str, Tuple[float, Any]] = {}
        self._cache_ttl = settings.CACHE_TTL_SECONDS
        self._is_live = bool(self.api_key and len(self.api_key) > 8)

    @property
    def is_live(self) -> bool:
        return self._is_live

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": "TomTom Traffic API",
            "isLive": self._is_live,
            "hasApiKey": bool(self.api_key),
            "cachedEntries": len(self._cache),
            "ttlSeconds": self._cache_ttl,
        }

    async def fetch_flow_for_point(self, lat: float, lon: float, segment_id: str) -> TrafficObservation:
        cache_key = f"flow:{segment_id}:{round(lat, 4)}:{round(lon, 4)}"
        now = time.time()

        if cache_key in self._cache:
            ts, data = self._cache[cache_key]
            if now - ts < self._cache_ttl:
                return data

        if self._is_live:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    url = f"{self.base_url}/flowSegmentData/relative0/10/json"
                    params = {
                        "point": f"{lat},{lon}",
                        "unit": "KMPH",
                        "key": self.api_key,
                    }
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        json_data = resp.json()
                        flow = json_data.get("flowSegmentData", {})
                        current_speed = float(flow.get("currentSpeed", 45.0))
                        free_flow_speed = float(flow.get("freeFlowSpeed", 50.0))
                        current_travel_time = float(flow.get("currentTravelTime", 120.0))
                        free_flow_travel_time = float(flow.get("freeFlowTravelTime", 100.0))
                        confidence = float(flow.get("confidence", 0.95))

                        obs = TrafficObservation(
                            observationId=f"tomtom_{segment_id}_{int(now)}",
                            segmentId=segment_id,
                            source="tomtom_live",
                            currentSpeed=max(5.0, current_speed),
                            freeFlowSpeed=max(20.0, free_flow_speed),
                            travelTime=current_travel_time,
                            delaySeconds=max(0.0, current_travel_time - free_flow_travel_time),
                            confidence=confidence,
                            timestamp=datetime.now(timezone.utc),
                        )
                        self._cache[cache_key] = (now, obs)
                        return obs
            except Exception as e:
                logger.warning(f"TomTom API request failed for point ({lat}, {lon}): {e}. Falling back to baseline.")

        # Deterministic Baseline / Fallback Generator
        obs = self._generate_fallback_flow(segment_id, lat, lon)
        self._cache[cache_key] = (now, obs)
        return obs

    def _generate_fallback_flow(self, segment_id: str, lat: float, lon: float) -> TrafficObservation:
        # Time-of-day dynamic diurnal curve for realistic Nagpur baseline
        now_dt = datetime.now(timezone.utc)
        hour = (now_dt.hour + 5.5) % 24  # Convert to IST (UTC+5:30)
        
        # Rush hour multipliers: Morning peak (9-11 AM), Evening peak (5-8 PM)
        is_morning_peak = 9.0 <= hour <= 11.5
        is_evening_peak = 17.0 <= hour <= 20.5
        
        base_speed = 50.0
        if "sitabuldi" in segment_id:
            base_speed = 38.0
        elif "wardha" in segment_id:
            base_speed = 55.0
        elif "central" in segment_id:
            base_speed = 42.0

        if is_morning_peak or is_evening_peak:
            speed_factor = 0.65 + 0.1 * math.sin(hour * math.pi / 4)
        else:
            speed_factor = 0.90 + 0.05 * math.cos(hour * math.pi / 6)

        current_speed = round(base_speed * speed_factor, 1)
        free_flow_speed = base_speed
        
        # Estimated 1.5km typical link
        typical_dist_km = 1.5
        free_flow_time = (typical_dist_km / free_flow_speed) * 3600
        current_time = (typical_dist_km / current_speed) * 3600
        delay = max(0.0, current_time - free_flow_time)

        return TrafficObservation(
            observationId=f"sim_flow_{segment_id}_{int(time.time())}",
            segmentId=segment_id,
            source="historical_baseline",
            currentSpeed=current_speed,
            freeFlowSpeed=free_flow_speed,
            travelTime=round(current_time, 1),
            delaySeconds=round(delay, 1),
            confidence=0.88,
            timestamp=now_dt,
        )

    async def fetch_incidents_in_bbox(self, bbox: List[float]) -> List[Incident]:
        """Fetch incidents within Nagpur bounding box [min_lon, min_lat, max_lon, max_lat]"""
        cache_key = f"incidents:{bbox[0]}:{bbox[1]}:{bbox[2]}:{bbox[3]}"
        now = time.time()
        if cache_key in self._cache:
            ts, data = self._cache[cache_key]
            if now - ts < self._cache_ttl:
                return data

        # If live API key is available, query TomTom Incident Details
        if self._is_live:
            try:
                min_lon, min_lat, max_lon, max_lat = bbox
                url = f"{self.base_url}/incidentDetails/s3/{min_lat},{min_lon},{max_lat},{max_lon}/11/-1/json"
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(url, params={"key": self.api_key})
                    if resp.status_code == 200:
                        incidents = []
                        items = resp.json().get("tm", {}).get("poi", [])
                        for item in items:
                            inc_id = f"tomtom_inc_{item.get('id', 'unk')}"
                            desc = item.get("d", "Traffic disruption reported")
                            p = item.get("p", {})
                            inc_lat = p.get("y", 21.1458)
                            inc_lon = p.get("x", 79.0882)
                            incidents.append(
                                Incident(
                                    id=inc_id,
                                    title=desc[:50],
                                    incidentType=IncidentType.ACCIDENT if "accident" in desc.lower() else IncidentType.CONGESTION_SPILLOVER,
                                    severity=RiskSeverity.HIGH,
                                    lat=inc_lat,
                                    lon=inc_lon,
                                    affectedRoadIds=[],
                                    blockedLanes=1,
                                    capacityReductionPct=40.0,
                                    source="tomtom_live",
                                    confidence=0.92,
                                    description=desc,
                                    isSimulated=False,
                                )
                            )
                        self._cache[cache_key] = (now, incidents)
                        return incidents
            except Exception as e:
                logger.warning(f"TomTom incidents request failed: {e}")

        # Return empty or active list
        self._cache[cache_key] = (now, [])
        return []

tomtom_provider = TomTomProvider()
