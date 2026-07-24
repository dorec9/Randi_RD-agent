from __future__ import annotations

import argparse
import csv
from collections import OrderedDict
from pathlib import Path

from .data_io import EvaluationDataError, write_jsonl


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a completed labeling CSV to qrels JSONL.")
    parser.add_argument("--labels", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    grouped: OrderedDict[str, dict] = OrderedDict()
    with args.labels.open(encoding="utf-8-sig", newline="") as file:
        for line_number, row in enumerate(csv.DictReader(file), start=2):
            query_id = (row.get("query_id") or "").strip()
            doc_id = (row.get("doc_id") or "").strip()
            grade_text = (row.get("relevance") or "").strip()
            if not grade_text:
                continue
            try:
                grade = int(grade_text)
            except ValueError as exc:
                raise EvaluationDataError(
                    f"{args.labels}:{line_number}: relevance must be 0, 1, or 2"
                ) from exc
            if grade not in {0, 1, 2}:
                raise EvaluationDataError(
                    f"{args.labels}:{line_number}: relevance must be 0, 1, or 2"
                )
            item = grouped.setdefault(
                query_id,
                {
                    "query_id": query_id,
                    "query_text": (row.get("query_text") or "").strip(),
                    "ministry_name": (row.get("ministry_name") or "").strip(),
                    "relevance": {},
                },
            )
            item["relevance"][doc_id] = grade

    for query_id, item in grouped.items():
        if not any(grade > 0 for grade in item["relevance"].values()):
            raise EvaluationDataError(
                f"query {query_id!r} has no relevant document; complete the labels before conversion"
            )
    if not grouped:
        raise EvaluationDataError("no labeled rows found")

    write_jsonl(args.output, grouped.values())
    print(f"Qrels written to {args.output.resolve()} ({len(grouped)} queries)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
