import styled from "styled-components";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type Status = "idle" | "processing" | "done" | "error";

const PptDraftPage: React.FC = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [pptUrl, setPptUrl] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleUpload = async (file: File) => {
    try {
      setStatus("processing");

      const formData = new FormData();
      formData.append("file", file);

      // 실제 API 연동 위치
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 예시 다운로드 URL
      setPptUrl("/mock/ppt-draft.pptx");
      setStatus("done");
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <Container>
      <UploadSection>
        <UploadLabel 
          htmlFor="file"
          // 파일 업로드 중 다시 선택 못함
          style={{ pointerEvents: status === "processing" ? "none" : "auto", 
                  opacity: status === "processing" ? 0.6 : 1 }}>
          제안서 등록
        </UploadLabel>
        <HiddenInput
          id="file"
          type="file"
          accept=".docx"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length === 0) return;

            setUploadedFiles(files);     // ⭐ 여러 파일 저장
            files.forEach(handleUpload); // ⭐ 각각 업로드 처리
          }}
        />
      </UploadSection>

      {uploadedFiles.length > 0 && (
        <FileInfo>
          <span className="label">업로드된 파일</span>
          {uploadedFiles.map((file, idx) => (
            <span key={idx} className="name">
              {file.name}
            </span>
          ))}
        </FileInfo>
      )}


      {status === "processing" && (
        <LoadingSection>
          <Spinner />
          <span>초안을 생성 중입니다...</span>
        </LoadingSection>
      )}

      {status === "error" && (
        <ErrorText>
            처리 중 오류가 발생했습니다.
        </ErrorText>
        )}


      {status === "done" && (
        <>
          <Spacer />
          <ResultSection>
            <DownloadButton href={pptUrl!}>
              PPT 초안 다운로드
            </DownloadButton>
          </ResultSection>
        </>
      )}
    </Container>
  );
};

export default PptDraftPage;


/* 전체 페이지 */
export const Container = styled.div`
  width: 100%;
  min-height: 100vh;

  display: flex;
  flex-direction: column;
  align-items: center;

  padding-top: 80px;
`;

/* 상단 업로드 영역 */
export const UploadSection = styled.div`
  margin-bottom: 40px;
`;

/* 업로드 버튼 */
export const UploadLabel = styled.label`
  padding: 14px 28px;
  background-color: #2f6fff;
  color: white;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background-color: #2556cc;
  }
`;

export const HiddenInput = styled.input`
  display: none;
`;

/* 로딩 영역 */
export const LoadingSection = styled.div`
  margin-top: 20px;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  color: #555;
`;

/* 여백 */
export const Spacer = styled.div`
  height: 80px;
`;

/* 결과 영역 */
export const ResultSection = styled.div`
  margin-top: 20px;
`;

/* 다운로드 버튼 */
const DownloadButton = styled.a`
  padding: 14px 28px;
  background-color: #00b894;
  color: white;
  border-radius: 8px;
  font-size: 16px;
  text-decoration: none;

  &:hover {
    background-color: #009c7a;
  }
`;

export const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border: 4px solid #ddd;
  border-top: 4px solid #2f6fff;
  border-radius: 50%;

  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const ErrorText = styled.div`
  margin-top: 16px;
  color: #e74c3c;
  font-size: 14px;
`;

export const FileInfo = styled.div`
  margin-top: 12px;
  padding: 10px 14px;
  min-width: 320px;

  background: #f7f9ff;
  border: 1px solid rgba(47, 111, 255, 0.25);
  border-radius: 8px;

  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 12px;
    color: #666;
  }

  .name {
    font-size: 14px;
    color: #222;
    font-weight: 500;
    word-break: break-all;
  }
`;
