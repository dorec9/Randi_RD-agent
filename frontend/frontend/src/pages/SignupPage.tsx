import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import "../styles/Global.css";
import http from "../api/http";

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [codeError, setCodeError] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    if (!showTimer || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [showTimer, timeLeft]);

  useEffect(() => {
    if (showTimer && timeLeft <= 0) {
      setShowTimer(false);
      setIsEmailVerified(false);
      setMessage("인증 시간이 만료되었습니다. 다시 인증 요청을 해주세요.");
      setMessageType("error");
    }
  }, [showTimer, timeLeft]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setMessage("이메일을 입력해주세요.");
      setMessageType("error");
      return;
    }

    try {
      const emailValue = email.trim();
      const checkRes = await http.post("/api/auth/email/check", { email: emailValue });
      const available = Boolean(checkRes.data?.available);

      if (!available) {
        setMessage(checkRes.data?.message || "이미 사용 중인 이메일입니다.");
        setMessageType("error");
        return;
      }

      await http.post("/api/auth/email/send", { email: emailValue });

      setMessage("인증코드를 발송했습니다.");
      setMessageType("success");
      setTimeLeft(300);
      setShowTimer(true);

      setCode("");
      setCodeError(false);
      setIsEmailVerified(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "인증 코드 발송 실패";
      setMessage(msg);
      setMessageType("error");
    }
  };

  const handleVerifyCode = async () => {
    if (!email.trim()) {
      setMessage("이메일을 먼저 입력해주세요.");
      setMessageType("error");
      return;
    }
    if (!code || code.length !== 6) {
      setMessage("인증번호 6자리를 입력해주세요.");
      setMessageType("error");
      return;
    }
    if (!showTimer || timeLeft <= 0) {
      setMessage("인증 시간이 만료되었습니다. 다시 인증 요청을 해주세요.");
      setMessageType("error");
      return;
    }

    try {
      const res = await http.post("/api/auth/email/verify", {
        email: email.trim(),
        code: code.trim(),
      });

      const verified = Boolean(res.data?.verified);

      if (verified) {
        setCodeError(false);
        setShowTimer(false);
        setIsEmailVerified(true);
        setMessage(res.data?.message || "인증 완료");
        setMessageType("success");
      } else {
        setCodeError(true);
        setIsEmailVerified(false);
        setMessage("인증번호가 올바르지 않습니다.");
        setMessageType("error");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || "인증 확인 중 오류가 발생했습니다.";
      setMessage(msg);
      setMessageType("error");
    }
  };

  const validatePassword = (pw: string) => {
    const forbidden = /[()<>"';]/;
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
      return "영문, 숫자, 특수문자 중 2종류 이상 조합이어야 합니다.";
    }
    return "";
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));

    if (passwordConfirm && value !== passwordConfirm) {
      setConfirmError("비밀번호가 일치하지 않습니다.");
    } else {
      setConfirmError("");
    }
  };

  const handleConfirm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasswordConfirm(value);

    if (password !== value) {
      setConfirmError("비밀번호가 일치하지 않습니다.");
    } else {
      setConfirmError("");
    }
  };

  const isValid =
    isEmailVerified &&
    !passwordError &&
    !confirmError &&
    name.trim().length > 0 &&
    department.trim().length > 0 &&
    position.trim().length > 0 &&
    password.length > 0 &&
    passwordConfirm.length > 0;

  const handleSignup = async () => {
    setMessage("");
    setMessageType("");

    if (!isValid) {
      setMessage("이메일 인증과 필수 입력값을 모두 확인해주세요.");
      setMessageType("error");
      return;
    }

    if (!code || code.trim().length !== 6) {
      setMessage("인증번호 6자리를 입력해주세요.");
      setMessageType("error");
      return;
    }

    try {
      setSignupLoading(true);

      const payload = {
        email: email.trim(),
        password,
        passwordConfirm,
        authCode: code.trim(),
        name: name.trim(),
        department: department.trim(),
        position: position.trim(),
      };

      await http.post("/api/auth/company-signup", payload);

      setMessage("회원가입이 완료되었습니다. 로그인 해주세요.");
      setMessageType("success");
      navigate("/login");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        "회원가입에 실패했습니다.";
      setMessage(msg);
      setMessageType("error");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <Wrapper>
      <LoginBox>
        <Title>회원가입</Title>

        <ContentArea>
          <div className="inputGroup">
            <div className="label">이메일 입력</div>
            <Row>
              <input
                value={email}
                className="input"
                placeholder="이메일"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailVerified(false);
                  setShowTimer(false);
                  setTimeLeft(600);
                  setCode("");
                  setCodeError(false);
                  setMessage("");
                  setMessageType("");
                }}
                disabled={isEmailVerified}
              />
              <button onClick={handleSendCode} disabled={isEmailVerified}>
                인증 요청
              </button>
            </Row>
            {message && <MessageText type={messageType}>{message}</MessageText>}
          </div>

          <div className="inputGroup">
            <div className="label">인증번호 입력</div>
            <Row>
              <input
                value={code}
                className="input"
                placeholder="인증번호 6자리를 입력하세요"
                onChange={(e) => setCode(e.target.value)}
                disabled={!email || !showTimer || isEmailVerified}
              />
              {showTimer && <Timer>{formatTime(timeLeft)}</Timer>}
              <button onClick={handleVerifyCode} disabled={!showTimer || isEmailVerified}>
                확인
              </button>
            </Row>
            {codeError && <ErrorText>인증번호가 올바르지 않습니다.</ErrorText>}
          </div>

          <div className="inputGroup">
            <div className="label">이름</div>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              disabled={!isEmailVerified}
            />
          </div>

          <div className="inputGroup">
            <div className="label">부서</div>
            <input
              className="input"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="부서"
              disabled={!isEmailVerified}
            />
          </div>

          <div className="inputGroup">
            <div className="label">직책</div>
            <input
              className="input"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="직책"
              disabled={!isEmailVerified}
            />
          </div>

          <div className="inputGroup">
            <div className="label">비밀번호 입력</div>
            <input
              type="password"
              className="input"
              value={password}
              onChange={handlePassword}
              placeholder="비밀번호"
              disabled={!isEmailVerified}
            />
            {passwordError && <ErrorText>{passwordError}</ErrorText>}
          </div>

          <div className="inputGroup">
            <div className="label">비밀번호 확인</div>
            <input
              type="password"
              className="input"
              value={passwordConfirm}
              onChange={handleConfirm}
              placeholder="비밀번호 확인"
              disabled={!password || !isEmailVerified}
            />
            {confirmError && <ErrorText>{confirmError}</ErrorText>}
          </div>
        </ContentArea>

        <BottomRow>
          <FloatingButton
            type="button"
            className="button_center"
            disabled={!isValid || signupLoading}
            onClick={handleSignup}
          >
            {signupLoading ? "가입 중..." : "회원가입 완료"}
          </FloatingButton>
        </BottomRow>
      </LoginBox>
    </Wrapper>
  );
};

