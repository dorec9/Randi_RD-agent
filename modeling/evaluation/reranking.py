from __future__ import annotations

import re
from collections.abc import Iterable, Mapping
from typing import Any


_ALIASES = (
    ("인공지능", "ai"),
    ("소프트웨어", "sw"),
    ("에이전트", "자율행동체"),
    ("가축", "동물"),
    ("조류인플루엔자", "고위험동물감염병"),
    ("구제역", "고위험동물감염병"),
)


def _normalize_for_lexical_match(text: str) -> str:
    normalized = text.lower()
    for source, target in _ALIASES:
        normalized = normalized.replace(source, target)
    normalized = re.sub(r"r&d|\d+차|적절|사업|연구|개발|기술", "", normalized)
    return re.sub(r"[^0-9a-z가-힣]", "", normalized)


def _bigram_containment(query_text: str, title: str) -> float:
    query = _normalize_for_lexical_match(query_text)
    candidate = _normalize_for_lexical_match(title)
    query_bigrams = {query[index : index + 2] for index in range(len(query) - 1)}
    title_bigrams = {
        candidate[index : index + 2] for index in range(len(candidate) - 1)
    }
    denominator = min(len(query_bigrams), len(title_bigrams))
    if denominator == 0:
        return 0.0
    return 100.0 * len(query_bigrams.intersection(title_bigrams)) / denominator


def rerank_results(
    results: Iterable[dict[str, Any]],
    title_scores: Mapping[str, float],
    *,
    query_text: str = "",
    target_ministries: Iterable[str] = (),
    title_weight: float = 0.35,
    lexical_weight: float = 0.0,
    lexical_max_query_chars: int = 120,
    ministry_boost: float = 0.0,
    limit: int = 10,
) -> list[dict[str, Any]]:
    """Combine chunk and title relevance scores into a document ranking."""
    if not 0 <= title_weight <= 1:
        raise ValueError("title_weight must be between 0 and 1")
    if not 0 <= lexical_weight <= 1:
        raise ValueError("lexical_weight must be between 0 and 1")
    if lexical_max_query_chars <= 0:
        raise ValueError("lexical_max_query_chars must be positive")
    if limit <= 0:
        raise ValueError("limit must be positive")

    ministries = set(target_ministries)
    effective_lexical_weight = (
        lexical_weight
        if query_text and len(query_text.strip()) <= lexical_max_query_chars
        else 0.0
    )
    best_by_document: dict[str, dict[str, Any]] = {}
    for result in results:
        doc_id = str(result["doc_id"])
        semantic_score = float(result["score"])
        title_score = float(title_scores.get(doc_id, semantic_score))
        semantic_title_score = (
            (1 - title_weight) * semantic_score
            + title_weight * title_score
            + (ministry_boost if result.get("agency") in ministries else 0.0)
        )
        lexical_score = _bigram_containment(query_text, result.get("title", ""))
        final_score = (
            (1 - effective_lexical_weight) * semantic_title_score
            + effective_lexical_weight * lexical_score
        )
        item = dict(result)
        item["semantic_score"] = round(semantic_score, 4)
        item["title_score"] = round(title_score, 4)
        item["lexical_score"] = round(lexical_score, 4)
        item["score"] = round(final_score, 4)
        current = best_by_document.get(doc_id)
        if current is None or item["score"] > current["score"]:
            best_by_document[doc_id] = item

    return sorted(
        best_by_document.values(), key=lambda item: item["score"], reverse=True
    )[:limit]
