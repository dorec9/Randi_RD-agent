import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import "../styles/Global.css";

const WithdrawPage: React.FC = () => {
  const navigate = useNavigate();
  const [agree, setAgree] = useState(false);
  const [reason, setReason] = useState("");

  const handleWithdraw = () => {
    if (!agree) return;

    console.log("회원 탈퇴 진행");
    console.log("탈퇴 사유:", reason);

    // TODO: 탈퇴 API 호출
    // axios.post("/api/member/withdraw")

    navigate("/"); // 탈퇴 후 이동 경로
  };

  return (
    <Wrapper>
      <WithdrawBox>
        <Title>회원 탈퇴</Title>

        <ContentArea>
          {/* 1. 탈퇴 안내 */}
          <Section>
            <SectionTitle>탈퇴 전 안내사항</SectionTitle>
            <GuideText>
              • 회원 탈퇴 시 계정 및 회사 정보는 즉시 삭제되며 복구할 수 없습니다.<br />
              • 탈퇴 후에는 서비스 이용 내역 및 인공지능 생성 결과물을 다시 확인할 수 없습니다.<br />
              • 탈퇴 시 보유 중인 이용권 및 결제 내역에 대한 환불은 제공되지 않습니다.<br />
              • 탈퇴 후에도 업로드 자료 및 결과물과 관련된 책임은 회원에게 귀속됩니다.
            </GuideText>
          </Section>

          {/* 2. 유지되는 조항 */}
          <Section>
            <SectionTitle>탈퇴 후에도 적용되는 약관</SectionTitle>
            <GuideText>
              • 제6조 (인공지능 생성 결과물의 성격)<br />
              • 제7조 (업로드 자료의 이용)<br />
              • 제8조 (지식재산권)<br />
              • 제11조 (면책조항)<br />
              • 제12조 (준거법 및 관할)
            </GuideText>
          </Section>

          {/* 3. 탈퇴 사유 (선택) */}
          <div className="inputGroup">
            <div className="label">탈퇴 사유 (선택)</div>
            <Textarea
              placeholder="탈퇴 사유를 입력해주세요 (선택 사항)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* 4. 동의 체크 */}
          <AgreeBox>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              위 내용을 모두 확인하였으며, 회원 탈퇴에 동의합니다.
            </span>
          </AgreeBox>

          {/* 5. 최종 경고 */}
          <WarningText>
            탈퇴를 진행하시면 모든 데이터가 즉시 삭제되며,<br />
            이 작업은 되돌릴 수 없습니다.
          </WarningText>
        </ContentArea>

        {/* 6. 버튼 */}
        <ButtonArea>
          <CancelButton onClick={() => navigate(-1)}>
            취소
          </CancelButton>
          <WithdrawButton
            disabled={!agree}
            onClick={handleWithdraw}
          >
            회원 탈퇴
          </WithdrawButton>
        </ButtonArea>
      </WithdrawBox>
    </Wrapper>
  );
};

export default WithdrawPage;

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1f3a5f 0%, #162c48 100%);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const WithdrawBox = styled.div`
  width: 800px;
  background-color: #ffffff;
  border-radius: 14px;
  padding: 48px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
`;

const Title = styled.div`
  font-size: 36px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 32px;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const Section = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
`;

const SectionTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const GuideText = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
`;

const AgreeBox = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
`;

const WarningText = styled.div`
  font-size: 14px;
  color: #dc2626;
  font-weight: 600;
  text-align: center;
`;

const ButtonArea = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 36px;
`;

const CancelButton = styled.button`
  padding: 10px 16px;
`;

const WithdrawButton = styled.button`
  padding: 10px 16px;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:disabled {
    background-color: #fca5a5;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  height: 100px;
  padding: 12px;
  resize: vertical;
`;
