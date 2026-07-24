# RFP 검색 정확도 평가

기존 `scorer.py`는 검색 점수 분포만 확인하며 정답 문서와의 일치 여부를 측정하지 않습니다. 이 디렉터리는 실제 공고/RFP 질의와 사람이 판정한 관련 문서를 기준으로 문서 검색 품질을 재현 가능하게 측정합니다.

## 측정 지표

- `Precision@K`: 상위 K개 중 관련 문서의 비율
- `Recall@K`: 전체 관련 문서 중 상위 K개에서 찾은 비율
- `Success@K`: 관련 문서가 하나라도 상위 K개에 들어온 질의의 비율
- `MRR`: 첫 관련 문서가 얼마나 앞에 나타나는지 측정
- `nDCG@K`: 관련도 2(매우 관련), 1(관련)의 순서까지 반영

평가는 청크가 아닌 `doc_id` 단위로 수행합니다. 동일 문서의 여러 청크가 검색돼도 가장 높은 점수 하나만 남깁니다.

## 1. Drive 데이터로 새 인덱스 구축

Google Drive의 `strategy_chunks_norm.jsonl`을 저장소 밖 또는 `.local-data/`에 둡니다. 기존 인덱스 생성 코드는 기본 L2 거리와 코사인 점수를 혼용할 가능성이 있으므로 평가용 인덱스는 반드시 `cosine`으로 새로 만듭니다.

```powershell
python -m modeling.evaluation.build_index `
  --jsonl .local-data/strategy_chunks_norm.jsonl `
  --persist-dir .local-data/chroma_strategy_eval
```

같은 이름의 컬렉션을 지우고 다시 만들 때만 `--reset`을 명시합니다.

## 2. 평가 질의 작성

`examples/queries.example.jsonl` 형식으로 실제 공고문에서 20~30개 질의를 먼저 만듭니다. 제목만 복사하면 검색이 지나치게 쉬워지므로 사업 목적, 핵심 기술, 적용 분야를 2~5문장으로 요약한 내용을 사용합니다.

```json
{"query_id":"q001","query_text":"공고 내용을 요약한 검색 질의","ministry_name":"해양수산부","notes":"원본 공고 파일명"}
```

## 3. 검색 결과 생성

```powershell
python -m modeling.evaluation.retrieve_chroma `
  --queries modeling/evaluation/data/queries.jsonl `
  --persist-dir .local-data/chroma_strategy_eval `
  --output modeling/evaluation/output/baseline.jsonl `
  --top-k 10
```

제목 의미 기반 재정렬을 적용한 권장 실행은 다음 옵션을 추가합니다.

```powershell
  --candidate-multiplier 10 `
  --title-rerank-weight 0.35 `
  --lexical-rerank-weight 0.05 `
  --lexical-max-query-chars 120
```

검색 후보를 본문 청크 점수로 먼저 모은 뒤 문서 제목의 E5 의미 유사도를 결합합니다. 120자 이하의 짧은 검색 요청에는 관리 문자열을 제거하고 AI/인공지능, SW/소프트웨어 같은 표기를 통일한 제목 어휘 점수를 5% 반영합니다. 긴 공고문에는 어휘 점수를 자동으로 적용하지 않습니다. 같은 문서의 여러 청크는 최고 점수 하나만 유지합니다. `--ministry-boost`는 두 트랙을 합쳐 표시하는 별도 실험에서만 선택적으로 사용합니다.

서버형 Chroma를 평가할 때는 `--persist-dir` 대신 `--host 127.0.0.1 --port 8002`를 사용합니다.

## 4. 관련도 라벨 작성

여러 검색 실행의 상위 결과를 합쳐 라벨링 CSV를 만듭니다.

```powershell
python -m modeling.evaluation.make_pool `
  --queries modeling/evaluation/data/queries.jsonl `
  --run baseline=modeling/evaluation/output/baseline.jsonl `
  --output modeling/evaluation/data/judgments.csv
```

CSV의 `relevance` 열을 다음 기준으로 채웁니다.

- `2`: 질의와 직접 관련되어 선행 RFP로 바로 참고할 수 있음
- `1`: 일부 기술·정책·적용 분야가 관련됨
- `0`: 관련 없음

제목만 보지 말고 본문을 확인해야 합니다. 최소 1개 이상의 관련 문서가 있는 질의만 평가에 포함합니다.

```powershell
python -m modeling.evaluation.labels_to_qrels `
  --labels modeling/evaluation/data/judgments.csv `
  --output modeling/evaluation/data/qrels.jsonl
```

## 5. 개선 전후 비교

```powershell
python -m modeling.evaluation.evaluate `
  --qrels modeling/evaluation/data/qrels.jsonl `
  --run baseline=modeling/evaluation/output/baseline.jsonl `
  --run improved=modeling/evaluation/output/improved.jsonl `
  --binary-threshold 2 `
  --k 5 --k 10 `
  --bootstrap-samples 10000 `
  --output-dir modeling/evaluation/output/report
```

결과는 `summary.json`, `summary.md`, `per_query.csv`로 저장됩니다. 첫 번째 `--run`이 기준선이며 이후 실행의 지표 변화량과 질의별 paired bootstrap 95% 신뢰구간도 함께 계산합니다.

정답 문서가 하나인 known-item 평가에서는 `Precision@5`보다 `Success@5`를 핵심 지표로 사용합니다. 개선 폭의 95% 신뢰구간 하한이 0보다 클 때 통계적으로 확인된 개선으로 판정합니다.

`--binary-threshold 2`는 직접 관련 문서만 Precision, Recall, MRR의 정답으로 인정하는 엄격한 평가입니다. `nDCG`는 항상 0/1/2 전체 등급과 검색 순서를 함께 반영합니다.

## 빠른 동작 확인

아래 예시는 지표 파이프라인의 형식 확인용이며 실제 성능 수치가 아닙니다.

```powershell
python -m modeling.evaluation.evaluate `
  --qrels modeling/evaluation/examples/qrels.example.jsonl `
  --run baseline=modeling/evaluation/examples/baseline.example.jsonl `
  --run improved=modeling/evaluation/examples/improved.example.jsonl `
  --k 2 `
  --output-dir modeling/evaluation/output/smoke

python -m unittest discover modeling/evaluation/tests
```
