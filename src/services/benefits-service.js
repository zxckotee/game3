/**
 * Сервис для работы с бонусами (benefits)
 * Предоставляет методы для получения, добавления, обновления и применения бонусов
 */
const modelRegistry = require('../models/registry');
const { Op } = require('sequelize');
const sectService = require('./sect-service');
const inventoryService = require('./inventory-service');
const equipmentService = require('./equipment-service');

// Инициализируем переменные для моделей
let Benefit;
let PlayerBenefit;

/**
 * Асинхронная функция для инициализации моделей
 */
async function initModels() {
  if (!Benefit) {
    // Получаем модель из реестра
    Benefit = modelRegistry.getModel('Benefit');
    
    if (!Benefit) {
      throw new Error('Модель Benefit не найдена в реестре');
    }
  }
  
  if (!PlayerBenefit) {
    // Получаем модель пользовательских бонусов из реестра
    PlayerBenefit = modelRegistry.getModel('PlayerBenefit');
    
    if (!PlayerBenefit) {
      throw new Error('Модель PlayerBenefit не найдена в реестре');
    }
  }
}

// Вызываем инициализацию моделей
initModels().catch(error => {
  console.error('Ошибка при инициализации моделей в benefits-service:', error);
});

/**
 * Получение всех бонусов
 * @returns {Promise<Array>} Массив всех бонусов
 */
async function getAllBenefits() {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    return await Benefit.findAll({
      order: [['type', 'ASC'], ['modifier_type', 'ASC']]
    });
  } catch (error) {
    console.error('Ошибка при получении всех бонусов:', error);
    throw error;
  }
}

/**
 * Получение бонуса по ID
 * @param {number} id ID бонуса
 * @returns {Promise<Object|null>} Объект бонуса или null, если бонус не найден
 */
async function getBenefitById(id) {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    return await Benefit.findByPk(id);
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
async function getBenefitsByType(type) {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    return await Benefit.findAll({
      where: { type },
      order: [['modifier_type', 'ASC'], ['modifier', 'DESC']]
    });
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
async function getBenefitsByModifierType(modifierType) {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    return await Benefit.findAll({
      where: { modifier_type: modifierType },
      order: [['type', 'ASC'], ['modifier', 'DESC']]
    });
  } catch (error) {
    console.error(`Ошибка при получении бонусов с типом модификатора ${modifierType}:`, error);
    throw error;
  }
}

/**
 * Получение положительных бонусов
 * @returns {Promise<Array>} Массив положительных бонусов
 */
async function getPositiveBenefits() {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    return await Benefit.findAll({
      where: {
        modifier: {
          [Op.gt]: 0
        }
      },
      order: [['type', 'ASC'], ['modifier_type', 'ASC']]
    });
  } catch (error) {
    console.error('Ошибка при получении положительных бонусов:', error);
    throw error;
  }
}

/**
 * Получение отрицательных бонусов
 * @returns {Promise<Array>} Массив отрицательных бонусов
 */
async function getNegativeBenefits() {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    return await Benefit.findAll({
      where: {
        modifier: {
          [Op.lt]: 0
        }
      },
      order: [['type', 'ASC'], ['modifier_type', 'ASC']]
    });
  } catch (error) {
    console.error('Ошибка при получении отрицательных бонусов:', error);
    throw error;
  }
}

/**
 * Создание нового бонуса
 * @param {Object} benefitData Данные нового бонуса
 * @param {string} benefitData.type Тип бонуса
 * @param {number} benefitData.modifier Значение модификатора
 * @param {string} benefitData.modifier_type Тип модификатора (percent, flat, chance)
 * @param {string} [benefitData.description] Описание бонуса
 * @returns {Promise<Object>} Созданный бонус
 */
async function createBenefit(benefitData) {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    return await Benefit.create(benefitData);
  } catch (error) {
    console.error('Ошибка при создании нового бонуса:', error);
    throw error;
  }
}

