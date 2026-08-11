import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') ||
      sessionStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===============================
// AUTH APIs
// ===============================

export const signup = (identifier, password) =>
  api.post('/auth/signup', {
    identifier,
    password,
  });

export const login = (identifier, password, rememberMe) =>
  api.post('/auth/login', {
    identifier,
    password,
    rememberMe,
  });

export const getMe = () =>
  api.get('/auth/me');

export const sendOtp = (email, purpose) =>
  api.post('/auth/send-otp', {
    email,
    purpose,
  });

export const verifyOtp = (email, otp, purpose) =>
  api.post('/auth/verify-otp', {
    email,
    otp,
    purpose,
  });

export const resetPassword = (email, resetToken, newPassword) =>
  api.post('/auth/reset-password', {
    email,
    resetToken,
    newPassword,
  });

export const googleLogin = (credential) =>
  api.post('/auth/google', {
    credential,
  });

export default api;