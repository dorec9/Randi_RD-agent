# R&D Agent · 유사 과제 검색과 공고 분석

R&D 공고를 분석해 유사한 제안요청서(RFP)를 찾고 발표자료와 예상 질문을 준비하는 팀 프로젝트입니다. 담당 범위는 유사 RFP 검색, 발표 대본·질의응답 모델링, 배포 구성입니다.

## 검색 개선 결과

후보 문서를 넓게 가져온 뒤 본문과 제목 점수로 순서를 다시 매기고, 같은 문서에서 나온 조각은 하나로 합쳤습니다. 2026년 7월 24일 평가에서 정답 문서가 상위 5개 안에 들어간 질의는 **30개 중 23개에서 30개**로 늘었습니다. 정답이 얼마나 앞에 나타나는지 보는 평균 역순위(MRR)는 **0.6664에서 0.8733**으로 올랐습니다.

실제 문서 30개·16개 기관으로 구성한 고정 홀드아웃의 결과입니다. 정답은 한 사람이 매겼으며 새로운 질의 전체에 대한 성공률은 별도로 검증해야 합니다. [평가 방식과 결과](modeling/evaluation/benchmarks/rfp_holdout_v2/results.md) · [재현 절차](modeling/evaluation/README.md)

## 1) 프로젝트 개요
- 프로젝트명: R&D Agent
- 목적: R&D 공고 분석, 유사 RFP 탐색, 발표자료(PPT) 생성, 발표 스크립트/Q&A 생성 자동화
- 형태: Spring Boot + React + FastAPI + ChromaDB 기반 멀티 서비스
- 담당 역할(명시): 모델링 파트(2, 4) 및 배포 구성
- 검색 품질 측정과 개선: [`modeling/evaluation/`](modeling/evaluation/) — 아래 5-5 참고

## 2) 저장소 구조
```text
Randi_RD-agent/
  backend/                 # Spring Boot API 서버
  frontend/frontend/       # React + Vite 클라이언트
  modeling/                # FastAPI + AI 파이프라인
  scripts/                 # 운영/문서 보조 스크립트
  tools/                   # QnA PDF 생성 도구
```

## 3) 아키텍처 요약
```text
[Browser]
   |
   | (/api/*)
   v
[Nginx]
   |-- /api/analyze/step3  -> FastAPI:8000
   |-- /api/analyze/step4  -> FastAPI:8000
   |-- /download/pptx/*    -> FastAPI:8000
   |-- /api/*              -> Spring:8080
   |
   +-- static files        -> frontend dist

[Spring Boot]
   |- 인증/권한/JWT
   |- 공고 수집/조회
   |- FastAPI 연동(step1~4 일부)
   |- MySQL/Redis 연동

[FastAPI]
   |- 문서 파싱(/parse)
   |- step1~4 분석/생성 API
   |- ChromaDB(법령/전략) 조회
```

## 4) 핵심 기능 (코드 확인 기준)
### 4-1. 인증/권한
- 로그인: `POST /api/login`
- 로그아웃: `POST /api/logout` (Redis 블랙리스트 처리)
- 회원가입/이메일 인증:
  - `POST /api/auth/company-signup`
  - `POST /api/auth/email/check`
  - `POST /api/auth/email/send`
  - `POST /api/auth/email/verify`
- 내 정보 조회: `GET /api/users/me`
- 보안 방식:
  - JWT 기반 stateless 인증 (`JwtAuthenticationFilter`)
  - ROLE 기반 접근 제어(`ADMIN`, `MEMBER`)

### 4-2. 공고 데이터 수집/조회
- 공고 수집: `POST /api/notices/collect`
  - 기업마당 RSS(XML) 파싱 후 DB 적재
  - 공고 파일/해시태그 동시 저장
- 공고 목록/상세:
  - `GET /api/notices`
  - `GET /api/notices/{id}`
- 공고 첨부파일 다운로드:
  - `GET /api/notices/{noticeId}/files/{fileId}/download`

### 4-3. AI 4단계 파이프라인
- Step1 공고 분석:
  - Spring: `POST /api/notices/{noticeId}/analyze`
  - FastAPI: `POST /api/analyze/step1`
  - 결과: 체크리스트/분석 JSON 생성 및 저장
- Step2 유사 RFP 탐색:
  - Spring: `POST /api/notices/{noticeId}/search-rfp`
  - 내부 흐름: 파일 파싱(`/parse`) -> 텍스트 구성 -> 벡터 검색 -> 보고서 생성
- Step3 발표자료(PPT) 생성:
  - FastAPI: `POST /api/analyze/step3`
  - LangGraph 노드 기반 파이프라인(텍스트 추출/섹션 분리/슬라이드 생성/병합/렌더)
  - 다운로드: `GET /download/pptx/{filename}`
- Step4 발표 스크립트/Q&A 생성:
  - FastAPI: `POST /api/analyze/step4`
  - PPT 텍스트 추출 후 Gemini로 `slides`, `qna` JSON 생성

### 4-4. 결과 리포트 출력
- 프론트 결과 페이지에서 PDF 다운로드 제공:
  - 공고 분석 결과 PDF
  - 유사 RFP 분석 결과 PDF
  - 스크립트/Q&A 결과 PDF

