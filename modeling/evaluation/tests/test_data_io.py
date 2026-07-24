import tempfile
import unittest
from pathlib import Path

from modeling.evaluation.data_io import EvaluationDataError, load_qrels, load_run


class EvaluationDataIoTest(unittest.TestCase):
    def test_load_run_deduplicates_document_ids(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "run.jsonl"
            path.write_text(
                '{"query_id":"q1","results":[{"doc_id":"a"},{"doc_id":"a"},{"doc_id":"b"}]}\n',
                encoding="utf-8",
            )
            run = load_run(path)
            self.assertEqual([item["doc_id"] for item in run["q1"]], ["a", "b"])

    def test_qrels_requires_a_positive_label(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "qrels.jsonl"
            path.write_text(
                '{"query_id":"q1","query_text":"text","relevance":{"a":0}}\n',
                encoding="utf-8",
            )
            with self.assertRaises(EvaluationDataError):
                load_qrels(path)


if __name__ == "__main__":
    unittest.main()
