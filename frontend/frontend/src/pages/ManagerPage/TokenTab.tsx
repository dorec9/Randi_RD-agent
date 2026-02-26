import React from "react";
import styled from "styled-components";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";

const TokenTab: React.FC = () => {
  const navigate = useNavigate();

  const menus = [
    {
      name: "토큰 확인",
      path: "/manager/tokentab",
      onClick:() => navigate("/manager/tokentab")
    },
    {
      name: "역할 관리",
      path: "/manager/rolemanagetab",
      onClick:() => navigate("/manager/rolemanagetab"),
      gap : true
    },
    {
      name: "사용자 관리",
      path: "/manager/usermanagetab",
      onClick:() => navigate("/manager/usermanagetab")
    },
    {
      name: "회사 정보",
      path: "/manager/companyinfo",
      onClick:() => navigate("/manager/companyinfo"),
      gap : true
    }
  ]

  return (
    <Sidebar
      sidebarMenus={menus}
    >
      <Container>
        <div className="title">
          토큰 확인
        </div>

        <Header>
          <MonthControl>
            <Arrow>{"◀"}</Arrow>
            <Month>5월</Month>
            <Arrow>{"▶"}</Arrow>
          </MonthControl>

          <ToggleGroup>
            <Toggle active>Daily</Toggle>
            <Toggle>Monthly</Toggle>
          </ToggleGroup>
        </Header>

        <Chart>
          {mockData.map((v, i) => (
            <BarItem key={i}>
              <Bar height={v} />
              <Label>{i + 1}일</Label>
            </BarItem>
          ))}
        </Chart>

        <Usage>
          <UsageTitle>이번 달 사용량</UsageTitle>

          <ProgressBar>
            <Progress percent={70} />
          </ProgressBar>

          <UsageText>70 / 150</UsageText>
        </Usage>

        <Footer>
          <button
            type="button"
            className="button_center"
            onClick={() => navigate("/manager/payment")}
          >
            결제 관리
          </button>
        </Footer>
      </Container>
    </Sidebar>
  );
};

export default TokenTab;

/* ================= styled ================= */

const Container = styled.div`
  padding: 60px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 40px;
`;

const MonthControl = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Arrow = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size : 30px;
`;

const Month = styled.span`
  font-size: 30px;
`;

const ToggleGroup = styled.div`
  margin-left: auto;
  display: flex;
  border: 1px solid #ccc;
`;

const Toggle = styled.button<{ active?: boolean }>`
  padding: 6px 14px;
  border: none;
  cursor: pointer;
  background: ${({ active }) => (active ? "#ddd" : "#f5f5f5")};
`;

const Chart = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 18px;
    height: 300px;
    // width: 100%;
    // max-width: 1000px;
    margin-bottom: 40px;
`;

const BarItem = styled.div`
  text-align: center;
`;

const Bar = styled.div<{ height: number }>`
  width: 18px;
  height: ${({ height }) => height}px;
  background: #d9d9d9;
  border-radius: 4px;
`;

const Label = styled.div`
  font-size: 12px;
  margin-top: 8px;
`;

const Usage = styled.div`
  margin-bottom: 64px;
`;

const UsageTitle = styled.div`
  font-size: 24px;
  margin-bottom: 12px;
`;

const ProgressBar = styled.div`
  width: 500px;
  height: 30px;
  background: #e0e0e0;
  border-radius: 5px;
  margin-bottom: 12px;
`;

const Progress = styled.div<{ percent: number }>`
  width: ${({ percent }) => percent}%;
  height: 100%;
  background: #1677ff;
`;

const UsageText = styled.div`
  margin-top: 2px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ManageButton = styled.button`
  padding: 10px 16px;
  background: #e0e0e0;
  border: none;
  cursor: pointer;
`;

/* mock */
const mockData = [80, 120, 160, 70, 130, 40, 150, 135, 120, 150,
                80, 120, 160, 70, 130, 40, 150, 135, 120, 150,
                80, 120, 160, 70, 130, 40, 150, 135, 120, 150, 180
];
