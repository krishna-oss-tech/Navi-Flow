# NAVI-FLOW API Documentation

## REST Endpoints

### 1. Health & Observability
- `GET /api/health`: Returns service health, provider availability, and uptime.
- `GET /api/ready`: Readiness probe.
- `GET /api/providers/status`: Status of TomTom, OSRM, Spatial Matcher query counts, and WebSocket client metrics.

### 2. Network State
- `GET /api/network/summary`: Complete snapshot of current live states, junction risks, incidents, and deployments.
- `GET /api/network/junctions`: All registered Nagpur junctions and risk factor breakdowns.
- `GET /api/network/roads`: All registered road segments and fused speeds.

### 3. Route Intelligence
- `POST /api/routes/query`:
  ```json
  {
    "startLat": 21.1278,
    "startLon": 79.0754,
    "endLat": 21.1532,
    "endLon": 79.1055
  }
  ```
  Returns ranked `RouteCandidate` array classified as `FASTEST`, `RECOMMENDED`, `LOW_RISK_ALTERNATIVE`, or `BACKUP`.

### 4. Police Optimization & Human-in-the-Loop
- `GET /api/police/recommendations`: Active OR-Tools dispatch recommendations.
- `POST /api/police/deployments/accept`: `{ "recommendationId": "string" }`
- `POST /api/police/deployments/override`: `{ "recommendationId": "string", "alternateOfficerId": "string", "overrideReason": "string" }`
- `POST /api/police/deployments/reject`: `{ "recommendationId": "string", "reason": "string" }`

### 5. Incident Simulation
- `POST /api/simulation/run`:
  ```json
  {
    "targetJunctionId": "j_sitabuldi",
    "incidentType": "accident",
    "blockedLanes": 2,
    "capacityReductionPct": 65.0,
    "durationMinutes": 45
  }
  ```

### 6. Copilot & Audit
- `POST /api/copilot/query`: Natural language query `{ "query": "Why is Sitabuldi critical?" }`
- `GET /api/audit/events`: Immutable event log.

## Real-Time WebSocket
- `ws://localhost:8000/ws/live`: Streams `INITIAL_STATE` and continuous `STATE_UPDATE` JSON deltas.
