import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
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
  (error) => Promise.reject(error)
);

// ===============================
// AUTH APIs
// ===============================

export const signup = (name, email, mobile, password) => {
  return api.post('/auth/signup', {
    name,
    email,
    mobile,
    password,
  });
};

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

// ===============================
// USER LOCATION APIs
// ===============================

export const saveUserLocation = (latitude, longitude) => {
  return api.post('/user/location', {
    latitude,
    longitude,
  });
};

export const getUserLocation = () => {
  return api.get('/user/location');
};

export default api;