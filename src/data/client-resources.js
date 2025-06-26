/**
 * Клиентская версия модуля ресурсов
 * Предназначена для использования в браузере, где нет доступа к БД
 */

// Типы ресурсов
const RESOURCE_TYPES = {
  HERB: 'herb',         // Травы
  PILL: 'pill',         // Пилюли
  MINERAL: 'mineral',   // Минералы
  ESSENCE: 'essence',   // Эссенции
  MATERIAL: 'material', // Материалы
  ARTIFACT: 'artifact', // Артефакты
  SOUL: 'soul',         // Души существ
  CURRENCY: 'currency'  // Валюта
};

// Редкость ресурсов
const RARITY = {
  COMMON: 'common',     // Обычный
  UNCOMMON: 'uncommon', // Необычный
  RARE: 'rare',         // Редкий
  EPIC: 'epic',         // Эпический
  LEGENDARY: 'legendary', // Легендарный
  MYTHIC: 'mythic'      // Мифический
};

// Хранилище ресурсов в памяти
let resources = getDefaultResources();

/**
 * Загружает ресурсы из локального хранилища браузера
 */
function loadFromStorage() {
  try {
    const storedResources = localStorage.getItem('game_resources');
    if (storedResources) {
      resources = JSON.parse(storedResources);
      console.log(`Загружено ${resources.length} ресурсов из локального хранилища`);
    }
  } catch (error) {
    console.error('Ошибка при загрузке ресурсов из localStorage:', error);
  }
}

/**
 * Сохраняет ресурсы в локальное хранилище браузера
 */
function saveResourcesToStorage() {
  try {
    localStorage.setItem('game_resources', JSON.stringify(resources));
  } catch (error) {
    console.error('Ошибка при сохранении ресурсов в localStorage:', error);
  }
}

/**
 * Получает все ресурсы
 * @returns {Promise<Array>} Массив ресурсов
 */
async function getAllResources() {
  return resources;
}

/**
 * Получает ресурс по ID
 * @param {string} id - ID ресурса
 * @returns {Promise<Object|null>} Ресурс или null, если не найден
 */
async function getResourceById(id) {
  return resources.find(resource => resource.id === id) || null;
}

/**
 * Получает ресурсы по типу
 * @param {string} type - Тип ресурса
 * @returns {Promise<Array>} Массив ресурсов указанного типа
 */
async function getResourcesByType(type) {
  return resources.filter(resource => resource.type === type);
}

/**
 * Получает ресурсы по редкости
 * @param {string} rarity - Редкость ресурса
 * @returns {Promise<Array>} Массив ресурсов указанной редкости
 */
async function getResourcesByRarity(rarity) {
  return resources.filter(resource => resource.rarity === rarity);
}

/**
 * Добавляет новый ресурс (только для клиента)
 * @param {Object} resource - Объект ресурса
 * @returns {Promise<Object>} Добавленный ресурс
 */
async function addNewResource(resource) {
  // Проверяем, что ресурс имеет необходимые поля
  if (!resource.id || !resource.name || !resource.type || !resource.rarity) {
    throw new Error('Ресурс должен иметь id, name, type и rarity');
  }

  // Проверяем, что ресурс с таким ID не существует
  if (resources.some(r => r.id === resource.id)) {
    throw new Error(`Ресурс с ID ${resource.id} уже существует`);
  }

  // Добавляем значения по умолчанию для необязательных полей
  const newResource = {
    ...resource,
    description: resource.description || '',
    effects: resource.effects || {},
    value: resource.value || 0,
    stackable: resource.stackable !== undefined ? resource.stackable : true,
    maxStack: resource.maxStack || 99
  };

  // Добавляем ресурс в массив
  resources.push(newResource);

  // Сохраняем в локальное хранилище
  saveResourcesToStorage();

  return newResource;
}

/**
 * Обновляет существующий ресурс (только для клиента)
 * @param {string} id - ID ресурса
 * @param {Object} updates - Объект с обновлениями
 * @returns {Promise<Object|null>} Обновленный ресурс или null, если не найден
 */
async function updateResource(id, updates) {
  const index = resources.findIndex(resource => resource.id === id);
  
  if (index === -1) {
    return null;
  }

  // Обновляем ресурс
  resources[index] = {
    ...resources[index],
    ...updates
  };

  // Сохраняем в локальное хранилище
  saveResourcesToStorage();

  return resources[index];
}

/**
 * Получает значения ресурсов по умолчанию
 * @returns {Array} Массив ресурсов по умолчанию
 */
function getDefaultResources() {
  return [
    {
      id: 'copper_ore',
      name: 'Медная руда',
      description: 'Распространенный минерал, используемый в создании базовых артефактов и оружия.',
      type: RESOURCE_TYPES.MINERAL,
      rarity: RARITY.COMMON,
      value: 10,
      stackable: true,
      maxStack: 99,
      effects: {}
    },
    {
      id: 'iron_ore',
      name: 'Железная руда',
      description: 'Прочный минерал, необходимый для создания оружия и брони среднего уровня.',
      type: RESOURCE_TYPES.MINERAL,
      rarity: RARITY.COMMON,
      value: 15,
      stackable: true,
      maxStack: 99,
      effects: {}
    },
    {
      id: 'spirit_herb',
      name: 'Духовная трава',
      description: 'Трава, впитавшая духовную энергию. Используется в алхимии и культивации.',
      type: RESOURCE_TYPES.HERB,
      rarity: RARITY.UNCOMMON,
      value: 25,
      stackable: true,
      maxStack: 50,
      effects: { cultivation_boost: 5 }
    },
    {
      id: 'spirit_stone',
      name: 'Духовный камень',
      description: 'Камень, содержащий концентрированную духовную энергию. Основная валюта в мире культивации.',
      type: RESOURCE_TYPES.CURRENCY,
      rarity: RARITY.UNCOMMON,
      value: 100,
      stackable: true,
      maxStack: 9999,
      effects: {}
    },
    {
      id: 'qi_essence',
      name: 'Эссенция ци',
      description: 'Чистая эссенция духовной энергии, используемая для прорывов в культивации.',
      type: RESOURCE_TYPES.ESSENCE,
      rarity: RARITY.RARE,
      value: 500,
      stackable: true,
      maxStack: 10,
      effects: { cultivation_breakthrough: 1 }
    }
  ];
}

// При загрузке модуля пытаемся загрузить данные из localStorage
loadFromStorage();

// Экспортируем по умолчанию весь объект
module.exports = {
  RESOURCE_TYPES,
  RARITY,
  getAllResources,
  getResourceById,
  getResourcesByType,
  getResourcesByRarity,
  saveResourcesToStorage,
  addNewResource,
  updateResource
};

// Экспортируем отдельные свойства для совместимости
module.exports.RESOURCE_TYPES = RESOURCE_TYPES;
module.exports.RARITY = RARITY;
module.exports.getAllResources = getAllResources;
module.exports.getResourceById = getResourceById;
module.exports.getResourcesByType = getResourcesByType;
module.exports.getResourcesByRarity = getResourcesByRarity;
module.exports.saveResourcesToStorage = saveResourcesToStorage;
module.exports.addNewResource = addNewResource;
module.exports.updateResource = updateResource;