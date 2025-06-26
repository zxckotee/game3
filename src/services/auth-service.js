// Сервис для работы с авторизацией
import { config } from '../config';

// Функция для получения токена из localStorage
export const getToken = () => {
  return localStorage.getItem(config.auth.tokenKey);
};

// Функция для установки токена в localStorage
export const setToken = (token) => {
  localStorage.setItem(config.auth.tokenKey, token);
};

// Функция для удаления токена из localStorage (выход из системы)
export const removeToken = () => {
  localStorage.removeItem(config.auth.tokenKey);
};

// Функция для проверки, авторизован ли пользователь
export const isAuthenticated = () => {
  const token = getToken();
  return !!token; // Возвращает true, если токен существует
};

// Функция для получения заголовков авторизации
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Функция для обработки ошибок аутентификации
export const handleAuthError = (error) => {
  // Если ошибка 401 (Unauthorized), выход из системы
  if (error.response && error.response.status === 401) {
    removeToken();
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

// Функция для получения информации о пользователе из токена
export const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    // Расшифровка JWT токена
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    return payload;
  } catch (e) {
    console.error('Ошибка при расшифровке JWT токена:', e);
    return null;
  }
};

export default {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  getAuthHeader,
  handleAuthError,
  getUserInfo
};