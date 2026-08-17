# NAVI-FLOW Security & Privacy Policy

## 1. Zero Personally Identifiable Information (PII)
- **No Facial Recognition**: Video streams are processed purely for multi-modal bounding boxes and vehicle counting.
- **No License Plate Recognition (LPR/ANPR)**: No alphanumeric plate data is parsed, stored, or transmitted.
- **Edge Aggregation**: Raw video frames are discarded immediately after computing aggregate metrics (VPM, speed estimates, class distributions).

## 2. API Key Protection & Secret Management
- External provider secret keys (e.g. `TOMTOM_API_KEY`) reside exclusively in server-side environment variables and are never bundled in browser client code or prefixed with `NEXT_PUBLIC_` / `VITE_`.

## 3. Immutability of Operational Audit Trail
- All dispatch decisions, manual overrides, and incident creations are written to an append-only in-memory and persistent ledger with UTC timestamps and actor tags.
