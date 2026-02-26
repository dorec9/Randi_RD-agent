import React from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { me } = useAuth();

  const handleStartClick = () => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      navigate('/notice');
    } else {
      navigate('/login');
    }
  };

  return (
    <PageWrapper>
      <ContentContainer>
        {/* Hero Section */}
        {!me && (
          <HeroSection>
            <HeroContent>
              <LogoTitle>RanDi</LogoTitle>
              <Subtitle>
                R&D 공고 분석부터 발표자료 제작까지
                <br />
                성공적인 과제 수주를 위한 가장 확실한 솔루션
              </Subtitle>
              <CTAButton onClick={handleStartClick}>
                지금 시작하기
                <ArrowIcon>→</ArrowIcon>
              </CTAButton>
            </HeroContent>
          </HeroSection>
        )}

        {/* Features Section */}
        <FeaturesSection>
          {!me && (
            <>
              <SectionTitle>핵심 기능</SectionTitle>
              <SectionSubtitle>
                RanDi는 R&D 과제 수주의 모든 과정을 지원합니다
              </SectionSubtitle>
            </>
          )}

          <CardGrid>
            <FeatureCard onClick={() => navigate("/notice?view=main&type=analysis")}>
              <CardIcon>📋</CardIcon>
              <CardTitle>공고문 분석</CardTitle>
              <CardDescription>
                AI 기반 자동 분석으로 자격요건, 사업 목적, 평가항목을
                한눈에 파악할 수 있습니다
              </CardDescription>
              <FeatureList>
                <FeatureItem>✓ 자격요건 체크리스트 제공</FeatureItem>
                <FeatureItem>✓ 과제 의도 및 목적 분석</FeatureItem>
                <FeatureItem>✓ 평가지표 분석 사항</FeatureItem>
                <FeatureItem>✓ 제출 문서 리스트 제공</FeatureItem>
                <FeatureItem>✓ 필수 준수 사항</FeatureItem>
              </FeatureList>
            </FeatureCard>

            <FeatureCard onClick={() => navigate("/notice?view=main&type=rfp")}>
              <CardIcon>🔍</CardIcon>
              <CardTitle>유관 RFP 검색</CardTitle>
              <CardDescription>
                과거 유사 RFP를 빠르게 찾아 성공 사례를
                참고할 수 있습니다
              </CardDescription>
              <FeatureList>
                <FeatureItem>✓ 동일 발주처 유사 RFP 추천</FeatureItem>
                <FeatureItem>✓ 타 발주처 유사 RFP 추천</FeatureItem>
                <FeatureItem>✓ 권장 차별화 전략 제안</FeatureItem>
              </FeatureList>
            </FeatureCard>

            <FeatureCard onClick={() => navigate("/notice?view=main&type=announce")}>
              <CardIcon>📊</CardIcon>
              <CardTitle>발표자료 제작</CardTitle>
              <CardDescription>
                전문적인 프레젠테이션 자료를 자동으로
                생성하여 시간을 절약합니다
              </CardDescription>
              <FeatureList>
                <FeatureItem>✓ 발표 제목</FeatureItem>
                <FeatureItem>✓ 슬라이드 수</FeatureItem>
                <FeatureItem>✓ 파일 경로</FeatureItem>
              </FeatureList>
            </FeatureCard>

            <FeatureCard onClick={() => navigate("/notice?view=main&type=script")}>
              <CardIcon>📝</CardIcon>
              <CardTitle>스크립트 생성</CardTitle>
              <CardDescription>
                발표 스크립트와 예상 질문을 자동으로
                작성하여 완벽한 프레젠테이션을 준비합니다
              </CardDescription>
              <FeatureList>
                <FeatureItem>✓ 발표 스크립트 생성</FeatureItem>
                <FeatureItem>✓ 예상 질문 생성</FeatureItem>
              </FeatureList>
            </FeatureCard>
          </CardGrid>
        </FeaturesSection>

        {/* CTA Section */}
        {/* <CTASection>
          <CTATitle>지금 바로 시작하세요</CTATitle>
          <CTASubtitle>
            RanDi와 함께 R&D 과제 수주 성공률을 높이세요
          </CTASubtitle>
          <CTAButton onClick={() => navigate("/login")}>
            무료로 시작하기
            <ArrowIcon>→</ArrowIcon>
          </CTAButton>
        </CTASection> */}
      </ContentContainer>
    </PageWrapper>
  );
};

export default MainPage;

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-bg-main);
  overflow-x: hidden;
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
`;

const HeroSection = styled.section`
  padding: 120px 0 80px;
  text-align: center;
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const LogoTitle = styled.h1`
  font-size: 72px;
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-xl);
  letter-spacing: -0.03em;
`;

const Subtitle = styled.p`
  font-size: 24px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2xl);
  font-weight: var(--font-weight-regular);
`;

const CTAButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 18px 36px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-lg);
  letter-spacing: -0.01em;

  &:hover {
    background: var(--color-primary-dark);
    box-shadow: var(--shadow-xl);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: var(--shadow-lg);
  }
`;

const ArrowIcon = styled.span`
  font-size: 20px;
  transition: transform var(--transition-fast);

  ${CTAButton}:hover & {
    transform: translateX(4px);
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 0;
`;

const SectionTitle = styled.h2`
  font-size: 42px;
  font-weight: var(--font-weight-bold);
  text-align: center;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  letter-spacing: -0.02em;
`;

const SectionSubtitle = styled.p`
  font-size: 18px;
  text-align: center;
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-2xl);
  font-weight: var(--font-weight-regular);
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xl);
              
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  position: relative;
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  cursor: pointer;

  /* 좌측 컬러 바 */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-xl) 0 0 var(--radius-xl);
    transition: all var(--transition-base);
  }

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-xl);
    transform: translateY(-4px);
    
    /* Hover 시 좌측 바 강조 */
    &::before {
      width: 6px;
      background: var(--color-primary-dark);
    }
  }
`;

const CardIcon = styled.div`
  width: 64px;
  height: 64px;
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: var(--spacing-md);
  transition: all var(--transition-base);

  ${FeatureCard}:hover & {
    background: var(--color-primary-100);
    border-color: var(--color-primary-200);
    transform: scale(1.05);
  }
`;

const CardTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  letter-spacing: -0.01em;
`;

const CardDescription = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  font-size: 15px;
  color: var(--color-text-tertiary);
  padding: var(--spacing-sm) 0;
  line-height: 1.5;

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-border-light);
  }
`;

const CTASection = styled.section`
  padding: 80px 0 120px;
  text-align: center;
  background: linear-gradient(135deg, 
    rgba(79, 70, 229, 0.05) 0%, 
    rgba(99, 102, 241, 0.05) 100%);
  border-radius: var(--radius-xl);
  margin: var(--spacing-2xl) 0;
`;

const CTATitle = styled.h2`
  font-size: 42px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  letter-spacing: -0.02em;
`;

const CTASubtitle = styled.p`
  font-size: 20px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2xl);
`;
