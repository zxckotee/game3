/**
 * Сервис для работы с предметами экипировки
 * Предоставляет методы для получения, создания, обновления и удаления предметов экипировки
 */
const modelRegistry = require('../models/registry');
const { Op } = require('sequelize');
const connectionProvider = require('../utils/connection-provider');


/**
 * Получение всех предметов экипировки
 * @param {Object} options Опции запроса
 * @param {number} [options.limit] Ограничение количества результатов
 * @param {number} [options.offset] Смещение результатов
 * @param {string} [options.orderBy] Поле для сортировки
 * @param {string} [options.orderDirection] Направление сортировки ('ASC' или 'DESC')
 * @returns {Promise<Array>} Массив предметов экипировки
 */
async function getAllEquipmentItems(options = {}) {
  try {
    // Инициализируем реестр моделей перед получением моделей
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemEffect = modelRegistry.getModel('EquipmentItemEffect');
    const EquipmentItemRequirement = modelRegistry.getModel('EquipmentItemRequirement');
    const EquipmentItemSpecialEffect = modelRegistry.getModel('EquipmentItemSpecialEffect');
    
    const { limit, offset, orderBy = 'name', orderDirection = 'ASC' } = options;
    
    return await EquipmentItem.findAll({
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [[orderBy, orderDirection]],
      include: [
        { model: EquipmentItemEffect, as: 'effects' },
        { model: EquipmentItemRequirement, as: 'requirements' },
        { model: EquipmentItemSpecialEffect, as: 'specialEffects' }
      ]
    });
  } catch (error) {
    console.error('Ошибка при получении всех предметов экипировки:', error);
    throw error;
  }
}

/**
 * Получение предмета экипировки по ID
 * @param {number} id ID предмета
 * @returns {Promise<Object|null>} Предмет экипировки или null, если предмет не найден
 */
