/**
 * Утилиты для кеширования данных в localStorage
 */

const CACHE_DURATION = 60 * 1000; // 1 минута по умолчанию

/**
 * Получение данных из кеша
 * @param {string} key - Ключ для доступа к кешированным данным
 * @param {number} duration - Продолжительность актуальности кеша в мс (по умолчанию 1 минута)
 * @returns {any|null} - Данные или null, если кеш не найден или устарел
 */
export const getCachedData = (key, duration = CACHE_DURATION) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < duration) {
      console.log(`[Cache] Использованы кешированные данные для ${key}`);
      return data;
    } else {
      console.log(`[Cache] Кеш для ${key} устарел`);
    }
  } catch (e) {
    console.error('Ошибка при чтении кеша:', e);
    // При ошибке чтения удаляем проблемный кеш
    localStorage.removeItem(key);
  }
  return null;
};

/**
 * Сохранение данных в кеш
 * @param {string} key - Ключ для сохранения данных
 * @param {any} data - Данные для кеширования
 */
export const setCachedData = (key, data) => {
  if (!data) return; // Не кешируем null/undefined
  
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    console.log(`[Cache] Сохранены данные в кеш для ${key}`);
  } catch (e) {
    console.error('Ошибка при сохранении кеша:', e);
  }
};

/**
 * Очистка определенного кеша
 * @param {string} key - Ключ кеша для удаления
 */
export const clearCache = (key) => {
  localStorage.removeItem(key);
  console.log(`[Cache] Очищен кеш для ${key}`);
};

/**
 * Генерирует ключ кеша для секты пользователя
 * @param {number|string} userId - ID пользователя
 * @returns {string} - Ключ кеша
 */
export const getSectCacheKey = (userId) => `sect_data_${userId}`;

/**
 * Генерирует ключ кеша для списка доступных сект
 * @returns {string} - Ключ кеша
 */
export const getAvailableSectsCacheKey = () => 'available_sects_data';