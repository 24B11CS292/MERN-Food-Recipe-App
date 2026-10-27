// utils/api.js
// Creates a pre-configured Axios instance used for ALL API calls.
//
// Why use a custom Axios instance instead of plain fetch()?
// - We set the base URL once here, not in every file
// - We attach the JWT token automatically to every request via interceptors
// - Error handling is centralized

import axios from "axios";

// Base URL of our backend server
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- REQUEST INTERCEPTOR ---
// Runs before every request is sent.
// We read the token from localStorage and attach it to the Authorization header.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
// Runs when a response comes back.
// If we get a 401 (Unauthorized), the token is expired — log the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login if token is invalid/expired
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
