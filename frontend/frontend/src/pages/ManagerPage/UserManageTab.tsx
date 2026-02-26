import React from "react";
import styled from "styled-components";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";

const UserManageTab: React.FC = () => {
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
            사용자 관리
        </div>

        <Table>
          <TableHeader>
            <Col flex={5}>이메일 주소</Col>
            <Col flex={2}>이름</Col>
            <Col flex={2}>역할</Col>
            <Col flex={5}>사번</Col>
            <Col flex={3}></Col>
          </TableHeader>

          <TableRow>
            <Col flex={5}>ttingppong@naver.com</Col>
            <Col flex={2}>성건모</Col>
            <Col flex={2}>대표</Col>
            <Col flex={5}>15-71030074</Col>
            <Col flex={3}>
              <ActionButton>역할 수정 버튼</ActionButton>
            </Col>
          </TableRow>
        </Table>

        <Footer>
            <button
                type="button"
                className="button_center"
                onClick={() => navigate("/manager/userregist")}
                >
                새 역할 등록
            </button>
        </Footer>
      </Container>
    </Sidebar>
  );
};

export default UserManageTab;

/* ================= styled-components ================= */

const Container = styled.div`
  padding: 60px;
`;

const Table = styled.div`
  border: 1px solid #999;
`;

const TableHeader = styled.div`
  display: flex;
  background: #e0e0e0;
  border-bottom: 1px solid #999;
`;

const TableRow = styled.div`
  display: flex;
  background: #e6e6e6;
  border-bottom: 1px solid #999;

  &:last-child {
    border-bottom: none;
  }
`;

const Col = styled.div<{ flex: number }>`
  flex: ${({ flex }) => flex};
  padding: 12px;
  display: flex;
  align-items: center;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  cursor: pointer;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
`;

const CreateButton = styled.button`
  padding: 8px 16px;
  cursor: pointer;
`;
