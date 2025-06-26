/**
 * Модуль для работы с техниками
 * Обеспечивает загрузку техник через адаптер и операции с ними
 */

// Импортируем адаптер вместо прямого доступа к базе данных
const TechniqueAdapter = require('../services/technique-adapter');

// Импортируем функции и константы из адаптера
const {
  getAllTechniques: adapterGetAllTechniques,
  getTechniqueById: adapterGetTechniqueById,
  getTechniqueByName: adapterGetTechniqueByName,
  getTechniquesByType: adapterGetTechniquesByType,
  getLearnedTechniques: adapterGetLearnedTechniques,
  getAvailableTechniques: adapterGetAvailableTechniques,
  learnTechnique: adapterLearnTechnique,
  upgradeTechnique: adapterUpgradeTechnique,
  calculateUpgradeCost: adapterCalculateUpgradeCost,
  techniqueTypes,
  elementTypes,
  elementColors
} = TechniqueAdapter;

// Кэш для хранения техник и вспомогательные структуры
let techniques = [];
let techniquesByLevel = {};

/**
 * Получить все техники
 * @returns {Promise<Array>} Массив техник
 */
async function getAllTechniques() {
  try {
    const result = await adapterGetAllTechniques();
    techniques = result; // Обновляем кэш
    
    // Обновляем вспомогательные структуры
    techniquesByLevel = {};
    techniques.forEach(technique => {
      const level = technique.baseLevel || 1;
      if (!techniquesByLevel[level]) {
        techniquesByLevel[level] = [];
      }
      techniquesByLevel[level].push(technique);
    });
    
    return result;
  } catch (error) {
    console.error('Ошибка при загрузке техник:', error);
    return techniques; // В случае ошибки возвращаем кэшированные данные
  }
}

/**
 * Получить технику по ID
 * @param {string} id ID техники
 * @returns {Promise<Object|null>} Техника или null, если не найдена
 */
async function getTechniqueById(id) {
  try {
    return await adapterGetTechniqueById(id);
  } catch (error) {
    console.error(`Ошибка при загрузке техники с ID ${id}:`, error);
    // Возвращаем технику из кэша, если она есть
    return techniques.find(t => t.id === id) || null;
  }
}

/**
 * Получить технику по имени
 * @param {string} name Имя техники
 * @returns {Promise<Object|null>} Техника или null, если не найдена
 */
async function getTechniqueByName(name) {
  try {
    return await adapterGetTechniqueByName(name);
  } catch (error) {
    console.error(`Ошибка при загрузке техники с именем ${name}:`, error);
    // Возвращаем технику из кэша, если она есть
    return techniques.find(t => t.name === name) || null;
  }
}

/**
 * Получить техники по типу
 * @param {string} type Тип техники
 * @returns {Promise<Array>} Массив техник указанного типа
 */
async function getTechniquesByType(type) {
  try {
    return await adapterGetTechniquesByType(type);
  } catch (error) {
    console.error(`Ошибка при загрузке техник типа ${type}:`, error);
    // В случае ошибки возвращаем из кэша
    return techniques.filter(t => t.type === type);
  }
}

/**
 * Получить изученные техники пользователя
 * @param {string} userId ID пользователя
 * @returns {Promise<Array>} Массив изученных техник
 */
async function getLearnedTechniques(userId) {
  try {
    return await adapterGetLearnedTechniques(userId);
  } catch (error) {
    console.error(`Ошибка при загрузке изученных техник для пользователя ${userId}:`, error);
    return [];
  }
}

/**
 * Получить доступные для изучения техники
 * @param {string} userId ID пользователя
 * @param {Object} params Параметры фильтрации
 * @returns {Promise<Array>} Массив доступных техник
 */
async function getAvailableTechniques(userId, params = {}) {
  try {
    return await adapterGetAvailableTechniques(userId, params);
  } catch (error) {
    console.error(`Ошибка при загрузке доступных техник для пользователя ${userId}:`, error);
    return [];
  }
}

/**
 * Изучить технику
 * @param {string} userId ID пользователя
 * @param {string} techniqueId ID техники
 * @returns {Promise<Object>} Результат операции
 */
async function learnTechnique(userId, techniqueId) {
  try {
    return await adapterLearnTechnique(userId, techniqueId);
  } catch (error) {
    console.error(`Ошибка при изучении техники ${techniqueId} пользователем ${userId}:`, error);
    throw error;
  }
}

/**
 * Улучшить технику
 * @param {string} userId ID пользователя
 * @param {string} learnedTechniqueId ID изученной техники
 * @returns {Promise<Object>} Результат операции
 */
async function upgradeTechnique(userId, learnedTechniqueId) {
  try {
    return await adapterUpgradeTechnique(userId, learnedTechniqueId);
  } catch (error) {
    console.error(`Ошибка при улучшении техники ${learnedTechniqueId} пользователем ${userId}:`, error);
    throw error;
  }
}

// Инициализация данных
async function initTechniqueData() {
  try {
    techniques = await getAllTechniques();
    return techniques;
  } catch (error) {
    console.error('Ошибка при инициализации данных техник:', error);
    return techniques;
  }
}

// Инициализируем данные при импорте модуля
initTechniqueData().catch(error => {
  console.error('Ошибка при инициализации данных техник:', error);
});

// Экспорты для обратной совместимости
module.exports = {
  techniques,
  techniqueTypes,
  elementTypes,
  elementColors,
  techniquesByLevel,
  getAllTechniques,
  getTechniqueById,
  getTechniqueByName,
  getTechniquesByType,
  getLearnedTechniques,
  getAvailableTechniques,
  learnTechnique,
  upgradeTechnique,
  calculateUpgradeCost: adapterCalculateUpgradeCost
};
