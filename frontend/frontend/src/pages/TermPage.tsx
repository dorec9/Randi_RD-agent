import React, {useState, useRef, useEffect} from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import "../styles/Global.css";
import ServiceTermContent from "./ServiceTermContent";
import PrivacyTermContent from "./PrivacyTermContent";

const TermPage: React.FC = () => {
    const [agree, setAgree] = useState({
    service: false,
    privacy: false,
    });

    const [open, setOpen] = useState({
    service: true,
    privacy: true,
    });

    const [scrolledEnd, setScrolledEnd] = useState({
    service: false,
    privacy: false,
    });

    const serviceRef = useRef<HTMLDivElement>(null);
    const privacyRef = useRef<HTMLDivElement>(null);

      // 펼칠 때 스크롤 맨 위
    useEffect(() => {
        if (open.service && serviceRef.current) {
        serviceRef.current.scrollTop = 0;
        }
    }, [open.service]);

    useEffect(() => {
        if (open.privacy && privacyRef.current) {
        privacyRef.current.scrollTop = 0;
        }
    }, [open.privacy]);

      // 스크롤 끝 감지
    const handleScroll = (
        key: "service" | "privacy",
        ref: React.RefObject<HTMLDivElement | null>
        ) => {
        if (!ref.current) return;

        const { scrollTop, scrollHeight, clientHeight } = ref.current;

        if (scrollTop + clientHeight >= scrollHeight - 5) {
            setScrolledEnd(prev => ({ ...prev, [key]: true }));
        }
    };


    const toggleOpen = (key: "service" | "privacy") => {
        setOpen(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAgree = (key: "service" | "privacy") => {
        if (!scrolledEnd[key]) return; // 🔒 핵심 차단
        setAgree(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const navigate = useNavigate();

    return (
        <Wrapper>
            <LoginBox>
                {/* <ContentArea> */}
                    <LogoArea>
                        <div className="logo">
                            RanDi
                        </div>
                    </LogoArea>
                {/* </ContentArea> */}
                    <TermBox>
                        <TermHeader>
                            <label className={!scrolledEnd.service ? "disabled" : ""}>
                                <input
                                type="checkbox"
                                checked={agree.service}
                                disabled={!scrolledEnd.service}
                                onChange={() => toggleAgree("service")}
                                />
                                (필수) 서비스 이용약관
                            </label>

                            <ToggleBtn onClick={() => toggleOpen("service")}>
                                {open.service ? "접기 ▲" : "펼치기 ▼"}
                            </ToggleBtn>
                        </TermHeader>

                        {open.service && (
                        <TermContent
                            ref={serviceRef}
                            onScroll={() => handleScroll("service", serviceRef)}
                        >
                            <ServiceTermContent />
                        </TermContent>
                        )}
                    </TermBox>

                    {/* 개인정보 수집·이용 */}
                    <TermBox>
                        <TermHeader>
                        <label className={!scrolledEnd.privacy ? "disabled" : ""}>
                            <input
                            type="checkbox"
                            checked={agree.privacy}
                            disabled={!scrolledEnd.privacy}
                            onChange={() => toggleAgree("privacy")}
                            />
                            (필수) 개인정보 수집·이용 동의
                        </label>

                        <ToggleBtn onClick={() => toggleOpen("privacy")}>
                            {open.privacy ? "접기 ▲" : "펼치기 ▼"}
                        </ToggleBtn>
                        </TermHeader>

                        {open.privacy && (
                        <TermContent
                            ref={privacyRef}
                            onScroll={() => handleScroll("privacy", privacyRef)}
                        >
                            <PrivacyTermContent />
                        </TermContent>
                        )}
                    </TermBox>
                    
                    {/* <ContentArea> */}
                    <ButtonArea>
                        <button
                            type="button"
                            className="button_center"
                            onClick={() => navigate("/signup")}
                            disabled={!(agree.service && agree.privacy)}>
                            다음
                        </button>
                    </ButtonArea>
                {/* </ContentArea> */}
            </LoginBox>
        </Wrapper>
    );
};

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
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
  min-height: 700px;
  background-color: white;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-xl);
`;

const ContentArea = styled.div`
  flex: 1;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 40px;
`;

const TermHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;

  label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 15px;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    cursor: pointer;
    
    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
  }

  label.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    input[type="checkbox"] {
      cursor: not-allowed;
    }
  }
`;

const TermBox = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--spacing-lg);
  margin-bottom: var(--spacing-md);
`;

const ToggleBtn = styled.button`
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--color-border-light);
    color: var(--color-text-primary);
  }
`;

const TermContent = styled.div`
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  height: 120px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
  background: var(--color-bg-main);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
`;

export const TermsBlock = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);

  &:last-child {
    border-bottom: none;
  }
`;

export const TermsBlockTitle = styled.div`
  font-weight: 700;
  margin-bottom: 8px;
  font-size: 15px;
`;

export const TermsBlockContent = styled.div`
    font-size: 14px;
    line-height: 1.6;
    color: #333;

    p {
    margin: 0 0 6px 0;
    }
`;

export const TermsScrollBox = styled.div`
  max-height: 240px;
  overflow-y: auto;
  padding: 0 16px;

  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
`;

const LogoArea = styled.div`
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .logo {
    font-size: 48px;
    font-weight: var(--font-weight-bold);
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.03em;
  }
`;

const ButtonArea = styled.div`
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .button_center {
    min-width: 120px;
  }
`;


export default TermPage;
