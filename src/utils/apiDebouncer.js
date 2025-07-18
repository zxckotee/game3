/**
 * Утилита для дебаунсинга и throttling API запросов
 * Предотвращает избыточные запросы к серверу
 */

// Хранилище для дебаунс таймеров
const debounceTimers = new Map();

// Хранилище для throttle таймеров
const throttleTimers = new Map();

// Кеш последних результатов запросов
const requestCache = new Map();

/**
 * Дебаунсинг функции - откладывает выполнение до прекращения вызовов
 * @param {Function} func - Функция для дебаунсинга
 * @param {number} delay - Задержка в миллисекундах
 * @param {string} key - Уникальный ключ для идентификации функции
 * @returns {Function} Дебаунсированная функция
 */
const debounce = (func, delay, key) => {
  return (...args) => {
    // Очищаем предыдущий таймер
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key));
    }
    
    // Устанавливаем новый таймер
    const timer = setTimeout(() => {
      debounceTimers.delete(key);
      func.apply(this, args);
    }, delay);
    
    debounceTimers.set(key, timer);
  };
};

/**
 * Throttling функции - ограничивает частоту выполнения
 * @param {Function} func - Функция для throttling
 * @param {number} limit - Минимальный интервал между вызовами в миллисекундах
 * @param {string} key - Уникальный ключ для идентификации функции
 * @returns {Function} Throttled функция
 */
const throttle = (func, limit, key) => {
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

/**
 * Дебаунсинг API запросов с кешированием
 * @param {Function} apiFunction - API функция для вызова
 * @param {number} delay - Задержка дебаунсинга
 * @param {string} cacheKey - Ключ для кеширования
 * @param {number} cacheTime - Время жизни кеша в миллисекундах
 * @returns {Function} Дебаунсированная API функция
 */
const debounceApiCall = (apiFunction, delay = 1000, cacheKey, cacheTime = 30000) => {
  return debounce(async (...args) => {
    try {
      // Проверяем кеш
      if (cacheKey && requestCache.has(cacheKey)) {
        const cached = requestCache.get(cacheKey);
        if (Date.now() - cached.timestamp < cacheTime) {
          console.log(`[ApiDebouncer] Используем кешированный результат для ${cacheKey}`);
          return cached.data;
        }
      }
      
      console.log(`[ApiDebouncer] Выполняем API запрос: ${cacheKey || 'unknown'}`);
      const result = await apiFunction(...args);
      
      // Сохраняем в кеш
      if (cacheKey && result) {
        requestCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }
      
      return result;
    } catch (error) {
      console.error(`[ApiDebouncer] Ошибка API запроса ${cacheKey}:`, error);
      throw error;
    }
  }, delay, cacheKey || `api_${Date.now()}`);
};

/**
 * Throttling API запросов
 * @param {Function} apiFunction - API функция для вызова
 * @param {number} limit - Минимальный интервал между запросами
 * @param {string} key - Уникальный ключ
 * @returns {Function} Throttled API функция
 */
const throttleApiCall = (apiFunction, limit = 2000, key) => {
  return throttle(async (...args) => {
    try {
      console.log(`[ApiDebouncer] Throttled API запрос: ${key || 'unknown'}`);
      return await apiFunction(...args);
    } catch (error) {
      console.error(`[ApiDebouncer] Ошибка throttled API запроса ${key}:`, error);
      throw error;
    }
  }, limit, key || `throttle_${Date.now()}`);
};

/**
 * Создает дебаунсированную версию функции обновления профиля
 * @param {Function} updateFunction - Функция обновления
 * @param {string} userId - ID пользователя
 * @returns {Function} Дебаунсированная функция
 */
const createDebouncedProfileUpdate = (updateFunction, userId) => {
  return debounceApiCall(
    updateFunction,
    2000, // 2 секунды дебаунс
    `profile_update_${userId}`,
    60000 // Кеш на 1 минуту
  );
};

/**
 * Создает дебаунсированную версию функции обновления инвентаря
 * @param {Function} updateFunction - Функция обновления
 * @param {string} userId - ID пользователя
 * @returns {Function} Дебаунсированная функция
 */
const createDebouncedInventoryUpdate = (updateFunction, userId) => {
  return debounceApiCall(
    updateFunction,
    1500, // 1.5 секунды дебаунс
    `inventory_update_${userId}`,
    30000 // Кеш на 30 секунд
  );
};

/**
 * Создает throttled версию функции для частых обновлений
 * @param {Function} updateFunction - Функция обновления
 * @param {string} key - Уникальный ключ
 * @param {number} limit - Лимит throttling
 * @returns {Function} Throttled функция
 */
const createThrottledUpdate = (updateFunction, key, limit = 3000) => {
  return throttleApiCall(updateFunction, limit, key);
};

/**
 * Очистка всех таймеров и кеша
 */
const clearAllTimers = () => {
  // Очищаем дебаунс таймеры
  debounceTimers.forEach(timer => clearTimeout(timer));
  debounceTimers.clear();
  
  // Очищаем throttle таймеры
  throttleTimers.clear();
  
  // Очищаем кеш
  requestCache.clear();
  
  console.log('[ApiDebouncer] Все таймеры и кеш очищены');
};

/**
 * Очистка старого кеша
 * @param {number} maxAge - Максимальный возраст кеша в миллисекундах
 */
const cleanupCache = (maxAge = 300000) => { // 5 минут по умолчанию
  const now = Date.now();
  const keysToDelete = [];
  
  requestCache.forEach((value, key) => {
    if (now - value.timestamp > maxAge) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => requestCache.delete(key));
  
  if (keysToDelete.length > 0) {
    console.log(`[ApiDebouncer] Очищено ${keysToDelete.length} устаревших записей кеша`);
  }
};

/**
 * Получить статистику по кешу и таймерам
 * @returns {object} Статистика
 */
const getStats = () => {
  return {
    debounceTimers: debounceTimers.size,
    throttleTimers: throttleTimers.size,
    cacheEntries: requestCache.size,
    cacheKeys: Array.from(requestCache.keys())
  };
};

// Автоматическая очистка кеша каждые 5 минут
setInterval(() => {
  cleanupCache();
}, 300000);

module.exports = {
  debounce,
  throttle,
  debounceApiCall,
  throttleApiCall,
  createDebouncedProfileUpdate,
  createDebouncedInventoryUpdate,
  createThrottledUpdate,
  clearAllTimers,
  cleanupCache,
  getStats
};