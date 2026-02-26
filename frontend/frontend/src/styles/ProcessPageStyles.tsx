import styled from "styled-components";

// Process 페이지 공통 레이아웃 컴포넌트

export const PageContainer = styled.div`
  min-height: calc(100vh - 64px);
  background: var(--color-bg-main);
  padding: var(--spacing-2xl);
`;

export const PageHeader = styled.div`
  max-width: 1200px;
  margin: 0 auto var(--spacing-2xl);
`;

export const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  letter-spacing: -0.02em;
`;

export const PageSubtitle = styled.p`
  font-size: 16px;
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-regular);
`;

export const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

export const Card = styled.div`
  position: relative;
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-xl);
  
  /* Left Color Bar */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-xl) 0 0 var(--radius-xl);
  }
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
`;

export const CardTitle = styled.h2`
  font-size: 20px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  letter-spacing: -0.01em;
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
`;

export const InfoLabel = styled.label`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  letter-spacing: -0.01em;
`;

export const InfoValue = styled.div`
  font-size: 15px;
  color: var(--color-text-primary);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
`;

export const InfoInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 var(--spacing-md);
  border: 1.5px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-card);
  outline: none;
  transition: all var(--transition-fast);

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:hover {
    border-color: var(--color-border-medium);
  }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-xl);
  flex-wrap: wrap;
`;

export const PrimaryButton = styled.button`
  padding: 12px var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  letter-spacing: -0.01em;
  min-width: 120px;

  &:hover:not(:disabled) {
    background: var(--color-primary-dark);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export const SecondaryButton = styled.button`
  padding: 12px var(--spacing-xl);
  background: white;
  color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border-medium);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
  letter-spacing: -0.01em;
  min-width: 120px;

  &:hover:not(:disabled) {
    background: var(--color-bg-secondary);
    border-color: var(--color-border-dark);
    color: var(--color-text-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const FileUploadArea = styled.div`
  border: 2px dashed var(--color-border-medium);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  text-align: center;
  background: var(--color-bg-main);
  transition: all var(--transition-fast);
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-50);
  }

  input[type="file"] {
    display: none;
  }
`;

export const FileUploadText = styled.p`
  font-size: 15px;
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-md);
`;

export const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
`;

export const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-secondary);
`;

export const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

export const LoadingText = styled.p`
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-top: var(--spacing-lg);
`;

export const ProgressBar = styled.div`
  width: 300px;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: var(--spacing-md);
`;

export const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: var(--color-primary);
  transition: width var(--transition-base);
  border-radius: var(--radius-full);
`;

export const ErrorMessage = styled.div`
  padding: var(--spacing-lg);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-lg);
  color: var(--color-error);
  font-size: 15px;
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-xl);
`;

export const SuccessMessage = styled.div`
  padding: var(--spacing-lg);
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-lg);
  color: var(--color-success);
  font-size: 15px;
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-xl);
`;

export const EmptyState = styled.div`
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 16px;
`;

/* Step Indicator Components */
export const StepContainer = styled.div`
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

export const StepNumber = styled.div`
  width: 40px;
  height: 40px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
`;

export const StepContent = styled.div`
  flex: 1;
`;

export const StepTitle = styled.div`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-dark);
  margin-bottom: 4px;
  letter-spacing: -0.01em;
`;

export const StepDescription = styled.div`
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
`;

/* Result Components */
export const ResultCard = styled.div`
  position: relative;
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  transition: all var(--transition-base);
  
  /* Left Color Bar */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  }

  &:hover {
    border-color: var(--color-primary-light);
    box-shadow: var(--shadow-md);
  }
`;

export const ResultTitle = styled.h3`
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  letter-spacing: -0.01em;
`;

export const ResultContent = styled.div`
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  white-space: pre-wrap;
`;

/* Badge Component */
export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: var(--color-primary-50);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.01em;
`;

/* Info Box */
export const InfoBox = styled.div`
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin: var(--spacing-lg) 0;
`;

export const InfoBoxTitle = styled.div`
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-dark);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
`;

export const InfoBoxContent = styled.div`
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.6;
`;
