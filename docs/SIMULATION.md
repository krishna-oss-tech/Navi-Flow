# NAVI-FLOW: Traffic Incident & What-If Disruption Simulator

## 1. Purpose & Modeling Philosophy

The What-If Simulation Engine allows traffic operations engineers and city planners to evaluate the systemic impacts of incidents, construction lane blockages, monsoon waterlogging, and emergency road closures across the Nagpur arterial network.

---

## 2. Disruption Propagation Model

When an incident reduces capacity on road segment $s \in S$:

$$\text{EffectiveCapacity}(s) = \text{BaseCapacity}(s) \times \left(1.0 - \frac{\text{CapacityReductionPct}}{100}\right)$$

### Travel Time Inflation (BPR Function)
The Bureau of Public Roads (BPR) delay formulation calculates the disrupted travel time:

$$T_{\text{disrupted}}(s) = T_{\text{freeflow}}(s) \times \left[ 1 + \alpha \left( \frac{V(s)}{\text{EffectiveCapacity}(s)} \right)^\beta \right]$$

where $\alpha = 0.15$ and $\beta = 4.0$.

### Network Shockwave Spillover
When downstream queues exceed segment physical storage capacity:
1. Spills backward onto feeder corridors with exponential decay ($\lambda = 0.65$).
2. Diverts non-local traffic to secondary parallel corridors.
3. Quantifies network-wide cumulative delay delta ($\Delta \text{Delay}_{\text{seconds}}$).

---

## 3. High-Fidelity SUMO Simulation Integration

For microscopic traffic dynamics, NAVI-FLOW provides the `SUMOSimulationProvider`:
- Configured with Nagpur network topology `.net.xml` and route flows `.rou.xml`.
- Communicates via `libsumo` / `TraCI` protocol to model vehicle acceleration, deceleration, lane-changing, and signal control phases.
- Falls back to pure deterministic graph simulation when SUMO binaries are unavailable.

---

## 4. Before vs After Comparative Output Schema

Every simulation run produces structured Before vs After metrics:
- **Baseline Average ETA (sec)** vs **Disrupted Average ETA (sec)**
- **Cumulative Network Delay (sec)**
- **Bottlenecks & Chokepoints Created vs Resolved**
- **Projected Risk Recovery % with Police Dispatch Intervention**
