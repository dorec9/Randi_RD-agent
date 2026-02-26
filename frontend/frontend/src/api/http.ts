import axios from "axios";

const http = axios.create({
  baseURL: "/", // ✅ 비워두지 말고 루트로
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;