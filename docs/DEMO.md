# NAVI-FLOW: Hackathon Judge Live Demonstration Guide

## ⏱ 3-Minute Deterministic Presentation Script

This sequence demonstrates the complete causal chain of NAVI-FLOW without needing a terminal.

---

### Step 1: Open Operations Center (0:00 - 0:30)
1. Navigate to `http://localhost:3000`.
2. **Key Talking Points**:
   - "This is **NAVI-FLOW**, the real-time traffic intelligence and decision support platform for Nagpur."
   - "Notice the live map centered on Zero Mile Nagpur with real-time TomTom telemetry fused with Edge CCTV observations."
   - "The top bar indicates `LIVE TELEMETRY` with synced IST clock. All 5 core corridors (Sitabuldi, Wardha Rd, Central Ave, Dharampeth, Ring Rd) are green/amber."
3. **Action**: Click the **Basemap Selector** in the top right of the map (`DARK` → `SATELLITE` → `STANDARD`) to prove raster satellite capabilities.

---

### Step 2: Inject Collision Disruption (0:30 - 1:00)
1. **Action**: Click the **"Demo Collision"** button in the top command header.
2. **System Response**:
   - Header shifts to `INCIDENT ACTIVE` with blinking red alert.
   - **Sitabuldi Junction** turns red (`CRITICAL RISK: 92/100`), pulsing with an animated hazard diamond.
   - The **Junction Intelligence Drawer** slides open on the right showing:
     - Multi-factor breakdown: *Incident Impact: 95*, *Congestion: 84*, *Centrality: 88*.
     - Diagnostic explanation: *"Severe bottleneck due to multi-vehicle accident with 2 blocked lanes."*

---

### Step 3: Route Intelligence & Vehicle Composition (1:00 - 1:45)
1. **Action**: Click the **Routes icon** on the left icon bar.
2. **Action**: Click **"Rank Route Candidates"** (from Rahate Colony to Agrasen Sq).
3. **System Response**:
   - The engine ranks 3 alternatives using multi-objective optimization:
     - `RECOMMENDED`: Diverts via Dharampeth corridor (avoids Sitabuldi bottleneck).
     - `FASTEST`: Passes close to the bottleneck.
     - `LOW_RISK_ALTERNATIVE`: Outer bypass corridor.
   - The selected route draws the highlighted path and glow on the map.
   - **Route Vehicle Composition** displays live CCTV aggregation: *45% Two-Wheelers*, *25% Cars*, *18% Auto-Rickshaws*, *8% Buses*, *4% Trucks*, with flow rate and queue pressure.

---

### Step 4: Constrained Police Optimization & Human Decision (1:45 - 2:20)
1. **Action**: View the **OR-Tools Police Dispatch Card** in the right drawer.
2. **System Response**:
   - Recommends: `Inspector Rajesh Sharma` → Sitabuldi.
   - Displays: `ETA: 4.2 min`, `Expected Benefit: -18 Risk Points`.
3. **Action**: Click **"Accept"** (or test "Override").
4. **Result**: Confirmation toast appears: `✓ Dispatch recommendation accepted & logged to audit ledger.`

---

### Step 5: What-If Simulation & Before/After Validation (2:20 - 3:00)
1. **Action**: Click **"Simulate"** in the top bar → click **"Execute Simulation"**.
2. **System Response**:
   - Runs graph shockwave diffusion and displays Before vs After comparison cards:
     - *Baseline ETA: 18.2 min → Disrupted ETA: 28.4 min (+56% delay)*.
     - *Police Recovery: -24% risk recovery*.
     - *Affected Corridors: Sitabuldi Interchange, Wardha Road Connector*.
3. **Action**: Click **"Audit"** in the header to show the immutable cryptographically sequenced event trail documenting every operator decision.
