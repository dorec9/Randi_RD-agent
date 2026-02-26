import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Global.css";
import http from "../../api/http";

type AnnounceStep =
  | "UPLOAD_CHECK"
  | "TEXT_EXTRACT"
  | "SECTION_SPLIT"
  | "SLIDE_GENERATE"
  | "SLIDE_MERGE"
  | "PPT_CREATE";

type Slide = {
  section: string;
  slide_title: string;
  key_message: string;
  bullets: string[];
};

type PPTResult = {
  deck_title: string;
  total_slides: number;
  pptx_path: string;
  sections?: string[];
  slides?: Slide[];
  db_saved?: boolean;
  pptx_filename?: string;   // 서버가 주면 사용
  download_url?: string;    // 서버가 주면 사용
};

const STEP_TEXT: Record<AnnounceStep, string> = {
  UPLOAD_CHECK: "파일 확인 중...",
  TEXT_EXTRACT: "텍스트 추출 중...",
  SECTION_SPLIT: "섹션 분할 중...",
  SLIDE_GENERATE: "슬라이드 생성 중 (Gemini API)...",
  SLIDE_MERGE: "슬라이드 병합 중...",
  PPT_CREATE: "PPTX 생성 중 (Gamma API)...",
};

const AnnounceCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("-");
  const [org, setOrg] = useState("-");
  const [budget, setBudget] = useState("-");
  const [period, setPeriod] = useState("-");
  const [url, setUrl] = useState("-");
  const [summary, setSummary] = useState("-");

  const [isLoading, setIsLoading] = useState(false);
  const [pptResult, setPptResult] = useState<PPTResult | null>(null);
  const [step, setStep] = useState<AnnounceStep>("UPLOAD_CHECK");
  const [progress, setProgress] = useState(0);

  const [files, setFiles] = useState<File[]>([]);
  const location = useLocation();
  const noticeId = location.state?.noticeId as number | undefined;

  // ✅ 공고 상세 API 호출
  useEffect(() => {
    if (!noticeId) return;

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
        setBudget("-");
      } catch (err) {
        console.error("공고 조회 오류:", err);
        setTitle("-");
        setOrg("-");
        setBudget("-");
        setPeriod("-");
        setUrl("-");
        setSummary("-");
      }
    })();
  }, [noticeId]);

  const runStep = (s: AnnounceStep, duration: number) => {
    return new Promise<void>((resolve) => {
      setStep(s);
      setProgress(0);

      const start = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - start;
        const percent = Math.min(Math.floor((elapsed / duration) * 100), 100);
        setProgress(percent);

        if (percent >= 100) {
          clearInterval(timer);
          resolve();
        }
      }, 60);
    });
  };

  // ✅ PPT 생성 핸들러 (FastAPI Step 3 호출)
  const handleGeneratePPT = async () => {
    if (files.length === 0) {
      alert("제안서 파일을 업로드해주세요.");
      return;
    }

    setIsLoading(true);
    setPptResult(null);

    try {
      // 1) 파일 확인
      await runStep("UPLOAD_CHECK", 500);

      // 2) FormData 생성
      const formData = new FormData();
      formData.append("file", files[0]); // 첫 번째 파일 사용
      if (noticeId) {
        formData.append("notice_id", noticeId.toString());
      }

      // 3) FastAPI Step 3 호출 (각 단계별 progress 시뮬레이션)
      const steps: AnnounceStep[] = [
        "TEXT_EXTRACT",
        "SECTION_SPLIT",
        "SLIDE_GENERATE",
        "SLIDE_MERGE",
        "PPT_CREATE",
      ];

      // 병렬: API 호출 + 진행률 시뮬레이션
      const apiPromise = http.post(
        "/api/analyze/step3",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // 진행률 시뮬레이션 (총 60초 가정: 텍스트 5초, 섹션 5초, 슬라이드 30초, 병합 5초, PPTX 15초)
      const durations = [5000, 5000, 30000, 5000, 15000];

      for (let i = 0; i < steps.length; i++) {
        await runStep(steps[i], durations[i]);
      }

      // API 응답 대기
      const { data } = await apiPromise;

      const result: PPTResult = data.data;
      setPptResult(result);

      // 성공하면 결과 페이지로 이동
      navigate("/process/announce/result", {
        state: {
          noticeId,
          pptResult: result,
        },
      });
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.response?.data?.message || "PPT 생성 중 오류가 발생했습니다.";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToProcess = (id: number) => {
    navigate("/process", { state: { noticeId: id } });
  };

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
            발표 자료 제작
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
                  <span style={{ color: '#22c55e' }}>✔</span> 발표 제목
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span style={{ color: '#22c55e' }}>✔</span> 슬라이드 수
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span style={{ color: '#22c55e' }}>✔</span> 파일 경로
                </div>
              </div>
            </div>
          </ModalSummary>
        </Section>
        <Section>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280' }}>
            발표 자료 제작을 위해 아래 파일을 업로드 해주세요
          </div>

          <Row>
            <Section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>필수 업로드 파일</div>
              <ul style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 16px 0', paddingLeft: '0', listStyle: 'none' }}>
                <li style={{ marginBottom: '4px' }}><span style={{ color: '#22c55e', marginRight: '6px' }}>✔</span>제안서 파일 (.pdf)</li>
              </ul>

              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>* 업로드한 파일을 기반으로</div>
              <ul style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 20px 0', paddingLeft: '20px' }}>
                <li>발표 자료 구조 설계</li>
                <li>슬라이드별 내용 생성</li>
              </ul>
            </Section>

            <Section style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '40px' }}>
              <div style={{ marginBottom: '10px', fontSize: '14px', color: '#6b7280' }}>
                제안서 선택 버튼을 클릭해 첨부해주세요.
              </div>
              <UploadArea>
                <UploadLabel htmlFor="file">📤 제안서 선택</UploadLabel>
                <HiddenInput
                  id="file"
                  type="file"
                  accept=".pptx,.pdf,.docx"
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
          <GenerateBtn
            type="button"
            onClick={handleGeneratePPT}
            disabled={files.length === 0 || isLoading}
          >
            PPT 생성
          </GenerateBtn>
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

export default AnnounceCreatePage;

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
    color: #1f2937;
    line-height: 1.5;
    word-break: break-word;
  }

  a {
    color: #2563eb;
    text-decoration: underline;

    &:hover {
      opacity: 0.85;
    }
  }
`;

const ModalSummary = styled.div`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 14px;
  line-height: 1.45;

  .label {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .text {
    font-size: 14px;
    color: #1f2937;
    white-space: pre-wrap;
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

const GenerateBtn = styled.button`
  padding: 10px 24px;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;

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