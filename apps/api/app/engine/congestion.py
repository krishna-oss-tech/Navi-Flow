from typing import Dict, Any, Tuple
from pydantic import BaseModel, Field

class CongestionBreakdown(BaseModel):
    speedDegradationScore: float = Field(..., description="0-100 based on speed drop from free flow")
    delayScore: float = Field(..., description="0-100 based on delay ratio")
    volumeCapacityScore: float = Field(..., description="0-100 based on estimated flow vs design capacity")
    queuePressureScore: float = Field(..., description="0-100 based on observed queue buildup")
    freshnessFactor: float = Field(..., description="Multiplicative discount for stale data (1.0 = fresh, <1.0 = stale)")
    finalCongestionScore: float = Field(..., ge=0.0, le=100.0)


class CongestionEngine:
    """
    Deterministic Traffic Congestion Calculator.
    Formulates a multi-factor congestion index from 0 (free-flow) to 100 (gridlock).
    
    Weights:
    - Speed Degradation: 0.40
    - Delay Index: 0.30
    - Volume/Capacity (V/C): 0.20
    - Queue Pressure: 0.10
    """

    WEIGHT_SPEED_DROP: float = 0.40
    WEIGHT_DELAY: float = 0.30
    WEIGHT_VC_RATIO: float = 0.20
    WEIGHT_QUEUE: float = 0.10

    @classmethod
    def calculate_congestion(
        cls,
        current_speed: float,
        free_flow_speed: float,
        current_travel_time: float,
        free_flow_travel_time: float,
        capacity_vph: int = 2400,
        estimated_vph: float = 1200.0,
        queue_length_meters: float = 0.0,
        freshness_seconds: float = 0.0,
    ) -> Tuple[float, CongestionBreakdown]:
        # 1. Speed drop score (0 - 100)
        ff_speed = max(10.0, free_flow_speed)
        speed_drop_ratio = max(0.0, min(1.0, (ff_speed - current_speed) / ff_speed))
        speed_score = speed_drop_ratio * 100.0

        # 2. Delay score (0 - 100)
        ff_time = max(1.0, free_flow_travel_time)
        delay_ratio = max(0.0, (current_travel_time - ff_time) / ff_time)
        delay_score = min(100.0, delay_ratio * 50.0)

        # 3. Volume / Capacity (V/C) score
        cap = max(100, capacity_vph)
        vc_ratio = estimated_vph / cap
        vc_score = min(100.0, vc_ratio * 80.0)

        # 4. Queue pressure score (based on 300m reference max queue)
        queue_score = min(100.0, (queue_length_meters / 300.0) * 100.0)

        # 5. Raw weighted sum
        raw_score = (
            cls.WEIGHT_SPEED_DROP * speed_score
            + cls.WEIGHT_DELAY * delay_score
            + cls.WEIGHT_VC_RATIO * vc_score
            + cls.WEIGHT_QUEUE * queue_score
        )

        # 6. Freshness factor: penalize confidence if data is older than 5 minutes
        freshness_factor = 1.0
        if freshness_seconds > 300.0:
            freshness_factor = max(0.5, 1.0 - ((freshness_seconds - 300.0) / 900.0))

        final_score = round(max(0.0, min(100.0, raw_score * freshness_factor)), 1)

        breakdown = CongestionBreakdown(
            speedDegradationScore=round(speed_score, 1),
            delayScore=round(delay_score, 1),
            volumeCapacityScore=round(vc_score, 1),
            queuePressureScore=round(queue_score, 1),
            freshnessFactor=round(freshness_factor, 2),
            finalCongestionScore=final_score,
        )

        return final_score, breakdown

congestion_engine = CongestionEngine()
