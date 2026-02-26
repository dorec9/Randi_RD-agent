import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Global.css";

import { jsPDF } from "jspdf";
import { NotoSansKR } from "../../utils/NotoSansKR";

const ScriptCreatePageResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const noticeId = location.state?.noticeId as number | undefined;
  const scriptData = location.state?.scriptData as any; // API에서 받은 데이터

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!scriptData) {
      alert("스크립트 데이터가 없습니다.");
      navigate("/process");
    }
  }, [scriptData, navigate]);

  const handleBack = (id: number) => {
    navigate("/process/script", {
      state: { noticeId: id },
    });
  };

  const handleClose = (id: number) => {
    navigate("/process", {
      state: { noticeId: id },
    });
  };

  const handleDownloadPDF = () => {
    if (!scriptData) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

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

    // --- Colors & Styles ---
    const COLORS = {
      primary: [0, 184, 148],     // #00b894 (Green)
      secondary: [9, 132, 227],   // #0984e3 (Blue)
      danger: [214, 48, 49],      // #d63031 (Red)
      warning: [253, 203, 110],   // #fdcb6e (Yellow)
      dark: [45, 52, 54],         // #2d3436
      gray: [99, 110, 114],       // #636e72
      lightGray: [241, 243, 245], // #f1f3f5
      white: [255, 255, 255],
      headerBg: [30, 39, 46]      // Dark background for header
    };

    const addPageIfNeeded = (minSpace: number) => {
      if (y + minSpace <= pageHeight - margin) return;
      doc.addPage();
      y = 20;
    };

    // Helper: Draw defined text with auto-wrap
    const writeText = (text: string, x: number, yPos: number, opts?: { width?: number; fontSize?: number; color?: number[]; font?: string; align?: "left" | "center" | "right" }) => {
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
      // Approx height calculation: fontSize * 0.3527 (pt to mm) * 1.6 (line height) * lines
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

    // ================= HEADER =================
    doc.setFillColor(COLORS.headerBg[0], COLORS.headerBg[1], COLORS.headerBg[2]);
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setFont("NotoSansKR", "bold");
    doc.setFontSize(24);
    doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
    doc.text("발표 스크립트 생성 결과", margin, 32);

    doc.setFont("NotoSansKR", "normal");
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated on ${today}  |  Notice ID: ${noticeId ?? "N/A"}`, margin, 42);

    y = 60;

    // ================= DASHBOARD SUMMARY =================
    // Counts
    const slides = Array.isArray(scriptData.slides) ? scriptData.slides : [];
    const qna = Array.isArray(scriptData.qna) ? scriptData.qna : [];
    const totalSlides = slides.length;
    const totalQna = qna.length;

    // 1. Overall Status Card
    const status = "생성 완료"; // Assuming successful generation
    const statusColor = COLORS.primary;

    // Card Background
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, 35, 3, 3, "FD");

    // Status Circle/Box
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(margin + 5, y + 5, 25, 25, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("NotoSansKR", "bold");
    doc.setFontSize(12);
    doc.text(status, margin + 17.5, y + 17, { align: "center", baseline: "middle" });

    // Summary Text next to status
    const summaryX = margin + 35;
    const summaryW = contentWidth - 40;

    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.setFont("NotoSansKR", "bold");
    doc.setFontSize(12);
    doc.text("종합 요약", summaryX, y + 10);

    doc.setFont("NotoSansKR", "normal");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
    doc.text(`총 ${totalSlides}장의 발표용 슬라이드 스크립트와 ${totalQna}개의 예상 질문이 성공적으로 생성되었습니다.`, summaryX, y + 18);

    y += 45;

    // 2. Metrics Row
    const boxGap = 5;
    const boxW = (contentWidth - boxGap) / 2;
    const boxH = 20;

    const drawStatBox = (label: string, value: number | string, color: number[], xPos: number) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(xPos, y, 2, boxH, "F"); // Left colored strip

      doc.setFillColor(250, 250, 250);
      doc.rect(xPos + 2, y, boxW - 2, boxH, "F"); // Grey bg

      doc.setFont("NotoSansKR", "normal");
      doc.setFontSize(9);
      doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
      doc.text(label, xPos + 8, y + 8);

      doc.setFont("NotoSansKR", "bold");
      doc.setFontSize(14);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.text(String(value), xPos + 8, y + 16);
    };

    drawStatBox("총 슬라이드", `${totalSlides} 장`, COLORS.secondary, margin);
    drawStatBox("예상 질문 수", `${totalQna} 개`, COLORS.warning, margin + boxW + boxGap);

    y += 30;

    // ================= SECTIONS =================

    // 1. 발표 스크립트
    drawSectionHeader("발표 스크립트", "🎤");

    if (slides.length === 0) {
      writeText("데이터가 없습니다.", margin, y);
      y += 10;
    } else {
      slides.forEach((slide: any, idx: number) => {
        addPageIfNeeded(40);

        const pageNo = slide?.page ?? idx + 1;
        const title = slide?.title ?? "";
        const scriptText = slide?.script ?? "(스크립트 없음)";

        // Slide Box Header
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.roundedRect(margin, y, contentWidth, 8, 2, 2, "F"); // Top bar

        doc.setFont("NotoSansKR", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(`Slide ${pageNo}`, margin + 4, y + 5.5);

        if (title) {
          doc.setFont("NotoSansKR", "normal");
          doc.text(` : ${title}`, margin + 25, y + 5.5);
        }

        y += 16; // Increased gap to prevent overlap

        // Content
        const addedH = writeText(scriptText, margin + 2, y, { width: contentWidth - 4, color: COLORS.dark });

        // Light separator line below content if needed, or just standard spacing
        y += addedH + 10;

        // Draw bottom border or separator? Let's use a subtle line
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.line(margin, y - 5, pageWidth - margin, y - 5);
      });
    }

    addPageIfNeeded(60);

    // 2. 예상 질문 및 답변
    drawSectionHeader("예상 질문 및 답변", "💬");

    if (qna.length === 0) {
      writeText("데이터가 없습니다.", margin, y);
      y += 10;
    } else {
      qna.forEach((item: any, idx: number) => {
        addPageIfNeeded(40);

        const q = item?.question ?? "";
        const a = item?.answer ?? "";
        const tips = item?.tips ?? "";

        // Q
        const qPrefix = `Q${idx + 1}. `;
        // Use Secondary Color (Blue) for Question
        const qH = writeText(qPrefix + q, margin, y, {
          width: contentWidth,
          color: COLORS.secondary,
          font: "bold",
          fontSize: 11
        });
        y += qH + 6;

        // A
        // Use Primary Color (Green) for Answer
        const aH = writeText(`A. ${a}`, margin + 4, y, {
          width: contentWidth - 4,
          color: COLORS.primary,
          font: "normal",
          fontSize: 10
        });
        y += aH + 6;

        // Tip
        if (tips) {
          // Box for tip
          doc.setFont("NotoSansKR", "normal");
          doc.setFontSize(9);
          const tipText = `💡 Tip: ${tips}`;
          const tipLines = doc.splitTextToSize(tipText, contentWidth - 10);
          const tipH = tipLines.length * 5 + 6; // Height with padding

          addPageIfNeeded(tipH);

          // Yellow Border for Tip Box
          doc.setDrawColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
          doc.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
          doc.roundedRect(margin + 4, y, contentWidth - 4, tipH, 2, 2, "FD");

          doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
          doc.text(tipLines, margin + 8, y + 5);

          y += tipH + 8;
        } else {
          y += 4;
        }

        // Separator
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.5);
        doc.line(margin, y - 4, pageWidth - margin, y - 4);
      });
    }

    // Footer Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    const filename = `스크립트_결과_${today}.pdf`;
    doc.save(filename);
  };

  if (!scriptData) {
    return <Container>로딩 중...</Container>;
  }

  return (
    <Container>
      <Card>
        <div className="title" style={{ marginLeft: 0, marginBottom: 50 }}>
          스크립트 생성 결과
        </div>

        {/* 스크립트 섹션 */}
        <div className="title" style={{ fontSize: 15, marginBottom: 10 }}>
          발표 스크립트
        </div>
        <Section>
          {scriptData.slides && scriptData.slides.length > 0 ? (
            <ScriptList>
              {scriptData.slides.map((slide: any, index: number) => (
                <ScriptItem key={index}>
                  <ScriptHeader>
                    <SlideNumber>슬라이드 {slide.page}</SlideNumber>
                    <SlideTitle>{slide.title}</SlideTitle>
                  </ScriptHeader>
                  <ScriptContent>{slide.script}</ScriptContent>
                </ScriptItem>
              ))}
            </ScriptList>
          ) : (
            <EmptyMessage>스크립트 데이터가 없습니다.</EmptyMessage>
          )}
        </Section>
        <br />

        {/* 예상 질문 섹션 */}
        <div className="title" style={{ fontSize: 15, marginBottom: 10 }}>
          예상 질문 및 답변
        </div>
        <Section>
          {scriptData.qna && scriptData.qna.length > 0 ? (
            <QnaList>
              {scriptData.qna.map((item: any, index: number) => (
                <QnaItem key={index}>
                  <Question>Q{index + 1}. {item.question}</Question>
                  <Answer>A. {item.answer}</Answer>
                  {item.tips && <Tips>💡 Tip: {item.tips}</Tips>}
                </QnaItem>
              ))}
            </QnaList>
          ) : (
            <EmptyMessage>예상 질문 데이터가 없습니다.</EmptyMessage>
          )}
        </Section>

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
              handleClose(noticeId);
            }}
          >
            닫기
          </MiniBtn>
        </ModalActions>

        <DownloadWrapper>
          <DownloadButton type="button" onClick={handleDownloadPDF} disabled={loading}>
            스크립트 다운로드 (PDF)
          </DownloadButton>
        </DownloadWrapper>
      </Card>
    </Container>
  );
};

export default ScriptCreatePageResult;

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

const Section = styled.div`
  width: 100%;
  max-height: 400px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 28px;
  box-sizing: border-box;
  position: relative;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #636e72;
  padding: 40px;
`;

const DownloadWrapper = styled.div`
  margin-top: 40px;
  display: flex;
  justify-content: center;
`;

const DownloadButton = styled.button<{ disabled?: boolean }>`
  padding: 14px 28px;
  background-color: ${(p) => (p.disabled ? "#9aa0a6" : "#00b894")};
  color: white;
  border-radius: 8px;
  font-size: 16px;
  text-decoration: none;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  border: none;

  &:hover {
    background-color: ${(p) => (p.disabled ? "#9aa0a6" : "#009c7a")};
  }
`;

const ScriptList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ScriptItem = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e0e0e0;
`;

const ScriptHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const SlideNumber = styled.span`
  background: #2e6fdb;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
`;

const SlideTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #2d3436;
`;

const ScriptContent = styled.p`
  font-size: 14px;
  color: #2d3436;
  line-height: 1.8;
  margin: 0;
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

const QnaList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const QnaItem = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e0e0e0;
`;

const Question = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #2e6fdb;
  margin-bottom: 10px;
`;

const Answer = styled.div`
  font-size: 14px;
  color: #2d3436;
  line-height: 1.7;
  margin-bottom: 8px;
`;

const Tips = styled.div`
  font-size: 13px;
  color: #636e72;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #ffc107;
`;
