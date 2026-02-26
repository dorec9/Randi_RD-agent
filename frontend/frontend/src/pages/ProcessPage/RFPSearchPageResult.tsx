import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Global.css";
import jsPDF from "jspdf";
import { NotoSansKR } from "../../utils/NotoSansKR";

type Similarity = "상" | "중" | "하" | string;

interface TrackComparisonItem {
  year?: string;
  ministry?: string;
  title?: string;
  similarity?: Similarity;
  difference?: string;
}

interface ReportData {
  summary_opinion?: string;
  track_a_comparison?: TrackComparisonItem[];
  track_b_comparison?: TrackComparisonItem[];
  strategies?: string[];
  error?: string;
}

interface TrackHit {
  id?: string;
  score?: number;
  distance?: number;
  document?: string;
  metadata?: Record<string, any>;
}

interface Step2ResultExpanded {
  report?: ReportData;
  track_a?: TrackHit[];
  track_b?: TrackHit[];
}

interface SpringStep2Envelope {
  status: string;
  noticeId: number;
  savedReferenceCount?: number;
  fastapi?: any; // FastAPI 원본
}

const RFPSearchPageResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const noticeId = location.state?.noticeId as number | undefined;
  const rfpResult = location.state?.rfpResult as SpringStep2Envelope | undefined;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [report, setReport] = useState<ReportData | null>(null);
  const [trackA, setTrackA] = useState<TrackHit[]>([]);
  const [trackB, setTrackB] = useState<TrackHit[]>([]);

  const handleDownload = () => {
    if (!report) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      doc.setLineHeightFactor(1.6);

      doc.addFileToVFS("NotoSansKR-Regular.ttf", NotoSansKR);
      doc.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
      doc.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "bold");

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const today = new Date().toLocaleDateString("ko-KR");
      let y = 15;

      const COLORS = {
        primary: [0, 184, 148],
        secondary: [9, 132, 227],
        danger: [214, 48, 49],
        warning: [253, 203, 110],
        dark: [45, 52, 54],
        gray: [99, 110, 114],
        lightGray: [241, 243, 245],
        white: [255, 255, 255],
        headerBg: [30, 39, 46],
      };

      const trackAItems = report.track_a_comparison ?? [];
      const trackBItems = report.track_b_comparison ?? [];
      const strategyItems = report.strategies ?? [];

      const addPageIfNeeded = (minSpace: number) => {
        if (y + minSpace <= pageHeight - margin) return;
        doc.addPage();
        y = 20;
      };

      const writeText = (
        text: string,
        x: number,
        yPos: number,
        opts?: {
          width?: number;
          fontSize?: number;
          color?: number[];
          font?: "normal" | "bold";
          align?: "left" | "center" | "right";
        }
      ) => {
        const width = opts?.width ?? contentWidth;
        const fontSize = opts?.fontSize ?? 10;
        const color = opts?.color ?? COLORS.dark;
        const font = opts?.font ?? "normal";
        const align = opts?.align ?? "left";

        doc.setFont("NotoSansKR", font);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);

        const lines = doc.splitTextToSize(text, width);
        doc.text(lines, x, yPos, { align });
        return lines.length * (fontSize * 0.3527 * 1.6);
      };

      const drawSectionHeader = (title: string, iconChar: string = "■") => {
        addPageIfNeeded(20);
        y += 5;

        doc.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
        doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");

        doc.setFont("NotoSansKR", "bold");
        doc.setFontSize(12);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.text(`${iconChar}  ${title}`, margin + 4, y + 7);
        y += 15;
      };

      const similarityColor = (value?: string) => {
        const v = (value || "").toLowerCase();
        if (v.includes("high") || v.includes("상")) return COLORS.danger;
        if (v.includes("mid") || v.includes("중")) return COLORS.warning;
        if (v.includes("low") || v.includes("하")) return COLORS.primary;
        return COLORS.gray;
      };

      doc.setFillColor(COLORS.headerBg[0], COLORS.headerBg[1], COLORS.headerBg[2]);
      doc.rect(0, 0, pageWidth, 50, "F");

      doc.setFont("NotoSansKR", "bold");
      doc.setFontSize(24);
      doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
      doc.text("유사 RFP 분석 결과", margin, 32);

      doc.setFont("NotoSansKR", "normal");
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(`Generated on ${today}  |  Notice ID: ${noticeId ?? "N/A"}`, margin, 42);

      y = 60;

      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, y, contentWidth, 35, 3, 3, "FD");

      doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
      doc.roundedRect(margin + 5, y + 5, 25, 25, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("NotoSansKR", "bold");
      doc.setFontSize(10);
      doc.text("RFP", margin + 17.5, y + 17, { align: "center", baseline: "middle" });
      doc.setFontSize(8);
      doc.text("분석", margin + 17.5, y + 23, { align: "center", baseline: "middle" });

      const summaryX = margin + 35;
      const summaryW = contentWidth - 40;
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont("NotoSansKR", "bold");
      doc.setFontSize(12);
      doc.text("요약", summaryX, y + 10);
      doc.setFont("NotoSansKR", "normal");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
      const summaryLines = doc.splitTextToSize(
        report.summary_opinion ?? "요약 데이터가 없습니다.",
        summaryW
      );
      doc.text(summaryLines.slice(0, 3), summaryX, y + 18);
      y += 45;

      const boxGap = 5;
      const boxW = (contentWidth - boxGap * 2) / 3;
      const boxH = 20;

      const drawStatBox = (
        label: string,
        value: number | string,
        color: number[],
        xPos: number
      ) => {
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(xPos, y, 2, boxH, "F");
        doc.setFillColor(250, 250, 250);
        doc.rect(xPos + 2, y, boxW - 2, boxH, "F");

        doc.setFont("NotoSansKR", "normal");
        doc.setFontSize(9);
        doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
        doc.text(label, xPos + 8, y + 8);

        doc.setFont("NotoSansKR", "bold");
        doc.setFontSize(14);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.text(String(value), xPos + 8, y + 16);
      };

      drawStatBox("Track A", trackAItems.length, COLORS.secondary, margin);
      drawStatBox("Track B", trackBItems.length, COLORS.primary, margin + boxW + boxGap);
      drawStatBox("전략", strategyItems.length, COLORS.warning, margin + (boxW + boxGap) * 2);
      y += 30;

      drawSectionHeader("Track A: 동일 발주처 유사 RFP", "A");
      if (trackAItems.length === 0) {
        y += writeText("동일 발주처 기준 유사 RFP가 없습니다.", margin, y) + 6;
      } else {
        trackAItems.forEach((item, idx) => {
          addPageIfNeeded(36);

          const level = item.similarity ?? "-";
          const badge = similarityColor(level);
          const title = item.title ?? "제목 없음";
          const meta = `(${item.year ?? "연도 미상"}, ${item.ministry ?? "부처 미상"})`;
          const diff = item.difference ?? "-";

          doc.setDrawColor(220, 220, 220);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, y, contentWidth, 28, 2, 2, "FD");

          doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
          doc.roundedRect(margin, y, contentWidth, 7, 2, 2, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("NotoSansKR", "bold");
          doc.setFontSize(9);
          doc.text(`A-${idx + 1}`, margin + 4, y + 4.8);
          doc.text(title, margin + 18, y + 4.8);

          const badgeText = `유사도 ${level}`;
          const badgeW = Math.max(18, doc.getTextWidth(badgeText) + 6);
          doc.setFillColor(badge[0], badge[1], badge[2]);
          doc.roundedRect(pageWidth - margin - badgeW, y + 1.2, badgeW, 4.5, 1, 1, "F");
          doc.setFont("NotoSansKR", "normal");
          doc.setFontSize(7);
          doc.text(badgeText, pageWidth - margin - badgeW + 3, y + 4.2);

          y += 10;
          y += writeText(meta, margin + 3, y, { fontSize: 9, color: COLORS.gray }) + 2;
          y += writeText(`차이점: ${diff}`, margin + 3, y, { width: contentWidth - 6, fontSize: 9 }) + 6;
        });
      }

      drawSectionHeader("Track B: 타 발주처 유사 RFP", "B");
      if (trackBItems.length === 0) {
        y += writeText("타 발주처 기준 유사 RFP가 없습니다.", margin, y) + 6;
      } else {
        trackBItems.forEach((item, idx) => {
          addPageIfNeeded(36);

          const level = item.similarity ?? "-";
          const badge = similarityColor(level);
          const title = item.title ?? "제목 없음";
          const meta = `(${item.year ?? "연도 미상"}, ${item.ministry ?? "부처 미상"})`;
          const diff = item.difference ?? "-";

          doc.setDrawColor(220, 220, 220);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, y, contentWidth, 28, 2, 2, "FD");

          doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
          doc.roundedRect(margin, y, contentWidth, 7, 2, 2, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("NotoSansKR", "bold");
          doc.setFontSize(9);
          doc.text(`B-${idx + 1}`, margin + 4, y + 4.8);
          doc.text(title, margin + 18, y + 4.8);

          const badgeText = `유사도 ${level}`;
          const badgeW = Math.max(18, doc.getTextWidth(badgeText) + 6);
          doc.setFillColor(badge[0], badge[1], badge[2]);
          doc.roundedRect(pageWidth - margin - badgeW, y + 1.2, badgeW, 4.5, 1, 1, "F");
          doc.setFont("NotoSansKR", "normal");
          doc.setFontSize(7);
          doc.text(badgeText, pageWidth - margin - badgeW + 3, y + 4.2);

          y += 10;
          y += writeText(meta, margin + 3, y, { fontSize: 9, color: COLORS.gray }) + 2;
          y += writeText(`차이점: ${diff}`, margin + 3, y, { width: contentWidth - 6, fontSize: 9 }) + 6;
        });
      }

      drawSectionHeader("권장 차별화 전략", "S");
      if (strategyItems.length === 0) {
        y += writeText("전략 결과가 없습니다.", margin, y) + 6;
      } else {
        strategyItems.forEach((strategy, idx) => {
          addPageIfNeeded(18);

          doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
          doc.circle(margin + 3, y - 1.2, 2.4, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("NotoSansKR", "bold");
          doc.setFontSize(8);
          doc.text(String(idx + 1), margin + 3, y - 0.3, { align: "center", baseline: "middle" });

          doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
          y += writeText(strategy, margin + 8, y, { width: contentWidth - 8, fontSize: 10 }) + 4;
        });
      }

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
      }

      doc.save(`RFP_분석결과_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("PDF 생성 오류:", error);
      alert("PDF 생성 중 오류가 발생했습니다.");
    }
  };
  const unpackFastApiData = (fastapi: any) => {
    const data = fastapi?.data ?? fastapi; // 혹시 이미 data만 온 경우도 방어
    const expanded = data as Step2ResultExpanded;

    if (expanded && expanded.report) {
      setReport(expanded.report ?? null);
      setTrackA(expanded.track_a ?? []);
      setTrackB(expanded.track_b ?? []);
    } else {
      setReport(data as ReportData);
      setTrackA([]);
      setTrackB([]);
    }
  };

  const handleClose = (id: number) => {
    navigate("/process", {
      state: { noticeId: id },
    });
  };

  useEffect(() => {
    if (!noticeId) {
      setErrorMsg("noticeId가 없습니다.");
      return;
    }

    if (!rfpResult) {
      setErrorMsg("결과 데이터가 없습니다. (state 전달 누락)");
      return;
    }

    // ✅ Spring envelope → fastapi → data
    const fastapi = rfpResult.fastapi;
    if (!fastapi) {
      setErrorMsg("fastapi 응답이 없습니다.");
      return;
    }

    unpackFastApiData(fastapi);
  }, [noticeId, rfpResult]);

  const handleBack = (id: number) => {
    navigate("/process/rfp", {
      state: { noticeId: id },
    });
  };

  const handleReExtract = (id: number) => {
    // 재추출은 결과 페이지에서 직접 호출하지 말고
    // 검색 페이지로 돌아가서 재실행하는 게 깔끔함(업로드 파일 필요)
    handleBack(id);
  };

  if (loading) {
    return (
      <Container>
        <Card>
          <div className="title" style={{ marginLeft: 0, marginBottom: 20 }}>
            유관 RFP 검색
          </div>
          <Section>
            <LoadingSpinner />
            <div style={{ textAlign: "center", marginTop: 20 }}>
              유사 RFP 검색 중...
            </div>
          </Section>
        </Card>
      </Container>
    );
  }

  if (errorMsg) {
    return (
      <Container>
        <Card>
          <div className="title" style={{ marginLeft: 0, marginBottom: 20 }}>
            유관 RFP 검색
          </div>
          <Section style={{ color: "red", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {errorMsg}
          </Section>
          <RightActionRow>
            <button
              type="button"
              className="button_center"
              style={{ width: 120 }}
              onClick={() => {
                if (!noticeId) return;
                handleBack(noticeId);
              }}
            >
              돌아가기
            </button>
          </RightActionRow>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <div className="title" style={{ marginLeft: 0, marginBottom: 20 }}>
          유관 RFP 검색 결과
        </div>

        <SectionTitle>분석 요약</SectionTitle>
        <Section>
          {report?.summary_opinion ? report.summary_opinion : "요약 결과가 없습니다."}
        </Section>

        <Divider />

        <SectionTitle>
          Track A: 동일 발주처 유사 RFP
          <Badge color="#3b82f6">중복성 집중 검토</Badge>
        </SectionTitle>
        <Section>
          {report?.track_a_comparison && report.track_a_comparison.length > 0 ? (
            <List>
              {report.track_a_comparison.map((item, idx) => (
                <ListItem key={idx}>
                  <ItemTitle>
                    {item.title ?? "제목 없음"}{" "}
                    <MetaText>
                      ({item.year ?? "연도미상"}, {item.ministry ?? "부처미상"})
                    </MetaText>
                    <SimilarityBadge level={item.similarity ?? "하"}>
                      유사도: {item.similarity ?? "-"}
                    </SimilarityBadge>
                  </ItemTitle>
                  <ItemBody>{item.difference ?? "-"}</ItemBody>
                </ListItem>
              ))}
            </List>
          ) : (
            <EmptyMessage>동일 발주처 유사 RFP가 없습니다.</EmptyMessage>
          )}
        </Section>

        <Divider />

        <SectionTitle>
          Track B: 타 발주처 유사 RFP
          <Badge color="#10b981">차별성 집중 검토</Badge>
        </SectionTitle>
        <Section>
          {report?.track_b_comparison && report.track_b_comparison.length > 0 ? (
            <List>
              {report.track_b_comparison.map((item, idx) => (
                <ListItem key={idx}>
                  <ItemTitle>
                    {item.title ?? "제목 없음"}{" "}
                    <MetaText>
                      ({item.year ?? "연도미상"}, {item.ministry ?? "부처미상"})
                    </MetaText>
                    <SimilarityBadge level={item.similarity ?? "하"}>
                      유사도: {item.similarity ?? "-"}
                    </SimilarityBadge>
                  </ItemTitle>
                  <ItemBody>{item.difference ?? "-"}</ItemBody>
                </ListItem>
              ))}
            </List>
          ) : (
            <EmptyMessage>타 발주처 유사 RFP가 없습니다.</EmptyMessage>
          )}
        </Section>

        <Divider />

        <SectionTitle>권장 차별화 전략</SectionTitle>
        <Section>
          {report?.strategies && report.strategies.length > 0 ? (
            <StrategyList>
              {report.strategies.map((s, idx) => (
                <StrategyItem key={idx}>
                  <StrategyNumber>{idx + 1}</StrategyNumber>
                  <StrategyText>{s}</StrategyText>
                </StrategyItem>
              ))}
            </StrategyList>
          ) : (
            <EmptyMessage>전략 결과가 없습니다.</EmptyMessage>
          )}
        </Section>

        <ModalActions>
          <MiniBtn
            type="button"
            onClick={() => {
              if (!noticeId) return;
              handleReExtract(noticeId); // = handleBack(noticeId)
            }}
          >
            재추출
          </MiniBtn>

          <MiniBtn
            type="button"
            onClick={() => {
              if (!noticeId) return;
              handleClose(noticeId);
            }}
          >
            닫기
          </MiniBtn>
        </ModalActions>

        <DownloadWrapper>
          <DownloadButton type="button" onClick={handleDownload}>
            분석 리포트 다운로드 (PDF)
          </DownloadButton>
        </DownloadWrapper>
      </Card>
    </Container>
  );
};

export default RFPSearchPageResult;

/* ===== styled-components ===== */

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background: var(--color-bg-main, #f3f4f6);
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
  padding: 32px;
  box-sizing: border-box;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Badge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 4px 10px;
  background: ${(props) => props.color};
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
`;

const Section = styled.div`
  width: 100%;
  min-height: 200px;
  max-height: 400px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 18px;
  box-sizing: border-box;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: #f1f3f5; border-radius: 10px; }
  &::-webkit-scrollbar-thumb { background: #adb5bd; border-radius: 10px; }
  &::-webkit-scrollbar-thumb:hover { background: #868e96; }
`;

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 24px 0;
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ListItem = styled.li`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s;

  &:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
`;

const ItemTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const MetaText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
`;

const SimilarityBadge = styled.span<{ level: string }>`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${(props) =>
    props.level === "상" ? "#fef3c7" : props.level === "중" ? "#dbeafe" : "#f3f4f6"};
  color: ${(props) =>
    props.level === "상" ? "#92400e" : props.level === "중" ? "#1e40af" : "#374151"};
`;

const ItemBody = styled.div`
  font-size: 13px;
  color: #4b5563;
  line-height: 1.7;
  white-space: pre-wrap;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #9ca3af;
  padding: 40px 0;
  font-size: 14px;
`;

const StrategyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const StrategyItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const StrategyNumber = styled.div`
  min-width: 28px;
  height: 28px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
`;

const StrategyText = styled.div`
  flex: 1;
  font-size: 14px;
  color: #374151;
  line-height: 1.7;
`;

const RightActionRow = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const ActionButton = styled.button<{ variant?: "primary" | "secondary" }>`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.variant === "secondary"
      ? `
    background: #ffffff;
    border: 1px solid #d1d5db;
    color: #374151;
    &:hover { background: #f9fafb; }
  `
      : `
    background: var(--color-accent, #3b82f6);
    border: none;
    color: white;
    &:hover { background: var(--color-accent-hover, #2563eb); }
  `}
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
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 60px auto 0;

  @keyframes spin { to { transform: rotate(360deg); } }
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