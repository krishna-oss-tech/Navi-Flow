# NAVI-FLOW: Showcase Demo Script & Sequence

## Live Demonstration Flow for Judges

### Step 1: Initial Baseline Health
1. Open the dashboard at `http://localhost:3000`.
2. Observe the Nagpur road network with green/amber corridors and low baseline risk scores across Sitabuldi, Wardha Road, and Central Avenue.
3. Observe bottom metrics ticker showing live network average speed (~42 km/h), 0 critical chokepoints, and available police reserves.

### Step 2: Inject Collision Disruption
1. Click the glowing red **"Sitabuldi Collision Demo"** button on the top header.
2. Observe:
   - Sitabuldi Interchange / Variety Sq immediately transitions to **CRITICAL Risk (92/100)** with a pulsing neon red halo.
   - Upstream queues propagate along Wardha Road and Central Avenue.
   - The top banner switches to **"SIMULATED INCIDENT ACTIVE"**.

### Step 3: Inspect Multi-Factor Diagnosis & AI Copilot
1. Click on the Sitabuldi junction marker.
2. In the right Context Panel, examine the multi-factor breakdown (Incident: 90, Congestion: 85, Centrality: 95) and the automated diagnosis.
3. Open the **AI Copilot** and ask: *"Why is Sitabuldi critical?"*
4. Inspect the grounded, hallucination-free telemetry response.

### Step 4: Constrained Police Optimization & Human-in-the-Loop
1. Inspect the generated OR-Tools police dispatch card recommending officer deployment with ETA and projected risk reduction (-28.5 pts).
2. Click **"Accept"** or **"Override"** (enter reason e.g. "East corridor bypass").
3. Observe that the officer is dispatched, the risk reduces on the map, and the decision is permanently recorded in the **Audit Ledger**.

### Step 5: Route Intelligence & What-If Simulation
1. Switch to the **Route Ranking** tab.
2. Click **"Calculate & Rank Routes"** to observe multi-objective scoring diverting traffic around Sitabuldi onto North Ambazari / Great Nag Road.
3. Open **What-If Sim** and inspect the Before vs After comparative metrics.
