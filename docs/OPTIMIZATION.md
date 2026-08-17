# NAVI-FLOW: Constrained Police Resource Optimization

## 1. Mathematical Formulation

The police resource optimizer dispatches available traffic wardens and patrol officers to high-risk junctions in Nagpur to maximize overall network safety and relieve chokepoints.

### Decision Variables
Let $x_{ij} \in \{0, 1\}$ be the binary assignment variable:
$$x_{ij} = 1 \quad \text{if officer } i \text{ is deployed to junction } j, \quad 0 \text{ otherwise.}$$

### Objective Function
$$\max \sum_{i \in \text{Officers}} \sum_{j \in \text{Junctions}} \left( \text{RiskScore}_j \times \text{Importance}_j \times e^{-\lambda \cdot \text{ETA}_{ij}} \right) x_{ij}$$

where $\lambda = 0.08$ is the distance-decay penalty coefficient.

### Constraints
1. **Officer Uniqueness**: Each officer can be assigned to at most one junction:
   $$\sum_{j \in \text{Junctions}} x_{ij} \le 1 \quad \forall i \in \text{Officers}$$

2. **Availability**: Officers currently engaged or on rest cannot be assigned:
   $$x_{ij} = 0 \quad \forall i \notin \text{AvailableOfficers}$$

3. **Junction Demand**: Each junction receives at most the required number of units:
   $$\sum_{i \in \text{Officers}} x_{ij} \le \text{MaxUnits}_j \quad \forall j \in \text{Junctions}$$

---

## 2. Solver Engine & Fallbacks

- **Primary Solver**: Google **OR-Tools Linear Solver (CBC / SCIP)**.
- **Deterministic Heuristic Fallback**: Greedy bipartite matching with response-time matrix decay when OR-Tools native libraries are in-memory.

---

## 3. Human-in-the-Loop Workflow

```
[System Recommendation] ──► [Operator Review]
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
             [ACCEPT]        [OVERRIDE]      [REJECT]
                 │               │               │
                 ▼               ▼               ▼
         Update Patrol    Log Alt Officer   Record Reason
         & Dispatch ETA   & Reason in Audit  in Audit Log
```
Every decision registers an immutable cryptographically sequenced event in the **Audit Ledger**.
