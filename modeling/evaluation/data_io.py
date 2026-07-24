from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


class EvaluationDataError(ValueError):
    """Raised when an evaluation input file does not match the expected schema."""


@dataclass(frozen=True)
class Query:
    query_id: str
    query_text: str
    ministry_name: str = ""
    notes: str = ""


def read_jsonl(path: str | Path) -> Iterable[tuple[int, dict[str, Any]]]:
    source = Path(path)
    with source.open(encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as exc:
                raise EvaluationDataError(
                    f"{source}:{line_number}: invalid JSON ({exc.msg})"
                ) from exc
            if not isinstance(value, dict):
                raise EvaluationDataError(
                    f"{source}:{line_number}: each line must be a JSON object"
                )
            yield line_number, value


def load_queries(path: str | Path) -> dict[str, Query]:
    queries: dict[str, Query] = {}
    for line_number, row in read_jsonl(path):
        query_id = str(row.get("query_id", "")).strip()
        query_text = str(row.get("query_text", "")).strip()
        if not query_id or not query_text:
            raise EvaluationDataError(
                f"{path}:{line_number}: query_id and query_text are required"
            )
        if query_id in queries:
            raise EvaluationDataError(
                f"{path}:{line_number}: duplicate query_id {query_id!r}"
            )
        queries[query_id] = Query(
            query_id=query_id,
            query_text=query_text,
            ministry_name=str(row.get("ministry_name", "")).strip(),
            notes=str(row.get("notes", "")).strip(),
        )
    if not queries:
        raise EvaluationDataError(f"{path}: no queries found")
    return queries


def load_qrels(path: str | Path) -> tuple[dict[str, Query], dict[str, dict[str, float]]]:
    queries: dict[str, Query] = {}
    qrels: dict[str, dict[str, float]] = {}
    for line_number, row in read_jsonl(path):
        query_id = str(row.get("query_id", "")).strip()
        query_text = str(row.get("query_text", "")).strip()
        relevance = row.get("relevance")
        if not query_id or not query_text or not isinstance(relevance, dict):
            raise EvaluationDataError(
                f"{path}:{line_number}: query_id, query_text, and relevance object are required"
            )
        if query_id in queries:
            raise EvaluationDataError(
                f"{path}:{line_number}: duplicate query_id {query_id!r}"
            )

        parsed_relevance: dict[str, float] = {}
        for doc_id, grade in relevance.items():
            doc_id = str(doc_id).strip()
            if not doc_id:
                raise EvaluationDataError(
                    f"{path}:{line_number}: relevance contains an empty doc_id"
                )
            try:
                numeric_grade = float(grade)
            except (TypeError, ValueError) as exc:
                raise EvaluationDataError(
                    f"{path}:{line_number}: relevance grade for {doc_id!r} is not numeric"
                ) from exc
            if numeric_grade < 0:
                raise EvaluationDataError(
                    f"{path}:{line_number}: relevance grades must be non-negative"
                )
            parsed_relevance[doc_id] = numeric_grade

        if not any(grade > 0 for grade in parsed_relevance.values()):
            raise EvaluationDataError(
                f"{path}:{line_number}: at least one relevant document (grade > 0) is required"
            )

        queries[query_id] = Query(
            query_id=query_id,
            query_text=query_text,
            ministry_name=str(row.get("ministry_name", "")).strip(),
            notes=str(row.get("notes", "")).strip(),
        )
        qrels[query_id] = parsed_relevance

    if not queries:
        raise EvaluationDataError(f"{path}: no qrels found")
    return queries, qrels


def load_run(path: str | Path) -> dict[str, list[dict[str, Any]]]:
    run: dict[str, list[dict[str, Any]]] = {}
    for line_number, row in read_jsonl(path):
        query_id = str(row.get("query_id", "")).strip()
        results = row.get("results")
        if not query_id or not isinstance(results, list):
            raise EvaluationDataError(
                f"{path}:{line_number}: query_id and results list are required"
            )
        if query_id in run:
            raise EvaluationDataError(
                f"{path}:{line_number}: duplicate query_id {query_id!r}"
            )

        unique_results: list[dict[str, Any]] = []
        seen: set[str] = set()
        for rank, result in enumerate(results, start=1):
            if isinstance(result, str):
                result = {"doc_id": result}
            if not isinstance(result, dict):
                raise EvaluationDataError(
                    f"{path}:{line_number}: result at rank {rank} must be an object or doc_id string"
                )
            doc_id = str(result.get("doc_id", "")).strip()
            if not doc_id:
                raise EvaluationDataError(
                    f"{path}:{line_number}: result at rank {rank} has no doc_id"
                )
            if doc_id in seen:
                continue
            seen.add(doc_id)
            normalized = dict(result)
            normalized["doc_id"] = doc_id
            unique_results.append(normalized)
        run[query_id] = unique_results
    if not run:
        raise EvaluationDataError(f"{path}: no run results found")
    return run


def write_jsonl(path: str | Path, rows: Iterable[dict[str, Any]]) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8", newline="\n") as file:
        for row in rows:
            file.write(json.dumps(row, ensure_ascii=False) + "\n")
