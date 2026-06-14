import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

if (typeof window !== 'undefined') {
  console.log('[API] baseURL:', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 55000, // 55s — Render free tier cold start can take ~50s
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
