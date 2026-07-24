from __future__ import annotations

import math
from statistics import fmean
from typing import Iterable, Mapping


def _unique(items: Iterable[str]) -> list[str]:
    return list(dict.fromkeys(items))


def precision_at_k(
    relevance: Mapping[str, float],
    ranking: Iterable[str],
    k: int,
    binary_threshold: float = 1.0,
) -> float:
    _check_k(k)
    top_k = _unique(ranking)[:k]
    hits = sum(relevance.get(doc_id, 0) >= binary_threshold for doc_id in top_k)
    return hits / k


def recall_at_k(
    relevance: Mapping[str, float],
    ranking: Iterable[str],
    k: int,
    binary_threshold: float = 1.0,
) -> float:
    _check_k(k)
    relevant = {
        doc_id for doc_id, grade in relevance.items() if grade >= binary_threshold
    }
    if not relevant:
        return 0.0
    hits = len(relevant.intersection(_unique(ranking)[:k]))
    return hits / len(relevant)


def hit_rate_at_k(
    relevance: Mapping[str, float],
    ranking: Iterable[str],
    k: int,
    binary_threshold: float = 1.0,
) -> float:
    _check_k(k)
    return float(
        any(
            relevance.get(doc_id, 0) >= binary_threshold
            for doc_id in _unique(ranking)[:k]
        )
    )


def reciprocal_rank(
    relevance: Mapping[str, float],
    ranking: Iterable[str],
    binary_threshold: float = 1.0,
) -> float:
    for rank, doc_id in enumerate(_unique(ranking), start=1):
        if relevance.get(doc_id, 0) >= binary_threshold:
            return 1.0 / rank
    return 0.0


def ndcg_at_k(relevance: Mapping[str, float], ranking: Iterable[str], k: int) -> float:
    _check_k(k)
    ranking = _unique(ranking)[:k]
    dcg = sum(
        (2 ** relevance.get(doc_id, 0) - 1) / math.log2(rank + 1)
        for rank, doc_id in enumerate(ranking, start=1)
    )
    ideal_grades = sorted((grade for grade in relevance.values() if grade > 0), reverse=True)[:k]
    ideal_dcg = sum(
        (2**grade - 1) / math.log2(rank + 1)
        for rank, grade in enumerate(ideal_grades, start=1)
    )
    return dcg / ideal_dcg if ideal_dcg else 0.0


def evaluate_query(
    relevance: Mapping[str, float],
    ranking: Iterable[str],
    ks: Iterable[int],
    binary_threshold: float = 1.0,
) -> dict[str, float]:
    ranking = _unique(ranking)
    metrics: dict[str, float] = {
        "mrr": reciprocal_rank(relevance, ranking, binary_threshold)
    }
    for k in sorted(set(ks)):
        metrics[f"success@{k}"] = hit_rate_at_k(
            relevance, ranking, k, binary_threshold
        )
        metrics[f"precision@{k}"] = precision_at_k(
            relevance, ranking, k, binary_threshold
        )
        metrics[f"recall@{k}"] = recall_at_k(
            relevance, ranking, k, binary_threshold
        )
        metrics[f"ndcg@{k}"] = ndcg_at_k(relevance, ranking, k)
    return metrics


def macro_average(per_query: Iterable[Mapping[str, float]]) -> dict[str, float]:
    rows = list(per_query)
    if not rows:
        return {}
    keys = rows[0].keys()
    return {key: fmean(row[key] for row in rows) for key in keys}


def _check_k(k: int) -> None:
    if k <= 0:
        raise ValueError("k must be a positive integer")
