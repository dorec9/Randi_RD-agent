from __future__ import annotations

import random
from statistics import fmean
from typing import Mapping, Sequence


def paired_bootstrap_delta(
    baseline: Sequence[Mapping[str, float]],
    candidate: Sequence[Mapping[str, float]],
    *,
    samples: int = 10_000,
    confidence: float = 0.95,
    seed: int = 42,
) -> dict[str, dict[str, float]]:
    """Estimate paired metric deltas and percentile confidence intervals."""
    if not baseline or len(baseline) != len(candidate):
        raise ValueError("baseline and candidate must have the same non-zero length")
    if samples <= 0:
        raise ValueError("samples must be positive")
    if not 0 < confidence < 1:
        raise ValueError("confidence must be between 0 and 1")

    metric_names = list(baseline[0])
    if any(set(row) != set(metric_names) for row in [*baseline, *candidate]):
        raise ValueError("all rows must contain the same metrics")

    rng = random.Random(seed)
    count = len(baseline)
    distributions = {metric: [] for metric in metric_names}
    for _ in range(samples):
        indices = [rng.randrange(count) for _ in range(count)]
        for metric in metric_names:
            distributions[metric].append(
                fmean(candidate[index][metric] - baseline[index][metric] for index in indices)
            )

    alpha = (1 - confidence) / 2
    result = {}
    for metric in metric_names:
        values = sorted(distributions[metric])
        low_index = max(0, int(alpha * samples))
        high_index = min(samples - 1, int((1 - alpha) * samples) - 1)
        observed = fmean(
            candidate[index][metric] - baseline[index][metric]
            for index in range(count)
        )
        result[metric] = {
            "mean_delta": observed,
            "ci_low": values[low_index],
            "ci_high": values[high_index],
            "probability_improved": sum(value > 0 for value in values) / samples,
        }
    return result
