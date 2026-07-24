from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from .data_io import EvaluationDataError, read_jsonl


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a clean cosine Chroma index from strategy JSONL.")
    parser.add_argument("--jsonl", type=Path, required=True)
    parser.add_argument("--persist-dir", type=Path, required=True)
    parser.add_argument("--collection", default="strategy_chunks_norm")
    parser.add_argument("--model", default="intfloat/multilingual-e5-base")
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument(
        "--encode-batch-size",
        type=int,
        default=32,
        help="SentenceTransformer inference batch size.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete an existing collection with the same name before rebuilding it.",
    )
    args = parser.parse_args()

    if args.batch_size <= 0 or args.encode_batch_size <= 0:
        parser.error("--batch-size and --encode-batch-size must be positive")

    import chromadb
    from sentence_transformers import SentenceTransformer

    rows = []
    seen_ids: set[str] = set()
    for line_number, item in read_jsonl(args.jsonl):
        text = str(item.get("chunk_text", "")).strip()
        chunk_id = str(item.get("chunk_id", "")).strip()
        doc_id = str(item.get("doc_id", "")).strip()
        if not text or not chunk_id:
            raise EvaluationDataError(
                f"{args.jsonl}:{line_number}: chunk_text and chunk_id are required"
            )
        unique_id = f"{doc_id}_{chunk_id}" if doc_id else chunk_id
        if unique_id in seen_ids:
            raise EvaluationDataError(
                f"{args.jsonl}:{line_number}: duplicate index id {unique_id!r}"
            )
        seen_ids.add(unique_id)
        rows.append(
            {
                "id": unique_id,
                "document": text,
                "metadata": {
                    "doc_id": doc_id,
                    "title": str(item.get("title_raw", ""))[:300],
                    "year": str(item.get("year", "")),
                    "agency_norm": str(item.get("agency_norm", "")),
                    "agency_raw": str(item.get("agency_raw", "")),
                },
            }
        )

    # Load/download the model before creating or resetting the collection. A
    # network/model failure must not leave behind an empty replacement index.
    model = SentenceTransformer(args.model)

    client = chromadb.PersistentClient(path=str(args.persist_dir))
    existing = {collection.name for collection in client.list_collections()}
    if args.collection in existing:
        if not args.reset:
            parser.error(
                f"collection {args.collection!r} already exists; use a new directory or pass --reset"
            )
        client.delete_collection(args.collection)

    collection = client.create_collection(
        name=args.collection,
        metadata={"hnsw:space": "cosine"},
    )

    documents = [item["document"] for item in rows]
    print(f"Encoding {len(documents)} chunks with {args.model}...")
    embeddings = model.encode(
        ["passage: " + document for document in documents],
        batch_size=args.encode_batch_size,
        normalize_embeddings=True,
        show_progress_bar=True,
    ).tolist()

    for start in range(0, len(rows), args.batch_size):
        batch = rows[start : start + args.batch_size]
        batch_embeddings = embeddings[start : start + args.batch_size]
        collection.add(
            ids=[item["id"] for item in batch],
            documents=[item["document"] for item in batch],
            metadatas=[item["metadata"] for item in batch],
            embeddings=batch_embeddings,
        )
        print(f"indexed: {collection.count()}/{len(rows)} chunks")

    manifest = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": str(args.jsonl.resolve()),
        "collection": args.collection,
        "distance": "cosine",
        "embedding_model": args.model,
        "chunks": len(rows),
        "documents": len({item["metadata"]["doc_id"] for item in rows}),
    }
    manifest_path = args.persist_dir / "index_manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
