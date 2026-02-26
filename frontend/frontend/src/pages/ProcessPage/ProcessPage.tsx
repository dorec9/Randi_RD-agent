import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import http from "../../api/http";

type NoticeItem = {
  id: number;
  title: string;
  dday: string;
  score: number;
  isRead: boolean;
  url?: string;

  org?: string;
  // budget?: string;
  period?: string;
  summary?: string;
};

const ProcessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const noticeId = location.state?.noticeId as number | undefined;

  const [searchParams] = useSearchParams();
  // view가 없으면 기본값으로 "notice" 취급
  const view = (searchParams.get("view") ?? "notice") as "notice" | "service";

  const [title, setTitle] = useState("");
  const [org, setOrg] = useState("");
  // const [budget, setBudget] = useState("");
  const [period, setPeriod] = useState("");
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // 공고 상세 로드 (noticeId 있을 때만)
  // ============================================
  useEffect(() => {
    if (!noticeId) {
      // 서비스에서 들어오면 공고 상세를 보여줄 필요가 없어서 에러로 막지 않음
      // (버튼은 공고 선택으로 유도)
      setError(null);
      return;
    }

    const stripHtml = (html: string) => {
      if (!html) return "-";
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "-";
    };

    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await http.get(`/api/notices/${noticeId}`);
        if (!alive) return;

        setTitle(data.title || "-");
        setOrg(data.author || data.excInsttNm || "-");
        setPeriod(data.reqstDt || "-");
        setUrl(data.link || "-");
        setSummary(stripHtml(data.description));
        // setBudget("-"); // 백엔드 예산 필드 생기면 매핑
      } catch (err) {
        console.error("공고 조회 오류:", err);
        if (!alive) return;
        setError("공고 정보를 불러오는데 실패했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [noticeId]);

  // ============================================
  // 이동 헬퍼
  // - noticeId 없으면 공고 선택 화면으로 유도
  // ============================================
  const goNeedNotice = () => {
    // 서비스에서 들어온 경우: 공고 선택/목록으로 보내는 의도
    // 기존 너 코드 흐름을 최대한 유지해서 view=service 붙여줌
    navigate("/notice?view=service");
  };

  const goAnalysis = () => {
    if (!noticeId) return goNeedNotice();
    navigate("/process/analysis", { state: { noticeId } });
  };

  const goRfp = () => {
    if (!noticeId) return goNeedNotice();
    navigate("/process/rfp", { state: { noticeId } });
  };

  const goAnnounce = () => {
    if (!noticeId) return goNeedNotice();
    navigate("/process/announce", { state: { noticeId } });
  };

  const goScript = () => {
    if (!noticeId) return goNeedNotice();
    navigate("/process/script", { state: { noticeId } });
  };

  // 로딩 UI (noticeId 있을 때만 로딩이 의미 있음)
  if (loading) {
    return (
      <Container>
        <Section>
          <div style={{ textAlign: "center", padding: "40px" }}>로딩 중...</div>
        </Section>
      </Container>
    );
  }

  // 에러 UI (noticeId 있는 상태에서만 의미 있음)
  if (error && noticeId) {
    return (
      <Container>
        <Section>
          <div style={{ color: "crimson" }}>{error}</div>
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      {/* service 뷰에서는 상세 박스 숨김 유지 */}
      {view !== "service" && noticeId && (
        <Section>
          <ModalGrid>
            <label>제목</label>
            <div className="text">{title}</div>

            <label>기관</label>
            <div className="text">{org}</div>

            <label>기간</label>
            <div className="text">{period}</div>

            <label>URL</label>
            <div className="text">
              {url !== "-" ? (
                <a href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
              ) : (
                url
              )}
            </div>

            <label>요약</label>
            <div className="text">{summary}</div>
          </ModalGrid>
        </Section>
      )}

      {/* noticeId가 없을 때 가이드(선택사항) */}
      {!noticeId && (
        <Section>
          <div style={{ fontSize: 14, color: "#374151" }}>
            공고를 선택하면 분석/추천 기능을 사용할 수 있습니다.
          </div>
        </Section>
      )}

      <ButtonGroup>
        <ProcessBtn type="button" onClick={goAnalysis}>
          <h3>공고문 분석</h3>
          <ul>
            <li>자격요건 체크리스트 제공</li>
            <li>과제 의도 및 목적 분석</li>
            <li>평가지표 분석 사항</li>
            <li>제출 문서 리스트 제공</li>
            <li>필수 준수 사항</li>
          </ul>
        </ProcessBtn>

        <ProcessBtn type="button" onClick={goRfp}>
          <h3>유관 RFP 검색</h3>
          <ul>
            <li>동일 발주처 유사 RFP 추천</li>
            <li>타 발주처 유사 RFP 추천</li>
            <li>권장 차별화 전략 제안</li>
          </ul>
        </ProcessBtn>

        <ProcessBtn type="button" onClick={goAnnounce}>
          <h3>발표자료 제작</h3>
          <ul>
            <li>발표 제목</li>
            <li>슬라이드 수</li>
            <li>파일 경로</li>
          </ul>
        </ProcessBtn>

        <ProcessBtn type="button" onClick={goScript}>
          <h3>스크립트 생성</h3>
          <ul>
            <li>발표 스크립트 생성</li>
            <li>예상 질문 생성</li>
          </ul>
        </ProcessBtn>
      </ButtonGroup>
    </Container>
  );
};

export default ProcessPage;

// ===== styled-components =====
const Container = styled.div`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-2xl) var(--spacing-xl);
  box-sizing: border-box;
`;

const Section = styled.div`
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-sizing: border-box;
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  row-gap: var(--spacing-md);
  column-gap: var(--spacing-lg);
  align-items: start;

  label {
    font-size: 14px;
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
    letter-spacing: -0.01em;
  }

  .text {
    font-size: 15px;
    color: var(--color-text-primary);
    line-height: 1.6;
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--color-primary-dark);
      text-decoration: underline;
    }
  }
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xl);
  margin: var(--spacing-2xl) 0;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ProcessBtn = styled.button`
  position: relative;
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  text-align: left;
  min-height: 200px;
  display: flex;
  flex-direction: column;

  /* 좌측 컬러 바 - MainPage와 동일 */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-xl) 0 0 var(--radius-xl);
    transition: all var(--transition-base);
  }

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-xl);
    transform: translateY(-4px);
    
    /* Hover 시 좌측 바 강조 */
    &::before {
      width: 6px;
      background: var(--color-primary-dark);
    }
  }

  h3 {
    font-size: 24px;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-md) 0;
    letter-spacing: -0.01em;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  li {
    font-size: 15px;
    color: var(--color-text-tertiary);
    padding: var(--spacing-sm) 0;
    line-height: 1.5;
    
    &:not(:last-child) {
      border-bottom: 1px solid var(--color-border-light);
    }
    
    &::before {
      content: '✓';
      margin-right: 8px;
      color: var(--color-primary);
      font-weight: var(--font-weight-semibold);
    }
  }
`;
