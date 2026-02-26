# Randi_RD-agent

## 1. 프로젝트 소개
- 프로젝트명: R&D Agent
- 형태: 팀 프로젝트 (모노레포 정리본)
- 목적: 연구/개발 업무를 보조하는 AI 기반 서비스 구현

## 2. 담당 역할
- 모델링 파트 2, 4 담당
- 모델 배포 및 운영 환경 구성
- 백엔드/프론트엔드 연동 협업

## 3. 저장소 구조
```text
Randi_RD-agent/
  backend/    # Spring Boot API 서버
  frontend/   # React + Vite 클라이언트
  modeling/   # Python/FastAPI 기반 모델 서비스
  scripts/    # 운영/보조 스크립트
  tools/      # 유틸리티 도구
```

## 4. 기술 스택
- Backend: Java 17, Spring Boot, JPA, Security, MySQL, Redis
- Frontend: React, TypeScript, Vite, styled-components
- Modeling: Python, FastAPI, ChromaDB, sentence-transformers, PyTorch
- Infra/Deploy: Docker 기반 배포 구성

## 5. 실행 방법

### 5-1. Backend
```bash
cd backend
./gradlew bootRun
```

### 5-2. Frontend
```bash
cd frontend/frontend
npm install
npm run dev
```

### 5-3. Modeling
```bash
cd modeling
python -m venv .venv
# Windows
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 6. 보안 및 공개 범위
- 본 저장소에는 민감 정보(비밀키, 계정정보)를 포함하지 않습니다.
- `.env` 및 로컬 설정 파일은 Git 추적에서 제외합니다.
