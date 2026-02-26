import React from "react";
import styled from "styled-components";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";

const CompanyInformationPage: React.FC = () => {
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
          회사 정보 확인
        </div>

        <Section>
              <ModalGrid>
                  <label>사업자 등록번호</label>
                  <div className="text">-</div>
                  <label>대표자 명</label>
                  <div className="text">-</div>
                  <label>개업 일자</label>
                  <div className="text">-</div>
                  <label>주소</label>
                  <div className="text">-</div>     
                  <label>업종</label>
                  <div className="text">-</div>    
                  <label>사원 수</label>
                  <div className="text">-</div>  
                  <label>자산 규모</label>
                  <div className="text">-</div>  
                  <label>연혁</label>
                  <div className="text">-</div>     
                  <label>핵심기술</label>
                  <div className="text">-</div>  
                  <label>강점</label>
                  <div className="text">-</div>             
              </ModalGrid>
          </Section>

        <Footer>
          <button
            type="button"
            className="button_center"
            onClick={() => navigate("/registration")}
          >
            회사 정보 수정
          </button>
        </Footer>
      </Container>
    </Sidebar>
  );
};

export default CompanyInformationPage;

/* ================= styled ================= */

const Container = styled.div`
  padding: 60px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const Section = styled.div`
  background: #f9fafb;
  border-radius: 10px;
  padding: 18px 20px;
  box-sizing: border-box;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  row-gap: 12px;
  column-gap: 16px;
  align-items: center;

  .label {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
  }
`;