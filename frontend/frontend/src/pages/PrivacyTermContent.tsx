import {
  TermsBlock,
  TermsBlockTitle,
  TermsBlockContent,
} from "../pages/TermPage";

const PrivacyTermContent = () => {
  return (
    <>
        <TermsBlock>
            <TermsBlockTitle>1. 수집하는 개인정보 항목</TermsBlockTitle>
            <TermsBlockContent>
                <p>회사는 회원가입 및 서비스 제공을 위해 다음 개인정보를 수집합니다.</p>
                <p>{"\u2003\u2003"}- 사업자등록번호</p>
                <p>{"\u2003\u2003"}- 대표자 성명</p>
                <p>{"\u2003\u2003"}- 개업일자</p>
                <p>{"\u2003\u2003"}- 담당자 이메일</p>
            </TermsBlockContent>
        </TermsBlock>

        <TermsBlock>
            <TermsBlockTitle>2. 개인정보 수집·이용 목적</TermsBlockTitle>
            <TermsBlockContent>
                <p>회사는 회원가입 및 서비스 제공을 위해 다음 개인정보를 수집합니다.</p>
                <p>{"\u2003\u2003"}- 회원 식별 및 회원관리</p>
                <p>{"\u2003\u2003"}- 서비스 제공 및 이용 이력 관리</p>
                <p>{"\u2003\u2003"}- 유료 서비스 결제 및 고객 문의 대응</p>
                <p>{"\u2003\u2003"}- 서비스 관련 공지사항 전달</p>
            </TermsBlockContent>
        </TermsBlock>

        <TermsBlock>
            <TermsBlockTitle>3. 개인정보 보유 및 이용 기간</TermsBlockTitle>
            <TermsBlockContent>
                <p>회사는 개인정보를 회원 탈퇴 시까지 보유·이용하며, 
                    관계 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
            </TermsBlockContent>
        </TermsBlock>

        <TermsBlock>
            <TermsBlockTitle>4. 동의 거부 권리 및 불이익</TermsBlockTitle>
            <TermsBlockContent>
                <p>회원은 개인정보 수집·이용에 대한 동의를 거부할 수 있으나, 
                    동의하지 않을 경우 회원가입 및 서비스 이용이 제한될 수 있습니다.</p>
            </TermsBlockContent>
        </TermsBlock>

        <TermsBlock>
            <TermsBlockTitle>5. 업로드 자료에 대한 안내</TermsBlockTitle>
            <TermsBlockContent>
                <p>회원이 업로드하는 공고 파일, 제안서, PPT 파일 등은 개인정보가 아닌 기업 자료로 간주되며, 
                    회사는 해당 자료를 서비스 제공 목적 범위 내에서만 처리합니다.</p>
            </TermsBlockContent>
        </TermsBlock>
    </>
  );
};

export default PrivacyTermContent;
