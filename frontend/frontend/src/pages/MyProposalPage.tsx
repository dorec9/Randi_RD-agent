//MyProposalPage.tsx
import React, { useMemo, useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import "../styles/Global.css";

type NoticeItem = {
  id: number;
  title: string;
  progress: string;
  isRead: boolean;

  url?: string;
  org?: string;
  budget?: string;
  period?: string;
  summary?: string;
};

const FAV_KEY = "bb_notice_favs_v1";
const PAGE_SIZE = 10;

type TabKey = "ALL" | "HASHTAG" | "FAV";

const loadFavIds = (): number[] => {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as number[]) : [];
  } catch {
    return [];
  }
};

const saveFavIds = (ids: number[]) => {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  } catch {}
};

const MyProposalPage: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<NoticeItem[]>([]);
  const [favIds, setFavIds] = useState<number[]>(() => loadFavIds());
  const [tab, setTab] = useState<TabKey>("ALL");
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<NoticeItem | null>(null);

  // ✅ 내 제안서 목록 불러오기
  useEffect(() => {
    fetch("/api/proposals/my")
      .then((res) => res.json())
      .then((list) => {
        setItems(
          list.map((p: any) => ({
            id: p.id,
            title: p.noticeTitle,
            progress: p.progress,
            isRead: true,
            org: p.agency,
            budget: p.budget,
            period: p.period,
            summary: p.summary,
            url: p.link,
          }))
        );
      })
      .catch(console.error);
  }, []);

  const toggleFav = (id: number) => {
    setFavIds((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavIds(next);
      return next;
    });
  };

  const openNotice = (notice: NoticeItem) => {
    setSelected(notice);
  };

  const handleConfirm = (id: number) => {
    navigate(`/proposal/${id}`);
  };

  const handleDelete = (id: number) => {
    fetch(`/api/proposals/${id}`, { method: "DELETE" })
      .then(() => {
        setItems((prev) => prev.filter((it) => it.id !== id));
        if (selected?.id === id) setSelected(null);
      })
      .catch(console.error);
  };

  const baseByTab = useMemo(() => {
    if (tab === "ALL") return items;
    if (tab === "FAV") return items.filter((it) => favIds.includes(it.id));
    return [];
  }, [items, favIds, tab]);

  const filtered = useMemo(() => {
    const t = filterText.trim().toLowerCase();
    return baseByTab.filter((it) =>
      t ? it.title.toLowerCase().includes(t) : true
    );
  }, [baseByTab, filterText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <Shell>
      <Main>
        <Title>내 제안서 목록</Title>

        <Section>
          <HeaderRow>
            <div>공고 제목</div>
            <Center>진행도</Center>
          </HeaderRow>

          {pagedItems.length === 0 ? (
            <Empty>제안서가 없습니다.</Empty>
          ) : (
            pagedItems.map((it) => (
              <Row key={it.id}>
                <TitleButton onClick={() => openNotice(it)}>
                  {it.title}
                </TitleButton>

                <ProgressText status={it.progress}>
                  {it.progress}
                </ProgressText>

                <Actions>
                  <button
                    type="button"
                    className="button_center"
                    onClick={() => handleConfirm(it.id)}
                  >
                    확인
                  </button>

                  <button
                    type="button"
                    className="button_center"
                    onClick={() => handleDelete(it.id)}
                  >
                    삭제
                  </button>
                </Actions>
              </Row>
            ))
          )}

          <Pagination>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PageBtn
                key={p}
                type="button"
                data-active={p === page}
                onClick={() => setPage(p)}
              >
                {p}
              </PageBtn>
            ))}
          </Pagination>
        </Section>
      </Main>

      {selected && (
        <ModalOverlay onClick={() => setSelected(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{selected.title}</ModalTitle>

            <ModalGrid>
              <div className="label">기관</div>
              <div>{selected.org ?? "-"}</div>

              <div className="label">예산</div>
              <div>{selected.budget ?? "-"}</div>

              <div className="label">기간</div>
              <div>{selected.period ?? "-"}</div>

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
            </ModalGrid>

            <ModalSummary>
              <div className="label">요약</div>
              <div>{selected.summary ?? "-"}</div>
            </ModalSummary>

            <ModalActions>
              <MiniBtn onClick={() => handleConfirm(selected.id)}>
                확인
              </MiniBtn>
              <MiniBtn onClick={() => setSelected(null)}>
                닫기
              </MiniBtn>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </Shell>
  );
};

export default MyProposalPage;


/* =========================
   styled-components
========================= */

/* =========================
   styled-components (수정본)
========================= */

const Shell = styled.div`
  width: 100%;
  height: 100vh;
  background-color: #f5f5f5;
`;

const Layout = styled.div`
  display: flex;
  height: 100%;
`;

/* 👇 Sidebar.css와 동일 비율 */
const Side = styled.aside`
  width: 300px;
  background: #e6e6e6;
  color: black;

  border-right: 1px solid rgba(0, 0, 0, 0.12);
  padding: 16px 12px;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
`;


const BrandRow = styled.div`
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-weight: 700;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.75);
  margin-bottom: 10px;
`;

const SideTab = styled.button`
  width: 100%;
  height: 42px;

  display: flex;
  align-items: center;

  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  text-align: left;

  padding: 0 20px;

  background: transparent;
  border: 1px solid transparent;

  &[data-active="true"] {
    background: #ffffff;
    border-color: rgba(0, 0, 0, 0.15);
    font-weight: 700;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.65);
  }

  & + & {
    margin-top: 4px;
  }
`;


const Main = styled.main`
  flex: 1;
  padding: 60px;      /* 👈 TokenTab Container와 동일 */
  box-sizing: border-box;
`;


const Title = styled.div`
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 14px;
`;

const Section = styled.div`
  background: #efefef;
  border-radius: 10px;
  padding: 14px 16px;
  box-sizing: border-box;
  margin-bottom: 16px;
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  height: 36px;
  background-color: #e0e0e0;
  border: none;
  outline: none;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 14px;
`;

const ClearBtn = styled.button`
  height: 36px;
  padding: 0 12px;
  background: none;
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #f7f7f7;
  }
`;

const Hint = styled.div`
  margin-top: 10px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 120px 260px;
  align-items: center;
  padding: 4px 0 4px 54px;
  font-size: 13px;
  color: #333;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 120px 350px;
  align-items: center;
  padding: 4px 0 4px 54px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
`;

const ActionHeader = styled.div`
  display: grid;
  grid-template-columns: 196px;
  gap: 10px;
  justify-content: end;
  align-items: center;
  padding-right: 2px;
`;

const ActionHeaderItem = styled.div`
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  text-align: center;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.85;
`;

const TitleButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  padding: 20px 8px;

  &:hover {
    text-decoration: underline;
  }
`;

const UnreadBadge = styled.span`
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  align-self: center;
  text-align: center;
  min-width: 56px; /* 헤더 폭과 맞추기 */
`;

const Center = styled.div`
  text-align: center;
  font-size: 14px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  align-items: center;
`;

const FavBtn = styled.button`
  width: 34px;
  height: 34px;
  padding: 0;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  cursor: pointer;

  position: relative;
  display: block;

  &[data-active="true"] {
    border-color: rgba(0, 0, 0, 0.35);
  }

  &:hover {
    background: #f7f7f7;
  }
`;

const FavIcon = styled.span`
  position: absolute;
  left: 50%;
  top: 45%;

  transform: translate(-50%, -50%);

  font-size: 18px;
  line-height: 1;
  display: block;
`;

const MiniBtn = styled.button`
  width: 72px;
  height: 34px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #f7f7f7;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  padding-top: 12px;
`;

const PageBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  padding: 4px 6px;
  opacity: 0.75;
  font-weight: 400;
  text-decoration: none;

  &[data-active="true"] {
    opacity: 1;
    font-weight: 700;
    text-decoration: underline;
  }
`;

const Empty = styled.div`
  padding: 22px 0;
  text-align: center;
  font-size: 14px;
  color: #666;
`;

const BottomRight = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
`;

const MiniOutlineBtn = styled.button`
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.35);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #f7f7f7;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
  z-index: 9999;
`;

const ModalCard = styled.div`
  width: 760px;
  max-width: 95vw;
  background: #ffffff;
  border-radius: 12px;
  padding: 22px;
  box-sizing: border-box;
`;

const ModalTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ModalBadge = styled.span`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  font-weight: 500;
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  row-gap: 10px;
  column-gap: 12px;
  align-items: center;
`;

const ModalSummary = styled.div`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 14px;
  line-height: 1.45;
`;

const ModalActions = styled.div`
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const ProgressText = styled.div<{ status: string }>`
  font-size: 14px;
  margin-right: 10px;

    color: ${({ status }) =>
    status === "완료" ? "#2e7d32" :
    status === "작성 중" ? "#1565c0" :
    "#333"};
`;
