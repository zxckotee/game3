/**
 * Сервис для работы с ресурсами на сервере
 * Обрабатывает запросы от API и взаимодействует с базой данных
 */

const { unifiedDatabase } = require('./database-connection-manager');

// Импортируем константы из оригинального модуля resources
const { RESOURCE_TYPES, RARITY } = require('../data/resources');

// Экспортируем константы для использования в других модулях
exports.RESOURCE_TYPES = RESOURCE_TYPES;
exports.RARITY = RARITY;

/**
 * Получает все ресурсы из базы данных
 * @returns {Promise<Array>} Промис с массивом ресурсов
 */
exports.getAllResources = async () => {
  try {
    const Resource = await unifiedDatabase.getCollection('Resource');
    const resources = await Resource.findAll();
    
    return resources.map(resource => resource.toJSON());
  } catch (error) {
    console.error('Ошибка при получении всех ресурсов:', error);
    throw error;
  }
};

/**
 * Получает ресурс по ID из базы данных
 * @param {string} id - ID ресурса
 * @returns {Promise<Object|null>} Промис с ресурсом или null, если не найден
 */
exports.getResourceById = async (id) => {
  try {
    const Resource = await unifiedDatabase.getCollection('Resource');
    const resource = await Resource.findByPk(id);
    
    return resource ? resource.toJSON() : null;
  } catch (error) {
    console.error(`Ошибка при получении ресурса с ID ${id}:`, error);
    throw error;
  }
};

/**
 * Получает ресурсы по типу из базы данных
 * @param {string} type - Тип ресурса
 * @returns {Promise<Array>} Промис с массивом ресурсов указанного типа
 */
exports.getResourcesByType = async (type) => {
  try {
    const Resource = await unifiedDatabase.getCollection('Resource');
    const resources = await Resource.findAll({
      where: { type }
    });
    
    return resources.map(resource => resource.toJSON());
  } catch (error) {
    console.error(`Ошибка при получении ресурсов типа ${type}:`, error);
    throw error;
  }
};

/**
 * Получает ресурсы по редкости из базы данных
 * @param {string} rarity - Редкость ресурса
 * @returns {Promise<Array>} Промис с массивом ресурсов указанной редкости
 */
exports.getResourcesByRarity = async (rarity) => {
  try {
    const Resource = await unifiedDatabase.getCollection('Resource');
    const resources = await Resource.findAll({
      where: { rarity }
    });
    
    return resources.map(resource => resource.toJSON());
  } catch (error) {
    console.error(`Ошибка при получении ресурсов редкости ${rarity}:`, error);
    throw error;
  }
};

/**
 * Добавляет новый ресурс в базу данных
 * @param {Object} resourceData - Объект с данными ресурса
 * @returns {Promise<Object>} Промис с добавленным ресурсом
 */
exports.addNewResource = async (resourceData) => {
  try {
    // Проверяем обязательные поля
    if (!resourceData.id || !resourceData.name || !resourceData.type || !resourceData.rarity) {
      throw new Error('Ресурс должен иметь id, name, type и rarity');
    }
    
    const Resource = await unifiedDatabase.getCollection('Resource');
    
    // Проверяем, существует ли ресурс с таким ID
    const existingResource = await Resource.findByPk(resourceData.id);
    if (existingResource) {
      throw new Error(`Ресурс с ID ${resourceData.id} уже существует`);
    }
    
    // Добавляем значения по умолчанию для необязательных полей
    const resourceToCreate = {
      ...resourceData,
      description: resourceData.description || '',
      effects: resourceData.effects || {},
      value: resourceData.value || 0,
      stackable: resourceData.stackable !== undefined ? resourceData.stackable : true,
      maxStack: resourceData.maxStack || 99
    };
    
    // Создаем ресурс в базе данных
    const newResource = await Resource.create(resourceToCreate);
    
    return newResource.toJSON();
  } catch (error) {
    console.error('Ошибка при добавлении нового ресурса:', error);
    throw error;
  }
};

/**
 * Обновляет существующий ресурс в базе данных
 * @param {string} id - ID ресурса для обновления
 * @param {Object} updates - Объект с обновлениями
 * @returns {Promise<Object|null>} Промис с обновленным ресурсом или null, если не найден
 */
exports.updateResource = async (id, updates) => {
  try {
    const Resource = await unifiedDatabase.getCollection('Resource');
    
    // Находим ресурс для обновления
    const resource = await Resource.findByPk(id);
    if (!resource) {
      return null;
    }
    
    // Обновляем ресурс
    await resource.update(updates);
    
    return resource.toJSON();
  } catch (error) {
    console.error(`Ошибка при обновлении ресурса с ID ${id}:`, error);
    throw error;
  }
};

