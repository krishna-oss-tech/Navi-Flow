# NAVI-FLOW: Dependencies, Licenses & Fallback Architecture

## 1. Core Technology Stack & Licensing

| Component | Library / Framework | Version | License | Role |
|---|---|---|---|---|
| **API Framework** | FastAPI | `0.115.6` | MIT | High-performance asynchronous REST & WebSocket server |
| **Data Contracts** | Pydantic | `2.10.4` | MIT | Strict type-safety & request/response validation |
| **Optimization** | Google OR-Tools | `9.11.4210` | Apache-2.0 | Constrained integer programming solver for police dispatch |
| **Web Framework** | Next.js | `15.1.0` | MIT | React 19 server/client application |
| **Map Engine** | MapLibre GL JS | `4.7.1` | BSD-3-Clause | Hardware-accelerated vector & raster tile map rendering |
| **Styling** | Tailwind CSS | `3.4.16` | MIT | Design token system and layout utilities |
| **Icons** | Lucide React | `0.468.0` | ISC | Semantic interface iconography |
| **Auth / Store** | Supabase JS | `2.112.3` | MIT | Optional cloud database & authentication (with zero-credential demo fallback) |

---

## 2. External Services & Transparent Fallbacks

| Provider | Purpose | Primary Protocol | Graceful Fallback Mode |
|---|---|---|---|
| **TomTom Traffic API** | Live Nagpur corridor flow & incidents | REST / JSON | High-fidelity deterministic physical state cache |
| **OSRM** | OpenStreetMap route candidate generation | HTTP API | Direct multi-corridor geometric generator |
| **Esri / CartoDB** | Satellite imagery & dark operational basemaps | Raster XYZ tiles | Standard OpenStreetMap raster layer |
| **SUMO** | Microscopic traffic shockwave simulation | TraCI / libsumo | BPR delay function & graph diffusion model |
| **Redis** | High-throughput pub/sub state cache | In-memory socket | FastAPI memory cache |
| **PostgreSQL / PostGIS** | Spatial querying of road network topology | SQL / GeoJSON | In-memory spatial index (R-Tree / KD-Tree) |
