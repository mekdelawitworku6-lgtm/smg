
import axios from "axios";

function getBaseURL() {
  const saved = localStorage.getItem("api_url");
  if (saved) return saved.replace(/\/+$/, "");
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/+$/, "");
  return "/api";
}

const API = axios.create({ baseURL: getBaseURL() });

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
