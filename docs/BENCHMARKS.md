# NAVI-FLOW: Benchmark & Performance Evaluation

## Reproducible Evaluation Summary

The automated evaluation benchmark (`apps/api/benchmark/run_benchmark.py`) measures network outcomes during a major central corridor disruption at Sitabuldi Interchange:

| Metric | Unmanaged Baseline | NAVI-FLOW Optimized | Quantifiable Delta |
|---|---|---|---|
| **Mean Travel Time** | 216.1 seconds | 155.6 seconds | **-28.0% faster** |
| **Total Network Delay** | 992.4 seconds | 635.1 seconds | **-36.0% reduction** |
| **Chokepoint Risk Score** | 90.2 / 100 | 67.2 / 100 | **-23.0 points reduction** |
| **Critical Junctions** | 2 active | 0 active | **100% resolved** |
| **Police Response Time** | Uncoordinated | 4.5 minutes (Optimal) | **Coverage gap closed** |

### Execution Command:
```bash
python apps/api/benchmark/run_benchmark.py
```
Output report is stored at `apps/api/benchmark/benchmark_results.json`.
