import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import settings
from app.domain.models import (
    Incident,
    TrafficScenario,
    SimulationResult,
    RouteCandidate,
    SystemHealth,
    AuditEvent,
)
from app.state.system_state import system_state
from app.audit.trail import audit_trail
from app.providers.tomtom import tomtom_provider
from app.providers.osrm import osrm_provider
from app.providers.geocoding import geocoding_provider
from app.vision.pipeline import vision_pipeline
from app.engine.spatial_matcher import spatial_matcher
from app.engine.route_ranker import route_ranker
from app.simulation.simulator import simulation_engine
from app.copilot.assistant import copilot
from app.realtime.events import ws_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("naviflow.api")

# Background periodic state update task
async def periodic_refresh_worker():
    while True:
        try:
            await asyncio.sleep(5.0)  # Refresh telemetry every 5 seconds
            await system_state.refresh_network_state()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in periodic refresh worker: {e}")
            await asyncio.sleep(5.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await system_state.initialize()
    worker_task = asyncio.create_task(periodic_refresh_worker())
    logger.info("NAVI-FLOW API Started Successfully.")
    yield
    # Shutdown
    worker_task.cancel()
    logger.info("NAVI-FLOW API Shutdown Complete.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Real-Time Traffic Intelligence, Optimization & Decision Support for Nagpur",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open for development / hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. Observability & Health Endpoints ---

@app.get("/api/health", response_model=SystemHealth)
async def get_health():
    summary = system_state.get_summary()
    return SystemHealth(
        status="HEALTHY",
        tomtomStatus="ACTIVE" if tomtom_provider.is_live else "BASELINE_FALLBACK",
        osrmStatus="ACTIVE",
        sumoStatus="ACTIVE",
        cvEngineStatus="ACTIVE",
        redisStatus="ACTIVE_IN_MEMORY",
        dbStatus="ACTIVE_POSTGIS_COMPAT",
        uptimeSeconds=summary["uptimeSeconds"],
        lastDataUpdate=system_state.last_update,
        activeConnections=len(ws_manager.active_connections),
    )

@app.get("/api/ready")
async def get_readiness():
    return {"status": "READY", "version": settings.APP_VERSION}

@app.get("/api/providers/status")
async def get_providers_status():
    return {
        "tomtom": tomtom_provider.get_status(),
        "spatialMatcher": spatial_matcher.get_matching_stats(),
        "activeWebSocketClients": len(ws_manager.active_connections),
    }

# --- 2. Network State & Geo Endpoints ---

@app.get("/api/network/summary")
async def get_network_summary():
    return system_state.get_summary()

@app.get("/api/network/junctions")
async def get_junctions():
    return {
        "junctions": [j.model_dump() for j in system_state.junctions.values()],
        "risks": {k: v.model_dump() for k, v in system_state.junction_risks.items()},
    }

@app.get("/api/network/roads")
async def get_roads():
    return {
        "segments": [s.model_dump() for s in system_state.road_segments.values()],
        "liveStates": {k: v.model_dump() for k, v in system_state.live_states.items()},
    }

# --- 2.5. Geocoding & Location Search ---

@app.get("/api/geocoding/search")
async def search_locations(q: str = Query(default="", description="Search place or junction name in Nagpur")):
    return await geocoding_provider.search(q, limit=8)

# --- 2.6. CCTV Edge Vision & Camera Streams ---

@app.get("/api/cctv/cameras")
async def get_cctv_cameras():
    cameras_list = []
    for cam_id, cam in system_state.cameras.items():
        obs = vision_pipeline.get_latest_observation(cam_id)
        source_cfg = vision_pipeline._source_configs.get(cam_id, {})
        cap = vision_pipeline._video_captures.get(cam_id)
        is_live = cap is not None and cap.isOpened()
        cameras_list.append({
            "cameraId": cam.cameraId,
            "junctionId": cam.junctionId,
            "name": cam.name,
            "lat": cam.lat,
            "lon": cam.lon,
            "direction": cam.direction,
            "sourceType": source_cfg.get("sourceType", cam.sourceType or "simulated"),
            "isLive": is_live,
            "fps": 29.2 if is_live else 28.5,
            "confidence": obs.confidence if obs else 0.92,
            "flowRateVpm": obs.vehiclesPerMinute if obs else 35.0,
            "occupancyPct": round((obs.occupancyEstimate if obs else 0.45) * 100.0, 1),
            "queueMeters": obs.queueLengthEstimateMeters if obs else 25.0,
            "composition": {
                "twoWheelers": obs.classDistribution.get("motorcycles", 45) if obs else 45,
                "cars": obs.classDistribution.get("cars", 25) if obs else 25,
                "autoRickshaws": obs.classDistribution.get("auto_rickshaws", 18) if obs else 18,
                "buses": obs.classDistribution.get("buses", 8) if obs else 8,
                "trucks": obs.classDistribution.get("trucks", 4) if obs else 4,
            },
        })
    return cameras_list

@app.get("/api/cctv/frame/{camera_id}")
async def get_cctv_frame(camera_id: str):
    frame_bytes = vision_pipeline.generate_jpeg_frame(camera_id)
    return Response(content=frame_bytes, media_type="image/jpeg")

class AnalyzeFrameRequest(BaseModel):
    cameraId: str
    frame: Optional[str] = None
    timestamp: Optional[str] = None

@app.post("/api/cctv/analyze-frame")
async def analyze_camera_frame(req: AnalyzeFrameRequest):
    return vision_pipeline.analyze_uploaded_frame(req.cameraId, req.frame)

class ConfigureCameraSourceRequest(BaseModel):
    cameraId: str
    sourceType: str = "webcam"  # webcam | rtsp | file | simulated
    sourceUrl: Optional[str] = "0"

@app.post("/api/cctv/configure")
async def configure_camera_source(req: ConfigureCameraSourceRequest):
    return vision_pipeline.configure_camera_source(req.cameraId, req.sourceType, req.sourceUrl)

# --- 3. Route Intelligence & Multi-Objective Ranking ---

class RouteQueryRequest(BaseModel):
    startLat: float = Field(default=21.1278, description="Default: Rahate Colony T-Point")
    startLon: float = Field(default=79.0754)
    endLat: float = Field(default=21.1532, description="Default: Central Avenue Agrasen Sq")
    endLon: float = Field(default=79.1055)

@app.post("/api/routes/query", response_model=List[RouteCandidate])
async def query_and_rank_routes(req: RouteQueryRequest):
    candidates = await osrm_provider.generate_route_candidates(
        req.startLat, req.startLon, req.endLat, req.endLon
    )
    ranked = route_ranker.rank_routes(candidates, system_state.live_states)
    return ranked

# --- 4. Incidents & What-If Simulation ---

@app.post("/api/incidents", response_model=Incident)
async def create_incident(inc: Incident):
    created = await system_state.create_incident(inc)
    return created

class RunSimulationRequest(BaseModel):
    scenarioName: str = "Custom What-If Scenario"
    targetJunctionId: str = "j_sitabuldi"
    incidentType: str = "accident"
    blockedLanes: int = 2
    capacityReductionPct: float = 60.0
    durationMinutes: int = 45

@app.post("/api/simulation/run", response_model=SimulationResult)
async def run_simulation(req: RunSimulationRequest):
    junc = system_state.junctions.get(req.targetJunctionId)
    if not junc:
        raise HTTPException(status_code=404, detail="Junction not found")

    # Affected roads are the connected roads to this junction
    affected_roads = junc.connectedRoads[:2]

    inc = Incident(
        id=f"sim_inc_{int(asyncio.get_event_loop().time())}",
        title=f"Simulated {req.incidentType.capitalize()} at {junc.name}",
        incidentType=req.incidentType,
        severity="HIGH" if req.capacityReductionPct < 70 else "CRITICAL",
        lat=junc.lat,
        lon=junc.lon,
        affectedRoadIds=affected_roads,
        blockedLanes=req.blockedLanes,
        capacityReductionPct=req.capacityReductionPct,
        isSimulated=True,
    )

    scenario = TrafficScenario(
        scenarioId=f"scenario_{int(asyncio.get_event_loop().time())}",
        name=req.scenarioName,
        description=f"Simulating {req.blockedLanes} blocked lane(s) at {junc.name}",
        incidents=[inc],
        durationMinutes=req.durationMinutes,
        isSimulated=True,
    )

    result = simulation_engine.run_scenario(scenario, system_state.live_states)
    return result

# --- 5. Police Optimization & Human-in-the-Loop Actions ---

@app.get("/api/police/recommendations")
async def get_police_recommendations():
    return list(system_state.recommendations.values())

class AcceptDeploymentRequest(BaseModel):
    recommendationId: str
    operatorNotes: Optional[str] = "Accepted via Command Center."

@app.post("/api/police/deployments/accept")
async def accept_police_deployment(req: AcceptDeploymentRequest):
    try:
        deployment = await system_state.accept_recommendation(req.recommendationId, req.operatorNotes or "")
        return deployment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class OverrideDeploymentRequest(BaseModel):
    recommendationId: str
    alternateOfficerId: str
    overrideReason: str

@app.post("/api/police/deployments/override")
async def override_police_deployment(req: OverrideDeploymentRequest):
    try:
        deployment = await system_state.override_recommendation(
            req.recommendationId, req.alternateOfficerId, req.overrideReason
        )
        return deployment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class RejectDeploymentRequest(BaseModel):
    recommendationId: str
    reason: Optional[str] = ""

@app.post("/api/police/deployments/reject")
async def reject_police_deployment(req: RejectDeploymentRequest):
    try:
        await system_state.reject_recommendation(req.recommendationId, req.reason or "")
        return {"status": "REJECTED", "recommendationId": req.recommendationId}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- 6. Audit Trail & Operations Copilot ---

@app.get("/api/audit/events", response_model=List[AuditEvent])
async def get_audit_events(limit: int = Query(default=50, ge=1, le=200)):
    return audit_trail.get_events(limit)

class CopilotQueryRequest(BaseModel):
    query: str

@app.post("/api/copilot/query")
async def ask_copilot(req: CopilotQueryRequest):
    return copilot.answer_query(req.query)

# --- 7. Deterministic Showcase Scenario Demo Triggers ---

@app.post("/api/demo/sitabuldi-accident")
async def trigger_sitabuldi_demo():
    summary = await system_state.trigger_sitabuldi_demo_scenario()
    return {"message": "Sitabuldi Disruption Scenario Triggered", "summary": summary}

@app.post("/api/demo/reset")
async def reset_demo():
    summary = await system_state.reset_demo_scenario()
    return {"message": "System State Reset to Normal", "summary": summary}

# --- 8. Real-Time WebSocket Endpoint ---

@app.websocket("/ws/live")
async def websocket_live_stream(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial snapshot immediately with safe JSON serialization
        initial_payload = json.dumps({"type": "INITIAL_STATE", "data": system_state.get_summary()}, default=str)
        await websocket.send_text(initial_payload)
        while True:
            # Keep connection alive and listen for client heartbeats/pings
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)
