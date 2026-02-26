//NoticeAlertpage.tsx
import styled from "styled-components";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Global.css";
import { META_KEY, NOTICE_FAV_CHANGED_EVENT } from "../common/constants";
import React, { useEffect, useMemo, useState } from "react";
import HashtagTab from "./HashtagTab";


type NoticeItem = {
  id: number;
  title: string;
  dday: string;
  // score: number;
  isRead: boolean;

  url?: string;
  attachFiles?: Array<{
    fileId: number;
    fileName: string;
    filePath: string;
  }>;
  org?: string;
  budget?: string;
  period?: string;
  summary?: string;
  hashtags?: string[];
};

type NoticeMeta = {
  fav: boolean;
  read: boolean;
}

type NoticeMetaMap = Record<number, NoticeMeta>;

// const FAV_KEY = "bb_notice_favs_v1"; // 찜하기만 저장되는 키
const PAGE_SIZE = 6;

type ReadFilter = "ALL" | "READ" | "UNREAD";
type DdayFilter = "ALL" | "D0_1" | "D2_3" | "D4_7" | "D8PLUS";
type ScoreFilter = "ALL" | "S80" | "S70" | "S60" | "S0";
type TabKey = "ALL" | "HASHTAG" | "FAV";

/* =========================
   유틸
========================= */
// const loadFavIds = (): number[] => {
//   try {
//     const raw = localStorage.getItem(FAV_KEY);
//     return raw ? JSON.parse(raw) : [];
//   } catch {
//     return [];
//   }
// };

// const saveFavIds = (ids: number[]) => {
//   try {
//     localStorage.setItem(FAV_KEY, JSON.stringify(ids));
//   } catch { }
// };

// 찜하기와 안읽음 저장
const loadMetaMap = (): NoticeMetaMap => {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveMetaMap = (map: NoticeMetaMap) => {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(NOTICE_FAV_CHANGED_EVENT));
  } catch { }
};


const calcDday = (endDate?: string) => {
  if (!endDate) return "-";

  if (!/\d{4}/.test(endDate)) {
    return endDate;
  }

  let dateStr = endDate;
  if (endDate.includes("~")) {
    const parts = endDate.split("~");
    dateStr = parts[parts.length - 1].trim();
  }

  if (/^\d{8}$/.test(dateStr)) {
    dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(dateStr);
    end.setHours(0, 0, 0, 0);

    if (isNaN(end.getTime())) {
      return endDate;
    }

    const diff = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff < 0) return "마감";
    return `D-${diff}`;
  } catch (e) {
    console.error("D-day 계산 오류:", e, dateStr);
    return endDate;
  }
};

const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
  if (totalPages <= 10) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  pages.push(1);

  if (currentPage <= 5) {
    for (let i = 2; i <= 10; i++) {
      pages.push(i);
    }
    pages.push("...");
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 4) {
    pages.push("...");
    for (let i = totalPages - 9; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push("...");
    for (let i = currentPage - 3; i <= currentPage + 3; i++) {
      pages.push(i);
    }
    pages.push("...");
    pages.push(totalPages);
  }

  return pages;
};

