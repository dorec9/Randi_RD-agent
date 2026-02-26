import http from "./http";

/** 1) 이메일 중복 체크 */
export async function checkEmailDuplicate(email: string) {
  // 백이 받는 DTO 키가 다르면 여기만 바꾸면 됨
  const res = await http.post("/api/auth/email/check", { email });
  return res.data as { duplicate?: boolean; isDuplicate?: boolean; message?: string };
}

/** 2) 인증 코드 발송 */
export async function sendEmailCode(email: string) {
  const res = await http.post("/api/auth/email/send", { email });
  return res.data as { message?: string };
}

/** 3) 인증 코드 검증 */
export async function verifyEmailCode(email: string, code: string) {
  const res = await http.post("/api/auth/email/verify", { email, code });
  return res.data as { verified?: boolean; message?: string };
}

/** 4) 회사 회원가입 */
export async function companySignup(payload: any) {
  const res = await http.post("/api/auth/company-signup", payload);
  return res.data;
}
