# Cross-Sectional Ranking + Separated Opportunity Layer

Two institutional upgrades: (1) rank percentile normalization across the universe, (2) clean separation between Factor Model (quality ranking) and Opportunity Model (trade ideas).

## Key Design Decision

> [!IMPORTANT]
> **Single-ticker vs Universe mode.** Cross-sectional ranking requires a universe to rank against. The current `/analyze/{ticker}` endpoint is single-ticker. Solution:
> - **Screening pipeline** (`/screen`): Applies full cross-sectional ranking after Phase 2 (deep enrichment). This is the institutional path.
> - **Single-ticker** (`/analyze/{ticker}`): Keeps absolute normalization as a fallback. The `factor_scores` will show absolute scores, and percentiles will be `null`.
>
> This mirrors how quant funds work: single-stock research uses the absolute model; portfolio construction uses the cross-sectional model.

## Architecture After Changes

```
Financial Data
      ↓
Normalization Layer (FCF stabilization)
      ↓
Valuation Engine (DCF, 3 scenarios)
      ↓
Scenario Engine (Bull/Base/Bear, skew, ER)
      ↓
Metric Extraction (ROIC, yield, margin, growth, stability)
      ↓
Factor Engines (absolute scores — per company)
  ├── Quality   (ROIC, stability, margin, debt)
  ├── Value     (FCF yield, margin of safety)
  ├── Growth    (FCF CAGR)
  └── Risk      (leverage, volatility, cyclicality)
      ↓
┌─────────────────────────────────────────────────────┐
│  Cross-Sectional Ranking (screening mode only)      │
│  Raw metrics → rank percentiles across universe     │
│  ROIC=28% → percentile=0.92 (top 8% of S&P 500)    │
└─────────────────────────────────────────────────────┘
      ↓
Factor Combination (percentile-based in screening, absolute in single-ticker)
      ↓
Expected Return Engine (already exists)
      ↓
Opportunity Engine (ER + Factor Score + Skew — separated layer)
      ↓
Opportunity Ranking (final ordering for screening)
```

## Proposed Changes

### Core Domain — Ranking Layer

#### [NEW] [factor_normalization.py](file:///c:/Users/mrfin/Documents/lumen_v1_project/app/core/factor_normalization.py)

Pure functions for cross-sectional ranking. No universe awareness — receives a list of values and returns percentile ranks.

```python
def rank_percentile(values: list[float | None]) -> list[float]:
    """Convert a list of raw values to percentile ranks [0.0, 1.0].
    
    Uses fractional ranking (ties get averaged rank).
    None values receive percentile 0.0.
    
    Example: [10, 30, 20, 30] → [0.0, 0.833, 0.333, 0.833]
    """

def compute_universe_percentiles(
    results: list[AnalysisResult],
) -> dict[str, FactorPercentiles]:
    """Extract rankable metrics from a list of AnalysisResults,
    compute percentile ranks for each metric, then return
    per-ticker FactorPercentiles.
    
    Ranked metrics:
      roic, fcf_stability, fcf_margin, debt_to_fcf (inverted),
      fcf_yield, margin_of_safety, fcf_growth, fcf_volatility
    """

def recalculate_factor_scores_with_percentiles(
    result: AnalysisResult,
    percentiles: FactorPercentiles,
) -> FactorScores:
    """Recompute factor scores using percentile ranks
    instead of absolute normalization."""
```

---

#### [MODIFY] [factor_models.py](file:///c:/Users/mrfin/Documents/lumen_v1_project/app/core/factor_models.py)

Add `FactorPercentiles` model:

```python
class FactorPercentiles(BaseModel):
    """Per-metric rank percentiles within the universe [0.0, 1.0].
    
    0.0 = bottom of universe, 1.0 = top of universe.
    None when cross-sectional ranking is not available (single-ticker mode).
    """
    roic: Optional[float] = None
    fcf_stability: Optional[float] = None
    fcf_margin: Optional[float] = None
    debt_to_fcf: Optional[float] = None      # inverted: lower debt = higher percentile
    fcf_yield: Optional[float] = None
    margin_of_safety: Optional[float] = None
    fcf_growth: Optional[float] = None
    fcf_volatility: Optional[float] = None    # inverted: lower volatility = higher percentile
```

Add percentiles to `FactorScores`:

```diff
 class FactorScores(BaseModel):
     quality: float
     value: float
     growth: float
     risk: float
     composite: float
     opportunity: Optional[float] = None
+    percentiles: Optional[FactorPercentiles] = None
```

---

#### [MODIFY] [factor_scoring.py](file:///c:/Users/mrfin/Documents/lumen_v1_project/app/core/factor_scoring.py)

Add parallel `*_from_percentiles` factor functions that accept pre-ranked inputs:

```python
def calculate_quality_factor_ranked(percentiles: FactorPercentiles) -> float:
    """Quality from percentile ranks — same weights, no normalization needed."""
    return round(
        0.40 * (percentiles.roic or 0.0)
        + 0.30 * (percentiles.fcf_stability or 0.0)
        + 0.20 * (percentiles.fcf_margin or 0.0)
        + 0.10 * (percentiles.debt_to_fcf or 0.0),
        4,
    )
# ... same pattern for value, growth, risk
```

The existing absolute functions are preserved for single-ticker mode.

---

### Application Layer — Pipeline Integration

#### [MODIFY] [screening_service.py](file:///c:/Users/mrfin/Documents/lumen_v1_project/app/application/screening_service.py)

Add **Phase 3** after Phase 2: cross-sectional ranking + re-scoring.

```python
# Phase 3 — Cross-Sectional Ranking
from core.factor_normalization import compute_universe_percentiles, recalculate_factor_scores_with_percentiles

percentile_map = compute_universe_percentiles(phase2_results)

for result in phase2_results:
    pctiles = percentile_map[result.ticker]
    result.factor_scores = recalculate_factor_scores_with_percentiles(result, pctiles)
    result.score = round(result.factor_scores.composite * max(0.50, result.data_quality.confidence_score), 4)

# Re-sort by opportunity (trade ideas), not just composite
phase2_results.sort(key=lambda r: r.factor_scores.opportunity or 0, reverse=True)
```

#### [MODIFY] [result_service.py](file:///c:/Users/mrfin/Documents/lumen_v1_project/app/application/result_service.py)

Expose percentiles in committee input:

```python
"percentile_roic": pctiles.roic if pctiles else None,
"percentile_fcf_yield": pctiles.fcf_yield if pctiles else None,
# ... etc
```

---

### Tests

#### [NEW] [test_factor_normalization.py](file:///c:/Users/mrfin/Documents/lumen_v1_project/app/tests/test_factor_normalization.py)

1. `rank_percentile` — basic ranking, ties, None handling
2. `compute_universe_percentiles` — with mock AnalysisResults
3. `recalculate_factor_scores_with_percentiles` — verify percentile-based scores differ from absolute
4. Edge cases: single company, all identical values, all None

## Verification Plan

### Automated Tests

```bash
cd c:\Users\mrfin\Documents\lumen_v1_project\app

# New normalization tests
python -m pytest tests/test_factor_normalization.py -v

# All tests (regression check)
python -m pytest tests/ -v
```
