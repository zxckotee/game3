/**
 * Клиентская версия данных о техниках без серверных зависимостей
 * Использует API для получения данных с сервера
 */

const TechniqueAPI = require('../services/technique-api');

// Экспорт констант из API
const techniqueTypes = TechniqueAPI.techniqueTypes;
const elementTypes = TechniqueAPI.elementTypes;
const elementColors = TechniqueAPI.elementColors;

// Категории техник для интерфейса (локальные, не хранятся в БД)
const techniqueCategories = [
  { id: 'all', name: 'Все техники', filter: () => true },
  { id: 'attack', name: 'Атакующие', filter: t => t.type === techniqueTypes.ATTACK },
  { id: 'defense', name: 'Защитные', filter: t => t.type === techniqueTypes.DEFENSE },
  { id: 'support', name: 'Вспомогательные', filter: t => t.type === techniqueTypes.SUPPORT },
  { id: 'cultivation', name: 'Культивация', filter: t => t.type === techniqueTypes.CULTIVATION },
  { id: 'fire', name: 'Огонь', filter: t => t.damageType === 'fire' },
  { id: 'water', name: 'Вода', filter: t => t.damageType === 'water' },
  { id: 'earth', name: 'Земля', filter: t => t.damageType === 'earth' },
  { id: 'wind', name: 'Ветер', filter: t => t.damageType === 'wind' },
  { id: 'lightning', name: 'Молния', filter: t => t.damageType === 'lightning' },
  { id: 'darkness', name: 'Тьма', filter: t => t.damageType === 'darkness' },
  { id: 'light', name: 'Свет', filter: t => t.damageType === 'light' }
];

// Кэш техник для повышения производительности
let techniquesCache = [];
let initialized = false;

/**
 * Загружает все техники используя API
 * @returns {Promise<Array>} Массив техник
 */
async function loadTechniques() {
  try {
    const techniques = await TechniqueAPI.getAllTechniques();
    // Обновляем кэш
    techniquesCache = techniques;
    initialized = true;
    return techniques;
  } catch (error) {
    console.error('Ошибка при загрузке техник через API:', error);
    return techniquesCache;
  }
}

/**
 * Получает технику по ID через API
 * @param {string} id ID техники
 * @returns {Promise<Object|null>} Техника или null, если техника не найдена
 */
async function getTechniqueById(id) {
  // Если в кэше, используем его для оптимизации
  const cachedTechnique = techniquesCache.find(t => t.id === id);
  if (cachedTechnique) {
    return cachedTechnique;
  }
  
  try {
    return await TechniqueAPI.getTechniqueById(id);
  } catch (error) {
    console.error(`Ошибка при получении техники с ID ${id}:`, error);
    return null;
  }
}

/**
 * Получает технику по названию через API
 * @param {string} name Название техники
 * @returns {Promise<Object|null>} Техника или null, если техника не найдена
 */
async function getTechniqueByName(name) {
  // Если в кэше, используем его для оптимизации
  const cachedTechnique = techniquesCache.find(t => t.name === name);
  if (cachedTechnique) {
    return cachedTechnique;
  }
  
  try {
    return await TechniqueAPI.getTechniqueByName(name);
  } catch (error) {
    console.error(`Ошибка при получении техники с названием ${name}:`, error);
    return null;
  }
}

/**
 * Получает техники по типу через API
 * @param {string} type Тип техники
 * @returns {Promise<Array>} Массив техник указанного типа
 */
async function getTechniquesByType(type) {
  // Если есть в кэше, используем его для оптимизации
  if (initialized && techniquesCache.length > 0) {
    return techniquesCache.filter(t => t.type === type);
  }
  
  try {
    return await TechniqueAPI.getTechniquesByType(type);
  } catch (error) {
    console.error(`Ошибка при получении техник типа ${type}:`, error);
    return [];
  }
}

/**
 * Получает изученные техники пользователя через API
 * @param {string} userId ID пользователя
 * @returns {Promise<Array>} Массив изученных техник
 */
async function getLearnedTechniques(userId) {
  try {
    return await TechniqueAPI.getLearnedTechniques(userId);
  } catch (error) {
    console.error(`Ошибка при получении изученных техник пользователя ${userId}:`, error);
    return [];
  }
}

/**
 * Получает доступные для изучения техники через API
 * @param {string} userId ID пользователя
 * @param {number} userLevel Уровень пользователя
 * @returns {Promise<Array>} Массив доступных техник
 */
