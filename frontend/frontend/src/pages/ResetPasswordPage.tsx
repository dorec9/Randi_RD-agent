import React, { useState } from "react";
import styled from "styled-components";
import "../styles/Global.css";
import http from "../api/http";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  const [pwError, setPwError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");

  // SignupPage와 동일한 비밀번호 정책
  const validatePassword = (pw: string) => {
    const forbidden = /[()<>\"';]/;
    if (forbidden.test(pw)) return "사용할 수 없는 특수문자가 포함되어 있습니다.";

    const hasEng = /[A-Za-z]/.test(pw);
    const hasNum = /[0-9]/.test(pw);
    const hasSpec = /[~!@#$%^&*_+\-=\[\]{}|:\\,.?/]/.test(pw);

    const typeCount = [hasEng, hasNum, hasSpec].filter(Boolean).length;

    if (typeCount >= 3) {
      if (pw.length < 8 || pw.length > 16) return "영문/숫자/특수문자 3종 조합은 8~16자리여야 합니다.";
    } else if (typeCount >= 2) {
      if (pw.length < 10 || pw.length > 16) return "2종 조합은 10~16자리여야 합니다.";
    } else {
      return "영문, 숫자, 특수문자 중 2종류 이상 조합해야 합니다.";
    }
    return "";
  };

  const onChangeNewPw = (v: string) => {
    setNewPw(v);
    const err = validatePassword(v);
    setPwError(err);

    if (newPw2 && v !== newPw2) setConfirmError("새 비밀번호 확인이 일치하지 않습니다.");
    else setConfirmError("");
  };

  const onChangeNewPw2 = (v: string) => {
    setNewPw2(v);
    if (newPw !== v) setConfirmError("새 비밀번호 확인이 일치하지 않습니다.");
    else setConfirmError("");
  };

  const resetPassword = async () => {
    setMessage("");
    setMessageType("");

    if (!email.trim()) {
      setMessage("이메일을 입력하세요.");
      setMessageType("error");
      return;
    }
    if (!currentPw) {
      setMessage("현재 비밀번호를 입력하세요.");
      setMessageType("error");
      return;
    }
    if (!newPw || !newPw2) {
      setMessage("새 비밀번호를 입력하세요.");
      setMessageType("error");
      return;
    }

    const pwErr = validatePassword(newPw);
    if (pwErr) {
      setPwError(pwErr);
      setMessage(pwErr);
      setMessageType("error");
      return;
    }
    if (newPw !== newPw2) {
      setConfirmError("새 비밀번호 확인이 일치하지 않습니다.");
      setMessage("새 비밀번호 확인이 일치하지 않습니다.");
      setMessageType("error");
      return;
    }
    // 현재 비밀번호와 새 비밀번호는 달라야 함(프론트에서도 1차 차단)
    if (currentPw === newPw) {
      setMessage("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      const res = await http.post("/api/auth/password/reset", {
        email: email.trim(),
        currentPassword: currentPw,
        newPassword: newPw,
        newPasswordConfirm: newPw2,
      });

      setMessage(res.data?.message || "비밀번호가 변경되었습니다.");
      setMessageType("success");

      // 성공하면 로그인 페이지로 이동
      navigate("/login");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "비밀번호 변경 실패";
      setMessage(msg);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <LoginBox>
        <Title>비밀번호 재설정</Title>

        <ContentArea>
          <div className="inputGroup">
            <div className="label">이메일</div>
            <input
              type="email"
              className="input"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="inputGroup">
            <div className="label">현재 비밀번호</div>
            <input
              type="password"
              className="input"
              placeholder="현재 비밀번호"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <div className="inputGroup">
            <div className="label">새 비밀번호</div>
            <input
              type="password"
              className="input"
              placeholder="새 비밀번호"
              value={newPw}
              onChange={(e) => onChangeNewPw(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
            {pwError && <ErrorText>{pwError}</ErrorText>}
          </div>

          <div className="inputGroup">
            <div className="label">새 비밀번호 확인</div>
            <input
              type="password"
              className="input"
              placeholder="새 비밀번호 확인"
              value={newPw2}
              onChange={(e) => onChangeNewPw2(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") resetPassword();
              }}
            />
            {confirmError && <ErrorText>{confirmError}</ErrorText>}
          </div>

          {message && <MessageText type={messageType}>{message}</MessageText>}
        </ContentArea>

        <FloatingButton type="button" className="button_center" onClick={resetPassword} disabled={loading}>
          {loading ? "처리 중..." : "비밀번호 변경"}
        </FloatingButton>
      </LoginBox>
    </Wrapper>
  );
};

export default ResetPasswordPage;

/* styles 유지 */
const Title = styled.div`
  position: absolute;
  top: 48px;
  left: 48px;
  font-size: 44px;
  font-weight: 700;
  color: var(--color-primary);
`;

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1f3a5f 0%, #162c48 100%);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LoginBox = styled.div`
  width: 800px;
  height: 650px;
  background-color: #ffffff;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
`;

const FloatingButton = styled.button`
  position: absolute;
  right: 40px;
  bottom: 30px;
  width: 130px;
  padding: 10px 10px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: red;
  font-size: 13px;
  margin-top: 4px;
`;

const MessageText = styled.p<{ type: "error" | "success" | "" }>`
  margin-top: 8px;
  font-size: 14px;
  color: ${({ type }) =>
    type === "error" ? "#dc2626" : type === "success" ? "#16a34a" : "#000"};
`;
