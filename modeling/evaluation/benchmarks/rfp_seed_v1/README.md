# RFP Seed Benchmark v1

Google Drive에 보관된 실제 2026년 RFP/공고 4건을 검색 질의로 요약하고, 각 질의의 상위 10개 검색 문서를 본문 기준으로 판정한 소규모 회귀 테스트 세트입니다.

## 라벨 기준

- `2`: 핵심 기술, 적용 분야, 사업 산출물이 직접 겹쳐 선행 RFP로 바로 참고할 수 있음
- `1`: 기술, 정책 또는 적용 분야 일부가 겹쳐 보조 자료로 참고할 수 있음
- `0`: 표면적인 단어만 겹치거나 사업 목적이 다름

엄격한 평가는 `--binary-threshold 2`를 사용합니다. Precision, Recall, MRR은 2점 문서만 정답으로 계산하고 nDCG는 0/1/2 전체 등급을 반영합니다.

## 재실행

```powershell
python -m modeling.evaluation.retrieve_chroma `
  --queries modeling/evaluation/benchmarks/rfp_seed_v1/queries.jsonl `
  --persist-dir .local-data/chroma_strategy_eval `
  --output modeling/evaluation/output/rfp_seed_v1/run.jsonl `
  --top-k 10 `
  --title-rerank-weight 0.35

python -m modeling.evaluation.evaluate `
  --qrels modeling/evaluation/benchmarks/rfp_seed_v1/qrels.jsonl `
  --run baseline=modeling/evaluation/output/rfp_seed_v1/run.jsonl `
  --binary-threshold 2 `
  --k 5 --k 10 `
  --output-dir modeling/evaluation/output/rfp_seed_v1/report
```

질의가 4개뿐이므로 이 결과는 초기 기준선 및 회귀 테스트용입니다. 포트폴리오의 대표 성능으로 사용하려면 서로 다른 부처·기술 분야의 질의를 최소 20개 이상으로 확장해야 합니다.

현재 기준선 수치는 [`baseline_metrics.md`](baseline_metrics.md)에, 제목 재정렬 개선 결과는 [`improved_metrics.md`](improved_metrics.md)에 고정되어 있습니다.
