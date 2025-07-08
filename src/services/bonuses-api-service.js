/**
 * API-сервис для работы с бонусами
 * Предоставляет методы для взаимодействия с API бонусов на клиенте
 */
const api = require('./api');

/**
 * Базовый путь для API бонусов
 */
const BONUSES_API_PATH = '/api/bonuses';

/**
 * Получение всех бонусов
 * @returns {Promise<Array>} Массив всех бонусов
 */
async function getAllBonuses() {
  try {
    const response = await api.get(BONUSES_API_PATH);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении всех бонусов:', error);
    throw error;
  }
}

/**
 * Получение бонуса по ID
 * @param {number} id ID бонуса
 * @returns {Promise<Object>} Объект бонуса
 */
async function getBonusById(id) {
  try {
    const response = await api.get(`${BONUSES_API_PATH}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении бонуса с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Получение бонусов по типу
 * @param {string} type Тип бонуса
 * @returns {Promise<Array>} Массив бонусов указанного типа
 */
async function getBonusesByType(type) {
  try {
    const response = await api.get(`${BONUSES_API_PATH}/type/${type}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении бонусов типа ${type}:`, error);
    throw error;
  }
}

/**
 * Получение бонусов по типу модификатора
 * @param {string} modifierType Тип модификатора (percent, flat, chance)
 * @returns {Promise<Array>} Массив бонусов с указанным типом модификатора
 */
async function getBonusesByModifierType(modifierType) {
  try {
    const response = await api.get(`${BONUSES_API_PATH}/modifier-type/${modifierType}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при получении бонусов с типом модификатора ${modifierType}:`, error);
    throw error;
  }
}

/**
 * Создание нового бонуса
 * @param {Object} bonusData Данные нового бонуса
 * @param {string} bonusData.type Тип бонуса
 * @param {number} bonusData.modifier Значение модификатора
 * @param {string} bonusData.modifier_type Тип модификатора (percent, flat, chance)
 * @param {string} [bonusData.description] Описание бонуса
 * @returns {Promise<Object>} Созданный бонус
 */
async function createBonus(bonusData) {
  try {
    const response = await api.post(BONUSES_API_PATH, bonusData);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании нового бонуса:', error);
    throw error;
  }
}

/**
 * Обновление существующего бонуса
 * @param {number} id ID бонуса для обновления
 * @param {Object} bonusData Данные для обновления
 * @returns {Promise<Object>} Обновленный бонус
 */
async function updateBonus(id, bonusData) {
  try {
    const response = await api.put(`${BONUSES_API_PATH}/${id}`, bonusData);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении бонуса с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Удаление бонуса
 * @param {number} id ID бонуса для удаления
 * @returns {Promise<Object>} Результат операции
 */
async function deleteBonus(id) {
  try {
    const response = await api.delete(`${BONUSES_API_PATH}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при удалении бонуса с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Получение всех типов бонусов
 * @returns {Promise<Array<string>>} Массив уникальных типов бонусов
 */
async function getAllBonusTypes() {
  try {
    const response = await api.get(`${BONUSES_API_PATH}/types`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении всех типов бонусов:', error);
    throw error;
  }
}

/**
 * Получение всех типов модификаторов
 * @returns {Promise<Array<string>>} Массив уникальных типов модификаторов
 */
async function getAllModifierTypes() {
  try {
    const response = await api.get(`${BONUSES_API_PATH}/modifier-types`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении всех типов модификаторов:', error);
    throw error;
  }
}

/**
 * Применение бонуса к характеристикам персонажа
 * @param {Object} characterStats Характеристики персонажа
 * @param {number} bonusId ID бонуса для применения
 * @returns {Promise<Object>} Обновленные характеристики персонажа
 */
async function applyBonusToCharacter(characterStats, bonusId) {
  try {
    const response = await api.post(`${BONUSES_API_PATH}/apply/${bonusId}`, { characterStats });
    return response.data;
  } catch (error) {
    console.error(`Ошибка при применении бонуса с ID ${bonusId} к персонажу:`, error);
    throw error;
  }
}

module.exports = {
  getAllBonuses,
  getBonusById,
  getBonusesByType,
  getBonusesByModifierType,
  createBonus,
  updateBonus,
  deleteBonus,
  getAllBonusTypes,
  getAllModifierTypes,
  applyBonusToCharacter
};