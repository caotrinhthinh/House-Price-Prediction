import axios from 'axios';

// Cấu hình URL linh hoạt: Lấy từ biến môi trường của Vite, hoặc fallback về Backend ở port 3001
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});