/* =========================
   컴포넌트
========================= */
const NoticeAlertPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const view = searchParams.get("view");
  const type = searchParams.get("type");
  const tabParam = searchParams.get("tab");

  const [items, setItems] = useState<NoticeItem[]>([]);
  // const [favIds, setFavIds] = useState<number[]>(loadFavIds);
  const [metaMap, setMetaMap] = useState<NoticeMetaMap>(loadMetaMap);

  const [tab, setTab] = useState<TabKey>("ALL");

  const [readFilter, setReadFilter] = useState<ReadFilter>("ALL");
  const [ddayFilter, setDdayFilter] = useState<DdayFilter>("ALL");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("ALL");
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<NoticeItem | null>(null);

  /* =========================
     목록 조회
  ========================= */
  useEffect(() => {
    fetch("/api/notices?size=1000&sort=noticeId,asc")
      .then((res) => res.json())
      .then((data) => {
        const list = data.content ?? data;

        const normalized: NoticeItem[] = list.map((n: any) => {
          const meta = metaMap[n.noticeId];

          return {
            id: n.noticeId,
            title: n.title,
            isRead: meta?.read ?? false,
            dday: calcDday(n.reqstDt),
            hashtags: n.hashtags ?? [],
            org: n.excInsttNm ?? "-",
            period: n.reqstDt ?? "-",
          };
        });

        setItems(normalized);
      })
      .catch(console.error);
  }, []);

  // Sync tab state with URL query parameter
  useEffect(() => {
    if (tabParam === "hashtag") {
      setTab("HASHTAG");
    } else if (tabParam === "fav") {
      setTab("FAV");
    } else {
      setTab("ALL");
    }
  }, [tabParam]);

  /* =========================
     필터
  ========================= */
  const parseDday = (dday: string) => {
    const n = Number(dday.replace("D-", ""));
    return Number.isNaN(n) ? 9999 : n;
  };

  const passRead = (it: NoticeItem) =>
    readFilter === "ALL"
      ? true
      : readFilter === "READ"
        ? it.isRead
        : !it.isRead;

  const passDday = (it: NoticeItem) => {
    const d = parseDday(it.dday);
    if (ddayFilter === "ALL") return true;
    if (ddayFilter === "D0_1") return d <= 1;
    if (ddayFilter === "D2_3") return d >= 2 && d <= 3;
    if (ddayFilter === "D4_7") return d >= 4 && d <= 7;
    return d >= 8;
  };

  /* =========================
     상세 열기
  ========================= */
  const openNotice = async (notice: NoticeItem) => {
    try {
      const res = await fetch(`/api/notices/${notice.id}`);
      const d = await res.json();

      const stripHtml = (html: string) => {
        if (!html) return "-";
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "-";
      };

      const attachFiles = (d.files || []).map((file: any) => ({
        fileId: file.fileId,
        fileName: file.fileName,
        filePath: file.filePath,
      }));

      markAsRead(notice.id);

      setSelected({
        ...notice,
        isRead: true,
        org: d.author || d.excInsttNm || "-",
        period: d.reqstDt || "-",
        url: d.link || "-",
        summary: stripHtml(d.description),
        attachFiles: attachFiles,
        hashtags: d.hashtags || [],
      });

      setItems((prev) =>
        prev.map((it) =>
          it.id === notice.id ? { ...it, isRead: true } : it
        )
      );
    } catch (e) {
      console.error("공고 상세 조회 오류:", e);
    }
  };

  const markAsRead = (id: number) => {
    setMetaMap((prev) => {
      const next = {
        ...prev,
        [id]: {
          fav: prev[id]?.fav ?? false,
          read: true,
        },
      };

      saveMetaMap(next);
      return next;
    });
  };

  const toggleFav = (id: number) => {
    setMetaMap((prev) => {
      const next = {
        ...prev,
        [id]: {
          fav: !prev[id]?.fav,
          read: prev[id]?.read ?? false,
        },
      };

      saveMetaMap(next);
      return next;
    });
  };


  const handleApply = (id: number) => {
    navigate("/process?view=notice", { state: { noticeId: id } });
  };

  // 메인 화면을 통해 바로 들어올경우
  const handleApply_main_analysis = (id: number) => {
    navigate("/process/analysis", { state: { noticeId: id } });
  };

  const handleApply_main_rfp = (id: number) => {
    navigate("/process/rfp", { state: { noticeId: id } });
  };

  const handleApply_main_announce = (id: number) => {
    navigate("/process/announce", { state: { noticeId: id } });
  };

  const handleApply_main_script = (id: number) => {
    navigate("/process/script", { state: { noticeId: id } });
  };

  const handleClearFilters = () => {
    setReadFilter("ALL");
    setDdayFilter("ALL");
    setScoreFilter("ALL");
    setFilterText("");
  };

  const handleFileDownload = (noticeId: number, fileId: number, fileName: string) => {
    const downloadUrl = `/api/notices/${noticeId}/files/${fileId}/download`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* =========================
     렌더링 데이터
  ========================= */
  const baseByTab = useMemo(() => {
    if (tab === "ALL") return items;
    if (tab === "FAV") return items.filter((it) => metaMap[it.id]?.fav);
    return [];
  }, [items, metaMap, tab]);

  const filtered = useMemo(() => {
    const t = filterText.trim().toLowerCase();
    return baseByTab
      .filter((it) => (t ? it.title.toLowerCase().includes(t) : true))
      .filter(passRead)
      .filter(passDday)
  }, [baseByTab, filterText, readFilter, ddayFilter, scoreFilter]);



  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageNumbers = getPageNumbers(page, totalPages);

  // 제목 텍스트 동적 변경
  const getTitleText = () => {
    if (tab === "HASHTAG") return "해시태그";
    if (tab === "FAV") return "찜";
    return "공고 목록";
  };

  // 신청 버튼 핸들러를 view/type에 따라 고르고,
  // view/type가 없으면 기본 handleApply로 보냄
  const getApplyHandler = () => {
    if (!selected) return () => { };

    if (view === "main") {
      if (type === "analysis") return () => handleApply_main_analysis(selected.id);
      if (type === "rfp") return () => handleApply_main_rfp(selected.id);
      if (type === "announce") return () => handleApply_main_announce(selected.id);
      if (type === "script") return () => handleApply_main_script(selected.id);
    }

    // 기본값 (쿼리 없을 때도 "신청" 보이게 + 동작)
    return () => handleApply(selected.id);
  };

  /* =========================
     JSX
  ========================= */
  return (
    <Shell>
      <Main>
        {/* 헤더 */}
        <Header>
          <Title>{getTitleText()}</Title>
          <HeaderActions>
            <SearchInput
              type="text"
              placeholder="🔍 공고 제목 검색"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </HeaderActions>
        </Header>

        {tab !== "HASHTAG" && (
          <FilterSection>
            <Select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as ReadFilter)}
            >
              <option value="ALL">전체</option>
              <option value="READ">읽음</option>
              <option value="UNREAD">읽지 않음</option>
            </Select>
            <Select
              value={ddayFilter}
              onChange={(e) => setDdayFilter(e.target.value as DdayFilter)}
            >
              <option value="ALL">마감일 전체</option>
              <option value="D0_1">D-0 ~ D-1</option>
              <option value="D2_3">D-2 ~ D-3</option>
              <option value="D4_7">D-4 ~ D-7</option>
              <option value="D8PLUS">D-8 이상</option>
            </Select>
            <ClearBtn onClick={handleClearFilters}>초기화</ClearBtn>
          </FilterSection>
        )}

        {tab === "HASHTAG" ? (
          <HashtagTab
            items={items}
            onApply={handleApply}
            onViewNotice={openNotice}
          />
        ) : (
          <CardGrid>
            {pagedItems.length > 0 ? (
              pagedItems.map((it) => {
                const isFav = metaMap[it.id]?.fav;
                const isRead = metaMap[it.id]?.read;

                return (
                  <NoticeCard key={it.id} onClick={() => openNotice(it)}>
                    <CardHeader>
                      {!it.isRead && <UnreadBadge>미확인</UnreadBadge>}
                      <FavBtn
                        data-active={isFav}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFav(it.id);
                        }}
                      >
                        {isFav ? "★" : "☆"}
                      </FavBtn>
                    </CardHeader>

                    <CardTitle>{it.title}</CardTitle>

                    <CardMeta>
                      <MetaItem>
                        <MetaLabel>기관</MetaLabel>
                        <MetaValue>{it.org}</MetaValue>
                      </MetaItem>
                      <MetaItem>
                        <MetaLabel>기한</MetaLabel>
                        <DdayBadge>{it.dday}</DdayBadge>
                      </MetaItem>
                    </CardMeta>

                    {it.hashtags && it.hashtags.length > 0 && (
                      <HashtagContainer>
                        {it.hashtags.slice(0, 3).map((tag, i) => (
                          <HashtagBadge key={i}>#{tag}</HashtagBadge>
                        ))}
                      </HashtagContainer>
                    )}

                    <CardActions>
                      <ApplyBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          openNotice(it);
                        }}
                      >
                        신청하기
                      </ApplyBtn>
                    </CardActions>
                  </NoticeCard>
                );
              })
            ) : (
              <Empty>조건에 맞는 공고가 없습니다.</Empty>
            )}
          </CardGrid>
        )}

        {totalPages > 1 && (
          <Pagination>
            <PageBtn
              disabled={page === 1}
              onClick={() => page > 1 && setPage(page - 1)}
            >
              ‹
            </PageBtn>

            {pageNumbers.map((p, idx) => {
              if (p === "...") {
                return <Ellipsis key={`ellipsis-${idx}`}>...</Ellipsis>;
              }
              return (
                <PageBtn
                  key={p}
                  data-active={p === page}
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </PageBtn>
              );
            })}

            <PageBtn
              disabled={page === totalPages}
              onClick={() => page < totalPages && setPage(page + 1)}
            >
              ›
            </PageBtn>
          </Pagination>
        )}
      </Main>

      {selected && (
        <ModalOverlay onClick={() => setSelected(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{selected.title}</ModalTitle>

            <ModalGrid>
              <React.Fragment key="org">
                <div className="label">기관</div>
                <div>{selected.org ?? "-"}</div>
              </React.Fragment>

              <React.Fragment key="period">
                <div className="label">기간</div>
                <div>
                  {selected.period ?? "-"}
                  {selected.dday && selected.dday !== "-" && (
                    <span style={{ marginLeft: "12px", fontWeight: "600", color: "#5B68E8" }}>
                      ({selected.dday})
                    </span>
                  )}
                </div>
              </React.Fragment>

              <React.Fragment key="url">
                <div className="label">URL</div>
                <div>
                  {selected.url ? (
                    <a href={selected.url} target="_blank" rel="noreferrer">
                      {selected.url}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </React.Fragment>

              {selected.hashtags && selected.hashtags.length > 0 && (
                <React.Fragment key="hashtags">
                  <div className="label">해시태그</div>
                  <HashtagContainer>
                    {selected.hashtags.map((tag, i) => (
                      <HashtagBadge key={i}>#{tag}</HashtagBadge>
                    ))}
                  </HashtagContainer>
                </React.Fragment>
              )}

              <React.Fragment key="attachments">
                <div className="label">첨부파일 다운로드</div>
                <div>
                  {selected.attachFiles && selected.attachFiles.length > 0 ? (
                    <AttachFileList>
                      {selected.attachFiles.map((file) => (
                        <AttachFileButton
                          key={file.fileId}
                          onClick={() => handleFileDownload(selected.id, file.fileId, file.fileName)}
                        >
                          📄 {file.fileName}
                        </AttachFileButton>
                      ))}
                    </AttachFileList>
                  ) : (
                    "-"
                  )}
                </div>
              </React.Fragment>
            </ModalGrid>

            <ModalSummary>
              <div className="label">요약</div>
              <div>{selected.summary ?? "-"}</div>
            </ModalSummary>

            <ModalActions>
              <ApplyBtn onClick={getApplyHandler()}>신청</ApplyBtn>
              <CloseBtn onClick={() => setSelected(null)}>닫기</CloseBtn>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Shell>
  );
};

export default NoticeAlertPage;

/* styled-components */
const Shell = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-bg-main);
`;

const Main = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 24px;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SearchInput = styled.input`
  width: 320px;
  height: 44px;
  padding: 0 16px;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  background: white;

  &:focus {
    border-color: #5B68E8;
    box-shadow: 0 0 0 3px rgba(91, 104, 232, 0.1);
  }

  &::placeholder {
    color: #9CA3AF;
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  height: 40px;
  background-color: white;
  border: 1px solid #E5E7EB;
  outline: none;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;

  &:focus {
    border-color: #5B68E8;
    box-shadow: 0 0 0 3px rgba(91, 104, 232, 0.1);
  }
`;

const ClearBtn = styled.button`
  height: 40px;
  padding: 0 20px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;

  &:hover {
    background: #F9FAFB;
    border-color: #D1D5DB;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const NoticeCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(91, 104, 232, 0.15);
    border-color: #5B68E8;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  min-height: 28px;
`;

const UnreadBadge = styled.span`
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  background: linear-gradient(135deg, #5B68E8 0%, #7B88F0 100%);
  color: white;
  font-weight: 600;
`;

const FavBtn = styled.button`
  width: 36px;
  height: 36px;
  background: white;
  border: 1.5px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  color: #FFC107;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &[data-active="true"] {
    border-color: #FFC107;
    background: #FFFBF0;
  }

  &:hover {
    background: #FFFBF0;
    transform: scale(1.1);
  }
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1F2937;
  margin: 0 0 16px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #F9FAFB;
  border-radius: 12px;
`;

const MetaItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MetaLabel = styled.span`
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
`;

const MetaValue = styled.span`
  font-size: 14px;
  color: #374151;
  font-weight: 500;
`;

const DdayBadge = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #EF4444;
  background: #FEF2F2;
  padding: 4px 12px;
  border-radius: 6px;
`;

const HashtagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
`;

const HashtagBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  background: rgba(91, 104, 232, 0.1);
  color: #5B68E8;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ApplyBtn = styled.button`
  flex: 1;
  height: 42px;
  background: linear-gradient(135deg, #5B68E8 0%, #7B88F0 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(91, 104, 232, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CloseBtn = styled.button`
  flex: 1;
  height: 42px;
  background: white;
  color: #6B7280;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: #F9FAFB;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 32px;
`;

const PageBtn = styled.button<{ disabled?: boolean }>`
  min-width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  padding: 0 12px;
  color: #6B7280;
  font-weight: 500;

  &:hover:not(:disabled) {
    background: #F9FAFB;
    border-color: #5B68E8;
    color: #5B68E8;
  }

  &[data-active="true"] {
    background: linear-gradient(135deg, #5B68E8 0%, #7B88F0 100%);
    color: white;
    border-color: #5B68E8;
    font-weight: 600;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`;

const Ellipsis = styled.span`
  padding: 0 8px;
  color: #9CA3AF;
  font-size: 14px;
`;

const Empty = styled.div`
  grid-column: 1 / -1;
  padding: 80px 0;
  text-align: center;
  font-size: 16px;
  color: #9CA3AF;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
  z-index: 9999;
  backdrop-filter: blur(4px);
`;

const ModalCard = styled.div`
  width: 760px;
  max-width: 95vw;
  max-height: 90vh;
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-sizing: border-box;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1F2937;
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  row-gap: 16px;
  column-gap: 20px;
  align-items: start;

  .label {
    font-weight: 600;
    color: #6B7280;
    font-size: 14px;
  }

  div:not(.label) {
    color: #374151;
    font-size: 14px;
    word-break: break-word;
  }

  a {
    color: #5B68E8;
    text-decoration: underline;

    &:hover {
      opacity: 0.8;
    }
  }
`;

const ModalSummary = styled.div`
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #F3F4F6;

  .label {
    font-weight: 600;
    color: #6B7280;
    font-size: 14px;
    margin-bottom: 12px;
  }

  div:not(.label) {
    font-size: 14px;
    line-height: 1.6;
    color: #374151;
  }
`;

const ModalActions = styled.div`
  margin-top: 28px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const AttachFileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AttachFileButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  color: #5B68E8;
  text-decoration: underline;
  word-break: break-all;
  text-align: left;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;
