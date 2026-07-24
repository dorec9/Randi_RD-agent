from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

from .data_io import EvaluationDataError, load_qrels, load_run
from .metrics import evaluate_query, macro_average
from .statistics import paired_bootstrap_delta


def _parse_run(value: str) -> tuple[str, Path]:
    if "=" not in value:
        raise argparse.ArgumentTypeError("run must use NAME=PATH format")
    name, path = value.split("=", 1)
    if not name.strip() or not path.strip():
        raise argparse.ArgumentTypeError("run must use NAME=PATH format")
    return name.strip(), Path(path)


def evaluate_runs(
    qrels_path: Path,
    run_specs: list[tuple[str, Path]],
    ks: list[int],
    binary_threshold: float = 1.0,
    bootstrap_samples: int = 0,
    bootstrap_seed: int = 42,
) -> tuple[dict, list[dict]]:
    queries, qrels = load_qrels(qrels_path)
    summaries: dict[str, dict[str, float]] = {}
    per_query_rows: list[dict] = []
    metrics_by_run: dict[str, list[dict[str, float]]] = {}

    for run_name, run_path in run_specs:
        run = load_run(run_path)
        unknown = sorted(set(run).difference(queries))
        if unknown:
            raise EvaluationDataError(
                f"{run_path}: unknown query_id values: {', '.join(unknown[:5])}"
            )

        query_metrics = []
        for query_id, query in queries.items():
            results = run.get(query_id, [])
            ranking = [result["doc_id"] for result in results]
            metrics = evaluate_query(
                qrels[query_id], ranking, ks, binary_threshold=binary_threshold
            )
            query_metrics.append(metrics)
            per_query_rows.append(
                {
                    "run": run_name,
                    "query_id": query_id,
                    "query_text": query.query_text,
                    "returned": len(ranking),
                    "relevant": sum(
                        grade >= binary_threshold for grade in qrels[query_id].values()
                    ),
                    **metrics,
                }
            )
        summaries[run_name] = macro_average(query_metrics)
        metrics_by_run[run_name] = query_metrics

    baseline_name = run_specs[0][0]
    baseline = summaries[baseline_name]
    deltas = {
        run_name: {
            metric: value - baseline[metric]
            for metric, value in metrics.items()
        }
        for run_name, metrics in summaries.items()
        if run_name != baseline_name
    }
    summary = {
        "query_count": len(queries),
        "ks": sorted(set(ks)),
        "binary_threshold": binary_threshold,
        "baseline": baseline_name,
        "runs": summaries,
        "delta_vs_baseline": deltas,
    }
    if bootstrap_samples:
        summary["bootstrap"] = {
            "samples": bootstrap_samples,
            "confidence": 0.95,
            "seed": bootstrap_seed,
            "method": "paired percentile bootstrap",
        }
        summary["statistical_confidence"] = {
            run_name: paired_bootstrap_delta(
                metrics_by_run[baseline_name],
                metrics_by_run[run_name],
                samples=bootstrap_samples,
                confidence=0.95,
                seed=bootstrap_seed,
            )
            for run_name in summaries
            if run_name != baseline_name
        }
    return summary, per_query_rows


def _write_outputs(output_dir: Path, summary: dict, per_query_rows: list[dict]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    metric_names = list(next(iter(summary["runs"].values())).keys())
    headers = list(per_query_rows[0].keys())
    with (output_dir / "per_query.csv").open(
        "w", encoding="utf-8-sig", newline=""
    ) as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        writer.writerows(per_query_rows)

    baseline = summary["baseline"]
    lines = [
        "# 검색 정확도 평가 결과",
        "",
        f"- 평가 질의: {summary['query_count']}개",
        f"- 기준 실행: `{baseline}`",
        f"- 이진 관련도 기준: `{summary['binary_threshold']}`점 이상",
        "",
        "| 실행 | " + " | ".join(metric_names) + " |",
        "|---|" + "---:|" * len(metric_names),
    ]
    for run_name, metrics in summary["runs"].items():
        lines.append(
            f"| {run_name} | "
            + " | ".join(f"{metrics[name]:.4f}" for name in metric_names)
            + " |"
        )

    if summary["delta_vs_baseline"]:
        lines.extend(["", f"## `{baseline}` 대비 변화", ""])
        for run_name, metrics in summary["delta_vs_baseline"].items():
            changes = ", ".join(f"{name} {value:+.4f}" for name, value in metrics.items())
            lines.append(f"- `{run_name}`: {changes}")

    (output_dir / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate one or more document retrieval runs.")
    parser.add_argument("--qrels", type=Path, required=True)
    parser.add_argument(
        "--run",
        type=_parse_run,
        action="append",
        required=True,
        metavar="NAME=PATH",
        help="Ranking JSONL. Repeat to compare runs; the first run is the baseline.",
    )
    parser.add_argument("--k", type=int, action="append", dest="ks", default=[])
    parser.add_argument(
        "--binary-threshold",
        type=float,
        default=1.0,
        help="Minimum relevance grade counted by Precision, Recall, and MRR. nDCG always uses graded labels.",
    )
    parser.add_argument("--output-dir", type=Path, default=Path("modeling/evaluation/output"))
    parser.add_argument("--bootstrap-samples", type=int, default=10_000)
    parser.add_argument("--bootstrap-seed", type=int, default=42)
    args = parser.parse_args()

    ks = args.ks or [5]
    summary, per_query_rows = evaluate_runs(
        args.qrels,
        args.run,
        ks,
        binary_threshold=args.binary_threshold,
        bootstrap_samples=args.bootstrap_samples,
        bootstrap_seed=args.bootstrap_seed,
    )
    _write_outputs(args.output_dir, summary, per_query_rows)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"Results written to {args.output_dir.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
