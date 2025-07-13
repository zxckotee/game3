/**
 * API клиент для работы с локациями
 * Использует централизованную функцию apiRequest из api.js
 */

const { apiRequest } = require('./api');

// Кэш для локаций
let locationsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

/**
 * Получает все локации
 * @returns {Promise<Array>} Массив локаций
 */
async function getAllLocations() {
  try {
    // Проверяем кэш
    const now = Date.now();
    if (locationsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('[Location API] Возвращаем локации из кэша');
      return locationsCache;
    }

    console.log('[Location API] Запрос всех локаций с сервера');
    
    // Используем apiRequest для выполнения запроса
    const response = await apiRequest('GET', '/api/locations');
    
    // Кэшируем результат
    locationsCache = response;
    cacheTimestamp = now;
    
    console.log(`[Location API] Получено ${response.length} локаций`);
    return response;
    
  } catch (error) {
    console.error('[Location API] Ошибка при получении локаций:', error);
    
    // В случае ошибки возвращаем кэш, если он есть
    if (locationsCache) {
      console.log('[Location API] Возвращаем устаревший кэш из-за ошибки');
      return locationsCache;
    }
    
    // Если кэша нет, возвращаем пустой массив
    console.log('[Location API] Возвращаем пустой массив из-за ошибки');
    return [];
  }
}

/**
 * Получает локацию по ID
 * @param {string} locationId - ID локации
 * @returns {Promise<Object|null>} Объект локации или null
 */
async function getLocationById(locationId) {
  try {
    console.log(`[Location API] Запрос локации ${locationId}`);
    
    // Используем apiRequest для выполнения запроса
    const response = await apiRequest('GET', `/api/locations/${locationId}`);
    
    console.log(`[Location API] Получена локация ${locationId}`);
    return response;
    
  } catch (error) {
    console.error(`[Location API] Ошибка при получении локации ${locationId}:`, error);
    
    // Пытаемся найти в кэше
    if (locationsCache) {
      const cachedLocation = locationsCache.find(loc => loc.id === locationId);
      if (cachedLocation) {
        console.log(`[Location API] Найдена локация ${locationId} в кэше`);
        return cachedLocation;
      }
    }
    
    return null;
  }
}

/**
 * Создает новую локацию
 * @param {Object} locationData - Данные локации
 * @returns {Promise<Object>} Созданная локация
 */
async function createLocation(locationData) {
  try {
    console.log('[Location API] Создание новой локации:', locationData.name);
    
    // Используем apiRequest для выполнения запроса
    const response = await apiRequest('POST', '/api/locations', locationData);
    
    // Очищаем кэш
    clearCache();
    
    console.log('[Location API] Локация успешно создана');
    return response;
    
  } catch (error) {
    console.error('[Location API] Ошибка при создании локации:', error);
    throw error;
  }
}

/**
 * Обновляет локацию
 * @param {string} locationId - ID локации
 * @param {Object} updateData - Данные для обновления
 * @returns {Promise<Object>} Обновленная локация
 */
async function updateLocation(locationId, updateData) {
  try {
    console.log(`[Location API] Обновление локации ${locationId}`);
    
    // Используем apiRequest для выполнения запроса
    const response = await apiRequest('PUT', `/api/locations/${locationId}`, updateData);
    
    // Очищаем кэш
    clearCache();
    
    console.log(`[Location API] Локация ${locationId} успешно обновлена`);
    return response;
    
  } catch (error) {
    console.error(`[Location API] Ошибка при обновлении локации ${locationId}:`, error);
    throw error;
  }
}

/**
 * Удаляет локацию
 * @param {string} locationId - ID локации
 * @returns {Promise<boolean>} true если удалена успешно
 */
async function deleteLocation(locationId) {
  try {
    console.log(`[Location API] Удаление локации ${locationId}`);
    
    // Используем apiRequest для выполнения запроса
    await apiRequest('DELETE', `/api/locations/${locationId}`);
    
    // Очищаем кэш
    clearCache();
    
    console.log(`[Location API] Локация ${locationId} успешно удалена`);
    return true;
    
  } catch (error) {
    console.error(`[Location API] Ошибка при удалении локации ${locationId}:`, error);
    throw error;
  }
}

/**
 * Очищает кэш локаций
 */
function clearCache() {
  locationsCache = null;
  cacheTimestamp = 0;
  console.log('[Location API] Кэш локаций очищен');
}


module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  clearCache
};