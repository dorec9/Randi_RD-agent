import unittest

from modeling.evaluation.statistics import paired_bootstrap_delta


class PairedBootstrapTest(unittest.TestCase):
    def test_constant_improvement_has_an_exact_positive_interval(self):
        baseline = [{"success@5": 0.0}, {"success@5": 0.0}]
        candidate = [{"success@5": 1.0}, {"success@5": 1.0}]

        result = paired_bootstrap_delta(
            baseline, candidate, samples=200, confidence=0.95, seed=7
        )

        self.assertEqual(result["success@5"]["mean_delta"], 1.0)
        self.assertEqual(result["success@5"]["ci_low"], 1.0)
        self.assertEqual(result["success@5"]["ci_high"], 1.0)
        self.assertEqual(result["success@5"]["probability_improved"], 1.0)


if __name__ == "__main__":
    unittest.main()
