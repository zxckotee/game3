// Конфигурационный файл для приложения

// URL базового API
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Настройки для различных модулей
export const config = {
  // Настройки для аутентификации
  auth: {
    tokenKey: 'auth_token',       // Ключ для хранения токена в localStorage
    refreshTokenKey: 'refresh_token', // Ключ для хранения refresh токена
    tokenExpireTime: 3600 * 24    // Время жизни токена в секундах (24 часа)
  },
  
  // Настройки для API
  api: {
    baseURL: API_URL,
    timeout: 10000,               // Таймаут запросов (10 секунд)
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  
  // Настройки для питомцев
  pets: {
    maxActivePets: 1,             // Максимальное количество активных питомцев
    hungerDecreaseTime: 4 * 3600, // Время в секундах, через которое уменьшается голод (4 часа)
    hungerDecreaseAmount: 10,     // Количество единиц голода, которое уменьшается
    loyaltyThreshold: 30,         // Порог лояльности, ниже которого питомец может сбежать
    fleeChanceBase: 20,           // Базовый шанс побега при низкой лояльности (%)
    statusCheckInterval: 300000   // Интервал проверки статуса питомцев (5 минут)
  }
};

export default config;