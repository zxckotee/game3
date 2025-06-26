/**
 * Клиентская версия ReputationService без серверных зависимостей
 * Используется в браузере вместо оригинального reputation-service.js
 */

// Типы фракций
const FACTION_TYPES = {
  SECT: 'sect',
  CITY: 'city',
  MERCHANT: 'merchant',
  CLAN: 'clan',
  EMPIRE: 'empire'
};

// Уровни репутации
const REPUTATION_LEVELS = {
  HOSTILE: { min: -100, max: -70, name: 'Враждебный' },
  UNFRIENDLY: { min: -69, max: -30, name: 'Недружелюбный' },
  NEUTRAL: { min: -29, max: 29, name: 'Нейтральный' },
  FRIENDLY: { min: 30, max: 69, name: 'Дружелюбный' },
  HONORED: { min: 70, max: 89, name: 'Уважаемый' },
  REVERED: { min: 90, max: 99, name: 'Почитаемый' },
  EXALTED: { min: 100, max: Infinity, name: 'Превознесённый' }
};

// Моковые данные о фракциях
const mockFactions = [
  {
    id: 1,
    name: 'Секта Пурпурного Пламени',
    description: 'Древняя секта, специализирующаяся на огненных техниках культивации.',
    type: FACTION_TYPES.SECT,
    leader: 'Старейшина Ли',
    homeBase: 'Гора Пурпурного Пламени',
    requirements: {
      minLevel: 5,
      minCultivationStage: 'Закалка тела'
    }
  },
  {
    id: 2,
    name: 'Город Восточной Реки',
    description: 'Крупный торговый город, расположенный на реке Восточного Потока.',
    type: FACTION_TYPES.CITY,
    leader: 'Губернатор Чжао',
    homeBase: 'Восточная Река',
    requirements: null
  },
  {
    id: 3,
    name: 'Гильдия Небесных Торговцев',
    description: 'Влиятельная торговая гильдия с сетью магазинов по всему региону.',
    type: FACTION_TYPES.MERCHANT,
    leader: 'Мастер-торговец Хуан',
    homeBase: 'Город Восточной Реки',
    requirements: {
      minLevel: 3
    }
  }
];

// Моковые данные о репутации пользователя
const mockUserReputations = [
  {
    id: 1,
    userId: 1,
    factionId: 1,
    value: 45,
    level: 'Дружелюбный',
    unlocks: ['Базовые техники секты', 'Доступ к внешнему двору']
  },
  {
    id: 2,
    userId: 1,
    factionId: 2,
    value: 20,
    level: 'Нейтральный',
    unlocks: ['Базовый доступ к рынку']
  },
  {
    id: 3,
    userId: 1,
    factionId: 3,
    value: 75,
    level: 'Уважаемый',
    unlocks: ['Торговые скидки 10%', 'Доступ к редким товарам']
  }
];

// Моковые данные о возможностях, открываемых на определенных уровнях репутации
const mockReputationFeatures = [
  {
    id: 1,
    factionId: 1,
    name: 'Базовые техники секты',
    description: 'Доступ к изучению базовых техник секты Пурпурного Пламени.',
    requiredLevel: 'Дружелюбный',
    requiredValue: 30,
    type: 'techniques'
  },
  {
    id: 2,
    factionId: 1,
    name: 'Доступ к внешнему двору',
    description: 'Возможность посещать внешний двор секты и участвовать в тренировках.',
    requiredLevel: 'Дружелюбный',
    requiredValue: 30,
    type: 'area'
  },
  {
    id: 3,
    factionId: 1,
    name: 'Доступ к внутреннему двору',
    description: 'Доступ к внутреннему двору и более продвинутым тренировкам.',
    requiredLevel: 'Уважаемый',
    requiredValue: 70,
    type: 'area'
  },
  {
    id: 4,
    factionId: 3,
    name: 'Торговые скидки 10%',
    description: 'Постоянная скидка 10% на все товары гильдии.',
    requiredLevel: 'Уважаемый',
    requiredValue: 70,
    type: 'discount'
  },
  {
    id: 5,
    factionId: 3,
    name: 'Доступ к редким товарам',
    description: 'Возможность покупать редкие товары из личного хранилища гильдии.',
    requiredLevel: 'Уважаемый',
    requiredValue: 70,
    type: 'inventory'
  }
];

