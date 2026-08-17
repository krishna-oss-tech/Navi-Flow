# NAVI-FLOW System Architecture

## Architecture Diagram

```
+-------------------------------------------------------------------------+
|                  NAVI-FLOW Command Center (Next.js 15)                  |
|   MapLibre WebGL | Glassmorphic UI | WebSocket State Stream | Copilot    |
+------------------------------------+------------------------------------+
                                     ^
                         WebSocket / REST API
                                     v
+-------------------------------------------------------------------------+
|                       FastAPI Backend Application                       |
|                                                                         |
|  [Ingestion & Fusion]        [Core Engines]        [Optimization & Sim] |
|  - TomTom Adapter (TTL)      - Congestion Engine   - Google OR-Tools    |
|  - Spatial Matcher (OSM)     - Risk & Criticality    Police Optimizer   |
|  - Multi-Source Synthesizer  - Route Ranker        - What-If Dynamic    |
|  - Edge CV Aggregator        - Audit Trail (Log)     Incident Simulator |
+------------------------------------+------------------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
    [Nagpur Road Network Graph]               [Real-Time State Broker]
    - 12 Strategic Junctions                  - WebSocket Broadcaster
    - 15 Arterial Corridors                   - State Delta Dispatcher
```

## Component Roles & Responsibilities

1. **`apps/api/app/domain`**: Defines strict Pydantic schemas (`LiveRoadState`, `JunctionRisk`, `RouteCandidate`, `DeploymentRecommendation`, `Incident`, `AuditEvent`) and Nagpur geospatial coordinates.
2. **`apps/api/app/engine/spatial_matcher.py`**: Projects external GPS coordinates onto LineStrings with confidence decay and low-confidence classification.
3. **`apps/api/app/engine/congestion.py`**: Computes deterministic 0-100 scores across speed degradation, delay ratio, V/C ratio, and queue pressure.
4. **`apps/api/app/engine/risk.py`**: Computes multi-factor risk, network criticality, and human-readable diagnostic explanations.
5. **`apps/api/app/engine/route_ranker.py`**: Multi-objective routing scoring balancing travel time against choke-point risks.
6. **`apps/api/app/optimization/police_optimizer.py`**: Solves optimal officer-to-chokepoint assignment using Google OR-Tools CP-SAT.
7. **`apps/api/app/simulation/simulator.py`**: Dynamic capacity reduction and shockwave queue propagation engine.
8. **`apps/web`**: Next.js 15 client rendering dark-mode MapLibre GL JS layers and dispatch modals.
