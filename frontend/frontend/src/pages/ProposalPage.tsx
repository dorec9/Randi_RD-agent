import React, {useState} from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import "../styles/Global.css";

const ProposalPage: React.FC = () => {
    const navigate = useNavigate();
    const [checked, setChecked] = useState(false);

    const handleLogin = () => {
        console.log("로그인 시도");
    };

    return (
        <Container>
            <Card>
                <div className="title" style={{ marginLeft: 0, marginBottom: 50 }}>
                    제안서
                </div>

                <Row>
                    <ProposalSection>
                        작성된 제안서
                    </ProposalSection>

                    <ActionColumn>
                        <BtnWithCheck>
                            <button
                                type="button"
                                className="button_center" style={{width : 120}}
                                onClick={() => navigate("/signup")}
                                >
                                제안서 확인
                            </button>
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => setChecked(e.target.checked)}
                                />
                        </BtnWithCheck>

                        <button
                            type="button"
                            className="button_center" style={{width : 120}}
                            onClick={handleLogin}
                            >
                            제안서 저장
                        </button>

                        <button
                            type="button"
                            className="button_center" style={{width : 120}}
                            onClick={handleLogin}
                            >
                            제안서 변환
                        </button>
                    </ActionColumn>
                </Row>
            </Card>
        </Container>
    );
};

export default ProposalPage;

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background: #d9d9d9;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 30px 0;
  box-sizing: border-box;
`;

const Card = styled.div`
  width: 1100px;
  background: #ffffff;
  border-radius: 12px;
  padding: 28px;
  box-sizing: border-box;

`;

const ProposalSection = styled.div`
  width: 80%;
  height : 500px;
  background: #d9d9d9;
  border-radius: 12px;
  padding: 28px;
  box-sizing: border-box;
`;

const Row = styled.div`
  display: flex;
  gap: 20px;
`;

const ActionColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  height: 600px;              /* 👈 ProposalSection이랑 맞춤 */
  justify-content: flex-end;  /* 아래 정렬 */
`;

const BtnWithCheck = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;

    input[type="checkbox"] {
    width: 22px;
    height: 22px;
    cursor: pointer;
    position: relative;
    }
`;
