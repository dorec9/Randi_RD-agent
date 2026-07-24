import tempfile
import unittest
from pathlib import Path

from modeling.evaluation.evaluate import evaluate_runs


class EvaluateRunsTest(unittest.TestCase):
    def test_comparison_includes_paired_confidence_interval(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            qrels = root / "qrels.jsonl"
            baseline = root / "baseline.jsonl"
            improved = root / "improved.jsonl"
            qrels.write_text(
                '{"query_id":"q1","query_text":"find a","relevance":{"a":2}}\n'
                '{"query_id":"q2","query_text":"find b","relevance":{"b":2}}\n',
                encoding="utf-8",
            )
            baseline.write_text(
                '{"query_id":"q1","results":[{"doc_id":"x"}]}\n'
                '{"query_id":"q2","results":[{"doc_id":"x"}]}\n',
                encoding="utf-8",
            )
            improved.write_text(
                '{"query_id":"q1","results":[{"doc_id":"a"}]}\n'
                '{"query_id":"q2","results":[{"doc_id":"b"}]}\n',
                encoding="utf-8",
            )

            summary, _ = evaluate_runs(
                qrels,
                [("baseline", baseline), ("improved", improved)],
                [5],
                binary_threshold=2,
                bootstrap_samples=200,
                bootstrap_seed=7,
            )

        confidence = summary["statistical_confidence"]["improved"]["success@5"]
        self.assertEqual(confidence["ci_low"], 1.0)
        self.assertEqual(confidence["ci_high"], 1.0)


if __name__ == "__main__":
    unittest.main()
