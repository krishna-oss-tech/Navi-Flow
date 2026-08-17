from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field


class RoadClass(str, Enum):
    MOTORWAY = "motorway"
    PRIMARY = "primary"
    SECONDARY = "secondary"
    TERTIARY = "tertiary"
    RESIDENTIAL = "residential"
    TRUNK = "trunk"


class RiskSeverity(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentType(str, Enum):
    ACCIDENT = "accident"
    CLOSURE = "closure"
    ROADWORKS = "roadworks"
    STALLED_VEHICLE = "stalled_vehicle"
    LANE_BLOCKAGE = "lane_blockage"
    WATERLOGGING = "waterlogging"
    CONGESTION_SPILLOVER = "congestion_spillover"
    OTHER = "other"


class RouteClassification(str, Enum):
    FASTEST = "FASTEST"
    RECOMMENDED = "RECOMMENDED"
    LOW_RISK_ALTERNATIVE = "LOW_RISK_ALTERNATIVE"
    BACKUP = "BACKUP"


class DeploymentStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    OVERRIDDEN = "OVERRIDDEN"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class AuditEventType(str, Enum):
    INCIDENT_CREATED = "incident_created"
    INCIDENT_UPDATED = "incident_updated"
    RISK_ESCALATED = "risk_escalated"
    ROUTE_RECOMMENDED = "route_recommended"
    POLICE_RECOMMENDED = "police_recommended"
    DEPLOYMENT_ACCEPTED = "deployment_accepted"
    DEPLOYMENT_OVERRIDDEN = "deployment_overridden"
    DEPLOYMENT_REJECTED = "deployment_rejected"
    SIMULATION_RUN = "simulation_run"
    MANUAL_OVERRIDE = "manual_override"
    TRAFFIC_REDISTRIBUTED = "traffic_redistributed"


class Junction(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    connectedRoads: List[str] = Field(default_factory=list)
    importance: float = 1.0  # 1.0 - 5.0
    betweennessCentrality: float = 0.0
    isSignalized: bool = True


class RoadSegment(BaseModel):
    id: str
    osmId: Optional[str] = None
    name: str
    fromJunction: str
    toJunction: str
    roadClass: RoadClass = RoadClass.PRIMARY
    lanes: int = 2
    lengthMeters: float
    speedLimitKmh: float = 50.0
    capacityVehiclesPerHour: int = 2400
    importance: float = 1.0
    betweennessCentrality: float = 0.0
    geometry: List[List[float]] = Field(
        ..., description="List of [lon, lat] coordinate pairs"
    )


class TrafficObservation(BaseModel):
    observationId: str
    segmentId: str
    source: str = Field(..., description="tomtom | cctv | simulation | historical")
    currentSpeed: float
    freeFlowSpeed: float
    travelTime: float
    delaySeconds: float
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LiveRoadState(BaseModel):
    segmentId: str
    name: str
    fromJunction: str
    toJunction: str
    currentSpeed: float
    freeFlowSpeed: float
    currentTravelTime: float
    freeFlowTravelTime: float
    delaySeconds: float
    delayPercent: float
    congestionScore: float = Field(ge=0.0, le=100.0)
    riskScore: float = Field(ge=0.0, le=100.0)
    riskSeverity: RiskSeverity
    vehiclesPerMinute: float = 0.0
    confidence: float = 1.0
    freshnessSeconds: float = 0.0
    closure: bool = False
    incidentState: bool = False
    source: str = "fusion"
    geometry: List[List[float]]
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Incident(BaseModel):
    id: str
    title: str
    incidentType: IncidentType
    severity: RiskSeverity
    lat: float
    lon: float
    affectedRoadIds: List[str]
    blockedLanes: int = 1
    capacityReductionPct: float = 50.0  # 0 to 100%
    startTime: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expectedEndTime: Optional[datetime] = None
    source: str = "operator"
    confidence: float = 1.0
    description: str = ""
    isSimulated: bool = False


class CountingLine(BaseModel):
    id: str
    name: str
    p1: List[float]  # [lon, lat]
    p2: List[float]  # [lon, lat]


class QueueZone(BaseModel):
    id: str
    name: str
    polygon: List[List[float]]


class Camera(BaseModel):
    cameraId: str
    junctionId: str
    name: str
    lat: float
    lon: float
    sourceType: str = "recorded"  # recorded | webcam | rtsp
    streamUrl: Optional[str] = None
    direction: str = "Northbound"
    countingLines: List[CountingLine] = Field(default_factory=list)
    queueZones: List[QueueZone] = Field(default_factory=list)
    isCalibrated: bool = False
    enabled: bool = True


class VehicleObservation(BaseModel):
    observationId: str
    cameraId: str
    junctionId: str
    vehiclesPerMinute: float
    vehicleCount: int
    classDistribution: Dict[str, int] = Field(
        default_factory=lambda: {
            "cars": 0,
            "motorcycles": 0,
            "buses": 0,
            "trucks": 0,
            "auto_rickshaws": 0,
        }
    )
    directionalFlow: Dict[str, int] = Field(default_factory=dict)
    occupancyEstimate: float = 0.0  # 0.0 - 1.0
    queueLengthEstimateMeters: float = 0.0
    activeTracks: int = 0
    estimatedSpeed: float = 0.0
    isSpeedCalibrated: bool = False
    confidence: float = 0.85
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class JunctionRisk(BaseModel):
    junctionId: str
    name: str
    lat: float
    lon: float
    riskScore: float = Field(ge=0.0, le=100.0)
    severity: RiskSeverity
    congestionFactor: float
    incidentFactor: float
    criticalityFactor: float
    exposureFactor: float
    queueFactor: float
    responseGapFactor: float
    whyExplanation: str
    policeAssigned: bool = False
    confidence: float = 0.9
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RouteStep(BaseModel):
    instruction: str
    distanceMeters: float
    durationSeconds: float
    roadName: str


class RouteCandidate(BaseModel):
    routeId: str
    label: str
    summary: str
    distanceMeters: float
    baseDurationSeconds: float
    trafficDurationSeconds: float
    averageCongestion: float
    maxRiskScore: float
    incidentCount: int
    reliabilityScore: float  # 0.0 - 1.0
    confidence: float
    classification: RouteClassification
    recommendationReason: str
    geometry: List[List[float]]
    roadSegmentIds: List[str]
    steps: List[RouteStep] = Field(default_factory=list)


class TrafficScenario(BaseModel):
    scenarioId: str
    name: str
    description: str
    incidents: List[Incident] = Field(default_factory=list)
    capacityDisruptions: Dict[str, float] = Field(default_factory=dict)
    durationMinutes: int = 60
    isSimulated: bool = True


class SimulationResult(BaseModel):
    simulationId: str
    scenarioId: str
    scenarioName: str
    mode: str = "SIMULATED"  # SIMULATED | SUMO | DETERMINISTIC
    baselineAverageEtaSeconds: float
    simulatedAverageEtaSeconds: float
    networkDelaySeconds: float
    congestedJunctionCount: int
    criticalRiskJunctionCount: int
    overallCongestionIndex: float
    beforeAfterDelta: Dict[str, float] = Field(
        default_factory=lambda: {
            "travelTimeDeltaPct": 0.0,
            "networkDelayDeltaPct": 0.0,
            "riskReductionDeltaPct": 0.0,
            "bottlenecksResolved": 0.0,
        }
    )
    affectedCorridors: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Officer(BaseModel):
    id: str
    name: str
    badgeNumber: str
    rank: str = "Traffic Warden"
    lat: float
    lon: float
    currentJunctionId: Optional[str] = None
    isAvailable: bool = True
    shiftStatus: str = "ON_DUTY"
    currentAssignmentId: Optional[str] = None
    contactNumber: str = "+91-712-TRAFFIC"


class DeploymentRecommendation(BaseModel):
    recommendationId: str
    officerId: str
    officerName: str
    targetJunctionId: str
    targetJunctionName: str
    incidentId: Optional[str] = None
    priority: RiskSeverity
    expectedRiskReduction: float  # e.g., 28.5 points
    estimatedArrivalMinutes: float
    rationale: str
    confidence: float = 0.95
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Deployment(BaseModel):
    deploymentId: str
    recommendationId: Optional[str] = None
    officerId: str
    officerName: str
    junctionId: str
    junctionName: str
    incidentId: Optional[str] = None
    status: DeploymentStatus = DeploymentStatus.PENDING
    assignedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolvedAt: Optional[datetime] = None
    etaMinutes: float = 5.0
    riskReductionExpected: float = 25.0
    operatorNotes: str = ""
    overrideReason: Optional[str] = None


class AuditEvent(BaseModel):
    eventId: str
    eventType: AuditEventType
    actor: str = "HUMAN_OPERATOR"  # HUMAN_OPERATOR | SYSTEM_AUTO | DISPATCH_LEAD
    summary: str
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SystemHealth(BaseModel):
    status: str = "HEALTHY"
    tomtomStatus: str = "ACTIVE"
    osrmStatus: str = "ACTIVE"
    sumoStatus: str = "ACTIVE"
    cvEngineStatus: str = "ACTIVE"
    redisStatus: str = "IN_MEMORY_FALLBACK"
    dbStatus: str = "ACTIVE_SPATIAL"
    uptimeSeconds: float = 0.0
    lastDataUpdate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    activeConnections: int = 0
