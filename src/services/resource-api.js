/**
 * API для взаимодействия с ресурсами через HTTP
 * Используется в клиентской части для доступа к данным на сервере
 */

// Импортируем базовый API клиент для отправки запросов
const { apiRequest } = require('./api');

// Создаем объект api с методами для HTTP запросов
const api = {
  get: async (url) => {
    try {
      const response = await apiRequest('GET', url);
      return { data: response };
    } catch (error) {
      console.warn(`API GET запрос к ${url} не удался:`, error.message);
      return { data: [] };
    }
  },
  post: async (url, data) => {
    try {
      const response = await apiRequest('POST', url, data);
      return { data: response };
    } catch (error) {
      console.warn(`API POST запрос к ${url} не удался:`, error.message);
      return { data: {} };
    }
  },
  put: async (url, data) => {
    try {
      const response = await apiRequest('PUT', url, data);
      return { data: response };
    } catch (error) {
      console.warn(`API PUT запрос к ${url} не удался:`, error.message);
      return { data: {} };
    }
  },
  delete: async (url) => {
    try {
      const response = await apiRequest('DELETE', url);
      return { data: response };
    } catch (error) {
      console.warn(`API DELETE запрос к ${url} не удался:`, error.message);
      return { data: { success: false } };
    }
  }
};

/**
 * Получает все ресурсы с сервера
 * @returns {Promise<Array>} Промис с массивом ресурсов
 */
async function getAllResources() {
  try {
    const response = await api.get('/api/resources');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении ресурсов с сервера:', error);
    throw error;
  }
}

/**
 * Получает ресурс по ID с сервера
 * @param {string} id - ID ресурса
 * @returns {Promise<Object|null>} Промис с ресурсом или null, если не найден
 */
async function getResourceById(id) {
  try {
    const response = await api.get(`/api/resources/${id}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error(`Ошибка при получении ресурса с ID ${id} с сервера:`, error);
    throw error;
  }
}

/**
 * Получает ресурсы по типу с сервера
 * @param {string} type - Тип ресурса
 * @returns {Promise<Array>} Промис с массивом ресурсов указанного типа
 */
async function getResourcesByType(type) {
  try {
    const response = await api.get(`/api/resources/type/${type}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении ресурсов типа ${type} с сервера:`, error);
    throw error;
  }
}

/**
 * Получает ресурсы по редкости с сервера
 * @param {string} rarity - Редкость ресурса
 * @returns {Promise<Array>} Промис с массивом ресурсов указанной редкости
 */
async function getResourcesByRarity(rarity) {
  try {
    const response = await api.get(`/api/resources/rarity/${rarity}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении ресурсов редкости ${rarity} с сервера:`, error);
    throw error;
  }
}

/**
 * Добавляет новый ресурс на сервере (только для администраторов)
 * @param {Object} resource - Объект ресурса для добавления
 * @returns {Promise<Object>} Промис с добавленным ресурсом
 */
async function addNewResource(resource) {
  try {
    const response = await api.post('/api/resources', resource);
    return response.data;
  } catch (error) {
    console.error('Ошибка при добавлении нового ресурса на сервере:', error);
    throw error;
  }
}

/**
 * Обновляет существующий ресурс на сервере (только для администраторов)
 * @param {string} id - ID ресурса для обновления
 * @param {Object} updates - Объект с обновлениями
 * @returns {Promise<Object|null>} Промис с обновленным ресурсом или null, если не найден
 */
async function updateResource(id, updates) {
  try {
    const response = await api.put(`/api/resources/${id}`, updates);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error(`Ошибка при обновлении ресурса с ID ${id} на сервере:`, error);
    throw error;
  }
}

/**
 * Удаляет ресурс с сервера (только для администраторов)
 * @param {string} id - ID ресурса для удаления
 * @returns {Promise<boolean>} Промис с результатом операции
 */
async function deleteResource(id) {
  try {
    await api.delete(`/api/resources/${id}`);
    return true;
  } catch (error) {
    console.error(`Ошибка при удалении ресурса с ID ${id} с сервера:`, error);
    return false;
  }
}

// Экспортируем константы типов и редкости через API
// В реальной ситуации эти данные должны приходить с сервера вместе с ресурсами
// Но для совместимости можно сделать и так
const RESOURCE_TYPES = {
  HERB: 'herb',
  PILL: 'pill',
  MINERAL: 'mineral',
  ESSENCE: 'essence',
  MATERIAL: 'material',
  ARTIFACT: 'artifact',
  SOUL: 'soul',
  CURRENCY: 'currency'
};

const RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic'
};

// Экспортируем функции и константы через module.exports
module.exports = {
  getAllResources,
  getResourceById,
  getResourcesByType,
  getResourcesByRarity,
  addNewResource,
  updateResource,
  deleteResource,
  RESOURCE_TYPES,
  RARITY
};

// Экспортируем отдельные свойства для совместимости
module.exports.getAllResources = getAllResources;
module.exports.getResourceById = getResourceById;
module.exports.getResourcesByType = getResourcesByType;
module.exports.getResourcesByRarity = getResourcesByRarity;
module.exports.addNewResource = addNewResource;
module.exports.updateResource = updateResource;
module.exports.deleteResource = deleteResource;
module.exports.RESOURCE_TYPES = RESOURCE_TYPES;
module.exports.RARITY = RARITY;

/**
 * Получает требуемые ресурсы для прорыва культивации
 * @param {string} stage - Ступень культивации
 * @param {number} level - Текущий уровень
 * @returns {Promise<Object>} - Промис с объектом требуемых ресурсов
 */
async function getBreakthroughResources(stage, level) {
  try {
    const response = await api.get(`/api/resources/breakthrough?stage=${encodeURIComponent(stage)}&level=${level}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении ресурсов для прорыва (ступень: ${stage}, уровень: ${level}):`, error);
    // Возвращаем пустой объект в случае ошибки
    return {};
  }
}

// Добавляем в экспорт
module.exports.getBreakthroughResources = getBreakthroughResources;