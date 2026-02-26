import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Global.css";
import http from "../../api/http";

import { jsPDF } from "jspdf";
import { NotoSansKR } from "../../utils/NotoSansKR";

type EligibilityStatus = "가능" | "불가" | "보류";

type NoticeAnalysisAggregatedResponse = {
  eligibility: {
    status: EligibilityStatus;
    summary: string;

    judgments: Array<{
      id: number;
      category: string;
      requirement_text: string;
      judgment: EligibilityStatus;
      reason: string;
      company_info_used: string;
      quote_from_announcement: string;
      additional_action: string | null;
    }>;

    missing_info: string[];
    warning_items: string[];
    recommendations: string[];
  };

  research_intent: {
    policy_background: string;
    target_issues: string[];
  };

  evaluation_weight_analysis: {
    summary: string;
    high_weight_items: Array<{
      item: string;
      points: number;
      strategy: string;
    }>;
  };

  deliverables: string[];
  mandatory_requirements: string[];
};

/** 섹션 타이틀 + 섹션 카드 공통 블록 */
const SectionBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const id = title.replace(/\s+/g, "-");
  return (
    <SectionWrap id={id}>
      <SectionTitleRow>
        <SectionTitle>{title}</SectionTitle>
      </SectionTitleRow>
      <SectionCard>{children}</SectionCard>
    </SectionWrap>
  );
};

const NoticeNewPageResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const noticeId = location.state?.noticeId as number | undefined;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aggregated, setAggregated] = useState<NoticeAnalysisAggregatedResponse | null>(null);

  const handleClose = (id: number) => {
    navigate("/process", {
      state: { noticeId: id },
    });
  };

  useEffect(() => {
    if (!noticeId) {
      setError("noticeId가 없습니다. /process에서 다시 들어오세요.");
      return;
    }

    setLoading(true);
    setError(null);

    http
      .get(`/api/notices/${noticeId}/analysis-aggregated`)
      .then(({ data }) => {
        setAggregated(data as NoticeAnalysisAggregatedResponse);
      })
      .catch((e) => {
        console.error(e);
        setError("분석 결과 조회 실패");
      })
      .finally(() => setLoading(false));
  }, [noticeId]);

  const handleBack = (id: number) => {
    navigate("/process/analysis", { state: { noticeId: id } });
  };

  const handleDownloadPDF = () => {
    if (!aggregated) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setLineHeightFactor(1.6); // Increase line spacing for better readability

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
    // Dark dashboard header
    doc.setFillColor(COLORS.headerBg[0], COLORS.headerBg[1], COLORS.headerBg[2]);
    doc.rect(0, 0, pageWidth, 50, "F");

    doc.setFont("NotoSansKR", "bold");
    doc.setFontSize(24);
    doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
    doc.text("공고문 분석 리포트", margin, 32);

    doc.setFont("NotoSansKR", "normal");
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated on ${today}  |  Notice ID: ${noticeId ?? "N/A"}`, margin, 42);

    y = 60;

    // ================= DASHBOARD SUMMARY =================
    // 1. Overall Status Card
    const status = aggregated.eligibility?.status ?? "보류";
    let statusColor = COLORS.warning;
    if (status === "가능") statusColor = COLORS.primary;
    if (status === "불가") statusColor = COLORS.danger;

    // Card Background
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, 35, 3, 3, "FD");

    // Status Circle/Box
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(margin + 5, y + 5, 25, 25, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("NotoSansKR", "bold");
    doc.setFontSize(14);
    doc.text(status, margin + 17.5, y + 17, { align: "center", baseline: "middle" });
    doc.setFontSize(8);
    doc.text("판정 결과", margin + 17.5, y + 23, { align: "center", baseline: "middle" });

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
    const summaryLines = doc.splitTextToSize(aggregated.eligibility?.summary ?? "-", summaryW);
    // Limit lines to 3 to fit
    const displayLines = summaryLines.slice(0, 3);
    doc.text(displayLines, summaryX, y + 18);

    y += 45;

    // 2. Metrics Row (Judgments Count)
    const judgments = aggregated.eligibility?.judgments ?? [];
    const countPass = judgments.filter(j => j.judgment === "가능").length;
    const countFail = judgments.filter(j => j.judgment === "불가").length;
    const countHold = judgments.filter(j => j.judgment === "보류").length;
    const totalReqs = judgments.length;

    const boxGap = 5;
    const boxW = (contentWidth - (boxGap * 3)) / 4;
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

    drawStatBox("총 항목", totalReqs, COLORS.secondary, margin);
    drawStatBox("충족", countPass, COLORS.primary, margin + boxW + boxGap);
    drawStatBox("미충족", countFail, COLORS.danger, margin + (boxW + boxGap) * 2);
    drawStatBox("검토 필요", countHold, COLORS.warning, margin + (boxW + boxGap) * 3);

    y += 30;

    // ================= SECTIONS =================

    // 1. 자격요건 상세
    drawSectionHeader("자격요건 상세 체크리스트", "📋");

    judgments.forEach((req) => {
      addPageIfNeeded(25);

      // Judgment Badge
      let badgeColor = COLORS.gray;
      if (req.judgment === "가능") badgeColor = COLORS.primary;
      if (req.judgment === "불가") badgeColor = COLORS.danger;
      if (req.judgment === "보류") badgeColor = COLORS.warning;

      // Requirement Row
      doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      doc.roundedRect(margin, y, 14, 6, 2, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("NotoSansKR", "bold");
      doc.text(req.judgment, margin + 7, y + 4.2, { align: "center", baseline: "middle" });

      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFontSize(10);
      const reqLines = doc.splitTextToSize(req.requirement_text, contentWidth - 20);
      doc.text(reqLines, margin + 18, y + 4.5);

      let rowH = Math.max(10, reqLines.length * 7);

      // Sub-details (Reason, Logic, etc.)
      const extraY = y + rowH + 2;
      let addedH = 0;

      if (req.reason || req.quote_from_announcement) {
        doc.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
        // pre-calculate height
        let details = [];
        if (req.reason) details.push(`• 판단 근거: ${req.reason}`);
        if (req.quote_from_announcement) details.push(`• 관련 문구: ${req.quote_from_announcement}`);
        if (req.additional_action) details.push(`• 추가 조치: ${req.additional_action}`);

        const detailStr = details.join("\n");
        const detailLines = doc.splitTextToSize(detailStr, contentWidth - 10);
        const detailH = detailLines.length * 6 + 8;

        addPageIfNeeded(detailH + rowH); // Check total height

        // Draw gray box for details
        doc.roundedRect(margin + 5, y + rowH, contentWidth - 5, detailH, 2, 2, "F");

        doc.setFont("NotoSansKR", "normal");
        doc.setFontSize(8);
        doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
        doc.text(detailLines, margin + 8, y + rowH + 6);

        addedH = detailH + 2;
      }

      y += rowH + addedH + 8;

      // Light separator
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, y - 3, pageWidth - margin, y - 3);
    });

    // 2. 주요 확인 사항 (Missing, Warnings, Recommendations) Grid
    addPageIfNeeded(60);
    drawSectionHeader("주요 확인 및 조치 사항", "⚠️");

    const infoBoxes = [
      { title: "확인 필요 정보", items: aggregated.eligibility?.missing_info, color: COLORS.warning },
      { title: "주의 사항", items: aggregated.eligibility?.warning_items, color: COLORS.danger },
      { title: "추천 전략", items: aggregated.eligibility?.recommendations, color: COLORS.secondary },
    ];

    infoBoxes.forEach((box) => {
      if (box.items && box.items.length > 0) {
        addPageIfNeeded(40);

        // Styled Box for each category
        doc.setDrawColor(box.color[0], box.color[1], box.color[2]);
        doc.setLineWidth(0.5);
        doc.setFillColor(255, 255, 255);

        // Use double newline for spacing between items
        const itemLines = box.items.map(it => `• ${it}`);
        const fullText = itemLines.join("\n\n");
        const lines = doc.splitTextToSize(fullText, contentWidth - 10);

        // Height calc: lines * 7mm + padding
        const blockH = lines.length * 7 + 16;

        doc.roundedRect(margin, y, contentWidth, blockH, 2, 2, "S");

        // Header for box
        doc.setFillColor(box.color[0], box.color[1], box.color[2]);
        doc.rect(margin, y, contentWidth, 8, "F"); // Top bar

        doc.setFont("NotoSansKR", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text(box.title, margin + 4, y + 5.5);

        doc.setFont("NotoSansKR", "normal");
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.text(lines, margin + 5, y + 14);

        y += blockH + 10;
      }
    });

    // 3. 평가지표 분석 (Bar Charts)
    addPageIfNeeded(60);
    drawSectionHeader("평가 지표 및 배점 분석", "📊");

    doc.setFont("NotoSansKR", "normal");
    doc.setFontSize(10);
    const summaryH = writeText(aggregated.evaluation_weight_analysis?.summary ?? "", margin, y);
    y += summaryH + 10;

    const highWeight = aggregated.evaluation_weight_analysis?.high_weight_items ?? [];
    if (highWeight.length > 0) {
      highWeight.forEach((item) => {
        // Prepare Strategy Text (wrapped)
        doc.setFont("NotoSansKR", "normal");
        doc.setFontSize(8);
        const strategyLines = doc.splitTextToSize(`└ 전략: ${item.strategy}`, contentWidth - 10);
        const strategyHeight = strategyLines.length * 5;

        // Calculate dynamic box height: Top(Header=10) + Gap(2) + Strategy(H) + Bottom(4)
        const boxHeight = 16 + strategyHeight;

        addPageIfNeeded(boxHeight + 5);

        // Box background
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "S");

        // Label (Item Name)
        doc.setFont("NotoSansKR", "bold");
        doc.setFontSize(10);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.text(item.item, margin + 4, y + 6);

        // Score Text (Right aligned or next to title)
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        const scoreText = `[${item.points}점]`;
        const scoreW = doc.getTextWidth(scoreText);
        doc.text(scoreText, margin + contentWidth - scoreW - 4, y + 6);

        // Strategy Text
        doc.setFont("NotoSansKR", "normal");
        doc.setFontSize(8);
        doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
        doc.text(strategyLines, margin + 4, y + 12);

        y += boxHeight + 8;
      });
    }

    // 4. 과제 의도 및 목적
    drawSectionHeader("과제 배경 및 의도", "🎯");
    const policyBg = aggregated.research_intent?.policy_background;
    if (policyBg) {
      doc.setFont("NotoSansKR", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.text("정책 배경:", margin, y);
      y += 6;

      doc.setFont("NotoSansKR", "normal");
      const lines = doc.splitTextToSize(policyBg, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 8;
    }

    // Target Issues
    const targetIssues = aggregated.research_intent?.target_issues ?? [];
    if (targetIssues.length > 0) {
      addPageIfNeeded(20);
      y += 4;
      doc.setFont("NotoSansKR", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.text("해결하려는 주요 이슈", margin, y);
      y += 6;
      doc.setFont("NotoSansKR", "normal");

      targetIssues.forEach(v => {
        const addedH = writeText(`• ${v}`, margin + 4, y, { width: contentWidth - 4 });
        y += addedH + 3; // Spacing
      });
      y += 5;
    }

    // 5. 제출 문서 & 필수 준수사항
    drawSectionHeader("제출 문서 및 필수 준수사항", "📂");

    // Deliverables
    const deliverables = aggregated.deliverables ?? [];
    if (deliverables.length > 0) {
      addPageIfNeeded(20);
      doc.setFont("NotoSansKR", "bold");
      doc.setFontSize(10);
      doc.text("필수 제출 문서", margin, y);
      y += 6;

      doc.setFont("NotoSansKR", "normal");
      deliverables.forEach((v) => {
        addPageIfNeeded(10);
        // Checkbox
        doc.setDrawColor(150, 150, 150);
        doc.rect(margin, y - 2.5, 3, 3);
        const addedH = writeText(v, margin + 5, y, { width: contentWidth - 5 });
        y += addedH + 3;
      });
      y += 8;
    }

    // Mandatory
    const mandatory = aggregated.mandatory_requirements ?? [];
    if (mandatory.length > 0) {
      addPageIfNeeded(20);
      // Divider
      if (deliverables.length > 0) y += 2;

      doc.setFont("NotoSansKR", "bold");
      doc.setFontSize(10);
      doc.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
      doc.text("필수 준수사항 (주의)", margin, y);
      y += 6;

      doc.setFont("NotoSansKR", "normal");
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      mandatory.forEach((v) => {
        const estH = doc.splitTextToSize(v, contentWidth - 4).length * 5;
        addPageIfNeeded(estH + 5);

        doc.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
        doc.text("!", margin, y);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        const addedH = writeText(v, margin + 4, y, { width: contentWidth - 4 });
        y += addedH + 3;
      });
    }

    // Footer Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }

    doc.save(`분석_리포트_${today}.pdf`);
  };

  // ====== 에러/로딩 ======
  if (error) {
    return (
      <Container>
        <Card>
          <div className="title" style={{ marginLeft: 0, marginBottom: 20 }}>
            공고문 분석
          </div>
          <ErrorText>{error}</ErrorText>
          <RightActionRow>
            <button type="button" className="button_center" style={{ width: 120 }} onClick={() => navigate("/process")}>
              돌아가기
            </button>
          </RightActionRow>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Card>
          <div className="title" style={{ marginLeft: 0, marginBottom: 20 }}>
            공고문 분석
          </div>
          <div style={{ padding: 20 }}>로딩 중...</div>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <div className="title" style={{ marginLeft: 0, marginBottom: 18 }}>
          공고문 분석
        </div>

        {/* 1. 자격 요건 체크리스트 */}
        <SectionBlock title="자격 요건 체크리스트">
          <ScrollBox>
            {aggregated?.eligibility && (
              <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
                <Text>{aggregated.eligibility.summary}</Text>
              </div>
            )}

            {aggregated?.eligibility?.judgments && aggregated.eligibility.judgments.length > 0 ? (
              <RequirementList>
                {aggregated.eligibility.judgments.map((req) => (
                  <RequirementItem key={req.id}>
                    <RequirementHeader>
                      <HeaderLeft>
                        <RequirementTitle>{req.category}</RequirementTitle>
                      </HeaderLeft>
                      <StatusBadge status={req.judgment}>{req.judgment}</StatusBadge>
                    </RequirementHeader>

                    <ExpandableText text={req.requirement_text} />

                    {(req.reason || req.quote_from_announcement || req.additional_action) && <ArrowWrapper />}

                    {(req.reason || req.quote_from_announcement || req.additional_action) && (
                      <>
                        {req.reason && <ExpandableText text={req.reason} />}

                        {req.quote_from_announcement && (
                          <>
                            <Label style={{ marginTop: 12, color: "#0984e3" }}>관련 법령</Label>
                            <div
                              style={{
                                marginTop: 10,
                                padding: 14,
                                background: "#f1f3f5",
                                borderRadius: 8,
                                fontSize: 13,
                                lineHeight: 1.6,
                              }}
                            >
                              <div style={{ marginBottom: 8 }}>{req.quote_from_announcement}</div>
                            </div>
                          </>
                        )}

                        {req.additional_action && (
                          <ConfirmationBox>
                            <Label>추가 조치</Label>
                            <Text>{req.additional_action}</Text>
                          </ConfirmationBox>
                        )}
                      </>
                    )}
                  </RequirementItem>
                ))}
              </RequirementList>
            ) : (
              <EmptyMessage>자격 요건 데이터가 없습니다.</EmptyMessage>
            )}
          </ScrollBox>
        </SectionBlock>

        {/* 2. 과제 의도 및 목적 */}
        <SectionBlock title="과제 의도 및 목적">
          <Text>{aggregated?.research_intent?.policy_background ?? "데이터 없음"}</Text>
          {aggregated?.research_intent?.target_issues && aggregated.research_intent.target_issues.length > 0 && (
            <ul style={{ margin: "12px 0 0 0", paddingLeft: 18 }}>
              {aggregated.research_intent.target_issues.map((it, idx) => (
                <li key={idx} style={{ margin: "6px 0", lineHeight: 1.5 }}>
                  {it}
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>

        {/* 3. 평가지표 분석 */}
        <SectionBlock title="평가지표 분석">
          {aggregated?.evaluation_weight_analysis?.summary ? (
            <Text style={{ marginBottom: 12 }}>{aggregated.evaluation_weight_analysis.summary}</Text>
          ) : (
            <Text>데이터 없음</Text>
          )}

          {aggregated?.evaluation_weight_analysis?.high_weight_items &&
            aggregated.evaluation_weight_analysis.high_weight_items.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {aggregated.evaluation_weight_analysis.high_weight_items.map((it, idx) => (
                <li key={idx} style={{ margin: "10px 0", lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700 }}>{it.item}</div>
                  <div style={{ marginTop: 4, color: "#636e72" }}>
                    <Tag>{it.points}점</Tag> {it.strategy}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Text>데이터 없음</Text>
          )}
        </SectionBlock>

        {/* 4. 제출 문서 리스트 */}
        <SectionBlock title="필수 제출 문서 리스트">
          {aggregated?.deliverables && aggregated.deliverables.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {aggregated.deliverables.map((c, idx) => (
                <li key={idx} style={{ margin: "8px 0", lineHeight: 1.5 }}>
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyMessage>데이터 없음</EmptyMessage>
          )}
        </SectionBlock>

        {/* 5. 필수 준수사항 */}
        <SectionBlock title="필수 준수사항">
          {aggregated?.mandatory_requirements && aggregated.mandatory_requirements.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {aggregated.mandatory_requirements.map((c, idx) => (
                <li key={idx} style={{ margin: "8px 0", lineHeight: 1.5 }}>
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyMessage>데이터 없음</EmptyMessage>
          )}
        </SectionBlock>

        <ModalActions>
          <MiniBtn type="button" onClick={() => noticeId && handleBack(noticeId)}>
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
          <DownloadButton type="button" onClick={handleDownloadPDF}>
            분석 리포트 다운로드 (PDF)
          </DownloadButton>
        </DownloadWrapper>
      </Card>
    </Container>
  );
};

// ====== ExpandableText ======
const ExpandableText: React.FC<{ text: string }> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const el = textRef.current;
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    }
  }, [text]);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
      <Text
        ref={textRef as any}
        style={
          isExpanded
            ? {}
            : {
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
              minWidth: 0,
            }
        }
      >
        {text}
      </Text>
      {(isOverflowing || isExpanded) && (
        <MoreButton onClick={() => setIsExpanded((v) => !v)} style={{ flexShrink: 0 }}>
          [{isExpanded ? "접기" : "더보기"}]
        </MoreButton>
      )}
    </div>
  );
};

export default NoticeNewPageResult;

/* ================= styled-components ================= */

const Container = styled.div`
  padding: 60px;
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 28px;
`;

const RightActionRow = styled.div`
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
`;

const ErrorText = styled.div`
  color: #b91c1c;
  margin: 16px 0;
`;

const Label = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #636e72;
  margin-bottom: 6px;
`;

const Text = styled.div`
  font-size: 14px;
  color: #2d3436;
  line-height: 1.6;
`;

const SectionWrap = styled.section`
  margin-top: 28px;
`;

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: #111827;
  padding-left: 12px;
  border-left: 6px solid #00b894;
`;

const SectionCard = styled.div`
  width: 100%;
  background: #f8f9fa;
  border-radius: 14px;
  padding: 28px;
  box-sizing: border-box;
  position: relative;
  border: 1px solid #e5e7eb;
`;

const ScrollBox = styled.div`
  height: clamp(420px, 60vh, 760px);
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

const RequirementList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RequirementItem = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e0e0e0;
`;

const RequirementHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const RequirementTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #2d3436;
`;

const ConfirmationBox = styled.div`
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 12px;
  margin-top: 12px;
  border-radius: 4px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MoreButton = styled.button`
  background: none;
  border: none;
  color: #636e72;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 0;

  &:hover {
    color: #2d3436;
    text-decoration: underline;
  }
`;

const ArrowWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 10px;
  cursor: default;
  font-size: 14px;
  color: #636e72;
`;

const StatusBadge = styled.div<{ status: string }>`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  background-color: ${(props) => {
    switch (props.status) {
      case "가능":
        return "#00b894";
      case "불가":
        return "#d63031";
      case "보류":
        return "#fdcb6e";
      default:
        return "#b2bec3";
    }
  }};
  ${(props) =>
    props.status === "보류" &&
    `
      color: #2d3436;
    `}
`;

const Tag = styled.span`
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #fff;
  margin-right: 6px;
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
