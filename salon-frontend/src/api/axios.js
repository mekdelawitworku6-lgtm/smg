
import axios from "axios";

function normalizeUrl(url) {
  let u = (url || "").trim().replace(/[\/.]+$/, "");
  if (!u) return u;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  if (/\/api$/i.test(u)) return u;
  return `${u}/api`;
}

function getBaseURL() {
  const saved = localStorage.getItem("api_url");
  if (saved) return normalizeUrl(saved);
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return normalizeUrl(envUrl);
  if (import.meta.env.PROD) {
    return "https://smg-backend.onrender.com/api";
  }
  return "/api";
}

const API = axios.create({ baseURL: getBaseURL(), timeout: 15000 });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;
