from __future__ import annotations

import argparse
import csv
from pathlib import Path

from .data_io import load_queries, load_run


def _parse_run(value: str) -> tuple[str, Path]:
    if "=" not in value:
        raise argparse.ArgumentTypeError("run must use NAME=PATH format")
    name, path = value.split("=", 1)
    return name.strip(), Path(path)


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a pooled relevance-labeling CSV.")
    parser.add_argument("--queries", type=Path, required=True)
    parser.add_argument("--run", type=_parse_run, action="append", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--depth", type=int, default=10)
    args = parser.parse_args()

    queries = load_queries(args.queries)
    named_runs = [(name, load_run(path)) for name, path in args.run]
    rank_columns = [f"{name}_rank" for name, _ in named_runs]
    rows = []

    for query_id, query in queries.items():
        pool: dict[str, dict] = {}
        for run_name, run in named_runs:
            for rank, result in enumerate(run.get(query_id, [])[: args.depth], start=1):
                doc_id = result["doc_id"]
                row = pool.setdefault(
                    doc_id,
                    {
                        "query_id": query_id,
                        "query_text": query.query_text,
                        "ministry_name": query.ministry_name,
                        "doc_id": doc_id,
                        "title": result.get("title", ""),
                        "agency": result.get("agency", ""),
                        "relevance": "",
                        "notes": "",
                    },
                )
                row[f"{run_name}_rank"] = rank
        rows.extend(
            sorted(
                pool.values(),
                key=lambda row: min(row.get(column, 10**9) for column in rank_columns),
            )
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "query_id",
        "query_text",
        "ministry_name",
        "doc_id",
        "title",
        "agency",
        *rank_columns,
        "relevance",
        "notes",
    ]
    with args.output.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Labeling pool written to {args.output.resolve()} ({len(rows)} rows)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
