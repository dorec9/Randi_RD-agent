import os
import re
import sys
from typing import Any, Dict, List

import chromadb
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()

# Allow importing `modeling/agency_utils.py` from `modeling/utils`.
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

try:
    from agency_utils import get_ministry_variants
except ImportError:

    def get_ministry_variants(name: str) -> List[str]:
        return [name] if name else []

try:
    from evaluation.reranking import rerank_results
except ImportError:
    from modeling.evaluation.reranking import rerank_results


# =========================================================
# ChromaDB (Strategy / RFP search)
# =========================================================
CHROMA_HOST = os.getenv("STRATEGY_CHROMA_HOST", os.getenv("CHROMA_HOST", "127.0.0.1"))
# RFP search(전략) 기본 포트: 8002
CHROMA_PORT = int(os.getenv("STRATEGY_CHROMA_PORT", os.getenv("CHROMA_PORT", "8002")))
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "strategy_chunks_norm")
EMBED_MODEL_NAME = os.getenv("CHROMA_EMBED_MODEL_NAME", "intfloat/multilingual-e5-base")
CHROMA_DIR_HINT = os.getenv("CHROMA_DB_DIR", r"C:\chroma_strategy")
TITLE_RERANK_WEIGHT = float(os.getenv("TITLE_RERANK_WEIGHT", "0.35"))
LEXICAL_RERANK_WEIGHT = float(os.getenv("LEXICAL_RERANK_WEIGHT", "0.05"))
LEXICAL_MAX_QUERY_CHARS = int(os.getenv("LEXICAL_MAX_QUERY_CHARS", "120"))
RERANK_CANDIDATE_MULTIPLIER = int(os.getenv("RERANK_CANDIDATE_MULTIPLIER", "10"))


def search_two_tracks(
    notice_text: str,
    ministry_name: str,
    top_k_a: int = 5,
    top_k_b: int = 5,
    exclude_same_ministry_in_b: bool = True,
    score_threshold: float = 0.0,
) -> Dict[str, List[Dict[str, Any]]]:
    print(f"[*] ChromaDB server: {CHROMA_HOST}:{CHROMA_PORT} (collection={COLLECTION_NAME})")

    try:
        client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
        collection = client.get_collection(name=COLLECTION_NAME)
    except Exception as e:
        print(f"[Error] ChromaDB connect failed: {e}")
        print(f"[Hint] Run: chroma run --host {CHROMA_HOST} --port {CHROMA_PORT} --path {CHROMA_DIR_HINT}")
        return {"track_a": [], "track_b": []}

    print(f"[*] Embed model: {EMBED_MODEL_NAME}")
    model = SentenceTransformer(EMBED_MODEL_NAME)

    query_text = "query: " + (notice_text or "")[:2000]
    # The corpus is indexed with normalized E5 passage vectors. Normalize query
    # vectors as well so cosine-distance scores remain comparable across queries.
    query_embedding = model.encode([query_text], normalize_embeddings=True).tolist()

    target_variants = get_ministry_variants(ministry_name)
    track_a: List[Dict[str, Any]] = []
    track_b: List[Dict[str, Any]] = []

    # --- Track A (same ministry) ---
    if target_variants:
        where_a = {"agency_norm": {"$in": target_variants}}
        try:
            results_a = collection.query(
                query_embeddings=query_embedding,
                n_results=max(top_k_a, top_k_a * RERANK_CANDIDATE_MULTIPLIER),
                where=where_a,
                include=["metadatas", "documents", "distances"],
            )
            track_a = _pack_results(results_a, score_threshold)
            track_a = _rerank_by_title(
                track_a,
                query_embedding[0],
                model,
                query_text=notice_text,
                limit=top_k_a,
            )
        except Exception as e:
            print(f"[Track A Error] {e}")

    # --- Track B (other ministries) ---
    where_b = None
    if exclude_same_ministry_in_b and target_variants:
        where_b = {"agency_norm": {"$nin": target_variants}}

    try:
        results_b = collection.query(
            query_embeddings=query_embedding,
            n_results=max(top_k_b, top_k_b * RERANK_CANDIDATE_MULTIPLIER),
            where=where_b,
            include=["metadatas", "documents", "distances"],
        )
        track_b = _pack_results(results_b, score_threshold)
        track_b = _rerank_by_title(
            track_b,
            query_embedding[0],
            model,
            query_text=notice_text,
            limit=top_k_b,
        )
    except Exception as e:
        print(f"[Track B Error] {e}")

    return {"track_a": track_a, "track_b": track_b}


def _pack_results(raw: dict, threshold: float = 0.0) -> List[Dict[str, Any]]:
    packed: List[Dict[str, Any]] = []
    if not raw or not raw.get("ids"):
        return []

    count = len(raw["ids"][0])
    pattern = re.compile(r"\[paragraph#\d+\]\s*")

    for i in range(count):
        dist = raw["distances"][0][i]
        similarity_score = (1 - dist) * 100

        if similarity_score < threshold:
            continue

        raw_text = raw["documents"][0][i]
        clean_text = pattern.sub("", raw_text)

        metadata = raw["metadatas"][0][i] or {}
        packed.append(
            {
                "id": raw["ids"][0][i],
                "doc_id": str(metadata.get("doc_id") or raw["ids"][0][i]),
                "title": metadata.get("title", ""),
                "agency": metadata.get("agency_norm", ""),
                "metadata": metadata,
                "document": clean_text.strip(),
                "distance": dist,
                "score": round(similarity_score, 1),
            }
        )

    return packed


def _rerank_by_title(
    results: List[Dict[str, Any]],
    query_embedding: List[float],
    model: SentenceTransformer,
    query_text: str,
    limit: int,
) -> List[Dict[str, Any]]:
    if not results or limit <= 0:
        return []
    if TITLE_RERANK_WEIGHT <= 0:
        return results[:limit]

    titles = [item.get("title") or item["document"][:300] for item in results]
    title_embeddings = model.encode(
        ["passage: " + title for title in titles],
        normalize_embeddings=True,
    )
    similarities = title_embeddings @ query_embedding
    title_scores = {
        item["doc_id"]: float(similarity) * 100
        for item, similarity in zip(results, similarities)
    }
    return rerank_results(
        results,
        title_scores,
        query_text=query_text,
        title_weight=TITLE_RERANK_WEIGHT,
        lexical_weight=LEXICAL_RERANK_WEIGHT,
        lexical_max_query_chars=LEXICAL_MAX_QUERY_CHARS,
        limit=limit,
    )