/**
 * Удаляет ресурс из базы данных
 * @param {string} id - ID ресурса для удаления
 * @returns {Promise<boolean>} Промис с результатом операции
 */
exports.deleteResource = async (id) => {
  try {
    const Resource = await unifiedDatabase.getCollection('Resource');
    
    // Находим ресурс для удаления
    const resource = await Resource.findByPk(id);
    if (!resource) {
      return false;
    }
    
    // Удаляем ресурс
    await resource.destroy();
    
    return true;
  } catch (error) {
    console.error(`Ошибка при удалении ресурса с ID ${id}:`, error);
    throw error;
  }
};

/**
 * Инициализирует ресурсы по умолчанию в базе данных
 * (используется при первом запуске или для восстановления)
 * @returns {Promise<Array>} Промис с массивом созданных ресурсов
 */
exports.initializeDefaultResources = async () => {
  try {
    const Resource = await unifiedDatabase.getCollection('Resource');
    
    // Получаем значения по умолчанию из модуля resources
    const { getDefaultResources } = require('../data/resources');
    const defaultResources = getDefaultResources();
    
    // Массив для хранения созданных ресурсов
    const createdResources = [];
    
    // Создаем или обновляем каждый ресурс по умолчанию
    for (const resourceData of defaultResources) {
      const [resource, created] = await Resource.findOrCreate({
        where: { id: resourceData.id },
        defaults: resourceData
      });
      
      // Если ресурс уже существовал, обновляем его поля
      if (!created) {
        await resource.update(resourceData);
      }
      
      createdResources.push(resource.toJSON());
    }
    
    return createdResources;
  } catch (error) {
    console.error('Ошибка при инициализации ресурсов по умолчанию:', error);
    throw error;
  }
};

/**
 * Возвращает необходимые ресурсы для прорыва культивации
 * @param {string} stage - Ступень культивации
 * @param {number} level - Текущий уровень
 * @returns {Object} - Объект с требуемыми ресурсами {resourceId: количество}
 */
exports.getBreakthroughResources = async (stage, level) => {
  try {
    // Статические данные ресурсов для прорыва (циклически повторяются каждые 3 уровня)
    const stageResourceSets = {
      'закалка тела': [
        // Набор 1 (уровни 1, 4, 7, 10...)
        {
          'herb_qigathering': 5,
          'mineral_dust': 2
        },
        // Набор 2 (уровни 2, 5, 8, 11...)
        {
          'herb_ironroot': 3,
          'water_pure': 2
        },
        // Набор 3 (уровни 3, 6, 9, 12...)
        {
          'herb_clearflow': 4,
          'crystal_clear': 1
        }
      ],
      'очищение ци': [
        // Набор 1
        {
          'herb_spiritbloom': 4,
          'essence_concentration': 2,
          'crystal_mind': 1
        },
        // Набор 2
        {
          'herb_goldensage': 3,
          'essence_purity': 2,
          'metal_celestial': 1
        },
        // Набор 3
        {
          'water_spirit': 5,
          'crystal_formation': 2
        }
      ],
      'золотое ядро': [
        // Набор 1
        {
          'herb_soulwhisper': 3,
          'essence_enlightenment': 2,
          'crystal_soul': 1
        },
        // Набор 2
        {
          'metal_heavenly': 2,
          'essence_heaven': 1,
          'crystal_star': 1
        },
        // Набор 3
        {
          'feather_phoenix': 1,
          'dust_stardust': 3
        }
      ],
      'формирование души': [
        // Набор 1
        {
          'spirit_ancient': 1,
          'essence_heaven': 2,
          'crystal_star': 2
        },
        // Набор 2
        {
          'herb_soulwhisper': 4,
          'essence_enlightenment': 3,
          'dust_stardust': 2
        },
        // Набор 3
        {
          'metal_heavenly': 3,
          'crystal_soul': 2,
          'feather_phoenix': 1
        }
      ]
    };

    // Получаем наборы ресурсов для текущей стадии
    const stageSets = stageResourceSets[stage.toLowerCase()] || stageResourceSets['закалка тела'];
    
    // Определяем какой набор использовать (циклически каждые 3 уровня)
    const setIndex = (level - 1) % 3;
    const resourceSet = stageSets[setIndex];
    
    // Вычисляем множитель на основе уровня
    const multiplier = Math.ceil(level / 3);
    
    // Формируем финальный объект ресурсов
    const finalResources = {};
    Object.keys(resourceSet).forEach(resourceId => {
      finalResources[resourceId] = resourceSet[resourceId] * multiplier;
    });
    
    return finalResources;
  } catch (error) {
    console.error(`Ошибка при получении ресурсов для прорыва (ступень: ${stage}, уровень: ${level}):`, error);
    return {};
  }
};
