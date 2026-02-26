import React from "react";
import "../styles/ManagerLayout.css";
import { useNavigate } from "react-router-dom";

interface ManagerLayoutProps {
  children: React.ReactNode;
}

const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="manager-layout">
      <aside className="manager-sidebar">
        <div className="manager-logo">Biz & Busy</div>

        <nav className="manager-menu">
            <div className="menu-group separated">
              <button
                className="menu-btn"
                onClick={() => navigate("/manager/tokentab")}
              >
                <div className="manager-menu-item">토큰 확인 탭</div>
              </button>
            </div>

            <div className="menu-group separated">
                <div className="menu-group">
                  <button
                    className="menu-btn"
                    onClick={() => navigate("/manager/rolemanagetab")}
                  >
                    <div className="manager-menu-item">역할 관리 탭</div>
                  </button>
                  <button
                    className="menu-btn"
                    onClick={() => navigate("/manager/usermanagetab")}
                  >
                    <div className="manager-menu-item">사용자 관리 탭</div>
                  </button>

                </div>
            </div>
            
            <div className="menu-group separated">
                <button
                  className="menu-btn"
                  onClick={() => navigate("/registration")}
                >
                  <div className="manager-menu-item">회사 정보 수정 탭</div>
                </button>
            </div>
        </nav>
      </aside>

      <main className="manager-content">{children}</main>
    </div>
  );
};

export default ManagerLayout;
