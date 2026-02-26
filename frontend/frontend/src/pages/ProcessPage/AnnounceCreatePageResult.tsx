import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Global.css";

// 타입 정의
interface Slide {
  section: string;
  slide_title: string;
  key_message: string;
  bullets: string[];
}

interface PPTResult {
  deck_title: string;
  total_slides: number;
  pptx_path: string;
  sections: string[];
  slides?: Slide[];
  db_saved?: boolean;

  // ✅ FastAPI가 내려주는 다운로드 정보
  pptx_filename?: string;
  download_url?: string;
}

const AnnounceCreatePageResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const noticeId = location.state?.noticeId as number | undefined;
  const pptResult = location.state?.pptResult as PPTResult | undefined;

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pptResult) {
      alert("PPT 생성 결과가 없습니다.");
      navigate("/process/announce", { state: { noticeId } });
    }
  }, [pptResult, navigate, noticeId]);

  const handleBack = (id: number) => {
    navigate("/process/announce", {
      state: { noticeId: id },
    });
  };

  const handleDownloadPPT = async () => {
    if (!pptResult) return;

    // ✅ FastAPI 다운로드 URL 우선
    let downloadUrl = "";
    if (pptResult.download_url) {
      downloadUrl = `${pptResult.download_url}`;
    } else {
      // fallback: pptx_path에서 filename 추출
      const filename =
        pptResult.pptx_filename ??
        (pptResult.pptx_path ? pptResult.pptx_path.split(/[/\\]/).pop() : null);

      if (!filename) {
        alert("다운로드할 파일명을 찾지 못했습니다.");
        return;
      }
      downloadUrl = `/download/pptx/${filename}`;
    }

    try {
      setLoading(true);

      const res = await fetch(downloadUrl, { method: "GET" });
      if (!res.ok) throw new Error(`다운로드 실패: ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      const safeTitle =
        (pptResult.deck_title || "발표자료").replace(/[\\/:*?"<>|]/g, "").trim() || "발표자료";
      a.download = `${safeTitle}.pptx`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "다운로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!pptResult) return null;

  return (
    <Container>
      <Card>
        <div className="title" style={{ marginLeft: 0, marginBottom: 30 }}>
          발표 자료 제작 결과
        </div>

        <InfoSection>
          <InfoRow>
            <InfoLabel>발표 제목:</InfoLabel>
            <InfoValue>{pptResult.deck_title}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>슬라이드 수:</InfoLabel>
            <InfoValue>{pptResult.total_slides}장</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>파일 경로:</InfoLabel>
            <InfoValue>{pptResult.pptx_path}</InfoValue>
          </InfoRow>
        </InfoSection>

        <ModalActions>
          <MiniBtn
            type="button"
            onClick={() => {
              if (!noticeId) return;
              handleBack(noticeId);
            }}
          >
            재생성
          </MiniBtn>

          <MiniBtn
            type="button"
            onClick={() => {
              if (!noticeId) return;
              navigate("/process", { state: { noticeId } });
            }}
          >
            닫기
          </MiniBtn>
        </ModalActions>

        <DownloadWrapper>
          <DownloadButton onClick={handleDownloadPPT} disabled={loading}>
            {loading ? "다운로드 중..." : "PPT 다운로드 (pptx)"}
          </DownloadButton>
        </DownloadWrapper>
      </Card>
    </Container>
  );
};

export default AnnounceCreatePageResult;

/* ===== Styled Components ===== */

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #d9d9d9;
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
`;

const InfoSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  min-width: 120px;
`;

const InfoValue = styled.div`
  font-size: 14px;
  color: #212529;
  flex: 1;
`;

const DownloadWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  justify-content: center;
`;

const DownloadButton = styled.button`
  padding: 14px 28px;
  background-color: #00b894;
  color: white;
  border-radius: 8px;
  font-size: 16px;
  text-decoration: none;
  cursor: pointer;
  border: none;

  &:hover {
    background-color: #009c7a;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
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
