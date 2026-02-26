import React, {useState} from "react";
import "../styles/Footer.css";
import { useNavigate } from "react-router-dom";
import PolicyModal from "../pages/PolicyModal";
import ServiceTermContent from "../pages/ServiceTermContent";
import PrivacyTermContent from "../pages/PrivacyTermContent";

const Footer: React.FC = () => {
    const navigate = useNavigate();

    const [modalType, setModalType] =
        useState<"term" | "privacy" | "withdraw" | null>(null);

  return (
    <footer className="footer">
      {/* 시스템 정보 */}
      <div className="footer-section">
        <div className="footer-system-name">
          AI 기반 국가 R&D 제안 지원 플랫폼
        </div>
      </div>

      {/* 약관 / 정책 */}
      <div className="footer-section">
        <div className="footer-policy">
            <button onClick={() => setModalType("term")}>이용약관</button>
            <button onClick={() => setModalType("privacy")}>개인정보처리방침</button>
            {/* <button onClick={() => navigate("/withdrawal")}>탈퇴 정책</button> */}
        </div>
      </div>

        {/* 메뉴 이동 */}
      <div className="footer-section">
        <div className="footer-menu">
            <button onClick={() => navigate("/")}>홈</button>
            <button onClick={() => navigate("/faq")}>FAQ</button>
            {/* <button onClick={() => navigate("/notice")}>공지사항</button> */}

            {/* 👉 여기서 버튼 계속 추가하면 오른쪽으로 생성됨 */}
            {/* <button onClick={() => navigate("/about")}>소개</button> */}
        </div>
      </div>

      {/* 카피라이트 */}
      <div className="footer-copy">
        © 2026 랜디회사. All rights reserved.
      </div>
          {modalType === "term" && (
        <PolicyModal
          title="이용약관"
          content={<ServiceTermContent />}
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "privacy" && (
        <PolicyModal
          title="개인정보처리방침"
          content={<PrivacyTermContent />}
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "withdraw" && (
        <PolicyModal
          title="탈퇴 정책"
          content={<div>탈퇴 정책 내용</div>}
          onClose={() => setModalType(null)}
        />
      )}
    </footer>
  );
};

export default Footer;