### 4-5. 마이페이지/감사로그
- 마이페이지 API:
  - `GET /api/mypage/projects`
  - `GET /api/mypage/my-audit-logs`
  - `GET /api/mypage/audit-logs` (관리자)
- 주요 사용자 액션(LOGIN, ANALYZE_STEP1, SEARCH_STEP2, PPT_STEP3, SCRIPT_STEP4 등) 기록

## 5) 모델링 모듈 상세
### 5-1. `features/rfp_analysis_checklist`
- 공고 자격요건 판정(적합/부적합/확인필요) 로직
- 법령 ChromaDB + 기업 DB 정보 결합 분석

### 5-2. `features/rnd_search`
- `search_two_tracks` 기반 유사 RFP 탐색
- Track A/B 결과를 LLM으로 요약 리포트 생성

### 5-3. `features/ppt_maker`
- LangGraph 워크플로우 기반 PPT 생성
- Gemini + Gamma 렌더링 노드 포함
- 템플릿 렌더링 모드 지원

### 5-4. `features/ppt_script`
- PPT에서 슬라이드별 텍스트 추출
- 발표 대본 + 예상 Q&A JSON 생성

### 5-5. `evaluation` — 검색 품질 측정과 개선

유사 RFP 검색이 실제로 관련 문서를 상위에 올리는지 확인할 방법이 없어, 평가셋부터 만들고 개선했습니다.

- 평가셋: 질의 30개와 정답 문서를 라벨링한 홀드아웃 (`benchmarks/rfp_holdout_v2/`)
- 코퍼스: 문서 1,620개 / 청크 2,204개, 기관 16곳, 임베딩 `intfloat/multilingual-e5-base`, 거리 cosine
- 평가 단위: 청크가 아닌 `doc_id`. 같은 문서의 여러 청크는 최고 점수 하나만 남깁니다.

| 지표 | 기존 | 개선 | 변화 |
|---|---:|---:|---:|
| Success@1 | 56.7% | 76.7% | +20.0%p |
| Success@5 | 76.7% | **100.0%** | +23.3%p |
| MRR | 0.6664 | **0.8733** | +0.2069 |
| nDCG@5 | 0.6862 | **0.9057** | +0.2196 |

개선 방식은 후보를 10배로 넓게 검색한 뒤 본문 점수와 제목 의미 점수를 결합하고, 같은 문서의 청크를 병합하는
재정렬입니다. 120자 이하의 짧은 질의에는 관리 문자열과 표기 차이를 정규화한 제목 어휘 점수를 5% 더합니다.

개선 폭이 우연인지 확인하기 위해 30개 질의의 기존·개선 결과를 짝지어 10,000회 percentile bootstrap으로
재표본화했습니다. Success@5는 95% 신뢰구간 `+10.0%p ~ +40.0%p`, MRR은 `+0.0686 ~ +0.3469`로
세 핵심 지표 모두 하한이 0보다 컸습니다.

**한계.** 위 100%는 이 고정 평가셋 30건에서의 수치이고 모든 사용자 질의에 대한 보장이 아닙니다.
정답 라벨을 단독으로 매겨 두 번째 판정자의 교차 검토가 빠져 있습니다.

실행 방법과 데이터 준비 절차는 [`modeling/evaluation/README.md`](modeling/evaluation/README.md),
원자료는 [`benchmarks/rfp_holdout_v2/results.md`](modeling/evaluation/benchmarks/rfp_holdout_v2/results.md)에 있습니다.

## 6) 기술 스택
- Backend: Java 17, Spring Boot 3.5, Spring Security, JPA, WebFlux, MySQL, Redis
- Frontend: React 19, TypeScript, Vite, styled-components, axios, jsPDF
- Modeling: Python 3.11, FastAPI, Uvicorn, ChromaDB, sentence-transformers, torch
- Infra/Deploy: Docker Compose, Nginx, MySQL, Redis, ChromaDB
- External API: Google Gemini, Gamma API, 기업마당 RSS API

## 7) 실행 방법 (로컬 기준)
### 7-1. Backend
```bash
cd backend
./gradlew bootRun
```

### 7-2. Frontend
```bash
cd frontend/frontend
npm install
npm run dev
```

### 7-3. Modeling
```bash
cd modeling
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 8) 배포 구성 (코드 기준)
- `backend/deploy/docker-compose.yml` 기준 서비스:
  - `nginx`, `spring`, `fastapi`, `mysql`, `redis`, `chroma_law`, `chroma_strategy`
- Nginx 라우팅:
  - `/api/analyze/step3`, `/api/analyze/step4`, `/download/pptx/*` -> FastAPI
  - `/api/*` -> Spring Boot

## 9) 환경변수 (예시 파일 기준)
- Spring(`spring.env.example`): `DB_*`, `REDIS_*`, `FASTAPI_BASE_URL`, `JWT_*`, `MAIL_*`, `BIZINFO_*`
- FastAPI(`fastapi.env.example`): `GEMINI_API_KEY`, `GAMMA_API_KEY`, `DB_*`, `LAW_CHROMA_*`, `STRATEGY_CHROMA_*`
- DB/Cache: `mysql.env.example`, `redis.env.example`

## 10) 보안/공개 원칙
- 민감 정보(실제 키, 비밀번호, 인증서)는 저장소에 포함하지 않음
- `.env`, 로컬 설정 파일, 빌드 산출물은 `.gitignore`로 제외
