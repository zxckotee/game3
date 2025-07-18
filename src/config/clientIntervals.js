/**
 * Конфигурация интервалов для клиентской части
 * Совместимо с браузерами и React
 */

// Определяем среду выполнения
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     (typeof window !== 'undefined' && window.location.hostname === 'localhost');
const isProduction = !isDevelopment;

// Базовые интервалы для development (в миллисекундах)
const DEVELOPMENT_INTERVALS = {
  // Критичные обновления
  COMBAT_STATE_UPDATE: 1000,        // Состояние боя
  BATTLE_COOLDOWN_CHECK: 250,       // Проверка кулдаунов в бою
  
  // Обычные обновления
  EFFECTS_UPDATE: 15000,            // Активные эффекты
  PVP_ROOMS_UPDATE: 5000,           // PvP комнаты
  SPIRIT_PETS_UPDATE: 60000,        // Духовные питомцы
  
  // Редкие обновления
  INVENTORY_SYNC: 60000,            // Синхронизация инвентаря
  PROFILE_SYNC: 120000,             // Синхронизация профиля
  CULTIVATION_SYNC: 120000,         // Синхронизация культивации
  MARKET_SYNC: 120000,              // Синхронизация рынка
  SECT_SYNC: 300000,                // Синхронизация секты
  QUEST_SYNC: 300000,               // Синхронизация квестов
  TECHNIQUE_SYNC: 180000,           // Синхронизация техник
  ALCHEMY_SYNC: 300000,             // Синхронизация алхимии
  RESOURCE_SYNC: 1800000,           // Синхронизация ресурсов
  
  // Уведомления и UI
  NOTIFICATION_TIMER: 30000,        // Случайные уведомления
  GAME_TIME_UPDATE: 1000,           // Обновление игрового времени
  WEATHER_UPDATE: 3000,             // Обновление погоды (отладка)
  
  // Автосохранение
  AUTO_SAVE: 300000,                // Автосохранение (5 минут)
};

// Интервалы для production (увеличенные для снижения нагрузки)
const PRODUCTION_INTERVALS = {
  // Критичные обновления (немного увеличены)
  COMBAT_STATE_UPDATE: 2000,        // Состояние боя (было 1000)
  BATTLE_COOLDOWN_CHECK: 500,       // Проверка кулдаунов в бою (было 250)
  
  // Обычные обновления (значительно увеличены)
  EFFECTS_UPDATE: 30000,            // Активные эффекты (было 15000)
  PVP_ROOMS_UPDATE: 15000,          // PvP комнаты (было 5000)
  SPIRIT_PETS_UPDATE: 180000,       // Духовные питомцы (было 60000)
  
  // Редкие обновления (сильно увеличены)
  INVENTORY_SYNC: 300000,           // Синхронизация инвентаря (было 60000)
  PROFILE_SYNC: 600000,             // Синхронизация профиля (было 120000)
  CULTIVATION_SYNC: 600000,         // Синхронизация культивации (было 120000)
  MARKET_SYNC: 600000,              // Синхронизация рынка (было 120000)
  SECT_SYNC: 900000,                // Синхронизация секты (было 300000)
  QUEST_SYNC: 900000,               // Синхронизация квестов (было 300000)
  TECHNIQUE_SYNC: 900000,           // Синхронизация техник (было 180000)
  ALCHEMY_SYNC: 900000,             // Синхронизация алхимии (было 300000)
  RESOURCE_SYNC: 3600000,           // Синхронизация ресурсов (было 1800000)
  
  // Уведомления и UI (увеличены)
  NOTIFICATION_TIMER: 120000,       // Случайные уведомления (было 30000)
  GAME_TIME_UPDATE: 2000,           // Обновление игрового времени (было 1000)
  WEATHER_UPDATE: 10000,            // Обновление погоды (было 3000)
  
  // Автосохранение (увеличено)
  AUTO_SAVE: 600000,                // Автосохранение (10 минут, было 5)
};

// Выбираем конфигурацию в зависимости от среды
const INTERVALS = isProduction ? PRODUCTION_INTERVALS : DEVELOPMENT_INTERVALS;

/**
 * Получить интервал для конкретного типа обновления
 * @param {string} type - Тип интервала
 * @returns {number} Интервал в миллисекундах
 */
const getInterval = (type) => {
  const interval = INTERVALS[type];
  if (!interval) {
    console.warn(`[ClientIntervals] Неизвестный тип интервала: ${type}. Используется значение по умолчанию: 60000ms`);
    return 60000; // 1 минута по умолчанию
  }
  
  console.log(`[ClientIntervals] ${type}: ${interval}ms (${isDevelopment ? 'development' : 'production'})`);
  return interval;
};

// Константы типов интервалов
const INTERVAL_TYPES = {
  COMBAT_STATE_UPDATE: 'COMBAT_STATE_UPDATE',
  BATTLE_COOLDOWN_CHECK: 'BATTLE_COOLDOWN_CHECK',
  EFFECTS_UPDATE: 'EFFECTS_UPDATE',
  PVP_ROOMS_UPDATE: 'PVP_ROOMS_UPDATE',
  SPIRIT_PETS_UPDATE: 'SPIRIT_PETS_UPDATE',
  INVENTORY_SYNC: 'INVENTORY_SYNC',
  PROFILE_SYNC: 'PROFILE_SYNC',
  CULTIVATION_SYNC: 'CULTIVATION_SYNC',
  MARKET_SYNC: 'MARKET_SYNC',
  SECT_SYNC: 'SECT_SYNC',
  QUEST_SYNC: 'QUEST_SYNC',
  TECHNIQUE_SYNC: 'TECHNIQUE_SYNC',
  ALCHEMY_SYNC: 'ALCHEMY_SYNC',
  RESOURCE_SYNC: 'RESOURCE_SYNC',
  NOTIFICATION_TIMER: 'NOTIFICATION_TIMER',
  GAME_TIME_UPDATE: 'GAME_TIME_UPDATE',
  WEATHER_UPDATE: 'WEATHER_UPDATE',
  AUTO_SAVE: 'AUTO_SAVE'
};

// Простые утилиты дебаунсинга для клиента
const debounceTimers = new Map();

const simpleDebounce = (func, delay, key) => {
  return (...args) => {
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      debounceTimers.delete(key);
      func.apply(this, args);
    }, delay);
    
    debounceTimers.set(key, timer);
  };
};

const throttleTimers = new Map();

const simpleThrottle = (func, limit, key) => {
  return (...args) => {
    if (!throttleTimers.has(key)) {
      func.apply(this, args);
      throttleTimers.set(key, true);
      
      setTimeout(() => {
        throttleTimers.delete(key);
      }, limit);
    }
  };
};

// Экспорт для ES6 модулей (React)
export { getInterval, INTERVAL_TYPES, simpleDebounce, simpleThrottle, isDevelopment, isProduction };

// Экспорт для CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getInterval,
    INTERVAL_TYPES,
    simpleDebounce,
    simpleThrottle,
    isDevelopment,
    isProduction
  };
}

// Глобальный доступ для отладки
if (typeof window !== 'undefined') {
  window.__GAME_INTERVALS__ = {
    getInterval,
    INTERVAL_TYPES,
    current: INTERVALS,
    isDevelopment,
    isProduction
  };
}