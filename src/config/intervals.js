/**
 * Централизованная конфигурация интервалов для разных сред
 * Решает проблему частых запросов на production сервере
 */

// Определяем среду выполнения
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

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
  
  // Очистка
  EFFECT_CLEANUP: 600000,           // Очистка истекших эффектов (10 минут)
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
  
  // Очистка (без изменений)
  EFFECT_CLEANUP: 600000,           // Очистка истекших эффектов
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
    console.warn(`[IntervalConfig] Неизвестный тип интервала: ${type}. Используется значение по умолчанию: 60000ms`);
    return 60000; // 1 минута по умолчанию
  }
  
  console.log(`[IntervalConfig] ${type}: ${interval}ms (${isDevelopment ? 'development' : 'production'})`);
  return interval;
};

/**
 * Получить все интервалы для текущей среды
 * @returns {object} Объект с интервалами
 */
const getAllIntervals = () => {
  return { ...INTERVALS };
};

/**
 * Проверить, является ли среда production
 * @returns {boolean}
 */
const isProductionEnv = () => isProduction;

/**
 * Проверить, является ли среда development
 * @returns {boolean}
 */
const isDevelopmentEnv = () => isDevelopment;

/**
 * Логирование информации о текущей конфигурации
 */
const logIntervalConfig = () => {
  console.log(`[IntervalConfig] Текущая среда: ${isDevelopment ? 'development' : 'production'}`);
  console.log('[IntervalConfig] Активные интервалы:', INTERVALS);
};

// Экспортируем константы для удобства
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
  AUTO_SAVE: 'AUTO_SAVE',
  EFFECT_CLEANUP: 'EFFECT_CLEANUP'
};

module.exports = {
  getInterval,
  getAllIntervals,
  isProductionEnv,
  isDevelopmentEnv,
  logIntervalConfig,
  INTERVAL_TYPES
};