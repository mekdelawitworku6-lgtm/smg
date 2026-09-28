
import axios from "axios";

function normalizeUrl(url) {
  let u = (url || "").trim().replace(/[./]+$/, "");
  if (!u) return u;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  if (/\/api$/i.test(u)) return u;
  return `${u}/api`;
}

function getBaseURL() {
  const saved = localStorage.getItem("api_url");
  if (saved) return normalizeUrl(saved);
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) return normalizeUrl(envUrl);
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

/* Dedupe concurrent refreshes so a burst of 401s triggers one call. */
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return "unauthorized";

  try {
    const res = await axios.post(
      `${getBaseURL()}/auth/refresh`,
      { refreshToken },
      { timeout: 15000 }
    );

    const { token, refreshToken: rotated, role, name } = res.data || {};
    if (!token) return "unauthorized";

    localStorage.setItem("token", token);
    if (rotated) localStorage.setItem("refreshToken", rotated);
    if (role) localStorage.setItem("role", role);
    if (name) localStorage.setItem("name", name);

    return "ok";
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 || status === 403) return "unauthorized";
    /* Network/server hiccup: stay signed in, let the caller retry. */
    return "unavailable";
  }
}

function hardLogout() {
  localStorage.clear();
  window.location.href = "/";
}

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    /* login/refresh must never trigger a refresh, or we'd recurse. */
    const isAuthEntry = /\/auth\/(login|refresh)\b/.test(original?.url || "");

    if (error.response?.status === 401 && original && !original._retried && !isAuthEntry) {
      original._retried = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const result = await refreshPromise;

      if (result === "ok") {
        const token = localStorage.getItem("token");
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return API(original);
      }

      if (result === "unauthorized") {
        hardLogout();
      }
    }

    return Promise.reject(error);
  }
);

export default API;
