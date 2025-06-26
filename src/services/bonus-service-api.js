/**
 * Клиентская версия BonusService без серверных зависимостей
 * Используется в браузере вместо оригинального bonus-service.js
 */

// Типы бонусов
const BONUS_TYPES = {
  // Характеристики
  STRENGTH: 'strength',
  AGILITY: 'agility',
  INTELLIGENCE: 'intelligence',
  VITALITY: 'vitality',
  LUCK: 'luck',
  
  // Боевые бонусы
  ATTACK: 'attack',
  DEFENSE: 'defense',
  HEALTH: 'health',
  ENERGY: 'energy',
  SPEED: 'speed',
  
  // Бонусы к стихиям
  FIRE_DAMAGE: 'fire_damage',
  WATER_DAMAGE: 'water_damage',
  EARTH_DAMAGE: 'earth_damage',
  AIR_DAMAGE: 'air_damage',
  THUNDER_DAMAGE: 'thunder_damage',
  ICE_DAMAGE: 'ice_damage',
  LIGHT_DAMAGE: 'light_damage',
  DARK_DAMAGE: 'dark_damage',
  
  // Бонусы к сопротивлениям
  FIRE_RESISTANCE: 'fire_resistance',
  WATER_RESISTANCE: 'water_resistance',
  EARTH_RESISTANCE: 'earth_resistance',
  AIR_RESISTANCE: 'air_resistance',
  THUNDER_RESISTANCE: 'thunder_resistance',
  ICE_RESISTANCE: 'ice_resistance',
  LIGHT_RESISTANCE: 'light_resistance',
  DARK_RESISTANCE: 'dark_resistance',
  
  // Бонусы культивации
  CULTIVATION_SPEED: 'cultivation_speed',
  BREAKTHROUGH_CHANCE: 'breakthrough_chance',
  INSIGHT_CHANCE: 'insight_chance',
  
  // Прочие бонусы
  RESOURCE_FIND_RATE: 'resource_find_rate',
  RESOURCE_QUALITY: 'resource_quality',
  SPIRIT_STONE_EFFICIENCY: 'spirit_stone_efficiency',
  ALCHEMY_SUCCESS_RATE: 'alchemy_success_rate',
  REPUTATION_GAIN: 'reputation_gain',
  MERCHANT_DISCOUNT: 'merchant_discount'
};

// Источники бонусов
const BONUS_SOURCES = {
  EQUIPMENT: 'equipment',
  TECHNIQUE: 'technique',
  SPIRIT_PET: 'spirit_pet',
  EFFECT: 'effect',
  PILL: 'pill',
  CULTIVATION: 'cultivation',
  SECT: 'sect',
  FACTION: 'faction',
  ACHIEVEMENT: 'achievement'
};

// Типы расчетов для бонусов
const CALCULATION_TYPES = {
  ADDITIVE: 'additive',     // Просто суммируются
  MULTIPLICATIVE: 'multiplicative',  // Умножаются (базовое_значение * (1 + бонус1) * (1 + бонус2) и т.д.)
  HIGHEST: 'highest',       // Применяется только наивысший бонус
  COMPLEX: 'complex'        // Особый расчет для некоторых бонусов
};

