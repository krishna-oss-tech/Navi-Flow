# NAVI-FLOW: Traffic & Risk Engine Specifications

## 1. Congestion Calculation Model
The congestion score $C \in [0, 100]$ is computed deterministically as:
$$C = \min\left(100, \left( 0.40 \cdot S_{drop} + 0.30 \cdot S_{delay} + 0.20 \cdot S_{VC} + 0.10 \cdot S_{queue} \right) \cdot F_{freshness} \right)$$

Where:
- $S_{drop} = \frac{v_{ff} - v_{curr}}{v_{ff}} \times 100$
- $S_{delay} = \min\left(100, \frac{t_{curr} - t_{ff}}{t_{ff}} \times 50\right)$
- $S_{VC} = \min\left(100, \frac{V}{C} \times 80\right)$
- $S_{queue} = \min\left(100, \frac{L_{queue}}{300} \times 100\right)$
- $F_{freshness} = \max(0.5, 1.0 - \frac{\text{age} - 300}{900})$ when age > 300s.

## 2. Multi-Factor Risk & Criticality Engine
Risk $R \in [0, 100]$ separates systemic chokepoint vulnerability from pure congestion:
$$R = 0.25 \cdot C_{avg} + 0.30 \cdot I_{severity} + 0.20 \cdot K_{criticality} + 0.15 \cdot Q_{pressure} + 0.10 \cdot G_{response}$$

### Severity Thresholds:
- **LOW** (0–34): Normal arterial flow
- **MODERATE** (35–59): Mild queue buildup
- **HIGH** (60–79): Severe congestion or major disruption
- **CRITICAL** (80–100): Chokepoint gridlock requiring immediate emergency dispatch

## 3. Police Resource Allocation (Google OR-Tools Formulation)
Let $x_{ij} \in \{0, 1\}$ be 1 if officer $i$ is assigned to junction $j$.
$$\max \sum_{i} \sum_{j} \left( 100 \cdot R_j - 30 \cdot \text{ETA}_{ij} \right) x_{ij}$$
Subject to:
$$\sum_{j} x_{ij} \le 1 \quad \forall i \in \text{Officers}$$
$$\sum_{i} x_{ij} \le 1 \quad \forall j \in \text{Junctions}$$
$$\text{ETA}_{ij} = \frac{\text{distance}(o_i, j_j)}{32 \text{ km/h}} \times 60$$
