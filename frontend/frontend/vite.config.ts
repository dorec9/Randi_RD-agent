import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    allowedHosts: [
      "nonatomical-unmediaeval-sha.ngrok-free.dev",
    ],
    proxy: {
      "/api": {
        target: "http://localhost:8080", // 🔥 백엔드 포트
        changeOrigin: true,
      },
    },
  },
});