class BonusServiceAPI {
  /**
   * Рассчитывает все бонусы персонажа
   * @param {number} userId ID пользователя
   * @param {Object} baseStats Базовые характеристики персонажа
   * @param {Array} equipment Снаряжение персонажа
   * @param {Array} techniques Изученные техники персонажа
   * @param {Array} effects Активные эффекты на персонаже
   * @param {Array} spiritPets Духовные питомцы персонажа
   * @param {Object} cultivation Данные о культивации персонажа
   * @param {Object} [options] Дополнительные опции расчета
   * @returns {Promise<Object>} Рассчитанные бонусы
   */
  static async calculateAllBonuses(userId, baseStats, equipment = [], techniques = [], effects = [], spiritPets = [], cultivation = {}, options = {}) {
    // Инициализируем объект с бонусами
    const bonuses = {};
    
    // Инициализируем таблицу для хранения бонусов по типам и источникам
    const bonusTable = {};
    for (const bonusType of Object.values(BONUS_TYPES)) {
      bonusTable[bonusType] = {};
      for (const source of Object.values(BONUS_SOURCES)) {
        bonusTable[bonusType][source] = [];
      }
    }
    
    // Собираем бонусы от снаряжения
    for (const item of equipment) {
      if (item.bonuses) {
        for (const bonus of item.bonuses) {
          if (bonusTable[bonus.type]) {
            bonusTable[bonus.type][BONUS_SOURCES.EQUIPMENT].push({
              value: bonus.value,
              source: `${item.name} (${item.slot || 'снаряжение'})`,
              id: item.id
            });
          }
        }
      }
    }
    
    // Собираем бонусы от техник
    for (const technique of techniques) {
      if (technique.bonuses) {
        for (const bonus of technique.bonuses) {
          if (bonusTable[bonus.type]) {
            bonusTable[bonus.type][BONUS_SOURCES.TECHNIQUE].push({
              value: bonus.value,
              source: technique.name,
              id: technique.id
            });
          }
        }
      }
    }
    
    // Собираем бонусы от эффектов
    for (const effect of effects) {
      if (effect.bonuses) {
        for (const bonus of effect.bonuses) {
          if (bonusTable[bonus.type]) {
            bonusTable[bonus.type][BONUS_SOURCES.EFFECT].push({
              value: bonus.value,
              source: effect.name,
              id: effect.id,
              duration: effect.duration || null
            });
          }
        }
      }
    }
    
    // Собираем бонусы от духовных питомцев
    for (const pet of spiritPets) {
      if (pet.bonusType && pet.bonusValue) {
        if (bonusTable[pet.bonusType]) {
          bonusTable[pet.bonusType][BONUS_SOURCES.SPIRIT_PET].push({
            value: pet.bonusValue,
            source: pet.name,
            id: pet.id
          });
        }
      }
    }
    
    // Собираем бонусы от культивации
    if (cultivation.stage) {
      // Бонусы в зависимости от стадии культивации
      const cultivationBonuses = {
        'Закалка тела': [
          { type: BONUS_TYPES.VITALITY, value: 5 },
          { type: BONUS_TYPES.HEALTH, value: 10 }
        ],
        'Построение основания': [
          { type: BONUS_TYPES.STRENGTH, value: 10 },
          { type: BONUS_TYPES.VITALITY, value: 10 },
          { type: BONUS_TYPES.ATTACK, value: 15 }
        ],
        'Золотое ядро': [
          { type: BONUS_TYPES.STRENGTH, value: 20 },
          { type: BONUS_TYPES.INTELLIGENCE, value: 15 },
          { type: BONUS_TYPES.ENERGY, value: 30 },
          { type: BONUS_TYPES.ATTACK, value: 25 }
        ]
      };
      
      const stageBonuses = cultivationBonuses[cultivation.stage] || [];
      for (const bonus of stageBonuses) {
        if (bonusTable[bonus.type]) {
          bonusTable[bonus.type][BONUS_SOURCES.CULTIVATION].push({
            value: bonus.value,
            source: `Стадия ${cultivation.stage}`,
            id: 'cultivation_stage'
          });
        }
      }
      
      // Бонусы от уровня культивации
      if (cultivation.level) {
        const levelBonuses = [
          { type: BONUS_TYPES.HEALTH, value: cultivation.level * 2 },
          { type: BONUS_TYPES.ENERGY, value: cultivation.level * 1.5 }
        ];
        
        for (const bonus of levelBonuses) {
          if (bonusTable[bonus.type]) {
            bonusTable[bonus.type][BONUS_SOURCES.CULTIVATION].push({
              value: bonus.value,
              source: `Уровень культивации ${cultivation.level}`,
              id: 'cultivation_level'
            });
          }
        }
      }
    }
    
    // Рассчитываем итоговые бонусы для каждого типа
    for (const bonusType of Object.values(BONUS_TYPES)) {
      // Собираем все бонусы данного типа из всех источников
      const allBonusesOfType = [];
      for (const source of Object.values(BONUS_SOURCES)) {
        allBonusesOfType.push(...bonusTable[bonusType][source]);
      }
      
      // Если есть бонусы данного типа, рассчитываем итоговое значение
      if (allBonusesOfType.length > 0) {
        // Определяем тип расчета для данного бонуса
        let calculationType = CALCULATION_TYPES.ADDITIVE; // По умолчанию - аддитивный
        
        // Для бонусов сопротивления и некоторых других используем мультипликативный расчет
        if (bonusType.includes('resistance') || 
            bonusType === BONUS_TYPES.CULTIVATION_SPEED || 
            bonusType === BONUS_TYPES.RESOURCE_QUALITY) {
          calculationType = CALCULATION_TYPES.MULTIPLICATIVE;
        }
        
        // Для некоторых бонусов берем только наивысшее значение
        if (bonusType === BONUS_TYPES.MERCHANT_DISCOUNT) {
          calculationType = CALCULATION_TYPES.HIGHEST;
        }
        
        // Выполняем расчет в зависимости от типа
        let totalValue = 0;
        
        if (calculationType === CALCULATION_TYPES.ADDITIVE) {
          // Суммируем все бонусы
          totalValue = allBonusesOfType.reduce((sum, bonus) => sum + bonus.value, 0);
        } else if (calculationType === CALCULATION_TYPES.MULTIPLICATIVE) {
          // Применяем мультипликативный расчет
          totalValue = allBonusesOfType.reduce((product, bonus) => product * (1 + bonus.value / 100), 1) - 1;
          totalValue = Math.round(totalValue * 100); // Конвертируем обратно в процентное значение
        } else if (calculationType === CALCULATION_TYPES.HIGHEST) {
          // Берем наивысшее значение
          totalValue = Math.max(...allBonusesOfType.map(bonus => bonus.value));
        }
        
        // Сохраняем результат расчета
        bonuses[bonusType] = {
          value: totalValue,
          sources: allBonusesOfType,
          calculationType
        };
      }
    }
    
    // Рассчитываем итоговые характеристики персонажа с учетом бонусов
    const finalStats = {...baseStats};
    
    // Применяем бонусы к базовым характеристикам
    if (bonuses[BONUS_TYPES.STRENGTH]) {
      finalStats.strength = (baseStats.strength || 10) + bonuses[BONUS_TYPES.STRENGTH].value;
    }
    
    if (bonuses[BONUS_TYPES.AGILITY]) {
      finalStats.agility = (baseStats.agility || 10) + bonuses[BONUS_TYPES.AGILITY].value;
    }
    
    if (bonuses[BONUS_TYPES.INTELLIGENCE]) {
      finalStats.intelligence = (baseStats.intelligence || 10) + bonuses[BONUS_TYPES.INTELLIGENCE].value;
    }
    
    if (bonuses[BONUS_TYPES.VITALITY]) {
      finalStats.vitality = (baseStats.vitality || 10) + bonuses[BONUS_TYPES.VITALITY].value;
    }
    
    if (bonuses[BONUS_TYPES.LUCK]) {
      finalStats.luck = (baseStats.luck || 10) + bonuses[BONUS_TYPES.LUCK].value;
    }
    
    // Рассчитываем производные характеристики
    finalStats.maxHealth = (baseStats.maxHealth || 100) + 
                          (finalStats.vitality * 10) + 
                          (bonuses[BONUS_TYPES.HEALTH]?.value || 0);
    
    finalStats.maxEnergy = (baseStats.maxEnergy || 100) + 
                          (finalStats.intelligence * 8) + 
                          (bonuses[BONUS_TYPES.ENERGY]?.value || 0);
    
    finalStats.attack = (baseStats.attack || 10) + 
                       (finalStats.strength * 2) + 
                       (bonuses[BONUS_TYPES.ATTACK]?.value || 0);
    
    finalStats.defense = (baseStats.defense || 10) + 
                        (finalStats.vitality * 1.5) + 
                        (bonuses[BONUS_TYPES.DEFENSE]?.value || 0);
    
    finalStats.speed = (baseStats.speed || 10) + 
                      (finalStats.agility * 2) + 
                      (bonuses[BONUS_TYPES.SPEED]?.value || 0);
    
    return Promise.resolve({
      bonuses,
      finalStats,
      bonusTable
    });
  }

