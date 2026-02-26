# R&D Agent 포트폴리오 (코드 기반 정리)

본 문서는 `Randi_RD-agent` 저장소의 실제 코드 파일을 기준으로 작성했습니다.

- 작성 기준 디렉터리: `backend/`, `frontend/`, `modeling/`, `scripts/`, `tools/`

## 1) 프로젝트 개요
- 프로젝트명: R&D Agent
- 목적: R&D 공고 분석, 유사 RFP 탐색, 발표자료(PPT) 생성, 발표 스크립트/Q&A 생성 자동화
- 형태: Spring Boot + React + FastAPI + ChromaDB 기반 멀티 서비스
- 담당 역할(명시): 모델링 파트(2, 4) 및 배포 구성

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
