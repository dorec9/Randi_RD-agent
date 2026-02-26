import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "../styles/UserSidebar.css";
import logo from "../assets/logo.jpg";
import { useAuth } from "../auth/AuthProvider";
import { META_KEY, NOTICE_FAV_CHANGED_EVENT } from "../common/constants";
import http from "../api/http";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

type NoticeMeta = {
  fav: boolean;
  read: boolean;
};

type NoticeMetaMap = Record<number, NoticeMeta>;

const loadMetaMap = (): NoticeMetaMap => {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const UserSidebar: React.FC<Props> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { me, logout } = useAuth();

  const [metaMap, setMetaMap] = useState<NoticeMetaMap>(loadMetaMap);

  const favCount = useMemo(() => {
    return Object.values(metaMap).filter((meta) => meta.fav).length;
  }, [metaMap]);

  useEffect(() => {
    const handler = () => setMetaMap(loadMetaMap());
    window.addEventListener(NOTICE_FAV_CHANGED_EVENT, handler);
    return () => window.removeEventListener(NOTICE_FAV_CHANGED_EVENT, handler);
  }, []);

  const [stats, setStats] = useState({
    totalNotices: 0,
    appliedNotices: 0,
    favNotices: 0,
  });

  useEffect(() => {
    fetch("/api/notices?size=1&sort=noticeId,asc")
      .then((res) => res.json())
      .then((data) => {
        const total = data.totalElements ?? (data.content?.length || 0);
        setStats((prev) => ({ ...prev, totalNotices: total }));
      })
      .catch(() => {
        setStats((prev) => ({ ...prev, totalNotices: 0 }));
      });

    setStats((prev) => ({
      ...prev,
      favNotices: favCount,
    }));

    // 요청(프로젝트) 개수 가져오기
    const fetchMyProjectsCount = async () => {
      try {
        // ManagerPage와 동일한 로직: my-audit-logs에서 특정 action 필터링
        // page=0, size=100 (충분히 큰 수)
        const targetActions = ["ANALYZE_STEP1", "SEARCH_STEP2", "PPT_STEP3", "SCRIPT_STEP4"];
        const res = await http.get("/api/mypage/my-audit-logs?page=0&size=100");
        const allLogs = res.data.content as any[];
        const filtered = allLogs.filter((log) => targetActions.includes(log.action));

        setStats((prev) => ({
          ...prev,
          appliedNotices: filtered.length,
        }));
      } catch (e) {
        console.error("Failed to fetch project count", e);
        // 에러 시 0으로 두거나 기존 값 유지
      }
    };

    if (me) {
      fetchMyProjectsCount();
    }

  }, [favCount, me]);

  const [openMenu, setOpenMenu] = useState<string | null>("notice");

  const displayName = me?.name?.trim() || "사용자";
  const displayDepartment = me?.department?.trim() || "-";
  const displayPosition = me?.position?.trim() || "-";
  const avatarInitial = displayName.charAt(0).toUpperCase() || "U";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (collapsed) {
    return (
      <aside className="user-sidebar collapsed" onClick={onToggle} style={{ cursor: "pointer" }}>
        <div className="sidebar-brand">
          <div
            className="logo-icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/");
            }}
          >
            <img src={logo} alt="RanDi" />
          </div>
        </div>

        <div className="sidebar-header" style={{ borderBottom: "none" }}>
          <div className="profile-compact">
            <div className="avatar-compact">{avatarInitial}</div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="user-sidebar">
      <div className="sidebar-brand">
        <div className="logo-full" onClick={() => navigate("/")}>
          <img src={logo} alt="RanDi" />
          <span className="logo-text">RanDi</span>
        </div>
        <button className="collapse-btn" onClick={onToggle}>
          ◀
        </button>
      </div>

      <div className="sidebar-header">
        <div className="profile-section">
          <div className="avatar">{avatarInitial}</div>

          <div className="profile-info" style={{ marginBottom: "16px" }}>
            {me ? (
              <>
                <div className="user-name">{displayName}</div>
                <div className="user-email">{me.email}</div>
                <div className="user-meta">
                  <div>부서: {displayDepartment}</div>
                  <div>직책: {displayPosition}</div>
                </div>
              </>
            ) : null}
          </div>

          {me ? (
            <button onClick={handleLogout} className="login-btn">
              로그아웃
            </button>
          ) : (
            <button onClick={() => navigate("/login")} className="login-btn">
              로그인
            </button>
          )}
        </div>

        <div className="stats-cards" style={{ visibility: me ? "visible" : "hidden" }}>
          <div className="stat-card" onClick={() => navigate("/notice?view=notice")} style={{ cursor: "pointer" }}>
            <div className="stat-label">전체 공고</div>
            <div className="stat-value">{stats.totalNotices}</div>
          </div>
          <div className="stat-card" onClick={() => navigate("/mypage?tab=projects")} style={{ cursor: "pointer" }}>
            <div className="stat-label">요청</div>
            <div className="stat-value">{stats.appliedNotices}</div>
          </div>
          <div className="stat-card" onClick={() => navigate("/notice?tab=fav")} style={{ cursor: "pointer" }}>
            <div className="stat-label">찜</div>
            <div className="stat-value">{favCount}</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <button className="nav-group-header" onClick={() => setOpenMenu(openMenu === "notice" ? null : "notice")}>
            <span className="nav-icon">📥</span>
            <span className="nav-text">공고</span>
            <span className="nav-arrow">{openMenu === "notice" ? "▼" : "▶"}</span>
          </button>

          {openMenu === "notice" && (
            <div className="nav-submenu">
              <NavLink
                to="/notice?view=notice"
                end
                className={({ isActive }) =>
                  isActive && !window.location.search.includes("tab=") ? "active" : ""
                }
              >
                <span className="nav-text">전체 공고</span>
              </NavLink>
              <NavLink
                to="/notice?tab=hashtag"
                className={({ isActive }) =>
                  isActive && window.location.search.includes("tab=hashtag") ? "active" : ""
                }
              >
                <span className="nav-text">해시 태그</span>
              </NavLink>
              <NavLink
                to="/notice?tab=fav"
                className={({ isActive }) =>
                  isActive && window.location.search.includes("tab=fav") ? "active" : ""
                }
              >
                <span className="nav-text">찜</span>
              </NavLink>
            </div>
          )}
        </div>

        <div className="nav-group">
          <button className="nav-group-header" onClick={() => setOpenMenu(openMenu === "service" ? null : "service")}>
            <span className="nav-icon">💡</span>
            <span className="nav-text">서비스</span>
            <span className="nav-arrow">{openMenu === "service" ? "▼" : "▶"}</span>
          </button>

          {openMenu === "service" && (
            <div className="nav-submenu">
              <NavLink
                to="/notice?view=main&type=analysis"
                className={() => (location.search.includes("type=analysis") ? "active" : "")}
              >
                <span className="nav-text">공고문 분석</span>
              </NavLink>
              <NavLink
                to="/notice?view=main&type=rfp"
                className={() => (location.search.includes("type=rfp") ? "active" : "")}
              >
                <span className="nav-text">유관 RFP 검색</span>
              </NavLink>
              <NavLink
                to="/notice?view=main&type=announce"
                className={() => (location.search.includes("type=announce") ? "active" : "")}
              >
                <span className="nav-text">발표자료 시작</span>
              </NavLink>
              <NavLink
                to="/notice?view=main&type=script"
                className={() => (location.search.includes("type=script") ? "active" : "")}
              >
                <span className="nav-text">스크립트 생성</span>
              </NavLink>
            </div>
          )}
        </div>

        {me && (
          <NavLink to="/mypage?tab=logs" className={({ isActive }) => (isActive ? "active" : "")}>
            <span className="nav-icon">🟠</span>
            <span className="nav-text">관리자</span>
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default UserSidebar;