export default SignupPage;

const Title = styled.div`
  position: absolute;
  top: var(--spacing-2xl);
  left: var(--spacing-2xl);
  font-size: 42px;
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
`;

const Wrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xl);
  box-sizing: border-box;
`;

const LoginBox = styled.div`
  width: 100%;
  max-width: 800px;
  min-height: 800px;
  background-color: white;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-xl);
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  button {
    white-space: nowrap;
    padding: 0 var(--spacing-lg);
    height: 48px;
    min-width: 100px;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl) 0;
`;

const FloatingButton = styled.button`
  position: absolute;
  right: var(--spacing-2xl);
  bottom: var(--spacing-xl);
  min-width: 120px;
  padding: 12px var(--spacing-lg);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: var(--color-error);
  font-size: 13px;
  margin-top: var(--spacing-xs);
  font-weight: var(--font-weight-medium);
`;

const Timer = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  min-width: 48px;
`;

const BottomRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
`;

const MessageText = styled.p<{ type: "error" | "success" | "" }>`
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  background: ${({ type }) =>
    type === "error"
      ? "rgba(239, 68, 68, 0.1)"
      : type === "success"
      ? "rgba(16, 185, 129, 0.1)"
      : "transparent"};
  color: ${({ type }) =>
    type === "error"
      ? "var(--color-error)"
      : type === "success"
      ? "var(--color-success)"
      : "var(--color-text-primary)"};
  border: 1px solid ${({ type }) =>
    type === "error"
      ? "rgba(239, 68, 68, 0.3)"
      : type === "success"
      ? "rgba(16, 185, 129, 0.3)"
      : "var(--color-border-light)"};
`;
