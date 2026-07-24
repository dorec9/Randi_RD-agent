from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

from .data_io import load_queries, write_jsonl
from .reranking import rerank_results


def _query_collection(
    collection: Any,
    query_embedding: list[float],
    n_results: int,
    where: dict | None,
) -> dict:
    kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": n_results,
        "include": ["metadatas", "documents", "distances"],
    }
    if where:
        kwargs["where"] = where
    return collection.query(**kwargs)


def _pack(raw: dict, track: str, threshold: float) -> list[dict]:
    if not raw or not raw.get("ids") or not raw["ids"][0]:
        return []
    packed = []
    for chunk_id, metadata, document, distance in zip(
        raw["ids"][0],
        raw["metadatas"][0],
        raw["documents"][0],
        raw["distances"][0],
    ):
        score = (1 - float(distance)) * 100
        if score < threshold:
            continue
        metadata = metadata or {}
        packed.append(
            {
                "doc_id": str(metadata.get("doc_id") or chunk_id),
                "chunk_id": str(chunk_id),
                "score": round(score, 4),
                "distance": float(distance),
                "track": track,
                "title": metadata.get("title", ""),
                "agency": metadata.get("agency_norm", ""),
                "document": document or "",
            }
        )
    return packed


def _deduplicate(results: list[dict], limit: int) -> list[dict]:
    best: dict[str, dict] = {}
    for result in results:
        current = best.get(result["doc_id"])
        if current is None or result["score"] > current["score"]:
            best[result["doc_id"]] = result
    return sorted(best.values(), key=lambda item: item["score"], reverse=True)[:limit]


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a document-level Chroma retrieval run.")
    parser.add_argument("--queries", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    connection = parser.add_mutually_exclusive_group(required=True)
    connection.add_argument("--persist-dir", type=Path)
    connection.add_argument("--host", default=os.getenv("CHROMA_HOST"))
    parser.add_argument("--port", type=int, default=int(os.getenv("CHROMA_PORT", "8002")))
    parser.add_argument(
        "--collection", default=os.getenv("CHROMA_COLLECTION", "strategy_chunks_norm")
    )
    parser.add_argument(
        "--model",
        default=os.getenv("CHROMA_EMBED_MODEL_NAME", "intfloat/multilingual-e5-base"),
    )
    parser.add_argument("--top-k", type=int, default=10)
    parser.add_argument("--candidate-multiplier", type=int, default=10)
    parser.add_argument("--score-threshold", type=float, default=0.0)
    parser.add_argument(
        "--title-rerank-weight",
        type=float,
        default=0.0,
        help="Weight (0..1) of E5 title relevance in the final score.",
    )
    parser.add_argument(
        "--ministry-boost",
        type=float,
        default=0.0,
        help="Additive score boost for documents from the query ministry.",
    )
    parser.add_argument(
        "--lexical-rerank-weight",
        type=float,
        default=0.05,
        help="Weight (0..1) of normalized title bigram relevance.",
    )
    parser.add_argument(
        "--lexical-max-query-chars",
        type=int,
        default=120,
        help="Disable lexical reranking for longer notice-style queries.",
    )
    args = parser.parse_args()

    if args.top_k <= 0 or args.candidate_multiplier <= 0:
        parser.error("--top-k and --candidate-multiplier must be positive")
    if not 0 <= args.title_rerank_weight <= 1:
        parser.error("--title-rerank-weight must be between 0 and 1")
    if not 0 <= args.lexical_rerank_weight <= 1:
        parser.error("--lexical-rerank-weight must be between 0 and 1")
    if args.lexical_max_query_chars <= 0:
        parser.error("--lexical-max-query-chars must be positive")

    import chromadb
    from sentence_transformers import SentenceTransformer

    try:
        from modeling.agency_utils import get_ministry_variants
    except ImportError:
        from agency_utils import get_ministry_variants

    client = (
        chromadb.PersistentClient(path=str(args.persist_dir))
        if args.persist_dir
        else chromadb.HttpClient(host=args.host, port=args.port)
    )
    collection = client.get_collection(args.collection)
    distance_space = (collection.metadata or {}).get("hnsw:space")
    if distance_space != "cosine":
        raise RuntimeError(
            f"Collection {args.collection!r} is not a verified cosine index "
            f"(hnsw:space={distance_space!r}). Rebuild it with build_index.py."
        )
    model = SentenceTransformer(args.model)
    queries = load_queries(args.queries)
    candidate_count = args.top_k * args.candidate_multiplier

    rows = []
    for index, query in enumerate(queries.values(), start=1):
        embedding = model.encode(
            ["query: " + query.query_text[:2000]], normalize_embeddings=True
        )[0].tolist()
        variants = get_ministry_variants(query.ministry_name)
        results = []

        if variants:
            raw_a = _query_collection(
                collection,
                embedding,
                candidate_count,
                {"agency_norm": {"$in": variants}},
            )
            results.extend(_pack(raw_a, "same_ministry", args.score_threshold))

        where_b = {"agency_norm": {"$nin": variants}} if variants else None
        raw_b = _query_collection(collection, embedding, candidate_count, where_b)
        results.extend(_pack(raw_b, "other_ministry", args.score_threshold))

        candidates = _deduplicate(results, candidate_count * 2)
        if args.title_rerank_weight > 0:
            title_embeddings = model.encode(
                ["passage: " + (item.get("title") or item["document"][:300]) for item in candidates],
                normalize_embeddings=True,
            )
            title_similarities = title_embeddings @ embedding
            title_scores = {
                item["doc_id"]: float(similarity) * 100
                for item, similarity in zip(candidates, title_similarities)
            }
            ranked = rerank_results(
                candidates,
                title_scores,
                query_text=query.query_text,
                target_ministries=variants,
                title_weight=args.title_rerank_weight,
                lexical_weight=args.lexical_rerank_weight,
                lexical_max_query_chars=args.lexical_max_query_chars,
                ministry_boost=args.ministry_boost,
                limit=args.top_k,
            )
        else:
            ranked = candidates[: args.top_k]
        rows.append(
            {
                "query_id": query.query_id,
                "results": ranked,
                "config": {
                    "title_rerank_weight": args.title_rerank_weight,
                    "lexical_rerank_weight": args.lexical_rerank_weight,
                    "lexical_max_query_chars": args.lexical_max_query_chars,
                    "candidate_multiplier": args.candidate_multiplier,
                    "ministry_boost": args.ministry_boost,
                },
            }
        )
        print(f"[{index}/{len(queries)}] {query.query_id}: {len(ranked)} documents")

    write_jsonl(args.output, rows)
    print(f"Run written to {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
