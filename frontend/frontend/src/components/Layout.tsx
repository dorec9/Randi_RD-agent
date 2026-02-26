import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Layout.css";
import { useAuth } from "../auth/AuthProvider";
import Footer from "./Footer";
import UserSidebar from "./UserSidebar";

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { me, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <>
      {/* ✅ 사이드바는 layout 밖 */}
      <UserSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(prev => !prev)}
      />
      <div className="layout"
        style={{ marginLeft: collapsed ? 72 : 280 }}>
        {/* <header className="header">
          <nav className="nav">
            <div className="nav-left">
              {/* Logo moved to Sidebar * /}
            </div>
            {/* <div className="nav-group-right">
              <div className="nav-center">
                <NavLink
                  to="/notice?view=notice"
                  className={`nav-btn ${tab === "notice" ? "active" : ""}`}>
                  공고
                </NavLink>

                {me && (
                  <NavLink
                    to="/manager/tokentab"
                    className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
                  >
                    관리자
                  </NavLink>
                )}
              </div>
            </div> * /}
            {/* <div className="nav-right">
              {me ? (
                <button onClick={onLogout} className="login-btn">
                  로그아웃
                </button>
              ) : (
                <button onClick={() => navigate("/login")} className="login-btn">
                  로그인
                </button>
              )}
            </div> * /}
          </nav>
        </header> */}

        <main style={{ minHeight: "calc(100vh - 120px) " }}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;