// import React, { useState } from "react";
// import styled from "styled-components";
// import { useNavigate } from "react-router-dom";
// import "../styles/Global.css";
// import http from "../api/http";

// declare global {
//   interface Window {
//     daum: any;
//   }
// }

// const RegistrationPage: React.FC = () => {
//   const navigate = useNavigate();

//   // ====== 주소(신규 UI) ======
//   const [zipCode, setZipCode] = useState("");
//   const [address1, setAddress1] = useState("");
//   const [address2, setAddress2] = useState("");

//   // ====== 기존 기능에서 쓰던 필수 DTO ======
//   const [companyName, setCompanyName] = useState("");
//   const [businessRegNo, setBusinessRegNo] = useState("");
//   const [ceoName, setCeoName] = useState("");
//   const [openDate, setOpenDate] = useState(""); // YYYY-MM-DD
//   const [planId] = useState<number>(1);

//   // ====== UI 전용 값(백 DTO에는 아직 없음) ======
//   const [industry, setIndustry] = useState("");
//   const [employeeCount, setEmployeeCount] = useState<number | null>(null);
//   const [assetAmount, setAssetAmount] = useState<number | null>(null);
//   const [historyText, setHistoryText] = useState("");
//   const [coreTechText, setCoreTechText] = useState("");

//   // ====== 메시지/로딩 ======
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState<string>("");
//   const [messageType, setMessageType] = useState<"error" | "success" | "">("");

//   // ====== SignupPage에서 저장해둔 값 ======
//   const email = localStorage.getItem("signup_email") ?? "";
//   const password = localStorage.getItem("signup_password") ?? "";
//   const passwordConfirm = localStorage.getItem("signup_passwordConfirm") ?? "";

//   const normalizeBizNo = (v: string) => v.replace(/[^0-9]/g, "");
//   const normalizeOpenDate = (v: string) => v.replace(/[^0-9]/g, "").slice(0, 8);

//   const validate = () => {
//     if (!email || !password || !passwordConfirm) return "이전 단계 정보가 없습니다. 회원가입부터 다시 진행하세요.";
//     if (!companyName.trim()) return "회사명을 입력하세요.";
//     if (!businessRegNo.trim()) return "사업자 등록 번호를 입력하세요.";
//     if (normalizeBizNo(businessRegNo).length !== 10) return "사업자등록번호는 숫자 10자리여야 합니다.";
//     if (!ceoName.trim()) return "대표자 명을 입력하세요.";
//     if (!openDate.trim()) return "개업 일자를 입력하세요.";
//     if (normalizeOpenDate(openDate).length !== 8) return "개업 일자는 YYYYMMDD 8자리여야 합니다.";
//     if (password !== passwordConfirm) return "비밀번호 확인이 일치하지 않습니다.";
//     return "";
//   };

//   const handleAddressSearch = () => {
//     new (window as any).daum.Postcode({
//       oncomplete: (data: any) => {
//         setZipCode(data.zonecode);
//         setAddress1(data.roadAddress);
//       },
//     }).open();
//   };

//   const handleRegistration = async () => {
//     setMessage("");
//     setMessageType("");

//     const err = validate();
//     if (err) {
//       setMessage(err);
//       setMessageType("error");
//       return;
//     }

//     try {
//       setLoading(true);

//       // 백 DTO(기존에 우리가 맞춘 payload) 그대로 유지
//       const payload = {
//         companyName: companyName.trim(),
//         businessRegNo: normalizeBizNo(businessRegNo),
//         openDate: normalizeOpenDate(openDate), // YYYYMMDD
//         ceoName: ceoName.trim(),
//         email: email.trim(),
//         password,
//         passwordConfirm,
//         planId, // 일단 1 고정
//       };

//       await http.post("/api/auth/company-signup", payload);

//       setMessage("회사 등록(회원가입)이 완료되었습니다. 로그인 해주세요.");
//       setMessageType("success");

//       localStorage.removeItem("signup_email");
//       localStorage.removeItem("signup_password");
//       localStorage.removeItem("signup_passwordConfirm");

//       navigate("/login");
//     } catch (error: any) {
//       const msg =
//         error?.response?.data?.message ||
//         (typeof error?.response?.data === "string" ? error.response.data : null) ||
//         "회사 등록에 실패했습니다.";
//       setMessage(msg);
//       setMessageType("error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Wrapper>
//       <LoginBox>
//         <Title>회사 정보 입력</Title>

//         <ContentArea>
//           <div className="inputGroup">
//             <div className="label">회사명</div>
//             <input
//               type="text"
//               className="input"
//               value={companyName}
//               onChange={(e) => setCompanyName(e.target.value)}
//               placeholder="회사명"
//             />
//           </div>

