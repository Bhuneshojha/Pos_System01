export const API_BASE_URL = import.meta.env.VITE_API_BASE || '/api';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const saveAuthToken = (token) => {
  if (token) localStorage.setItem('auth_token', token);
};

export const clearAuthToken = () => {
  localStorage.removeItem('auth_token');
};
