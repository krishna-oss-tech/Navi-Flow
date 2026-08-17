# NAVI-FLOW: Edge Computer Vision & Traffic Analysis Pipeline

## 1. Overview & Privacy Architecture

NAVI-FLOW processes visual traffic feeds from connected Nagpur municipal CCTV cameras, live RTSP streams, local webcams, and pre-recorded junction video.

### Zero-PII Guarantee
1. **No Facial Recognition**: Video frames are processed strictly through vehicle object detectors.
2. **No License Plate Recognition (ALPR)**: Bounding boxes and optical tracking do not store or extract alphanumeric plate text.
3. **Data Minimization**: Video streams are processed in-memory at the edge. Only aggregate numerical telemetry (`vehiclesPerMinute`, `classDistribution`, `occupancyEstimate`, `queueLengthEstimateMeters`) is transmitted and retained.

---

## 2. Multi-Modal Vehicle Detection & Classification

The vision engine detects and categorizes five dominant vehicle modalities typical in Indian urban transit:

| Vehicle Class | Detection Class ID | Description | Typical Nagpur Share |
|---|---|---|---|
| **Two-Wheelers** | `motorcycle` | Motorcycles, scooters, mopeds | 42% – 48% |
| **Four-Wheelers** | `car` | Private cars, cabs, SUVs | 24% – 28% |
| **Auto-Rickshaws** | `auto_rickshaw` | 3-wheeled passenger transit | 15% – 20% |
| **Buses** | `bus` | City buses, transit coaches | 6% – 9% |
| **Trucks & Heavy** | `truck` | Freight, commercial transport | 3% – 6% |

---

## 3. Mathematical Formulations

### Vehicle Flow Rate (Vehicles / Minute)
$$\text{VPM} = \frac{\sum_{i=1}^{N} \text{VehicleCount}_i}{\Delta t_{\text{minutes}}}$$

### Road Segment Occupancy Estimate
$$\text{Occupancy} = \min\left(1.0, \frac{\sum \text{Area}(\text{BoundingBoxes})}{\text{Area}(\text{RoadPolygon})}\right)$$

### Queue Length Estimation
$$\text{QueueLength}_{\text{meters}} = \max\left(0, (\text{Occupancy} - 0.40) \times L_{\text{segment}}\right)$$

---

## 4. Model Adapter Architecture & Licensing

NAVI-FLOW uses a vendor-agnostic detector adapter pattern:

```
                  ┌──────────────────────┐
                  │ Video / CCTV Stream  │
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │ ModelAdapter Interface│
                  └────┬────────────┬────┘
                       │            │
         ┌─────────────▼───┐    ┌───▼──────────────┐
         │ RT-DETR Adapter │    │ YOLO Adapter     │
         │ (Apache-2.0)    │    │ (Ultralytics)    │
         │ Default Clean   │    │ Optional Hook    │
         └─────────────────┘    └──────────────────┘
```

- **Default Commercial Path**: **RT-DETR (Apache-2.0)** for unrestricted enterprise/municipal deployment.
- **Optional YOLO Path**: Supports Ultralytics YOLO with documented AGPL-3.0 compliance.
