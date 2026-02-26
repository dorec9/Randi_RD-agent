import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { jwtDecode } from "jwt-decode";
import { useNavigate, useSearchParams } from "react-router-dom";
import http from "../../api/http";

type Role = "ADMIN" | "MEMBER";

interface ProjectDto {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  noticeId: number;
}

interface AuditLogDto {
  id: number;
  userName: string;
  action: string;
  targetDocument: string;
  timestamp: string;
}

type TabKey = "projects" | "logs";

const ManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [role, setRole] = useState<Role | null>(null);
  const tabFromQuery = (searchParams.get("tab") as TabKey) || null;

  const defaultTab: TabKey = useMemo(() => {
    if (tabFromQuery === "projects" || tabFromQuery === "logs") return tabFromQuery;
    return role === "ADMIN" ? "logs" : "projects";
  }, [role, tabFromQuery]);

  const [tab, setTab] = useState<TabKey>("projects");

  // 데이터 상태
  const [myProjects, setMyProjects] = useState<ProjectDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);

  // 페이지네이션
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ADMIN 로그 필터
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterKeyword, setFilterKeyword] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      setRole(decoded.role as Role);
    } catch (e) {
      console.error("토큰 오류", e);
    }
  }, []);

  // role 결정되면 tab 동기화
  useEffect(() => {
    if (!role) return;
    setTab(defaultTab);
  }, [role, defaultTab]);

  // tab/page/role 변경 시 데이터 로드
  useEffect(() => {
    if (!role) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, tab, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "projects") {
        // projects 탭이지만, 요구사항에 따라 특정 Action 로그를 보여줌
        // 1) 로그 fetch (ADMIN이면 전체, MEMBER면 내 로그)
        let logs: AuditLogDto[] = [];

        // ADMIN이 projects 탭을 볼 때도 '전체 로그' 중 특정 액션을 프로젝트처럼 볼 것인지,
        // 아니면 '내 로그'만 볼 것인지? 
        // -> 기획 의도가 "ManagerPage에서 tab이 projects일 때... logs일 때를 보고 Action이 ... 일 때 값들을 생성해줘"
        //    보통 프로젝트 탭은 '내 작업'을 의미하므로, 내 로그(my-audit-logs)를 가져오는 것이 맞아 보임.
        //    하지만 ADMIN도 '전체 프로젝트 현황'을 보고 싶을 수 있음.
        //    기존 코드: projects 탭 -> /api/mypage/projects (내 프로젝트)
        //    변경 코드: projects 탭 -> /api/mypage/my-audit-logs (내 로그) + 필터링

        // 우선 '내 로그' 기준으로 구현하되, ADMIN인 경우에도 '내 작업'을 보는 탭이라고 가정.
        // 만약 ADMIN이 전체 유저의 프로젝트 진행 상황을 봐야 한다면 audit-logs 호출이 필요함.
        // 여기서는 "내 프로젝트" 탭의 대체이므로 my-audit-logs 사용.

        /* 
           (주의) API가 페이징을 지원하므로, 모든 로그를 가져와서 필터링 하려면 
           페이지를 넉넉히 잡거나, 백엔드 필터 API가 필요함.
           현재 백엔드 수정 불가능 가정 시, 일정량(page=0, size=100 등)만 가져와서 필터링하거나
           그냥 1페이지 내에서 필터링된 결과만 보여질 수 있음.
           
           여기서는 일단 page=0 호출 후 프론트에서 필터링 (데이터가 많으면 문제될 수 있음)
           또는, 기존 API가 action 검색을 지원하므로(ADMIN용은 지원하지만 my-log는 불확실),
           안전하게 '내 로그' API 호출 후 클라이언트 필터링.
        */

        const targetActions = ["ANALYZE_STEP1", "SEARCH_STEP2", "PPT_STEP3", "SCRIPT_STEP4"];

        // my-audit-logs는 query param으로 action 필터링 지원 여부 확인 필요.
        // 기존 코드(101라인)에는 page 파라미터만 있음.
        // 만약 지원 안 한다면 다 가져와야 하는데, 일단 page 0에서 필터링 시도.
        const res = await http.get(`/api/mypage/my-audit-logs?page=${page}&size=100`);
        // size 파라미터가 먹히는지 모르겠으나 시도. 기본 20개라면 필터링 후 0개일 수도 있음.

        const allLogs = res.data.content as AuditLogDto[];
        const filtered = allLogs.filter(log => targetActions.includes(log.action));

        // 2) 공고 제목 가져오기 (N+1 방지 위해 Promise.all 사용)
        const uniqueNoticeIds = Array.from(new Set(filtered.map(log => log.targetDocument))).filter(Boolean);
        const titleMap = new Map<string, string>();

        await Promise.all(
          uniqueNoticeIds.map(async (docStr) => {
            if (!docStr) return;
            try {
              // docStr가 "noticeId=6" 또는 "noticeId=6, file=..." 등 복잡한 형태일 수 있음.
              // 숫자만 추출하거나 noticeId= 뒤의 숫자를 추출
              let nid = 0;
              // 1) noticeId= 숫자 패턴 검색
              const match = docStr.match(/noticeId=(\d+)/);
              if (match && match[1]) {
                nid = Number(match[1]);
              } else {
                // 2) 그냥 숫자만 있는 경우
                const parsed = Number(docStr);
                if (!isNaN(parsed)) nid = parsed;
              }

              if (!nid) {
                // 파싱 실패 시 그대로 둠
                titleMap.set(docStr, docStr);
                return;
              }

              const noticeRes = await http.get(`/api/notices/${nid}`);
              titleMap.set(docStr, noticeRes.data.title);
            } catch (e) {
              console.warn(`Failed to fetch notice title for targetDocument: ${docStr}`, e);
              titleMap.set(docStr, docStr);
            }
          })
        );

        // AuditLogDto -> ProjectDto 매핑
        const mappedProjects: ProjectDto[] = filtered.map(log => {
          let nid = 0;
          const docStr = log.targetDocument;
          if (docStr) {
            // 1) noticeId= 숫자 패턴 검색
            const match = docStr.match(/noticeId=(\d+)/);
            if (match && match[1]) {
              nid = Number(match[1]);
            } else {
              // 2) 그냥 숫자만 있는 경우
              const parsed = Number(docStr);
              if (!isNaN(parsed)) nid = parsed;
            }
          }

          return {
            id: log.id,
            title: titleMap.get(log.targetDocument) || log.targetDocument || "제목 없음",
            status: log.action,
            updatedAt: log.timestamp,
            noticeId: nid,
          };
        });

        setMyProjects(mappedProjects);
        // setTotalPages는 필터링 된 결과에 따라 다시 계산하기 어려우므로 
        // (전체 개수를 모르므로) 일단 0이나 1로 처리하거나, 
        // 무한 스크롤이 아니므로 현재 페이지 결과만 보여줌.
        setTotalPages(res.data.totalPages);

      } else {
        // logs 탭 (기존 로직 유지)
        if (role === "ADMIN") {
          const params = new URLSearchParams();
          params.set("page", String(page));
          if (filterUserId.trim()) params.set("userId", filterUserId.trim());
          if (filterAction.trim()) params.set("action", filterAction.trim());
          if (filterKeyword.trim()) params.set("keyword", filterKeyword.trim());

          const res = await http.get(`/api/mypage/audit-logs?${params.toString()}`);
          setAuditLogs(res.data.content);
          setTotalPages(res.data.totalPages);
        } else {
          // 내 로그
          const res = await http.get(`/api/mypage/my-audit-logs?page=${page}`);
          setAuditLogs(res.data.content);
          setTotalPages(res.data.totalPages);
        }
      }
    } catch (err) {
      console.error("데이터 로딩 실패", err);
    } finally {
      setLoading(false);
    }
  };

  const changeTab = (next: TabKey) => {
    setTab(next);
    setPage(0);
    setSearchParams((prev) => {
      prev.set("tab", next);
      return prev;
    });
  };

  const applyAdminFilter = () => {
    setPage(0);
    // page=0으로 fetch 다시
    fetchData();
  };

  const resetAdminFilter = () => {
    setFilterUserId("");
    setFilterAction("");
    setFilterKeyword("");
    setPage(0);
    // 초기화 후 fetch
    setTimeout(fetchData, 0);
  };

  return (
    <PageWrapper>
      <Container>
        <Header>
          <Title>{role === "ADMIN" ? "관리자 대시보드" : "마이페이지"}</Title>
          <HeaderBtn onClick={() => navigate("/resetPassword")}>
            🔒 비밀번호 변경
          </HeaderBtn>
        </Header>

        {/* 탭 */}
        <TabBar>
          <TabButton
            active={tab === "projects"}
            onClick={() => changeTab("projects")}
          >
            {role === "ADMIN" ? "프로젝트(내 작업)" : "내 프로젝트"}
          </TabButton>
          <TabButton
            active={tab === "logs"}
            onClick={() => changeTab("logs")}
          >
            {role === "ADMIN" ? "전체 로그" : "내 로그"}
          </TabButton>
        </TabBar>

        <ContentSection>
          <ContentArea>
            {loading && <LoadingText>데이터를 불러오는 중입니다...</LoadingText>}

            {/* 프로젝트 탭 */}
            {tab === "projects" && !loading && (
              <Table>
                <thead>
                  <tr>
                    <th style={{ width: "55%" }}>공고명</th>
                    <th>상태</th>
                    <th>생성일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {myProjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty">
                        프로젝트가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    myProjects.map((proj) => (
                      <tr key={proj.id}>
                        <td>
                          <TruncatedTitle title={proj.title}>
                            {proj.title}
                          </TruncatedTitle>
                        </td>
                        <td>
                          <StatusBadge status={proj.status}>{proj.status}</StatusBadge>
                        </td>
                        <td>{new Date(proj.updatedAt).toLocaleDateString()}</td>
                        <td>
                          <ActionButton
                            onClick={() => navigate("/process", { state: { noticeId: proj.noticeId } })}
                          >
                            작업 계속
                          </ActionButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}

            {/* 로그 탭 */}
            {tab === "logs" && !loading && (
              <>
                {/* ADMIN 전용 필터 */}
                {role === "ADMIN" && (
                  <FilterBar>
                    <FilterItem>
                      <FilterLabel>User ID</FilterLabel>
                      <FilterInput
                        value={filterUserId}
                        onChange={(e) => setFilterUserId(e.target.value)}
                        placeholder="예: 13"
                      />
                    </FilterItem>

                    <FilterItem>
                      <FilterLabel>Action</FilterLabel>
                      <FilterSelect
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                      >
                        <option value="">전체</option>
                        <option value="LOGIN">LOGIN</option>
                        <option value="DOWNLOAD">DOWNLOAD</option>
                        <option value="GENERATE">GENERATE</option>
                        <option value="ANALYZE_STEP1">ANALYZE_STEP1</option>
                        <option value="SEARCH_STEP2">SEARCH_STEP2</option>
                        <option value="PPT_STEP3">PPT_STEP3</option>
                        <option value="SCRIPT_STEP4">SCRIPT_STEP4</option>
                      </FilterSelect>
                    </FilterItem>

                    <FilterItem style={{ flex: 2 }}>
                      <FilterLabel>Keyword</FilterLabel>
                      <FilterInput
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                        placeholder="targetDocument / email 검색"
                      />
                    </FilterItem>

                    <FilterActions>
                      <FilterBtn onClick={applyAdminFilter}>적용</FilterBtn>
                      <FilterBtnGhost onClick={resetAdminFilter}>초기화</FilterBtnGhost>
                    </FilterActions>
                  </FilterBar>
                )}

                <Table>
                  <thead>
                    <tr>
                      <th style={{ width: "22%" }}>발생 시간</th>
                      <th style={{ width: "20%" }}>사용자</th>
                      <th style={{ width: "16%" }}>Action</th>
                      <th>대상</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty">
                          로그 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={{ fontWeight: 700, color: "#4b5563" }}>
                            {log.userName}
                          </td>
                          <td>
                            <ActionBadge action={log.action}>{log.action}</ActionBadge>
                          </td>
                          <td>{log.targetDocument}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>

                {/* 페이지네이션 */}
                <PaginationBox>
                  <PageBtn disabled={page === 0} onClick={() => setPage(page - 1)}>
                    &lt; 이전
                  </PageBtn>

                  <PageInfo>
                    {totalPages === 0 ? 0 : page + 1} / {totalPages}
                  </PageInfo>

                  <PageBtn
                    disabled={totalPages === 0 || page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    다음 &gt;
                  </PageBtn>
                </PaginationBox>
              </>
            )}
          </ContentArea>
        </ContentSection>
      </Container>
    </PageWrapper>
  );
};

export default ManagerPage;

/* ===== styles ===== */
const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  justify-content: center;
  padding: 40px 0;
  box-sizing: border-box;
`;

const Container = styled.div`
  width: 1100px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 18px;
  border-bottom: 2px solid #f3f4f6;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  margin: 0;
`;

const HeaderBtn = styled.button`
  background: #fff;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const TabBar = styled.div`
  display: flex;
  gap: 10px;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid ${({ active }) => (active ? "#2563eb" : "#d1d5db")};
  background: ${({ active }) => (active ? "#eff6ff" : "#fff")};
  color: ${({ active }) => (active ? "#1d4ed8" : "#374151")};
  font-weight: 800;
  cursor: pointer;
`;

const ContentSection = styled.div`
  flex: 1;
`;

const ContentArea = styled.div`
  min-height: 360px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 80px;
  color: #6b7280;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  flex: 1;

  th {
    background: #f9fafb;
    padding: 14px 16px;
    text-align: left;
    font-weight: 800;
    color: #4b5563;
    border-bottom: 1px solid #e5e7eb;
  }
  td {
    padding: 16px;
    border-bottom: 1px solid #f3f4f6;
    color: #374151;
    vertical-align: middle;
  }
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background-color: #f9fafb;
  }
  .empty {
    text-align: center;
    padding: 90px;
    color: #9ca3af;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  background: ${({ status }) => (status === "완료" ? "#d1fae5" : "#eff6ff")};
  color: ${({ status }) => (status === "완료" ? "#047857" : "#1d4ed8")};
`;

const ActionBadge = styled.span<{ action: string }>`
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  background: ${({ action }) =>
    action === "LOGIN"
      ? "#f3f4f6"
      : action === "DOWNLOAD"
      ? "#fee2e2"
      : "#fef3c7"};
  color: ${({ action }) =>
    action === "LOGIN"
      ? "#4b5563"
      : action === "DOWNLOAD"
      ? "#b91c1c"
      : "#b45309"};
`;

const ActionButton = styled.button`
  padding: 7px 14px;
  border: 1px solid #3b82f6;
  background: #fff;
  color: #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;

  &:hover {
    background: #eff6ff;
  }
`;

const PaginationBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px;
  gap: 18px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
`;

const PageBtn = styled.button`
  padding: 7px 14px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }

  &:disabled {
    background: #f3f4f6;
    color: #d1d5db;
    cursor: not-allowed;
    border-color: #e5e7eb;
  }
`;

const PageInfo = styled.span`
  font-size: 14px;
  color: #4b5563;
  font-weight: 900;
`;

const TruncatedTitle = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 550px;
  font-weight: 600;
`;

/* --- filter --- */
const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  align-items: flex-end;
`;

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
`;

const FilterLabel = styled.div`
  font-size: 12px;
  font-weight: 900;
  color: #6b7280;
`;

const FilterInput = styled.input`
  height: 36px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 0 12px;
  outline: none;

  &:focus {
    border-color: #93c5fd;
  }
`;

const FilterSelect = styled.select`
  height: 36px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 0 10px;
  outline: none;

  &:focus {
    border-color: #93c5fd;
  }
`;

const FilterActions = styled.div`
  display: flex;
  gap: 8px;
`;

const FilterBtn = styled.button`
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: white;
  font-weight: 900;
  cursor: pointer;
`;

const FilterBtnGhost = styled.button`
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  font-weight: 900;
  cursor: pointer;
`;
