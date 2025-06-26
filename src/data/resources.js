/**
 * Файл с данными о ресурсах игры
 * Содержит информацию о всех ресурсах, их свойствах и эффектах
 * Получает данные через адаптер ресурсов
 */

// Импортируем адаптер для работы с ресурсами
const ResourceAdapter = require('../services/resource-adapter');

// Определяем функции-обертки для методов адаптера
const adapterGetAllResources = ResourceAdapter.getAllResources || function() { return []; };
const adapterGetResourceById = ResourceAdapter.getResourceById || function() { return null; };
const adapterGetResourcesByType = ResourceAdapter.getResourcesByType || function() { return []; };
const adapterGetResourcesByRarity = ResourceAdapter.getResourcesByRarity || function() { return []; };
const adapterCreateResource = ResourceAdapter.createResource || function() { return null; };
const adapterUpdateResource = ResourceAdapter.updateResource || function() { return false; };
const adapterDeleteResource = ResourceAdapter.deleteResource || function() { return false; };

// Получаем константы из адаптера
const RESOURCE_TYPES = ResourceAdapter.RESOURCE_TYPES || {
  HERB: 'herb',
  ORE: 'ore',
  WOOD: 'wood',
  GEM: 'gem',
  SPIRITUAL: 'spiritual',
  MISC: 'misc'
};

const RARITY = ResourceAdapter.RARITY || {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

// Экспортируем константы для использования в других модулях
exports.RESOURCE_TYPES = RESOURCE_TYPES;
exports.RARITY = RARITY;

// Кэш ресурсов для обратной совместимости
let resources = [];

/**
 * Асинхронно загружает все ресурсы
 * @returns {Promise<Array>} Промис с массивом всех ресурсов
 */
async function getAllResources() {
  try {
    const result = await adapterGetAllResources();
    resources = result; // Обновляем кэш
    return result;
  } catch (error) {
    console.error('Ошибка при загрузке ресурсов:', error);
    return resources; // В случае ошибки возвращаем кэшированные данные
  }
}

/**
 * Получает ресурс по ID
 * @param {number} id ID ресурса
 * @returns {Promise<Object|null>} Промис с объектом ресурса или null
 */
async function getResourceById(id) {
  try {
    return await adapterGetResourceById(id);
  } catch (error) {
    console.error(`Ошибка при получении ресурса с ID ${id}:`, error);
    // Пытаемся найти в кэше
    return resources.find(r => r.id === id) || null;
  }
}

/**
 * Получает ресурсы указанного типа
 * @param {string} type Тип ресурса из RESOURCE_TYPES
 * @returns {Promise<Array>} Промис с массивом ресурсов указанного типа
 */
async function getResourcesByType(type) {
  try {
    return await adapterGetResourcesByType(type);
  } catch (error) {
    console.error(`Ошибка при получении ресурсов типа ${type}:`, error);
    // Фильтруем кэш
    return resources.filter(r => r.type === type);
  }
}

/**
 * Получает ресурсы указанной редкости
 * @param {string} rarity Редкость ресурса из RARITY
 * @returns {Promise<Array>} Промис с массивом ресурсов указанной редкости
 */
async function getResourcesByRarity(rarity) {
  try {
    return await adapterGetResourcesByRarity(rarity);
  } catch (error) {
    console.error(`Ошибка при получении ресурсов редкости ${rarity}:`, error);
    // Фильтруем кэш
    return resources.filter(r => r.rarity === rarity);
  }
}

/**
 * Создает новый ресурс
 * @param {Object} resourceData Данные ресурса
 * @returns {Promise<Object>} Промис с созданным ресурсом
 */
async function createResource(resourceData) {
  try {
    const newResource = await adapterCreateResource(resourceData);
    // Обновляем кэш
    resources.push(newResource);
    return newResource;
  } catch (error) {
    console.error('Ошибка при создании ресурса:', error);
    throw error;
  }
}

/**
 * Обновляет существующий ресурс
 * @param {number} id ID ресурса
 * @param {Object} updates Обновляемые поля
 * @returns {Promise<Object>} Промис с обновленным ресурсом
 */
async function updateResource(id, updates) {
  try {
    const updatedResource = await adapterUpdateResource(id, updates);
    // Обновляем кэш
    const index = resources.findIndex(r => r.id === id);
    if (index !== -1) {
      resources[index] = updatedResource;
    }
    return updatedResource;
  } catch (error) {
    console.error(`Ошибка при обновлении ресурса с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Удаляет ресурс
 * @param {number} id ID ресурса
 * @returns {Promise<boolean>} Промис с результатом операции
 */
async function deleteResource(id) {
  try {
    const result = await adapterDeleteResource(id);
    // Обновляем кэш
    const index = resources.findIndex(r => r.id === id);
    if (index !== -1) {
      resources.splice(index, 1);
    }
    return result;
  } catch (error) {
    console.error(`Ошибка при удалении ресурса с ID ${id}:`, error);
    throw error;
  }
}

// Инициализация кэша при загрузке модуля
(async function() {
  try {
    resources = await getAllResources();
    console.log(`Загружено ${resources.length} ресурсов`);
  } catch (error) {
    console.error('Ошибка при инициализации данных ресурсов:', error);
  }
})();

// Экспорт методов и данных
exports.getAllResources = getAllResources;
exports.getResourceById = getResourceById;
exports.getResourcesByType = getResourcesByType;
exports.getResourcesByRarity = getResourcesByRarity;
exports.createResource = createResource;
exports.updateResource = updateResource;
exports.deleteResource = deleteResource;
exports.resources = resources;