/**
 * Обновление существующего бонуса
 * @param {number} id ID бонуса для обновления
 * @param {Object} benefitData Данные для обновления
 * @returns {Promise<Object|null>} Обновленный бонус или null, если бонус не найден
 */
async function updateBenefit(id, benefitData) {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    const benefit = await Benefit.findByPk(id);
    if (!benefit) {
      return null;
    }
    
    return await benefit.update(benefitData);
  } catch (error) {
    console.error(`Ошибка при обновлении бонуса с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Удаление бонуса по ID
 * @param {number} id ID бонуса для удаления
 * @returns {Promise<boolean>} true, если бонус успешно удален, иначе false
 */
async function deleteBenefit(id) {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    const benefit = await Benefit.findByPk(id);
    if (!benefit) {
      return false;
    }
    
    await benefit.destroy();
    return true;
  } catch (error) {
    console.error(`Ошибка при удалении бонуса с ID ${id}:`, error);
    throw error;
  }
}

/**
 * Применение бонуса к характеристикам персонажа
 * @param {Object} characterStats Характеристики персонажа
 * @param {number|Object} benefit ID бонуса или объект бонуса
 * @returns {Promise<Object>} Обновленные характеристики персонажа
 */
async function applyBenefitToCharacter(characterStats, benefit) {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    // Если передан ID бонуса, получаем объект бонуса
    if (typeof benefit === 'number') {
      benefit = await getBenefitById(benefit);
      if (!benefit) {
        throw new Error(`Бонус с ID ${benefit} не найден`);
      }
    }
    
    // Создаем копию характеристик персонажа
    const updatedStats = { ...characterStats };
    
    // Применяем бонус в зависимости от его типа
    switch (benefit.type) {
      // Бонусы игровых механик
      case Benefit.BENEFIT_TYPES.CULTIVATION_SPEED:
        // Процентный бонус к скорости культивации
        if (!updatedStats.cultivation) {
          updatedStats.cultivation = {};
        }
        if (!updatedStats.cultivation.speedModifier) {
          updatedStats.cultivation.speedModifier = 0;
        }
        updatedStats.cultivation.speedModifier += benefit.modifier;
        break;
        
      case Benefit.BENEFIT_TYPES.RESOURCE_GATHERING:
        // Процентный бонус к сбору ресурсов
        if (!updatedStats.resourceGatheringBonus) {
          updatedStats.resourceGatheringBonus = 0;
        }
        updatedStats.resourceGatheringBonus += benefit.modifier;
        break;
        
      case Benefit.BENEFIT_TYPES.TECHNIQUE_DISCOUNT:
        // Процентный бонус к скидке на техники
        if (!updatedStats.techniqueDiscountBonus) {
          updatedStats.techniqueDiscountBonus = 0;
        }
        updatedStats.techniqueDiscountBonus += benefit.modifier;
        break;
        
      // Бонусы характеристик персонажа
      case Benefit.BENEFIT_TYPES.PHYSICAL_DEFENSE:
        // Абсолютный бонус к физической защите
        if (!updatedStats.physical_defense) {
          updatedStats.physical_defense = 0;
        }
        updatedStats.physical_defense += benefit.modifier;
        break;
        
      case Benefit.BENEFIT_TYPES.SPIRITUAL_DEFENSE:
        // Абсолютный бонус к духовной защите
        if (!updatedStats.spiritual_defense) {
          updatedStats.spiritual_defense = 0;
        }
        updatedStats.spiritual_defense += benefit.modifier;
        break;
        
      case Benefit.BENEFIT_TYPES.ATTACK_SPEED:
        // Абсолютный бонус к атаке
        if (!updatedStats.attack_speed) {
          updatedStats.attack_speed = 0;
        }
        updatedStats.attack_speed += benefit.modifier;
        break;
        
      case Benefit.BENEFIT_TYPES.CRITICAL_CHANCE:
        // Бонус к шансу критического удара
        if (!updatedStats.critical_chance) {
          updatedStats.critical_chance = 0;
        }
        updatedStats.critical_chance += benefit.modifier;
        break;
        
      case Benefit.BENEFIT_TYPES.MOVEMENT_SPEED:
        // Бонус к шансу уклонения
        if (!updatedStats.movement_speed) {
          updatedStats.movement_speed = 0;
        }
        updatedStats.movement_speed += benefit.modifier;
        break;
        
      case Benefit.BENEFIT_TYPES.LUCK:
        // Бонус к точности и шансу везения
        if (!updatedStats.luck) {
          updatedStats.luck = 0;
        }
        updatedStats.luck += benefit.modifier;
        break;
        
      default:
        console.warn(`Неизвестный тип бонуса: ${benefit.type}`);
    }
    
    return updatedStats;
  } catch (error) {
    console.error('Ошибка при применении бонуса к персонажу:', error);
    throw error;
  }
}

/**
 * Применение нескольких бонусов к характеристикам персонажа
 * @param {Object} characterStats Характеристики персонажа
 * @param {Array<number|Object>} benefits Массив ID бонусов или объектов бонусов
 * @returns {Promise<Object>} Обновленные характеристики персонажа
 */
async function applyBenefitsToCharacter(characterStats, benefits) {
  // Убеждаемся, что модели инициализированы
  if (!Benefit) await initModels();
  
  try {
    let updatedStats = { ...characterStats };
    
    for (const benefit of benefits) {
      updatedStats = await applyBenefitToCharacter(updatedStats, benefit);
    }
    
    return updatedStats;
  } catch (error) {
    console.error('Ошибка при применении бонусов к персонажу:', error);
    throw error;
  }
}

/**
 * Получение всех бонусов пользователя
 * @param {number} userId - ID пользователя
 * @param {Object} options - Дополнительные опции запроса
 * @param {string} [options.source] - Источник бонуса (sect, equipment, achievement, etc.)
 * @param {string} [options.type] - Тип бонуса
 * @returns {Promise<Array>} - Массив бонусов пользователя
 */
async function getUserBenefits(userId, options = {}) {
  // Убеждаемся, что модели инициализированы
  if (!PlayerBenefit) await initModels();
  
  try {
    const whereClause = { user_id: userId };
    
    // Добавляем фильтр по источнику, если указан
    if (options.source) {
      whereClause.source = options.source;
    }
    
    // Добавляем фильтр по типу, если указан
    if (options.type) {
      whereClause.benefit_type = options.type;
    }
    
    return await PlayerBenefit.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    console.error(`Ошибка при получении бонусов пользователя ${userId}:`, error);
    return [];
  }
}

/**
 * Добавление бонуса пользователю
 * @param {number} userId - ID пользователя
 * @param {Object} benefitData - Данные бонуса
 * @param {string} benefitData.benefit_type - Тип бонуса
 * @param {number} benefitData.value - Значение бонуса
 * @param {string} benefitData.value_type - Тип значения (percent, flat, chance)
 * @param {string} benefitData.source - Источник бонуса (sect, equipment, achievement, etc.)
 * @param {string} [benefitData.source_id] - ID источника (например, ID предмета экипировки)
 * @param {string} [benefitData.description] - Описание бонуса
 * @param {Date} [benefitData.expires_at] - Дата истечения бонуса (null для постоянных)
 * @returns {Promise<Object|null>} - Созданный бонус или null в случае ошибки
 */
async function addUserBenefit(userId, benefitData) {
  // Убеждаемся, что модели инициализированы
  if (!PlayerBenefit) await initModels();
  
  try {
    // Создаем объект данных с user_id
    const data = {
      user_id: userId,
      ...benefitData
    };
    
    // Создаем запись в БД
    return await PlayerBenefit.create(data);
  } catch (error) {
    console.error(`Ошибка при добавлении бонуса пользователю ${userId}:`, error);
    return null;
  }
}

/**
 * Удаление бонуса пользователя
 * @param {number} benefitId - ID бонуса для удаления
 * @returns {Promise<boolean>} - true, если бонус успешно удален, иначе false
 */
async function removeUserBenefit(benefitId) {
  // Убеждаемся, что модели инициализированы
  if (!PlayerBenefit) await initModels();
  
  try {
    const benefit = await PlayerBenefit.findByPk(benefitId);
    if (!benefit) {
      return false;
    }
    
    await benefit.destroy();
    return true;
  } catch (error) {
    console.error(`Ошибка при удалении бонуса ${benefitId}:`, error);
    return false;
  }
}

/**
 * Удаление всех бонусов пользователя
 * @param {number} userId - ID пользователя
 * @param {Object} options - Дополнительные опции
 * @param {string} [options.source] - Источник бонуса (sect, equipment, achievement, etc.)
 * @param {string} [options.type] - Тип бонуса
 * @returns {Promise<number>} - Количество удаленных бонусов
 */
async function removeAllUserBenefits(userId, options = {}) {
  // Убеждаемся, что модели инициализированы
  if (!PlayerBenefit) await initModels();
  
  try {
    const whereClause = { user_id: userId };
    
    // Добавляем фильтр по источнику, если указан
    if (options.source) {
      whereClause.source = options.source;
    }
    
    // Добавляем фильтр по типу, если указан
    if (options.type) {
      whereClause.benefit_type = options.type;
    }
    
    const result = await PlayerBenefit.destroy({
      where: whereClause
    });
    
    return result;
  } catch (error) {
    console.error(`Ошибка при удалении всех бонусов пользователя ${userId}:`, error);
    return 0;
  }
}

/**
 * Собирает все бенефиты пользователя из разных источников (секта, экипировка)
 * @param {number} userId - ID пользователя
 * @param {boolean} [saveToDatabase=false] - Сохранять ли собранные бенефиты в БД
 * @returns {Promise<Array>} - Массив всех бенефитов пользователя
 */
async function collectAllBenefits(userId, saveToDatabase = false) {
  try {
    // 1. Получаем бенефиты секты
    const sectBenefits = await sectService.getSectBenefits(userId);
    
    // Добавляем информацию о источнике
    const sectBenefitsWithSource = sectBenefits.map(benefit => ({
      ...benefit,
      source: 'sect'
    }));
    
    // 2. Получаем экипированные предметы
    const inventoryItems = await inventoryService.getInventoryItems(userId);
    const equippedItems = inventoryItems.filter(item => item.equipped === true);
    
    // 3. Извлекаем эффекты из экипировки
    const equipmentBenefits = [];
    
    // Для каждого экипированного предмета получаем эффекты
    for (const item of equippedItems) {
      // Получаем эффекты предмета
      if (item.effects && Array.isArray(item.effects)) {
        // Если эффекты уже есть в данных предмета
        for (const effect of item.effects) {
          // Преобразуем эффект в формат бенефита
          const benefit = {
            type: effect.target,
            modifier: effect.value,
            modifier_type: effect.operation === 'percent' ? 'percent' : 'flat',
            source: 'equipment',
            source_id: item.item_id.toString(),
            item_name: item.name // Дополнительно сохраняем название предмета
          };
          
          equipmentBenefits.push(benefit);
        }
      } else {
        // Если эффектов нет в данных предмета, используем equipmentService
        // Создаем пустой объект персонажа для применения эффектов
        const emptyCharacter = {};
        
        // Применяем эффекты предмета к пустому объекту персонажа
        const characterWithEffects = await equipmentService.applyItemEffectsToCharacter(item.item_id, emptyCharacter);
        
        // Извлекаем примененные эффекты и преобразуем их в бенефиты
        for (const category in characterWithEffects) {
          if (category === 'stats' || category === 'combat' || category === 'elemental' || category === 'cultivation') {
            for (const target in characterWithEffects[category]) {
              const value = characterWithEffects[category][target];
              
              // Создаем бенефит
              const benefit = {
                type: `${category}_${target}`,
                modifier: value,
                modifier_type: 'flat', // По умолчанию используем flat
                source: 'equipment',
                source_id: item.item_id.toString(),
                item_name: item.name
              };
              
              equipmentBenefits.push(benefit);
            }
          }
        }
      }
    }
    
    // 4. Объединяем бенефиты
    const allBenefits = [...sectBenefitsWithSource, ...equipmentBenefits];
    
    // 5. Агрегируем бенефиты одного типа (суммируем модификаторы)
    const aggregatedBenefits = {};
    
    for (const benefit of allBenefits) {
      const key = benefit.type;
      
      if (!aggregatedBenefits[key]) {
        aggregatedBenefits[key] = {
          type: benefit.type,
          modifier: benefit.modifier,
          modifier_type: benefit.modifier_type,
          sources: [benefit.source],
          source_ids: benefit.source_id ? [benefit.source_id] : []
        };
        
        // Если есть название предмета, добавляем его
        if (benefit.item_name) {
          aggregatedBenefits[key].items = [benefit.item_name];
        }
      } else {
        // Суммируем модификаторы
        aggregatedBenefits[key].modifier += benefit.modifier;
        
        // Добавляем источник, если он еще не добавлен
        if (!aggregatedBenefits[key].sources.includes(benefit.source)) {
          aggregatedBenefits[key].sources.push(benefit.source);
        }
        
        // Добавляем ID источника, если он есть
        if (benefit.source_id && !aggregatedBenefits[key].source_ids.includes(benefit.source_id)) {
          aggregatedBenefits[key].source_ids.push(benefit.source_id);
        }
        
        // Добавляем название предмета, если оно есть
        if (benefit.item_name && !aggregatedBenefits[key].items) {
          aggregatedBenefits[key].items = [benefit.item_name];
        } else if (benefit.item_name) {
          aggregatedBenefits[key].items.push(benefit.item_name);
        }
      }
    }
    
    // Преобразуем объект в массив
    const resultBenefits = Object.values(aggregatedBenefits);
    
    // 6. Если нужно сохранить в БД, сохраняем
    if (saveToDatabase && PlayerBenefit) {
      try {
        // Сначала удаляем все существующие бонусы пользователя
        await removeAllUserBenefits(userId);
        
        // Затем добавляем новые
        for (const benefit of resultBenefits) {
          await addUserBenefit(userId, {
            benefit_type: benefit.type,
            value: benefit.modifier,
            value_type: benefit.modifier_type,
            source: benefit.sources.join(','),
            source_id: benefit.source_ids.length > 0 ? benefit.source_ids.join(',') : null,
            description: benefit.items ? `От предметов: ${benefit.items.join(', ')}` : null
          });
        }
        
        console.log(`Сохранено ${resultBenefits.length} бонусов для пользователя ${userId}`);
      } catch (error) {
        console.error(`Ошибка при сохранении бонусов в БД для пользователя ${userId}:`, error);
      }
    }
    
    return resultBenefits;
  } catch (error) {
    console.error('Ошибка при сборе бенефитов:', error);
    return [];
  }
}

module.exports = {
  // Методы для работы с общими бонусами
  getAllBenefits,
  getBenefitById,
  getBenefitsByType,
  getBenefitsByModifierType,
  getPositiveBenefits,
  getNegativeBenefits,
  createBenefit,
  updateBenefit,
  deleteBenefit,
  
  // Методы для применения бонусов
  applyBenefitToCharacter,
  applyBenefitsToCharacter,
  
  // Методы для сбора и агрегации бонусов
  collectAllBenefits,
  
  // Методы для работы с пользовательскими бонусами
  getUserBenefits,
  addUserBenefit,
  removeUserBenefit,
  removeAllUserBenefits,
  
  // Константы будут доступны после инициализации модели
  get BENEFIT_TYPES() {
    return Benefit ? Benefit.BENEFIT_TYPES : {};
  },
  get MODIFIER_TYPES() {
    return Benefit ? Benefit.MODIFIER_TYPES : {};
  },
  get PLAYER_BENEFIT_TYPES() {
    return PlayerBenefit ? PlayerBenefit.BENEFIT_TYPES : {};
  },
  get PLAYER_BENEFIT_SOURCES() {
    return PlayerBenefit ? PlayerBenefit.BENEFIT_SOURCES : {};
  }
};