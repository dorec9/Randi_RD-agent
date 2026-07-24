import unittest

from modeling.evaluation.reranking import rerank_results


class RetrievalRerankingTest(unittest.TestCase):
    def test_directly_matching_title_moves_ahead_of_generic_high_score(self):
        results = [
            {
                "doc_id": "generic",
                "score": 88.0,
                "agency": "해양수산부",
                "title": "해양 정보 시스템 구축",
            },
            {
                "doc_id": "direct",
                "score": 85.0,
                "agency": "해양수산부",
                "title": "해양 기후변화 진단 및 장기전망 연구",
            },
        ]

        reranked = rerank_results(
            results,
            title_scores={"generic": 70.0, "direct": 95.0},
            title_weight=0.35,
            limit=2,
        )

        self.assertEqual([item["doc_id"] for item in reranked], ["direct", "generic"])

    def test_multiple_chunks_from_one_document_count_as_one_result(self):
        results = [
            {"doc_id": "same", "score": 80.0, "title": "same", "document": "old"},
            {"doc_id": "same", "score": 90.0, "title": "same", "document": "best"},
            {"doc_id": "other", "score": 85.0, "title": "other", "document": "other"},
        ]

        reranked = rerank_results(
            results,
            title_scores={"same": 90.0, "other": 85.0},
            title_weight=0.35,
            limit=3,
        )

        self.assertEqual([item["doc_id"] for item in reranked], ["same", "other"])
        self.assertEqual(reranked[0]["document"], "best")

    def test_korean_aliases_and_title_noise_help_the_matching_document(self):
        results = [
            {"doc_id": "generic", "score": 86.0, "title": "가축질병 대응기술 고도화 지원"},
            {
                "doc_id": "direct",
                "score": 86.0,
                "title": "고위험동물감염병대응기술개발(R&D)_2차_적절",
            },
        ]

        reranked = rerank_results(
            results,
            title_scores={"generic": 86.0, "direct": 86.0},
            query_text="구제역이나 조류인플루엔자 같은 가축 감염병 대응 사업",
            title_weight=0.35,
            lexical_weight=0.05,
            limit=2,
        )

        self.assertEqual(reranked[0]["doc_id"], "direct")

    def test_long_notice_keeps_semantic_ranking_without_lexical_override(self):
        results = [
            {"doc_id": "semantic", "score": 90.0, "title": "일반 전략계획"},
            {"doc_id": "lexical", "score": 80.0, "title": "동물감염병 대응"},
        ]

        reranked = rerank_results(
            results,
            title_scores={"semantic": 90.0, "lexical": 80.0},
            query_text=("동물감염병 " * 30),
            title_weight=0.35,
            lexical_weight=0.50,
            lexical_max_query_chars=120,
            limit=2,
        )

        self.assertEqual(reranked[0]["doc_id"], "semantic")


if __name__ == "__main__":
    unittest.main()
