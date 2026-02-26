import React, {useState} from "react";
import styled from "styled-components";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";


const NewRoleRegistPage: React.FC = () => {
  const [roleName, setRoleName] = useState("");
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);

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

  // 실제 권한 목록 예시
const options = [
  "권한 예시 1",
  "권한 예시 2",
  "권한 예시 3"
  ];

const toggle = (value: string) => {
  setChecked(prev =>
    prev.includes(value)
      ? prev.filter(v => v !== value)
      : [...prev, value]
  );
};

const toggleAll = () => {
if (checked.length === options.length) {
setChecked([]);
} else {
setChecked(options);
}
};


const getLabel = () => {
if (checked.length === 0) return "권한 선택";
if (checked.length === options.length) return "전체 권한";
return `${checked.length}개 권한 선택`;
};

  return (
    <Sidebar
    sidebarMenus={menus}
    >
      <Container>
        <div className="title">
            새 역할 등록
        </div>

        <Header>
            <button
                type="button"
                className="button_center"
                //onClick={handleLogin}
                >
                역할 추가 +
            </button>
        </Header>

        <Table>
          <TableHeader>
            <Col flex={2}>역할 이름</Col>
            <Col flex={5}>역할 권한</Col>
            <Col flex={2}></Col>
          </TableHeader>

          <TableRow>
            <Col flex={2}>
              <RoleInput
                placeholder="역할 이름 입력"
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
              />
            </Col>
            <Col flex={5}>
            <DropdownWrapper>
              <DropdownBox onClick={() => setOpen(!open)}>
              {getLabel()}
              </DropdownBox>

              {open && (
                <List onClick={e => e.stopPropagation()}>
                  <Item>
                    <input
                      type="checkbox"
                      checked={checked.length === options.length}
                      onChange={toggleAll}
                    />
                    전체 선택
                  </Item>

                  <Divider />

                  {options.map(v => (
                    <Item key={v}>
                      <input
                        type="checkbox"
                        checked={checked.includes(v)}
                        onChange={() => toggle(v)}
                      />
                      {v}
                    </Item>
                  ))}
                </List>
              )}
              </DropdownWrapper>
            </Col>
            <Col flex={2}>
            </Col>
          </TableRow>
        </Table>

        <Footer>
            <button
                type="button"
                className="button_center"
                //onClick={handleLogin}
                >
                새 역할 등록
            </button>
        </Footer>
      </Container>
    </Sidebar>
  );
};

export default NewRoleRegistPage;

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

const Header = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 40px;
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

const DropdownWrapper = styled.div`
position: relative;
width: 50%;
font-size: 14px;
`;


const DropdownBox = styled.div`
padding: 6px 8px;
border: 1px solid #999;
border-radius: 4px;
background-color: #fff;
cursor: pointer;


&:after {
content: "▼";
float: right;
font-size: 14px;
}
`;


const List = styled.div`
position: absolute;
top: 100%;
left: 0;
width: 100%;
border: 1px solid #ccc;
background: white;
margin-top: 4px;
border-radius: 4px;
z-index: 10;
max-height: 200px;
overflow-y: auto;
`;


const Item = styled.label`
display: flex;
align-items: center;
gap: 6px;
padding: 7px 8px;
cursor: pointer;


&:hover {
background: #f5f5f5;
}
`;

const Divider = styled.div`
height: 1px;
background: #e5e5e5;
margin: 4px 0;
`;

const RoleInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #999;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #666;
  }
`;