//           <div className="inputGroup">
//             <div className="label">사업자 등록 번호</div>
//             <input
//               type="text"
//               className="input"
//               value={businessRegNo}
//               onChange={(e) => setBusinessRegNo(e.target.value)}
//               placeholder="예: 000-00-00000"
//               maxLength={12}
//             />
//           </div>

//           <div className="inputGroup">
//             <div className="label">대표자 명</div>
//             <input
//               type="text"
//               className="input"
//               value={ceoName}
//               placeholder="예: 김철수"
//               onChange={(e) => setCeoName(e.target.value)}
//             />
//           </div>

//           <div className="inputGroup">
//             <div className="label">개업 일자</div>
//             {/* UI는 incoming 스타일 유지: date input */}
//             <input
//               type="date"
//               className="input"
//               value={openDate}
//               onChange={(e) => setOpenDate(e.target.value)}
//               placeholder="예: 2000-01-01"
//             />
//             {/* openDate는 내부적으로 YYYYMMDD로 저장 */}
//           </div>

//           <div className="inputGroup">
//             <div className="label">사업장 주소</div>

//             <div className="addressRow">
//               <input type="text" className="input zip" placeholder="우편번호" value={zipCode} readOnly />
//               <button type="button" className="addressBtn" onClick={handleAddressSearch}>
//                 주소 검색
//               </button>
//             </div>

//             <input type="text" className="input" placeholder="기본 주소" value={address1} readOnly />

//             <input
//               type="text"
//               className="input"
//               placeholder="상세 주소"
//               value={address2}
//               onChange={(e) => setAddress2(e.target.value)}
//             />
//           </div>

//           <div className="inputGroup">
//             <div className="label">업종</div>
//             <input
//               type="text"
//               className="input"
//               value={industry}
//               onChange={(e) => setIndustry(e.target.value)}
//               placeholder="예: 제조업"
//             />
//           </div>

//           <div className="inputGroup">
//             <div className="label">사원 수</div>
//             <input
//               type="number"
//               className="input"
//               value={employeeCount ?? ""}
//               onChange={(e) => setEmployeeCount(e.target.value === "" ? null : Number(e.target.value))}
//               placeholder="예: 25"
//             />
//           </div>

//           <div className="inputGroup">
//             <div className="label">자산 규모</div>
//             <input
//               type="number"
//               className="input"
//               value={assetAmount ?? ""}
//               onChange={(e) => setAssetAmount(e.target.value === "" ? null : Number(e.target.value))}
//               placeholder="예: 100000000 (원)"
//             />
//           </div>

//           <div className="inputGroup">
//             <div className="label">연혁</div>
//             <Textarea value={historyText} onChange={(e) => setHistoryText(e.target.value)} placeholder="회사 주요 연혁" />
//           </div>

//           <div className="inputGroup">
//             <div className="label">핵심 기술</div>
//             <Textarea value={coreTechText} onChange={(e) => setCoreTechText(e.target.value)} placeholder="핵심 기술" />
//           </div>

//           {message && <MessageText type={messageType}>{message}</MessageText>}
//         </ContentArea>

//         <FloatingButton type="button" className="button_right" onClick={handleRegistration} disabled={loading}>
//           {loading ? "등록 중..." : "회사 등록"}
//         </FloatingButton>
//       </LoginBox>
//     </Wrapper>
//   );
// };

// export default RegistrationPage;

// /* === styles (incoming 코드 기준 유지) === */

// const Title = styled.div`
//   position: absolute;
//   top: 48px;
//   left: 48px;

//   font-size: 44px;
//   font-weight: 700;
//   color: var(--color-primary);
// `;

// const Wrapper = styled.div`
//   width: 100vw;
//   height: 190vh;
//   background: linear-gradient(135deg, #1f3a5f 0%, #162c48 100%);

//   display: flex;
//   justify-content: center;
//   align-items: center;
// `;

// const LoginBox = styled.div`
//   width: 800px;
//   height: 1700px;
//   background-color: #ffffff;
//   border-radius: 14px;

//   display: flex;
//   flex-direction: column;
//   position: relative;

//   box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
// `;

// const ContentArea = styled.div`
//   flex: 1;

//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;

//   gap: 20px;
// `;

// const FloatingButton = styled.button`
//   position: absolute;
//   right: 40px;
//   bottom: 30px;

//   padding: 10px 10px;

//   &:disabled {
//     opacity: 0.6;
//     cursor: not-allowed;
//   }
// `;

// const MessageText = styled.p<{ type: "error" | "success" | "" }>`
//   margin-top: 8px;
//   font-size: 14px;
//   color: ${({ type }) => (type === "error" ? "#dc2626" : type === "success" ? "#16a34a" : "#000")};
// `;

// const Textarea = styled.textarea`
//   height: 120px;
//   resize: vertical;
//   padding: 12px;
// `;
