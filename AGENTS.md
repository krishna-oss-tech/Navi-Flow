# AGENTS.md: Antigravity Guidelines for NAVI-FLOW

## Core Directives
1. **Deterministic Traffic Calculations**: Congestion, risk, route scoring, simulation propagation, and police resource optimization must be calculated deterministically with pure algorithms.
2. **Zero PII**: No facial recognition, no license plate reading, aggregate traffic metrics only.
3. **Transparent Provenance**: Every metric carries source, timestamp, confidence, and freshness.
4. **Resilience**: Every provider (TomTom, OSRM, SUMO, Redis, Postgres) has a clean interface and safe in-memory/simulated fallback.
5. **Verified Verification**: Every change must be verified via unit tests, linting, and build validation.