  /**
   * Рассчитывает бонусы от конкретного предмета снаряжения
   * @param {Object} item Предмет снаряжения
   * @param {Object} characterStats Текущие характеристики персонажа
   * @returns {Promise<Object>} Рассчитанные бонусы от предмета
   */
  static async calculateItemBonuses(item, characterStats) {
    if (!item || !item.bonuses) {
      return Promise.resolve({
        bonuses: [],
        effectiveValue: 0
      });
    }
    
    // Копируем бонусы предмета
    const bonuses = [...item.bonuses];
    
    // Проверяем наличие условных бонусов
    if (item.conditionalBonuses) {
      for (const conditionalBonus of item.conditionalBonuses) {
        // Проверяем выполнение условия
        let conditionMet = false;
        
        if (conditionalBonus.condition.type === 'stat_min' && characterStats) {
          // Условие по минимальному значению характеристики
          const statValue = characterStats[conditionalBonus.condition.stat] || 0;
          conditionMet = statValue >= conditionalBonus.condition.value;
        } else if (conditionalBonus.condition.type === 'cultivation_stage' && characterStats?.cultivation) {
          // Условие по стадии культивации
          conditionMet = characterStats.cultivation.stage === conditionalBonus.condition.value;
        }
        
        // Если условие выполнено, добавляем бонус
        if (conditionMet) {
          bonuses.push({
            type: conditionalBonus.type,
            value: conditionalBonus.value,
            conditional: true
          });
        }
      }
    }
    
    // Рассчитываем эффективную ценность предмета
    const effectiveValueWeights = {
      [BONUS_TYPES.STRENGTH]: 10,
      [BONUS_TYPES.AGILITY]: 10,
      [BONUS_TYPES.INTELLIGENCE]: 10,
      [BONUS_TYPES.VITALITY]: 10,
      [BONUS_TYPES.LUCK]: 8,
      [BONUS_TYPES.ATTACK]: 5,
      [BONUS_TYPES.DEFENSE]: 5,
      [BONUS_TYPES.HEALTH]: 3,
      [BONUS_TYPES.ENERGY]: 3,
      [BONUS_TYPES.SPEED]: 7
    };
    
    let effectiveValue = 0;
    
    for (const bonus of bonuses) {
      const weight = effectiveValueWeights[bonus.type] || 1;
      effectiveValue += bonus.value * weight;
    }
    
    return Promise.resolve({
      bonuses,
      effectiveValue
    });
  }

