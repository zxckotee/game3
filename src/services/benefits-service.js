/**
 * Сервис для работы с бонусами (benefits)
 * Предоставляет методы для получения, добавления, обновления и применения бонусов
 */
const Benefit = require('../models/benefit');
const { Op } = require('sequelize');

/**
 * Получение всех бонусов
 * @returns {Promise<Array>} Массив всех бонусов
 */
async function getAllBenefits() {
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

module.exports = {
  getAllBenefits,
  getBenefitById,
  getBenefitsByType,
  getBenefitsByModifierType,
  getPositiveBenefits,
  getNegativeBenefits,
  createBenefit,
  updateBenefit,
  deleteBenefit,
  applyBenefitToCharacter,
  applyBenefitsToCharacter,
  BENEFIT_TYPES: Benefit.BENEFIT_TYPES,
  MODIFIER_TYPES: Benefit.MODIFIER_TYPES
};