// Моковые данные об отношениях между фракциями
const mockFactionRelations = [
  {
    id: 1,
    faction1Id: 1,
    faction2Id: 2,
    attitude: 'neutral',
    value: 0,
    description: 'Нейтральные отношения без особых конфликтов или альянсов.'
  },
  {
    id: 2,
    faction1Id: 1,
    faction2Id: 3,
    attitude: 'friendly',
    value: 50,
    description: 'Дружеские отношения, основанные на взаимовыгодной торговле.'
  },
  {
    id: 3,
    faction1Id: 2,
    faction2Id: 3,
    attitude: 'allied',
    value: 80,
    description: 'Тесный альянс, город является главной базой для гильдии.'
  }
];

class ReputationServiceAPI {
  /**
   * Получает все фракции
   * @returns {Promise<Array>} Массив всех фракций
   */
  static async getAllFactions() {
    return Promise.resolve([...mockFactions]);
  }

  /**
   * Получает фракцию по ID
   * @param {number} factionId ID фракции
   * @returns {Promise<Object|null>} Объект фракции или null, если не найдена
   */
  static async getFactionById(factionId) {
    const faction = mockFactions.find(faction => faction.id === factionId);
    return Promise.resolve(faction ? {...faction} : null);
  }

  /**
   * Получает фракции по типу
   * @param {string} type Тип фракции
   * @returns {Promise<Array>} Массив фракций указанного типа
   */
  static async getFactionsByType(type) {
    const factions = mockFactions.filter(faction => faction.type === type);
    return Promise.resolve([...factions]);
  }

  /**
   * Получает репутацию пользователя во всех фракциях
   * @param {number} userId ID пользователя
   * @returns {Promise<Array>} Массив репутаций пользователя
   */
  static async getUserReputations(userId) {
    const reputations = mockUserReputations.filter(rep => rep.userId === userId);
    return Promise.resolve([...reputations]);
  }

  /**
   * Получает репутацию пользователя в конкретной фракции
   * @param {number} userId ID пользователя
   * @param {number} factionId ID фракции
   * @returns {Promise<Object|null>} Объект репутации или null, если не найдена
   */
  static async getUserFactionReputation(userId, factionId) {
    const reputation = mockUserReputations.find(
      rep => rep.userId === userId && rep.factionId === factionId
    );
    return Promise.resolve(reputation ? {...reputation} : null);
  }

  /**
   * Получает особенности (возможности), доступные на определенном уровне репутации
   * @param {number} factionId ID фракции
   * @param {string} level Уровень репутации
   * @returns {Promise<Array>} Массив особенностей
   */
  static async getFeaturesByReputationLevel(factionId, level) {
    // Находим минимальное значение репутации для указанного уровня
    const levelMinValue = Object.values(REPUTATION_LEVELS).find(l => l.name === level)?.min || 0;
    
    // Получаем особенности, доступные на данном уровне репутации
    const features = mockReputationFeatures.filter(
      feature => feature.factionId === factionId && feature.requiredValue <= levelMinValue
    );
    
    return Promise.resolve([...features]);
  }