async function getEquipmentItemById(id) {

  await modelRegistry.initializeRegistry();
  const EquipmentItem = modelRegistry.getModel('EquipmentItem');
  try {
    return await EquipmentItem.findByPk(id, {
      include: [
        { model: EquipmentItemEffect, as: 'effects' },
        { model: EquipmentItemRequirement, as: 'requirements' },
        { model: EquipmentItemSpecialEffect, as: 'specialEffects' }
      ]
    });
  } catch (error) {
    console.error(`Ошибка при получении предмета экипировки с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Получение предмета экипировки по item_id
 * @param {string} itemId ID предмета (строковый идентификатор)
 * @returns {Promise<Object|null>} Предмет экипировки или null, если предмет не найден
 */
async function getEquipmentItemByItemId(itemId) {
  try {
    // Инициализируем реестр моделей перед получением моделей
    await modelRegistry.initializeRegistry();
    // Получаем модели через реестр
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemEffect = modelRegistry.getModel('EquipmentItemEffect');
    const EquipmentItemRequirement = modelRegistry.getModel('EquipmentItemRequirement');
    const EquipmentItemSpecialEffect = modelRegistry.getModel('EquipmentItemSpecialEffect');
    
    return await EquipmentItem.findOne({
      where: { item_id: itemId },
      include: [
        { model: EquipmentItemEffect, as: 'effects' },
        { model: EquipmentItemRequirement, as: 'requirements' },
        { model: EquipmentItemSpecialEffect, as: 'specialEffects' }
      ]
    });
  } catch (error) {
    console.error(`Ошибка при получении предмета экипировки с item_id ${itemId}:`, error);
    throw error;
  }
}

/**
 * Получение предметов экипировки по типу
 * @param {string} type Тип предмета
 * @returns {Promise<Array>} Массив предметов экипировки указанного типа
 */
async function getEquipmentItemsByType(type) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemEffect = modelRegistry.getModel('EquipmentItemEffect');
    const EquipmentItemRequirement = modelRegistry.getModel('EquipmentItemRequirement');
    const EquipmentItemSpecialEffect = modelRegistry.getModel('EquipmentItemSpecialEffect');

    return await EquipmentItem.findAll({
      where: { type },
      include: [
        { model: EquipmentItemEffect, as: 'effects' },
        { model: EquipmentItemRequirement, as: 'requirements' },
        { model: EquipmentItemSpecialEffect, as: 'specialEffects' }
      ],
      order: [['rarity', 'ASC'], ['name', 'ASC']]
    });
  } catch (error) {
    console.error(`Ошибка при получении предметов экипировки типа ${type}:`, error);
    throw error;
  }
}

/**
 * Получение предметов экипировки по редкости
 * @param {string} rarity Редкость предмета
 * @returns {Promise<Array>} Массив предметов экипировки указанной редкости
 */
async function getEquipmentItemsByRarity(rarity) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemEffect = modelRegistry.getModel('EquipmentItemEffect');
    const EquipmentItemRequirement = modelRegistry.getModel('EquipmentItemRequirement');
    const EquipmentItemSpecialEffect = modelRegistry.getModel('EquipmentItemSpecialEffect');

    return await EquipmentItem.findAll({
      where: { rarity },
      include: [
        { model: EquipmentItemEffect, as: 'effects' },
        { model: EquipmentItemRequirement, as: 'requirements' },
        { model: EquipmentItemSpecialEffect, as: 'specialEffects' }
      ],
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
  } catch (error) {
    console.error(`Ошибка при получении предметов экипировки редкости ${rarity}:`, error);
    throw error;
  }
}

/**
 * Получение предметов экипировки по набору (сету)
 * @param {string} setId ID набора
 * @returns {Promise<Array>} Массив предметов экипировки из указанного набора
 */
async function getEquipmentItemsBySet(setId) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemEffect = modelRegistry.getModel('EquipmentItemEffect');
    const EquipmentItemRequirement = modelRegistry.getModel('EquipmentItemRequirement');
    const EquipmentItemSpecialEffect = modelRegistry.getModel('EquipmentItemSpecialEffect');

    return await EquipmentItem.findAll({
      where: { set_id: setId },
      include: [
        { model: EquipmentItemEffect, as: 'effects' },
        { model: EquipmentItemRequirement, as: 'requirements' },
        { model: EquipmentItemSpecialEffect, as: 'specialEffects' }
      ],
      order: [['type', 'ASC'], ['name', 'ASC']]
    });
  } catch (error) {
    console.error(`Ошибка при получении предметов экипировки из набора ${setId}:`, error);
    throw error;
  }
}

/**
 * Создание нового предмета экипировки
 * @param {Object} itemData Данные предмета
 * @param {Array} [effectsData] Данные эффектов предмета
 * @param {Array} [requirementsData] Данные требований предмета
 * @param {Array} [specialEffectsData] Данные специальных эффектов предмета
 * @returns {Promise<Object>} Созданный предмет экипировки
 */
async function createEquipmentItem(itemData, effectsData = [], requirementsData = [], specialEffectsData = []) {
  const { db } = await connectionProvider.getSequelizeInstance();
  const transaction = await db.transaction();
  
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemEffect = modelRegistry.getModel('EquipmentItemEffect');
    const EquipmentItemRequirement = modelRegistry.getModel('EquipmentItemRequirement');
    const EquipmentItemSpecialEffect = modelRegistry.getModel('EquipmentItemSpecialEffect');

    // Создаем предмет
    const item = await EquipmentItem.create(itemData, { transaction });
    
    // Создаем эффекты предмета
    if (effectsData.length > 0) {
      const effects = effectsData.map(effect => ({
        ...effect,
        item_id: item.item_id
      }));
      await EquipmentItemEffect.bulkCreate(effects, { transaction });
    }
    
    // Создаем требования предмета
    if (requirementsData.length > 0) {
      const requirements = requirementsData.map(requirement => ({
        ...requirement,
        item_id: item.item_id
      }));
      await EquipmentItemRequirement.bulkCreate(requirements, { transaction });
    }
    
    // Создаем специальные эффекты предмета
    if (specialEffectsData.length > 0) {
      const specialEffects = specialEffectsData.map(specialEffect => ({
        ...specialEffect,
        item_id: item.item_id
      }));
      await EquipmentItemSpecialEffect.bulkCreate(specialEffects, { transaction });
    }
    
    await transaction.commit();
    
    // Получаем созданный предмет со всеми связанными данными
    return await getEquipmentItemByItemId(item.item_id);
  } catch (error) {
    await transaction.rollback();
    console.error('Ошибка при создании предмета экипировки:', error);
    throw error;
  }
}

/**
 * Обновление предмета экипировки
 * @param {string} itemId ID предмета (строковый идентификатор)
 * @param {Object} itemData Данные для обновления предмета
 * @returns {Promise<Object|null>} Обновленный предмет экипировки или null, если предмет не найден
 */
async function updateEquipmentItem(itemId, itemData) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');

    const item = await EquipmentItem.findOne({ where: { item_id: itemId } });
    if (!item) {
      return null;
    }
    
    await item.update(itemData);
    
    return await getEquipmentItemByItemId(itemId);
  } catch (error) {
    console.error(`Ошибка при обновлении предмета экипировки с item_id ${itemId}:`, error);
    throw error;
  }
}

/**
 * Удаление предмета экипировки
 * @param {string} itemId ID предмета (строковый идентификатор)
 * @returns {Promise<boolean>} true, если предмет успешно удален, иначе false
 */
async function deleteEquipmentItem(itemId) {
  const { db } = await connectionProvider.getSequelizeInstance();
  const transaction = await db.transaction();
  
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemEffect = modelRegistry.getModel('EquipmentItemEffect');
    const EquipmentItemRequirement = modelRegistry.getModel('EquipmentItemRequirement');
    const EquipmentItemSpecialEffect = modelRegistry.getModel('EquipmentItemSpecialEffect');

    const item = await EquipmentItem.findOne({
      where: { item_id: itemId },
      transaction
    });
    
    if (!item) {
      await transaction.rollback();
      return false;
    }
    
    // Удаляем связанные данные
    await EquipmentItemEffect.destroy({
      where: { item_id: itemId },
      transaction
    });
    
    await EquipmentItemRequirement.destroy({
      where: { item_id: itemId },
      transaction
    });
    
    await EquipmentItemSpecialEffect.destroy({
      where: { item_id: itemId },
      transaction
    });
    
    // Удаляем сам предмет
    await item.destroy({ transaction });
    
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error(`Ошибка при удалении предмета экипировки с item_id ${itemId}:`, error);
    throw error;
  }
}

/**
 * Добавление эффекта к предмету экипировки
 * @param {string} itemId ID предмета (строковый идентификатор)
 * @param {Object} effectData Данные эффекта
 * @returns {Promise<Object|null>} Созданный эффект или null, если предмет не найден
 */
async function addEffectToEquipmentItem(itemId, effectData) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemEffect = modelRegistry.getModel('EquipmentItemEffect');

    const item = await EquipmentItem.findOne({ where: { item_id: itemId } });
    if (!item) {
      return null;
    }
    
    const effect = await EquipmentItemEffect.create({
      ...effectData,
      item_id: itemId
    });
    
    return effect;
  } catch (error) {
    console.error(`Ошибка при добавлении эффекта к предмету экипировки с item_id ${itemId}:`, error);
    throw error;
  }
}

/**
 * Удаление эффекта предмета экипировки
 * @param {number} effectId ID эффекта
 * @returns {Promise<boolean>} true, если эффект успешно удален, иначе false
 */
async function removeEffectFromEquipmentItem(effectId) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItemEffect = modelRegistry.getModel('EquipmentItemEffect');

    const effect = await EquipmentItemEffect.findByPk(effectId);
    if (!effect) {
      return false;
    }
    
    await effect.destroy();
    return true;
  } catch (error) {
    console.error(`Ошибка при удалении эффекта с ID ${effectId}:`, error);
    throw error;
  }
}

/**
 * Добавление требования к предмету экипировки
 * @param {string} itemId ID предмета (строковый идентификатор)
 * @param {Object} requirementData Данные требования
 * @returns {Promise<Object|null>} Созданное требование или null, если предмет не найден
 */
async function addRequirementToEquipmentItem(itemId, requirementData) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemRequirement = modelRegistry.getModel('EquipmentItemRequirement');

    const item = await EquipmentItem.findOne({ where: { item_id: itemId } });
    if (!item) {
      return null;
    }
    
    const requirement = await EquipmentItemRequirement.create({
      ...requirementData,
      item_id: itemId
    });
    
    return requirement;
  } catch (error) {
    console.error(`Ошибка при добавлении требования к предмету экипировки с item_id ${itemId}:`, error);
    throw error;
  }
}

/**
 * Удаление требования предмета экипировки
 * @param {number} requirementId ID требования
 * @returns {Promise<boolean>} true, если требование успешно удалено, иначе false
 */
async function removeRequirementFromEquipmentItem(requirementId) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItemRequirement = modelRegistry.getModel('EquipmentItemRequirement');

    const requirement = await EquipmentItemRequirement.findByPk(requirementId);
    if (!requirement) {
      return false;
    }
    
    await requirement.destroy();
    return true;
  } catch (error) {
    console.error(`Ошибка при удалении требования с ID ${requirementId}:`, error);
    throw error;
  }
}

/**
 * Добавление специального эффекта к предмету экипировки
 * @param {string} itemId ID предмета (строковый идентификатор)
 * @param {Object} specialEffectData Данные специального эффекта
 * @returns {Promise<Object|null>} Созданный специальный эффект или null, если предмет не найден
 */
async function addSpecialEffectToEquipmentItem(itemId, specialEffectData) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemSpecialEffect = modelRegistry.getModel('EquipmentItemSpecialEffect');

    const item = await EquipmentItem.findOne({ where: { item_id: itemId } });
    if (!item) {
      return null;
    }
    
    const specialEffect = await EquipmentItemSpecialEffect.create({
      ...specialEffectData,
      item_id: itemId
    });
    
    return specialEffect;
  } catch (error) {
    console.error(`Ошибка при добавлении специального эффекта к предмету экипировки с item_id ${itemId}:`, error);
    throw error;
  }
}

/**
 * Удаление специального эффекта предмета экипировки
 * @param {number} specialEffectId ID специального эффекта
 * @returns {Promise<boolean>} true, если специальный эффект успешно удален, иначе false
 */
async function removeSpecialEffectFromEquipmentItem(specialEffectId) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItemSpecialEffect = modelRegistry.getModel('EquipmentItemSpecialEffect');

    const specialEffect = await EquipmentItemSpecialEffect.findByPk(specialEffectId);
    if (!specialEffect) {
      return false;
    }
    
    await specialEffect.destroy();
    return true;
  } catch (error) {
    console.error(`Ошибка при удалении специального эффекта с ID ${specialEffectId}:`, error);
    throw error;
  }
}

/**
 * Проверка, соответствует ли персонаж требованиям предмета
 * @param {string} itemId ID предмета (строковый идентификатор)
 * @param {Object} character Объект с характеристиками персонажа
 * @returns {Promise<Object>} Результат проверки { meetsRequirements: boolean, failedRequirements: Array }
 */
async function checkCharacterMeetsItemRequirements(itemId, character) {
  try {
    await modelRegistry.initializeRegistry();
    const item = await getEquipmentItemByItemId(itemId);
    if (!item) {
      throw new Error(`Предмет с item_id ${itemId} не найден`);
    }
    
    return await item.checkRequirements(character);
  } catch (error) {
    console.error(`Ошибка при проверке соответствия персонажа требованиям предмета с item_id ${itemId}:`, error);
    throw error;
  }
}

/**
 * Применение эффектов предмета к персонажу
 * @param {string} itemId ID предмета (строковый идентификатор)
 * @param {Object} character Объект с характеристиками персонажа
 * @returns {Promise<Object>} Обновленный объект персонажа с примененными эффектами
 */
async function applyItemEffectsToCharacter(itemId, character) {
  try {
    await modelRegistry.initializeRegistry();
    const item = await getEquipmentItemByItemId(itemId);
    if (!item) {
      throw new Error(`Предмет с item_id ${itemId} не найден`);
    }
    
    return await item.applyEffects(character);
  } catch (error) {
    console.error(`Ошибка при применении эффектов предмета с item_id ${itemId} к персонажу:`, error);
    throw error;
  }
}

/**
 * Поиск предметов экипировки по названию
 * @param {string} searchTerm Поисковый запрос
 * @returns {Promise<Array>} Массив найденных предметов экипировки
 */
async function searchEquipmentItems(searchTerm) {
  try {
    await modelRegistry.initializeRegistry();
    const EquipmentItem = modelRegistry.getModel('EquipmentItem');
    const EquipmentItemEffect = modelRegistry.getModel('EquipmentItemEffect');
    const EquipmentItemRequirement = modelRegistry.getModel('EquipmentItemRequirement');
    const EquipmentItemSpecialEffect = modelRegistry.getModel('EquipmentItemSpecialEffect');

    return await EquipmentItem.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      include: [
        { model: EquipmentItemEffect, as: 'effects' },
        { model: EquipmentItemRequirement, as: 'requirements' },
        { model: EquipmentItemSpecialEffect, as: 'specialEffects' }
      ],
      order: [['name', 'ASC']]
    });
  } catch (error) {
    console.error(`Ошибка при поиске предметов экипировки по запросу "${searchTerm}":`, error);
    throw error;
  }
}

module.exports = {
  getAllEquipmentItems,
  getEquipmentItemById,
  getEquipmentItemByItemId,
  getEquipmentItemsByType,
  getEquipmentItemsByRarity,
  getEquipmentItemsBySet,
  createEquipmentItem,
  updateEquipmentItem,
  deleteEquipmentItem,
  addEffectToEquipmentItem,
  removeEffectFromEquipmentItem,
  addRequirementToEquipmentItem,
  removeRequirementFromEquipmentItem,
  addSpecialEffectToEquipmentItem,
  removeSpecialEffectFromEquipmentItem,
  checkCharacterMeetsItemRequirements,
  applyItemEffectsToCharacter,
  searchEquipmentItems,
  // Константы будут доступны после инициализации моделей
  get ITEM_TYPES() {
    return EquipmentItem ? EquipmentItem.ITEM_TYPES : {};
  },
  get RARITY_TYPES() {
    return EquipmentItem ? EquipmentItem.RARITY_TYPES : {};
  },
  get ARMOR_TYPES() {
    return EquipmentItem ? EquipmentItem.ARMOR_TYPES : {};
  },
  get EFFECT_TYPES() {
    return EquipmentItem ? EquipmentItem.EFFECT_TYPES : {};
  },
  get EFFECT_OPERATIONS() {
    return EquipmentItem ? EquipmentItem.EFFECT_OPERATIONS : {};
  }
};