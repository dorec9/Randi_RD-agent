import styled from "styled-components";
import { useEffect } from "react";

type Props = {
  title: string;
  content: React.ReactNode;
  onClose: () => void;
};

const PolicyModal = ({ title, content, onClose }: Props) => {

    // ⭐ 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <Overlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <Header>
          <h2>{title}</h2>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </Header>

        <Content>
          {content}
        </Content>
      </ModalBox>
    </Overlay>
  );
};

export default PolicyModal;

/* ===== styled-components ===== */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
`;

const ModalBox = styled.div`
  width: 100%;
  max-width: 640px;
  max-height: 80vh;
  background: white;
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-xl);

  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-main);

  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 20px;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    letter-spacing: -0.01em;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }
`;

const Content = styled.div`
  padding: var(--spacing-xl);
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-secondary);
`;