  /**
   * Изменяет репутацию пользователя в фракции
   * @param {number} userId ID пользователя
   * @param {number} factionId ID фракции
   * @param {number} change Величина изменения (может быть отрицательной)
   * @returns {Promise<Object>} Результат изменения репутации
   */
  static async changeReputation(userId, factionId, change) {
    let reputation = await this.getUserFactionReputation(userId, factionId);
    
    // Если репутации еще нет, создаем новую запись
    if (!reputation) {
      reputation = {
        id: Math.max(...mockUserReputations.map(r => r.id), 0) + 1,
        userId,
        factionId,
        value: 0,
        level: 'Нейтральный',
        unlocks: []
      };
    } else {
      // Клонируем объект для изменения
      reputation = {...reputation};
    }
    
    // Старое значение и уровень для сравнения
    const oldValue = reputation.value;
    const oldLevel = reputation.level;
    
    // Обновляем значение репутации
    reputation.value = Math.min(Math.max(reputation.value + change, -100), 150);
    
    // Определяем новый уровень репутации
    for (const [level, range] of Object.entries(REPUTATION_LEVELS)) {
      if (reputation.value >= range.min && reputation.value <= range.max) {
        reputation.level = range.name;
        break;
      }
    }
    
    // Проверяем, изменился ли уровень репутации
    const levelChanged = oldLevel !== reputation.level;
    
    // Обновляем доступные возможности, если уровень изменился
    if (levelChanged) {
      const features = await this.getFeaturesByReputationLevel(factionId, reputation.level);
      reputation.unlocks = features.map(f => f.name);
    }
    
    // Определяем, открылись ли новые возможности
    let newUnlocks = [];
    if (levelChanged && change > 0) {
      // Получаем особенности, доступные на этом уровне, но недоступные на предыдущем
      const oldLevelValue = Object.values(REPUTATION_LEVELS).find(l => l.name === oldLevel)?.max || 0;
      const newFeatures = mockReputationFeatures.filter(
        feature => feature.factionId === factionId && 
                  feature.requiredValue > oldLevelValue && 
                  feature.requiredValue <= reputation.value
      );
      
      newUnlocks = newFeatures.map(f => f.name);
    }
    
    return Promise.resolve({
      success: true,
      message: change >= 0 
        ? `Репутация в "${factionId}" увеличена на ${change}` 
        : `Репутация в "${factionId}" уменьшена на ${Math.abs(change)}`,
      oldValue,
      newValue: reputation.value,
      oldLevel,
      newLevel: reputation.level,
      levelChanged,
      newUnlocks,
      reputation
    });
  }

  /**
   * Получает отношения между двумя фракциями
   * @param {number} faction1Id ID первой фракции
   * @param {number} faction2Id ID второй фракции
   * @returns {Promise<Object|null>} Объект отношений или null, если не найден
   */
  static async getFactionRelation(faction1Id, faction2Id) {
    // Ищем отношения в обоих направлениях
    let relation = mockFactionRelations.find(
      rel => (rel.faction1Id === faction1Id && rel.faction2Id === faction2Id) ||
             (rel.faction1Id === faction2Id && rel.faction2Id === faction1Id)
    );
    
    return Promise.resolve(relation ? {...relation} : null);
  }

  /**
   * Получает все отношения фракции
   * @param {number} factionId ID фракции
   * @returns {Promise<Array>} Массив отношений с другими фракциями
   */
  static async getFactionRelations(factionId) {
    const relations = mockFactionRelations.filter(
      rel => rel.faction1Id === factionId || rel.faction2Id === factionId
    );
    
    return Promise.resolve([...relations]);
  }

  /**
   * Получает типы фракций
   */
  static getFactionTypes() {
    return FACTION_TYPES;
  }

  /**
   * Получает уровни репутации
   */
  static getReputationLevels() {
    return REPUTATION_LEVELS;
  }
}

// Экспортируем класс через CommonJS
module.exports = ReputationServiceAPI;

// Экспортируем константы для совместимости
const FACTION_TYPES_EXPORT = FACTION_TYPES;
const REPUTATION_LEVELS_EXPORT = REPUTATION_LEVELS;

// Экспортируем отдельные методы для совместимости
module.exports.getAllFactions = ReputationServiceAPI.getAllFactions;
module.exports.getFactionById = ReputationServiceAPI.getFactionById;
module.exports.getFactionsByType = ReputationServiceAPI.getFactionsByType;
module.exports.getUserReputations = ReputationServiceAPI.getUserReputations;
module.exports.getUserFactionReputation = ReputationServiceAPI.getUserFactionReputation;
module.exports.getFeaturesByReputationLevel = ReputationServiceAPI.getFeaturesByReputationLevel;
module.exports.changeReputation = ReputationServiceAPI.changeReputation;
module.exports.getFactionRelation = ReputationServiceAPI.getFactionRelation;
module.exports.getFactionRelations = ReputationServiceAPI.getFactionRelations;