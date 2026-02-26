import React, { useMemo, useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Global.css";
import http from "../../api/http";

type AnalyzeStep =
  | "UPLOAD_CHECK"
  | "CHECKLIST_CREATE"
  | "PURPOSE_SUMMARY"
  | "CATEGORY_SUMMARY";

const STEP_TEXT: Record<AnalyzeStep, string> = {
  UPLOAD_CHECK: "추가 파일 확인 중...",
  CHECKLIST_CREATE: "체크리스트 생성 중...",
  PURPOSE_SUMMARY: "사업 목적 요약 중...",
  CATEGORY_SUMMARY: "평가항목 요약 중...",
};

const NoticeNewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const noticeId = location.state?.noticeId as number | undefined;

  const [title, setTitle] = useState("-");
  const [org, setOrg] = useState("-");
  // const [budget, setBudget] = useState("-");
  const [period, setPeriod] = useState("-");
  const [url, setUrl] = useState("-");
  const [summary, setSummary] = useState("-");

  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<AnalyzeStep>("UPLOAD_CHECK");
  const [progress, setProgress] = useState(0);

  const titleRef = useRef<HTMLInputElement | null>(null);
  const orgRef = useRef<HTMLInputElement | null>(null);
  const budgetRef = useRef<HTMLInputElement | null>(null);
  const periodRef = useRef<HTMLInputElement | null>(null);
  const urlRef = useRef<HTMLInputElement | null>(null);


  const [noticeFiles, setNoticeFiles] = useState<File[]>([]); // Notice files

  // ✅ 공고 상세 API 호출 (ProcessPage와 동일)
  useEffect(() => {
    if (!noticeId) {
      setPageError("공고 ID가 전달되지 않았습니다. (새로고침하면 state가 사라질 수 있어요)");
      return;
    }

    setPageLoading(true);
    setPageError(null);

    (async () => {
      try {
        const { data } = await http.get(`/api/notices/${noticeId}`);

        const stripHtml = (html: string) => {
          if (!html) return "-";
          const tmp = document.createElement("DIV");
          tmp.innerHTML = html;
          return tmp.textContent || tmp.innerText || "-";
        };

        setTitle(data.title || "-");
        setOrg(data.author || data.excInsttNm || "-");
        setPeriod(data.reqstDt || "-");
        setUrl(data.link || "-");
        setSummary(stripHtml(data.description));
        //setBudget("-"); // 예산 필드 생기면 매핑
      } catch (err) {
        console.error("공고 조회 오류:", err);
        setPageError("공고 정보를 불러오는데 실패했습니다.");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [noticeId]);

  const requiredFields = useMemo(
    () => [
      { label: "제목", value: title, ref: titleRef },
      { label: "기관", value: org, ref: orgRef },
      // { label: "예산", value: budget, ref: budgetRef },
      { label: "기간", value: period, ref: periodRef },
      { label: "URL", value: url, ref: urlRef },
    ],
    [title, org, period, url]
  );

  const focusFirstEmpty = () => {
    // 지금 화면은 입력폼이 아니라서 사실상 항상 false로 동작하겠지만,
    // 나중에 편집/입력폼으로 바꿀 때를 위해 유지
    const firstEmpty = requiredFields.find((f) => !String(f.value).trim());
    if (!firstEmpty) return false;

    alert(`${firstEmpty.label} 항목을 확인해 주세요.`);
    firstEmpty.ref.current?.focus();
    return true;
  };

  const runStep = (s: AnalyzeStep, duration: number) => {
    return new Promise<void>((resolve) => {
      setStep(s);
      setProgress(0);

      const start = Date.now();
      const timer = setInterval(() => {
        const percent = Math.min(
          Math.floor(((Date.now() - start) / duration) * 100),
          100
        );
        setProgress(percent);

        if (percent >= 100) {
          clearInterval(timer);
          resolve();
        }
      }, 60);
    });
  };

  const handleSubmit = async () => {
    if (!noticeId) return;
    if (focusFirstEmpty()) return;

    setIsLoading(true);

    try {
      // UI 진행바
      await runStep("UPLOAD_CHECK", 600);

      // ✅ 실제 분석 실행 (Spring -> FastAPI)
      await runStep("CHECKLIST_CREATE", 400);
      const { data: result } = await http.post(
        `/api/notices/${noticeId}/analyze`,
        null,
        { params: { companyId: 1 } }
      );

      // (옵션) 심층 분석/요약 단계도 UI로만 보여줌
      await runStep("PURPOSE_SUMMARY", 400);
      await runStep("CATEGORY_SUMMARY", 400);

      navigate("/process/analysis/result", {
        state: { noticeId, result },
      });
    } catch (e) {
      console.error(e);
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToProcess = () => {
    if (!noticeId) return;
    navigate("/process", { state: { noticeId } });
  };

  // ✅ 로딩/에러 UI
  if (pageLoading) {
    return (
      <Page>
        <Card>
          <div style={{ textAlign: "center", padding: 40 }}>로딩 중...</div>
        </Card>
      </Page>
    );
  }

  if (pageError) {
    return (
      <Page>
        <Card>
          <div style={{ textAlign: "center", padding: 40, color: "red" }}>
            {pageError}
          </div>
          <div style={{ textAlign: "center", paddingBottom: 20 }}>
            <MiniBtn type="button" onClick={() => navigate("/process")}>
              돌아가기
            </MiniBtn>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      {isLoading && (
        <LoadingOverlay>
          <LoadingBox>
            <Spinner />
            {STEP_TEXT[step]}
            <br />
            {progress}%
          </LoadingBox>
        </LoadingOverlay>
      )}

      <Card>
        <Section>
          <div className="title" style={{ marginLeft: 0, marginBottom: 18 }}>
            선택된 공고
          </div>
          <ModalGrid>
            <div className="label">제목</div>
            <div className="text">{title}</div>

            <div className="label">기관</div>
            <div className="text">{org}</div>

            <div className="label">기간</div>
            <div className="text">{period}</div>

            <div className="label">URL</div>
            <div className="text">
              {url !== "-" ? (
                <a href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
              ) : (
                url
              )}
            </div>
          </ModalGrid>

          <ModalSummary>
            <div className="label">요약</div>
            <div className="text">{summary}</div>
            <div className="summary-footer-text" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', lineHeight: '1.8', fontSize: '14px', color: '#374151' }}>
              <p style={{ marginBottom: '12px' }}>이 공고를 기준으로</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span style={{ color: '#22c55e' }}>✔</span> 자격요건 체크리스트
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span style={{ color: '#22c55e' }}>✔</span> 과제 의도 및 목적
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span style={{ color: '#22c55e' }}>✔</span> 평가 지표 분석
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span style={{ color: '#22c55e' }}>✔</span> 필수 제출 문서 리스트
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span style={{ color: '#22c55e' }}>✔</span> 필수 준수 사항
                </div>
              </div>
            </div>
          </ModalSummary>
        </Section>

        <Section>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280' }}>
            분석 정확도를 높이기 위해 아래 파일을 업로드 해주세요
          </div>

          <Row>
            <Section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>권장 업로드 파일</div>
              <ul style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 16px 0', paddingLeft: '0', listStyle: 'none' }}>
                <li style={{ marginBottom: '4px' }}><span style={{ color: '#22c55e', marginRight: '6px' }}>✔</span>사업 계획서 초안 또는 이전 제출분</li>
                {/* <li><span style={{ color: '#22c55e', marginRight: '6px' }}>✔</span>기업 소개서(IR)</li> */}
              </ul>

              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>* 업로드한 파일을 기반으로</div>
              <ul style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 20px 0', paddingLeft: '20px' }}>
                <li>공고 적합성 분석</li>
                <li>부정합 공고 분석</li>
              </ul>
            </Section>

            <Section style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '40px' }}>
              <div style={{ marginBottom: '10px', fontSize: '14px', color: '#6b7280' }}>
                파일 선택 버튼을 클릭해 첨부해주세요.
              </div>
              <UploadArea>
                <UploadLabel htmlFor="notice-file">📤 파일 선택</UploadLabel>
                <HiddenInput
                  id="notice-file"
                  type="file"
                  accept=".hwp,.pdf,.docx"
                  multiple
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []);
                    setNoticeFiles((prev) => [...prev, ...selected]);
                    e.target.value = '';
                  }}
                />
                {noticeFiles.length > 0 && (
                  <FileList>
                    {noticeFiles.map((file, idx) => {
                      const lastDot = file.name.lastIndexOf(".");
                      const name = lastDot > -1 ? file.name.substring(0, lastDot) : file.name;
                      const ext = lastDot > -1 ? file.name.substring(lastDot) : "";
                      return (
                        <li
                          key={idx}
                          onClick={() => {
                            const fileUrl = URL.createObjectURL(file);
                            window.open(fileUrl, '_blank');
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                            <span style={{ flex: '0 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {name}
                            </span>
                            <span style={{ flexShrink: 0 }}>{ext}</span>
                          </div>
                          <button
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoticeFiles(prev => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            ×
                          </button>
                        </li>
                      );
                    })}
                  </FileList>
                )}
              </UploadArea>
            </Section>
          </Row>
        </Section>

        <ModalActions>
          <MiniBtn type="button" onClick={handleSubmit}>
            분석
          </MiniBtn>
          <MiniBtn type="button" onClick={handleBackToProcess}>
            닫기
          </MiniBtn>
        </ModalActions>
      </Card >
    </Page >
  );
};

export default NoticeNewPage;

/* ===== styled-components ===== */

const Page = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--color-bg-main);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 30px 0;
  box-sizing: border-box;
`;

const Card = styled.div`
  width: 1100px;
  background: #ffffff;
  border-radius: 12px;
  padding: 28px;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
`;

const Section = styled.div`
  background: #f9fafb;
  border-radius: 10px;
  padding: 18px 20px;
  box-sizing: border-box;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
`;

const Row = styled.div`
  display: flex;
  gap: 16px;
`;

const ModalGrid = styled.div`
display: grid;
grid - template - columns: 120px 1fr;
row - gap: 12px;
column - gap: 16px;
align - items: center;

  .label {
  font - size: 14px;
  color: #374151;
  font - weight: 500;
}

  .text {
  font - size: 14px;
  color: #1f2937;
  line - height: 1.5;
}

  a {
  color: #2563eb;
  text - decoration: underline;

    &:hover {
    opacity: 0.85;
  }
}
`;

const ModalSummary = styled.div`
margin - top: 16px;
padding - top: 12px;
border - top: 1px solid rgba(0, 0, 0, 0.12);

  .label {
  font - size: 14px;
  color: #374151;
  font - weight: 500;
  margin - bottom: 8px;
}

  .text {
  font - size: 14px;
  color: #1f2937;
  line - height: 1.55;
  white - space: pre - wrap;
}
`;

const UploadLabel = styled.label`
  padding: 12px 26px;
  background-color: #2563eb;
  color: white;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background-color: #1d4ed8;
  }
`;

const HiddenInput = styled.input`
display: none;
`;

const UploadArea = styled.div`
  margin: 24px 0;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  justify-content: center;
`;

const ModalActions = styled.div`
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const MiniBtn = styled.button`
  width: 80px;
  height: 36px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;

  &:hover {
    background: #f9fafb;
  }
`;

const FileList = styled.ul`
margin - top: 12px;
padding: 12px 16px;
  width: 420px;
  // max-width: 420px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 150px;
  overflow-y: auto;

  li {
    font-size: 13px;
    color: #374151;
    line-height: 1.6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;

    &:hover {
      background-color: #f3f4f6;
    }

    .delete-btn {
        display: none;
        background: none;
        border: none;
        color: #ef4444;
        font-size: 16px;
        cursor: pointer;
        padding: 0 4px;
        margin-left: 8px;

        &:hover {
            color: #dc2626;
        }
    }

    &:hover .delete-btn {
        display: block;
    }
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingBox = styled.div`
  background: #ffffff;
  padding: 32px 40px;
  border-radius: 14px;
  text-align: center;
  min-width: 280px;
  font-size: 15px;
  color: #374151;
  line-height: 1.6;
`;

const Spinner = styled.div`
  width: 42px;
  height: 42px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto 16px;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