async function getAvailableTechniques(userId, userLevel) {
  try {
    return await TechniqueAPI.getAvailableTechniques(userId, userLevel);
  } catch (error) {
    console.error(`Ошибка при получении доступных техник для пользователя ${userId}:`, error);
    return [];
  }
}

/**
 * Изучает новую технику через API
 * @param {string} userId ID пользователя
 * @param {string} techniqueId ID техники
 * @returns {Promise<Object|null>} Результат операции
 */
async function learnTechnique(userId, techniqueId) {
  try {
    return await TechniqueAPI.learnTechnique(userId, techniqueId);
  } catch (error) {
    console.error(`Ошибка при изучении техники ${techniqueId}:`, error);
    return { error: true, message: error.message || 'Неизвестная ошибка' };
  }
}

/**
 * Улучшает изученную технику через API
 * @param {string} userId ID пользователя
 * @param {string} techniqueId ID техники
 * @param {number} targetLevel Целевой уровень
 * @returns {Promise<Object|null>} Результат операции
 */
async function upgradeTechnique(userId, techniqueId, targetLevel) {
  try {
    return await TechniqueAPI.upgradeTechnique(userId, techniqueId, targetLevel);
  } catch (error) {
    console.error(`Ошибка при улучшении техники ${techniqueId}:`, error);
    return { error: true, message: error.message || 'Неизвестная ошибка' };
  }
}

/**
 * Рассчитывает стоимость улучшения техники
 * @param {number} currentLevel Текущий уровень техники
 * @param {number} targetLevel Целевой уровень техники
 * @returns {number} Стоимость улучшения
 */
function calculateUpgradeCost(currentLevel, targetLevel) {
  return TechniqueAPI.calculateUpgradeCost(currentLevel, targetLevel);
}

/**
 * Рассчитывает эффекты техники с учетом уровня (клиентская версия)
 * @param {Object} technique Техника
 * @param {number} level Уровень техники (по умолчанию 1)
 * @returns {Object} Рассчитанные эффекты
 */
function calculateTechniqueEffects(technique, level = 1) {
  const result = { ...technique };
  
  if (!technique.effects) return result;
  
  const levelFactor = level - 1;
  result.calculatedEffects = technique.effects.map(effect => {
    // Получаем значение масштабирования или используем значение по умолчанию 0
    const scaling = effect.scaling || 0;
    return {
      type: effect.type,
      value: effect.value + (scaling * levelFactor),
      duration: effect.duration
    };
  });
  
  return result;
}

/**
 * Инициализирует данные о техниках, загружая их через API
 */
async function initTechniqueData() {
  console.log('Инициализация данных о техниках через API...');
  try {
    await loadTechniques();
    console.log(`Загружено ${techniquesCache.length} техник через API`);
  } catch (error) {
    console.error('Ошибка при инициализации данных о техниках:', error);
  }
}

// Инициализируем данные при загрузке модуля
initTechniqueData().catch(error => {
  console.error('Ошибка при автоматической инициализации техник:', error);
});

// Экспорт для совместимости со старым кодом
module.exports = {
  techniqueTypes,
  elementTypes,
  elementColors,
  techniqueCategories,
  loadTechniques,
  getTechniqueById,
  getTechniqueByName,
  getTechniquesByType,
  getLearnedTechniques,
  getAvailableTechniques,
  learnTechnique,
  upgradeTechnique,
  calculateUpgradeCost,
  calculateTechniqueEffects,
  initTechniqueData
};

// Экспортируем отдельные свойства для совместимости
module.exports.techniqueTypes = techniqueTypes;
module.exports.elementTypes = elementTypes;
module.exports.elementColors = elementColors;
module.exports.techniqueCategories = techniqueCategories;
module.exports.loadTechniques = loadTechniques;
module.exports.getTechniqueById = getTechniqueById;
module.exports.getTechniqueByName = getTechniqueByName;
module.exports.getTechniquesByType = getTechniquesByType;
module.exports.getLearnedTechniques = getLearnedTechniques;
module.exports.getAvailableTechniques = getAvailableTechniques;
module.exports.learnTechnique = learnTechnique;
module.exports.upgradeTechnique = upgradeTechnique;
module.exports.calculateUpgradeCost = calculateUpgradeCost;
module.exports.calculateTechniqueEffects = calculateTechniqueEffects;
module.exports.initTechniqueData = initTechniqueData;