import React, { useMemo, useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Global.css";

type ScriptStep =
  | "UPLOAD_CHECK"
  | "CHECKLIST_CREATE"
  | "PURPOSE_SUMMARY"
  | "CATEGORY_SUMMARY";

const STEP_TEXT: Record<ScriptStep, string> = {
  UPLOAD_CHECK: "추가 파일 확인 중...",
  CHECKLIST_CREATE: "스크립트 생성 중...",
  PURPOSE_SUMMARY: "대본 작성 중...",
  CATEGORY_SUMMARY: "Q&A 생성 중...",
};

const ScriptCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const noticeId = location.state?.noticeId as number | undefined;

  const [title, setTitle] = useState("");
  const [org, setOrg] = useState("");
  const [budget, setBudget] = useState("");
  const [period, setPeriod] = useState("");
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");

  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<ScriptStep>("UPLOAD_CHECK");
  const [progress, setProgress] = useState(0);

  const titleRef = useRef<HTMLInputElement | null>(null);
  const orgRef = useRef<HTMLInputElement | null>(null);
  const budgetRef = useRef<HTMLInputElement | null>(null);
  const periodRef = useRef<HTMLInputElement | null>(null);
  const urlRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!noticeId) {
      setPageError("공고 ID가 전달되지 않았습니다.");
      return;
    }

    setPageLoading(true);
    setPageError(null);

    fetch(`/api/notices/${noticeId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`API 오류: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const stripHtml = (html: string) => {
          if (!html) return "";
          const tmp = document.createElement("DIV");
          tmp.innerHTML = html;
          return tmp.textContent || tmp.innerText || "";
        };

        setTitle(data.title || "");
        setOrg(data.author || data.excInsttNm || "");
        setPeriod(data.reqstDt || "");
        setUrl(data.link || "");
        setSummary(stripHtml(data.description));
        setBudget("-");

        setPageLoading(false);
      })
      .catch((err) => {
        console.error("공고 조회 오류:", err);
        setPageError("공고 정보를 불러오는데 실패했습니다.");
        setPageLoading(false);
      });
  }, [noticeId]);

  const requiredFields = useMemo(
    () => [
      { label: "제목", value: title, ref: titleRef },
      { label: "기관", value: org, ref: orgRef },
      { label: "예산", value: budget, ref: budgetRef },
      { label: "기간", value: period, ref: periodRef },
      { label: "URL", value: url, ref: urlRef },
    ],
    [title, org, budget, period, url]
  );

  const focusFirstEmpty = () => {
    const firstEmpty = requiredFields.find((f) => !f.value.trim());
    if (!firstEmpty) return false;

    alert(`${firstEmpty.label} 항목을 입력해 주세요.`);

    const el = firstEmpty.ref.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.focus(), 150);
    }
    return true;
  };

  const handleSubmit = async (id: number) => {
    if (focusFirstEmpty()) return;

    if (files.length === 0) {
      alert("PPT 파일을 업로드해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      setStep("UPLOAD_CHECK");
      setProgress(0);

      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("notice_id", id.toString());  // ✅ notice_id 추가

      // ✅ JWT 토큰 가져오기
      const token = localStorage.getItem("accessToken");
      if (token) {
        formData.append("token", token);  // ✅ token 추가
      }

      setStep("CHECKLIST_CREATE");
      setProgress(30);

      const response = await fetch("/api/analyze/step4", {
        method: "POST",
        body: formData,
      });

      setProgress(60);

      if (!response.ok) {
        throw new Error("스크립트 생성 실패");
      }

      const result = await response.json();

      setStep("PURPOSE_SUMMARY");
      setProgress(80);

      if (result.status === "success") {
        setStep("CATEGORY_SUMMARY");
        setProgress(100);

        setTimeout(() => {
          navigate("/process/script/result", {
            state: {
              noticeId: id,
              scriptData: result.data,
            },
          });
        }, 500);
      } else {
        throw new Error(result.message || "스크립트 생성 실패");
      }
    } catch (e) {
      console.error("스크립트 생성 오류:", e);
      alert("스크립트 생성 중 오류가 발생했습니다.");
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleBackToProcess = (id: number) => {
    navigate("/process", {
      state: { noticeId: id },
    });
  };

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
            스크립트 생성
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
              {url ? (
                <a href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
              ) : (
                "-"
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
                  <span style={{ color: '#22c55e' }}>✔</span> 발표 스크립트
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span style={{ color: '#22c55e' }}>✔</span> 예상 질문
                </div>
              </div>
            </div>
          </ModalSummary>
        </Section>
        <Section>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280' }}>
            발표 스크립트 생성을 위해 아래 파일을 업로드 해주세요
          </div>

          <Row>
            <Section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>필수 업로드 파일</div>
              <ul style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 16px 0', paddingLeft: '0', listStyle: 'none' }}>
                <li style={{ marginBottom: '4px' }}><span style={{ color: '#22c55e', marginRight: '6px' }}>✔</span>발표 자료 (PPT)</li>
              </ul>

              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>* 업로드한 파일을 기반으로</div>
              <ul style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 20px 0', paddingLeft: '20px' }}>
                <li>슬라이드 흐름 파악</li>
                <li>발표 대본 및 Q&A 생성</li>
              </ul>
            </Section>

            <Section style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '40px' }}>
              <div style={{ marginBottom: '10px', fontSize: '14px', color: '#6b7280' }}>
                PPT 선택 버튼을 클릭해 첨부해주세요.
              </div>
              <UploadArea>
                <UploadLabel htmlFor="file">📤 PPT 선택</UploadLabel>
                <HiddenInput
                  id="file"
                  type="file"
                  accept=".pptx"
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files ?? []);
                    setFiles(selectedFiles);
                    e.target.value = '';
                  }}
                />
                {files.length > 0 && (
                  <FileList>
                    {files.map((file, idx) => {
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
                            <span style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '6px' }}>
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFiles(files.filter((_, i) => i !== idx));
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
          <ActionBtn
            type="button"
            onClick={() => {
              if (!noticeId) return;
              handleSubmit(noticeId);
            }}
            disabled={files.length === 0 || isLoading}
          >
            생성
          </ActionBtn>
          <MiniBtn
            type="button"
            onClick={() => {
              if (!noticeId) return;
              handleBackToProcess(noticeId);
            }}
          >
            닫기
          </MiniBtn>
        </ModalActions>
      </Card>
    </Page>
  );
};

export default ScriptCreatePage;

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
  grid-template-columns: 120px 1fr;
  row-gap: 12px;
  column-gap: 16px;
  align-items: center;

  .label {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
  }

  .text {
    font-size: 14px;
    color: #2d3436;
  }

  a {
    color: #2563eb;
    text-decoration: underline;

    &:hover {
      opacity: 0.85;
    }
  }

  .input {
    width: 100%;
    height: 38px;
    padding: 0 12px;
    box-sizing: border-box;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
  }

  .input:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px rgba(46, 111, 219, 0.15);
  }
`;

const ModalSummary = styled.div`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.12);

  .label {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .text {
    font-size: 14px;
    color: #2d3436;
    line-height: 1.45;
  }
`;

const UploadLabel = styled.label`
  padding: 12px 26px;
  background-color: var(--color-accent);
  color: white;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;

  &:hover {
    background-color: var(--color-accent-hover);
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

const ActionBtn = styled.button`
  padding: 0 24px;
  height: 36px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--color-accent-hover);
  }

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
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
  padding: 12px 16px;
  width: 420px;
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
  min-width: 240px;
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