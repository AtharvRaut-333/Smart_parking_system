// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8081",
  withCredentials: true,
});

// Automatically attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Intercept and handle refresh token
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // 🛑 Don't retry if request was login or register
    const excludedPaths = ["/user/login", "/user/register", "/user/success"];
    const isExcluded = excludedPaths.some((path) =>
      original.url.includes(path)
    );

    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url.includes("/user/refresh") &&
      !isExcluded
    ) {
      original._retry = true;
      try {
        const response = await api.post("/user/refresh"); // ⬅ Uses refreshToken cookie
        const newAccessToken = response.data.accessToken;

        localStorage.setItem("token", newAccessToken);
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;
        original.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return api(original); // Retry original request
      } catch (refreshErr) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }

    return Promise.reject(err);
  }
);

export default api;
