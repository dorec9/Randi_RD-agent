import unittest

from modeling.evaluation.metrics import (
    evaluate_query,
    hit_rate_at_k,
    macro_average,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)


class RetrievalMetricsTest(unittest.TestCase):
    def setUp(self):
        self.relevance = {"a": 2, "b": 1, "ignored": 0}

    def test_binary_metrics(self):
        ranking = ["x", "a", "b"]
        self.assertAlmostEqual(precision_at_k(self.relevance, ranking, 2), 0.5)
        self.assertAlmostEqual(recall_at_k(self.relevance, ranking, 2), 0.5)
        self.assertAlmostEqual(reciprocal_rank(self.relevance, ranking), 0.5)

    def test_hit_rate_reports_whether_top_k_contains_a_relevant_document(self):
        self.assertEqual(hit_rate_at_k(self.relevance, ["x", "a"], 2), 1.0)
        self.assertEqual(hit_rate_at_k(self.relevance, ["x", "a"], 1), 0.0)

    def test_ndcg_is_one_for_ideal_graded_ranking(self):
        self.assertAlmostEqual(ndcg_at_k(self.relevance, ["a", "b"], 2), 1.0)
        self.assertLess(ndcg_at_k(self.relevance, ["b", "a"], 2), 1.0)

    def test_duplicate_results_count_once(self):
        self.assertAlmostEqual(recall_at_k(self.relevance, ["a", "a", "b"], 2), 1.0)

    def test_evaluate_and_macro_average(self):
        first = evaluate_query(self.relevance, ["a", "b"], [1, 2])
        second = evaluate_query(self.relevance, [], [1, 2])
        average = macro_average([first, second])
        self.assertAlmostEqual(average["mrr"], 0.5)
        self.assertAlmostEqual(average["recall@2"], 0.5)

    def test_invalid_k(self):
        with self.assertRaises(ValueError):
            precision_at_k(self.relevance, ["a"], 0)

    def test_strict_binary_threshold(self):
        ranking = ["b", "a"]
        self.assertAlmostEqual(
            precision_at_k(self.relevance, ranking, 2, binary_threshold=2), 0.5
        )
        self.assertAlmostEqual(
            reciprocal_rank(self.relevance, ranking, binary_threshold=2), 0.5
        )


if __name__ == "__main__":
    unittest.main()
