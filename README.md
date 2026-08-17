# NAVI-FLOW
### Real-Time Traffic Intelligence, Optimization & Decision Support for Nagpur
**Manthan4Yuva / Vikasit Nagpur Hackathon 2026 — Intelligent Traffic Management Track**

NAVI-FLOW is a real-time, production-grade traffic intelligence and decision support platform engineered specifically for the road network of Nagpur. It implements an unbroken causal chain connecting real-time multi-source data fusion to deterministic congestion/risk estimation, multi-objective route ranking, dynamic What-If incident simulation, constrained police dispatch optimization via Google OR-Tools, human-in-the-loop auditability, and quantifiable before/after performance benchmarking.

---

## Key Features

1. **Deterministic Multi-Source Data Fusion**: Synthesizes TomTom live flow telemetry, edge CCTV camera vehicle counts/speeds, and historical baselines with transparent source attribution and conflict detection.
2. **Nagpur Geospatial Ground Truth**: Full geospatial graph covering key Nagpur junctions (Sitabuldi Interchange, Rahate Colony, Medical Square, Central Avenue, Cotton Market, Dharampeth, Sadar, Ajni, Hingna).
3. **Multi-Factor Congestion & Risk Engines**: Deterministic 0–100 congestion and risk scores separating structural criticality and police coverage gaps from pure speed drops.
4. **Traffic-Aware Multi-Objective Route Ranking**: Evaluates candidate paths generated via OSRM to balance travel time against active bottleneck risks.
5. **Google OR-Tools Police Optimization**: Constrained integer programming model matching available police officers to critical chokepoints based on response time and expected risk reduction.
6. **Human-in-the-Loop & Immutable Audit Ledger**: Human operators retain full final authority with Accept, Override, and Reject capabilities logged to an immutable event store.
7. **Next.js 15 & MapLibre GL JS Command Center**: Modern, dark-mode WebGL command dashboard with real-time WebSocket state streaming, interactive risk halos, and an AI Operations Copilot.

---

## Quickstart Guide

### 1. Start FastAPI Backend
```bash
# In repository root:
apps/api/venv/Scripts/python -m uvicorn app.main:app --port 8000 --reload
```

### 2. Start Next.js Frontend
```bash
# In apps/web:
cd apps/web
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 3. Run Automated Tests & Benchmarks
```bash
# Run backend test suite (8 tests covering all engines):
$env:PYTHONPATH="apps/api"; apps/api/venv/Scripts/pytest apps/api/tests

# Run benchmark comparison script:
$env:PYTHONPATH="apps/api"; apps/api/venv/Scripts/python apps/api/benchmark/run_benchmark.py
```

---

## Documentation Suite

- [`docs/PRD.md`](docs/PRD.md) — Product requirements and causal chain definition
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Detailed technical architecture & component interactions
- [`docs/API.md`](docs/API.md) — Full REST & WebSocket API specification
- [`docs/TRAFFIC_ENGINE.md`](docs/TRAFFIC_ENGINE.md) — Mathematical formulas for congestion, risk, and OR-Tools optimization
- [`docs/SECURITY.md`](docs/SECURITY.md) — Zero-PII privacy guarantees and secret management
- [`docs/DEMO.md`](docs/DEMO.md) — Step-by-step judge demonstration guide
- [`docs/BENCHMARKS.md`](docs/BENCHMARKS.md) — Baseline vs NAVI-FLOW performance evaluation results