  /**
   * Рассчитывает бонусы от всех активных эффектов
   * @param {Array} effects Массив активных эффектов
   * @returns {Promise<Object>} Рассчитанные бонусы от эффектов
   */
  static async calculateEffectsBonuses(effects) {
    if (!effects || effects.length === 0) {
      return Promise.resolve({
        bonusByType: {},
        totalBonuses: []
      });
    }
    
    // Инициализируем объект для хранения бонусов по типам
    const bonusByType = {};
    for (const bonusType of Object.values(BONUS_TYPES)) {
      bonusByType[bonusType] = [];
    }
    
    // Собираем бонусы из всех эффектов
    for (const effect of effects) {
      if (effect.bonuses) {
        for (const bonus of effect.bonuses) {
          if (bonusByType[bonus.type]) {
            bonusByType[bonus.type].push({
              value: bonus.value,
              source: effect.name,
              id: effect.id,
              duration: effect.duration || null
            });
          }
        }
      }
    }
    
    // Формируем итоговый список всех бонусов
    const totalBonuses = [];
    for (const [type, bonuses] of Object.entries(bonusByType)) {
      if (bonuses.length > 0) {
        // Рассчитываем суммарное значение бонуса данного типа
        const value = bonuses.reduce((sum, bonus) => sum + bonus.value, 0);
        
        totalBonuses.push({
          type,
          value,
          sources: bonuses
        });
      }
    }
    
    return Promise.resolve({
      bonusByType,
      totalBonuses
    });
  }

  /**
   * Проверяет, соответствует ли персонаж требованиям предмета
   * @param {Object} item Предмет для проверки
   * @param {Object} characterStats Характеристики персонажа
   * @returns {Promise<Object>} Результат проверки
   */
  static async checkItemRequirements(item, characterStats) {
    if (!item || !item.requirements) {
      return Promise.resolve({
        meetsRequirements: true,
        failedRequirements: []
      });
    }
    
    const failedRequirements = [];
    
    // Проверяем требования по уровню
    if (item.requirements.level && characterStats.level < item.requirements.level) {
      failedRequirements.push({
        type: 'level',
        required: item.requirements.level,
        current: characterStats.level
      });
    }
    
    // Проверяем требования по стадии культивации
    if (item.requirements.cultivationStage && 
        (!characterStats.cultivation || 
         characterStats.cultivation.stage !== item.requirements.cultivationStage)) {
      failedRequirements.push({
        type: 'cultivationStage',
        required: item.requirements.cultivationStage,
        current: characterStats.cultivation?.stage || 'Нет'
      });
    }
    
    // Проверяем требования по характеристикам
    if (item.requirements.stats) {
      for (const [stat, requiredValue] of Object.entries(item.requirements.stats)) {
        if (!characterStats[stat] || characterStats[stat] < requiredValue) {
          failedRequirements.push({
            type: `stat_${stat}`,
            required: requiredValue,
            current: characterStats[stat] || 0
          });
        }
      }
    }
    
    return Promise.resolve({
      meetsRequirements: failedRequirements.length === 0,
      failedRequirements
    });
  }

  /**
   * Получает типы бонусов
   */
  static getBonusTypes() {
    return BONUS_TYPES;
  }

  /**
   * Получает источники бонусов
   */
  static getBonusSources() {
    return BONUS_SOURCES;
  }

  /**
   * Получает типы расчетов
   */
  static getCalculationTypes() {
    return CALCULATION_TYPES;
  }
}

// Экспортируем класс через CommonJS
module.exports = BonusServiceAPI;

// Экспортируем константы для совместимости
const BONUS_TYPES_EXPORT = BONUS_TYPES;
const BONUS_SOURCES_EXPORT = BONUS_SOURCES;
const CALCULATION_TYPES_EXPORT = CALCULATION_TYPES;

// Экспортируем отдельные методы для совместимости
module.exports.calculateAllBonuses = BonusServiceAPI.calculateAllBonuses;
module.exports.calculateItemBonuses = BonusServiceAPI.calculateItemBonuses;
module.exports.calculateEffectsBonuses = BonusServiceAPI.calculateEffectsBonuses;
module.exports.checkItemRequirements = BonusServiceAPI.checkItemRequirements;