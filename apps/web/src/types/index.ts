export type RiskSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface LocationPlace {
  id: string;
  name: string;
  area: string;
  category?: string;
  lat: number;
  lon: number;
}

export interface Junction {
  id: string;
  name: string;
  lat: float;
  lon: float;
  connectedRoads: string[];
  importance: number;
  betweennessCentrality: number;
  isSignalized: boolean;
}

export type float = number;

export interface RoadSegment {
  id: string;
  osmId?: string;
  name: string;
  fromJunction: string;
  toJunction: string;
  roadClass: string;
  lanes: number;
  lengthMeters: number;
  speedLimitKmh: number;
  capacityVehiclesPerHour: number;
  importance: number;
  betweennessCentrality: number;
  geometry: [number, number][];
}

export interface LiveRoadState {
  segmentId: string;
  name: string;
  fromJunction: string;
  toJunction: string;
  currentSpeed: number;
  freeFlowSpeed: number;
  currentTravelTime: number;
  freeFlowTravelTime: number;
  delaySeconds: number;
  delayPercent: number;
  congestionScore: number;
  riskScore: number;
  riskSeverity: RiskSeverity;
  vehiclesPerMinute: number;
  confidence: number;
  freshnessSeconds: number;
  closure: boolean;
  incidentState: boolean;
  source: string;
  geometry: [number, number][];
  updatedAt: string;
}

export interface JunctionRisk {
  junctionId: string;
  name: string;
  lat: number;
  lon: number;
  riskScore: number;
  severity: RiskSeverity;
  congestionFactor: number;
  incidentFactor: number;
  criticalityFactor: number;
  exposureFactor: number;
  queueFactor: number;
  responseGapFactor: number;
  whyExplanation: string;
  policeAssigned: boolean;
  confidence: number;
  timestamp: string;
}

export interface Incident {
  id: string;
  title: string;
  incidentType: string;
  severity: RiskSeverity;
  lat: number;
  lon: number;
  affectedRoadIds: string[];
  blockedLanes: number;
  capacityReductionPct: number;
  startTime: string;
  source: string;
  confidence: number;
  description: string;
  isSimulated: boolean;
}

export interface Officer {
  id: string;
  name: string;
  badgeNumber: string;
  rank: string;
  lat: number;
  lon: number;
  currentJunctionId?: string;
  isAvailable: boolean;
  shiftStatus: string;
  contactNumber: string;
}

export interface DeploymentRecommendation {
  recommendationId: string;
  officerId: string;
  officerName: string;
  targetJunctionId: string;
  targetJunctionName: string;
  incidentId?: string;
  priority: RiskSeverity;
  expectedRiskReduction: number;
  estimatedArrivalMinutes: number;
  rationale: string;
  confidence: number;
  timestamp: string;
}

export interface Deployment {
  deploymentId: string;
  recommendationId?: string;
  officerId: string;
  officerName: string;
  junctionId: string;
  junctionName: string;
  status: "PENDING" | "ACCEPTED" | "OVERRIDDEN" | "REJECTED";
  assignedAt: string;
  etaMinutes: number;
  riskReductionExpected: number;
  operatorNotes: string;
  overrideReason?: string;
}

export interface Camera {
  cameraId: string;
  junctionId: string;
  name: string;
  lat: number;
  lon: number;
  sourceType: string;
  direction: string;
  isCalibrated: boolean;
  enabled: boolean;
}

export interface AuditEvent {
  eventId: string;
  eventType: string;
  actor: string;
  summary: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface RouteCandidate {
  routeId: string;
  label: string;
  summary: string;
  distanceMeters: number;
  baseDurationSeconds: number;
  trafficDurationSeconds: number;
  averageCongestion: number;
  maxRiskScore: number;
  incidentCount: number;
  reliabilityScore: number;
  confidence: number;
  classification: "FASTEST" | "RECOMMENDED" | "LOW_RISK_ALTERNATIVE" | "BACKUP";
  recommendationReason: string;
  geometry: [number, number][];
  roadSegmentIds: string[];
  vehicleComposition?: {
    percentages: {
      cars: number;
      motorcycles: number;
      buses: number;
      trucks: number;
      auto_rickshaws: number;
    };
    flowVehiclesPerMin: number;
    averageOccupancyPct: number;
    queuePressureMeters: number;
    cameraCount: number;
    confidence: number;
  };
  cctvObservations?: Array<{
    cameraId: string;
    name: string;
    junctionId: string;
    vehiclesPerMinute: number;
    occupancy: number;
    queueMeters: number;
    direction: string;
  }>;
}

export interface SystemMetrics {
  averageSpeedKmh: number;
  averageCongestionScore: number;
  criticalJunctions: number;
  highRiskJunctions: number;
  activeIncidentsCount: number;
  activeDeploymentsCount: number;
  availableOfficersCount: number;
}

export interface NetworkSummary {
  timestamp: string;
  uptimeSeconds: number;
  isDemoMode: boolean;
  metrics: SystemMetrics;
  liveStates: Record<string, LiveRoadState>;
  junctionRisks: Record<string, JunctionRisk>;
  incidents: Incident[];
  deployments: Deployment[];
  recommendations: DeploymentRecommendation[];
  officers: Officer[];
  cameras: Camera[];
}
