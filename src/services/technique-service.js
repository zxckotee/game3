/**
 * Сервис для работы с техниками
 * Обрабатывает запросы от API и взаимодействует с базой данных через ORM
 */

// Импортируем реестр моделей вместо прямого использования connectionProvider
const connectionProvider = require('../utils/connection-provider');
const modelRegistry = require('../models/registry');

// Импортируем необходимые сервисы для работы с энергией и валютой
const CultivationService = require('./cultivation-service');
const CharacterProfileService = require('./character-profile-service');

// Константы типов техник
const techniqueTypes = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  SUPPORT: 'support',
  CULTIVATION: 'cultivation'
};

// Константы типов элементов
const elementTypes = {
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  WIND: 'wind',
  LIGHTNING: 'lightning',
  DARKNESS: 'darkness',
  LIGHT: 'light',
  VOID: 'void'
};

// Цвета элементов
const elementColors = {
  [elementTypes.FIRE]: '#ff4d4d',
  [elementTypes.WATER]: '#4d94ff',
  [elementTypes.EARTH]: '#a67c00',
  [elementTypes.WIND]: '#80ff80',
  [elementTypes.LIGHTNING]: '#ffff4d',
  [elementTypes.DARKNESS]: '#660066',
  [elementTypes.LIGHT]: '#ffff99',
  [elementTypes.VOID]: '#1a1a1a'
};

// Кэш для хранения техник (для оптимизации и обратной совместимости)
let techniquesCache = [];
let techniquesByLevelCache = {};

/**
 * Вычисляет стоимость улучшения техники
 * @param {number} currentLevel - Текущий уровень техники
 * @param {number} targetLevel - Целевой уровень техники
 * @returns {number} Стоимость улучшения
 */
/**
 * Вычисляет стоимость улучшения техники по формуле из SQL-реализации
 * @param {number} currentLevel - Текущий уровень техники
 * @param {number} targetLevel - Целевой уровень техники
 * @returns {Object} Стоимость улучшения в виде объекта {experienceCost, goldCost, spiritStonesCost}
 */
function calculateUpgradeCost(currentLevel, targetLevel) {
  if (targetLevel <= currentLevel) {
    return { experienceCost: 0, goldCost: 0, spiritStonesCost: 0 };
  }
  
  // Используем фиксированную формулу, как в SQL-реализации
  const experienceCost = 50 * targetLevel;
  const goldCost = 100 + 20 * targetLevel;
  const spiritStonesCost = targetLevel > 5 ? targetLevel - 5 : 0;
  
  return {
    experienceCost,
    goldCost,
    spiritStonesCost,
    // Для обратной совместимости
    total: experienceCost + goldCost * 10 + spiritStonesCost * 100
  };
}

/**
 * Вычисляет стоимость изучения техники
 * @param {Object} technique - Объект техники
 * @returns {Object} Стоимость изучения в виде объекта {energy, currency}
 */
/**
 * Вычисляет стоимость изучения техники по формуле из SQL-реализации
 * @param {Object} technique - Объект техники
 * @returns {Object} Стоимость изучения в виде объекта
 */
function calculateLearnCost(technique) {
  // Используем фиксированные значения, как в SQL-реализации
  const experienceCost = 75;
  const goldCost = 100;
  
  return {
    // Для обратной совместимости сохраняем старые имена полей
    energy: experienceCost,
    currency: {
      gold: goldCost
    },
    // Добавляем новые поля для более явного использования
    experienceCost,
    goldCost
  };
}

/**
 * Вычисляет стоимость улучшения техники для конкретного уровня
 * @param {number} currentLevel - Текущий уровень техники
 * @param {number} targetLevel - Целевой уровень техники
 * @returns {Object} Стоимость улучшения в виде объекта {energy, currency}
 */
function calculateUpgradeCostResources(currentLevel, targetLevel) {
  if (targetLevel <= currentLevel) {
    return { energy: 0, currency: {} };
  }
  
  // Базовая стоимость энергии для улучшения
  const energyCost = 20 + (currentLevel * 10);
  
  // Стоимость валюты зависит от текущего уровня
  const currencyCost = {};
  
  if (currentLevel < 3) {
    // Уровни 1-3: медь
    currencyCost.copper = 200 * (currentLevel + 1);
  } else if (currentLevel < 6) {
    // Уровни 4-6: серебро
    currencyCost.silver = 20 * (currentLevel - 2);
  } else if (currentLevel < 9) {
    // Уровни 7-9: золото
    currencyCost.gold = 2 * (currentLevel - 5);
  } else {
    // Уровни 10+: духовные камни
    currencyCost.spiritStones = 1 * (currentLevel - 8);
  }
  
  return {
    energy: energyCost,
    currency: currencyCost
  };
}

/**
 * Получает все техники из базы данных
 * @returns {Promise<Array>} Массив техник
 */
exports.getAllTechniques = async function() {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Technique = modelRegistry.getModel('Technique');
    const TechniqueEffect = modelRegistry.getModel('TechniqueEffect');
    
    // Загружаем все техники с их эффектами, без обращения к user_id
    const techniques = await Technique.findAll({
      include: [
        {
          model: TechniqueEffect,
          as: 'effects',
          // Явно указываем атрибуты для эффектов
          attributes: ['id', 'type', 'name', 'duration', 'damage', 'damageType', 'healing']
        }
      ],
      // Явно указываем атрибуты для выборки, чтобы избежать неявных присоединений
      attributes: ['id', 'name', 'description', 'icon', 'level', 'damage', 'damageType',
                   'energyCost', 'cooldown', 'maxLevel', 'type', 'requiredLevel', 'healing']
    });
    
    // Преобразуем в нужный формат для клиента - используем snake_case для совместимости с SQL-API
    const formattedTechniques = techniques.map(technique => ({
      id: technique.id,
      name: technique.name,
      description: technique.description,
      icon: technique.icon,
      
      // Для неизученных техник уровень всегда должен быть 0, как в SQL-API
      level: 0,
      damage: technique.damage,
      damage_type: technique.damageType, // snake_case
      energy_cost: technique.energyCost, // snake_case
      cooldown: technique.cooldown,
      max_level: technique.maxLevel, // snake_case
      type: technique.type,
      required_level: technique.requiredLevel, // snake_case
      healing: technique.healing,
      effects: technique.effects.map(effect => ({
        id: effect.id,
        type: effect.type,
        name: effect.name,
        duration: effect.duration,
        damage: effect.damage || 0,
        damage_type: effect.damageType, // snake_case
        healing: effect.healing || 0
      })),
      // Функция для расчета стоимости улучшения всегда начинается с уровня 1
      upgradeCost: (targetLevel) => calculateUpgradeCost(1, targetLevel)
    }));
    
    // Группируем техники по уровню
    const byLevel = formattedTechniques.reduce((acc, technique) => {
      if (!acc[technique.level]) {
        acc[technique.level] = [];
      }
      acc[technique.level].push(technique);
      return acc;
    }, {});
    
    // Обновляем кэш для обратной совместимости
    techniquesCache = formattedTechniques;
    techniquesByLevelCache = byLevel;
    
    return formattedTechniques;
  } catch (error) {
    console.error('Ошибка при получении техник:', error);
    // Возвращаем кэшированные данные или пустой массив
    return techniquesCache.length > 0 ? techniquesCache : [];
  }
};

/**
 * Получает технику по ID
 * @param {string} id - ID техники
 * @returns {Promise<Object|null>} Техника или null, если не найдена
 */
exports.getTechniqueById = async function(id) {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Technique = modelRegistry.getModel('Technique');
    const TechniqueEffect = modelRegistry.getModel('TechniqueEffect');
    
    // Загружаем технику с её эффектами, явно указывая атрибуты
    const technique = await Technique.findByPk(id, {
      include: [
        {
          model: TechniqueEffect,
          as: 'effects',
          // Явно указываем атрибуты для эффектов
          attributes: ['id', 'type', 'name', 'duration', 'damage', 'damageType', 'healing']
        }
      ],
      // Явно указываем атрибуты для выборки, чтобы избежать неявных присоединений
      attributes: ['id', 'name', 'description', 'icon', 'level', 'damage', 'damageType',
                   'energyCost', 'cooldown', 'maxLevel', 'type', 'requiredLevel', 'healing']
    });
    
    if (!technique) {
      return null;
    }
    
    // Преобразуем в нужный формат для клиента (snake_case)
    return {
      id: technique.id,
      name: technique.name,
      description: technique.description,
      icon: technique.icon,
      level: technique.level || 0,
      damage: technique.damage,
      damage_type: technique.damageType, // snake_case
      energy_cost: technique.energyCost, // snake_case
      cooldown: technique.cooldown,
      max_level: technique.maxLevel, // snake_case
      type: technique.type,
      required_level: technique.requiredLevel, // snake_case
      healing: technique.healing,
      effects: technique.effects.map(effect => ({
        id: effect.id,
        type: effect.type,
        name: effect.name,
        duration: effect.duration,
        damage: effect.damage || 0,
        damage_type: effect.damageType, // snake_case
        healing: effect.healing || 0
      })),
      // Функция для расчета стоимости улучшения
      upgradeCost: (targetLevel) => calculateUpgradeCost(technique.level || 1, targetLevel)
    };
  } catch (error) {
    console.error(`Ошибка при получении техники с ID ${id}:`, error);
    // Ищем в кэше при ошибке
    return techniquesCache.find(t => t.id === id) || null;
  }
};

/**
 * Получает технику по названию
 * @param {string} name - Название техники
 * @returns {Promise<Object|null>} Техника или null, если не найдена
 */
exports.getTechniqueByName = async function(name) {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Technique = modelRegistry.getModel('Technique');
    const TechniqueEffect = modelRegistry.getModel('TechniqueEffect');
    
    // Загружаем технику с её эффектами, явно указывая атрибуты
    const technique = await Technique.findOne({
      where: { name },
      include: [
        {
          model: TechniqueEffect,
          as: 'effects',
          // Явно указываем атрибуты для эффектов
          attributes: ['id', 'type', 'name', 'duration', 'damage', 'damageType', 'healing']
        }
      ],
      // Явно указываем атрибуты для выборки, чтобы избежать неявных присоединений
      attributes: ['id', 'name', 'description', 'icon', 'level', 'damage', 'damageType',
                   'energyCost', 'cooldown', 'maxLevel', 'type', 'requiredLevel', 'healing']
    });
    
    if (!technique) {
      return null;
    }
    
    // Преобразуем в нужный формат для клиента (snake_case)
    return {
      id: technique.id,
      name: technique.name,
      description: technique.description,
      icon: technique.icon,
      level: technique.level || 0,
      damage: technique.damage,
      damage_type: technique.damageType, // snake_case
      energy_cost: technique.energyCost, // snake_case
      cooldown: technique.cooldown,
      max_level: technique.maxLevel, // snake_case
      type: technique.type,
      required_level: technique.requiredLevel, // snake_case
      healing: technique.healing,
      effects: technique.effects.map(effect => ({
        id: effect.id,
        type: effect.type,
        name: effect.name,
        duration: effect.duration,
        damage: effect.damage || 0,
        damage_type: effect.damageType, // snake_case
        healing: effect.healing || 0
      })),
      // Функция для расчета стоимости улучшения
      upgradeCost: (targetLevel) => calculateUpgradeCost(technique.level || 1, targetLevel)
    };
  } catch (error) {
    console.error(`Ошибка при получении техники с названием ${name}:`, error);
    // Ищем в кэше при ошибке
    return techniquesCache.find(t => t.name === name) || null;
  }
};

/**
 * Получает техники по типу
 * @param {string} type - Тип техники
 * @returns {Promise<Array>} Массив техник указанного типа
 */
exports.getTechniquesByType = async function(type) {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Technique = modelRegistry.getModel('Technique');
    const TechniqueEffect = modelRegistry.getModel('TechniqueEffect');
    
    // Загружаем техники с их эффектами, явно указывая атрибуты
    const techniques = await Technique.findAll({
      where: { type },
      include: [
        {
          model: TechniqueEffect,
          as: 'effects',
          // Явно указываем атрибуты для эффектов
          attributes: ['id', 'type', 'name', 'duration', 'damage', 'damageType', 'healing']
        }
      ],
      // Явно указываем атрибуты для выборки, чтобы избежать неявных присоединений
      attributes: ['id', 'name', 'description', 'icon', 'damage', 'damageType',
                   'energyCost', 'cooldown', 'maxLevel', 'type', 'requiredLevel', 'healing']
    });
    
    // Преобразуем в нужный формат для клиента (snake_case)
    return techniques.map(technique => ({
      id: technique.id,
      name: technique.name,
      description: technique.description,
      icon: technique.icon,
      level: technique.level || 0,
      damage: technique.damage,
      damage_type: technique.damageType, // snake_case
      energy_cost: technique.energyCost, // snake_case
      cooldown: technique.cooldown,
      max_level: technique.maxLevel, // snake_case
      type: technique.type,
      required_level: technique.requiredLevel, // snake_case
      healing: technique.healing,
      effects: technique.effects.map(effect => ({
        id: effect.id,
        type: effect.type,
        name: effect.name,
        duration: effect.duration,
        damage: effect.damage || 0,
        damage_type: effect.damageType, // snake_case
        healing: effect.healing || 0
      })),
      // Функция для расчета стоимости улучшения
      upgradeCost: (targetLevel) => calculateUpgradeCost(technique.level || 1, targetLevel)
    }));
  } catch (error) {
    console.error(`Ошибка при получении техник типа ${type}:`, error);
    // Фильтруем кэш при ошибке
    return techniquesCache.filter(t => t.type === type);
  }
};

/**
 * Получает изученные техники пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} Массив изученных техник
 */
exports.getLearnedTechniques = async function(userId) {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Technique = modelRegistry.getModel('Technique');
    const TechniqueEffect = modelRegistry.getModel('TechniqueEffect');
    const LearnedTechnique = modelRegistry.getModel('LearnedTechnique');
    
    // Загружаем изученные техники пользователя
    const learnedTechniques = await LearnedTechnique.findAll({
      where: { userId },
      include: [
        {
          model: Technique,
          as: 'technique',
          include: [
            {
              model: TechniqueEffect,
              as: 'effects',
              // Явно указываем атрибуты для эффектов
              attributes: ['id', 'type', 'name', 'duration', 'damage', 'damageType', 'healing']
            }
          ],
          // Явно указываем атрибуты для техники
          attributes: ['id', 'name', 'description', 'icon', 'damage', 'damageType',
                      'energyCost', 'cooldown', 'maxLevel', 'type', 'requiredLevel', 'healing']
        }
      ]
    });
    
    // Преобразуем в нужный формат для клиента
    return learnedTechniques.map(learned => {
      const technique = learned.technique;
      return {
        id: technique.id,
        name: technique.name,
        description: technique.description,
        icon: technique.icon,
        damage: technique.damage,
        damage_type: technique.damageType, // snake_case
        energy_cost: technique.energyCost, // snake_case
        cooldown: technique.cooldown,
        max_level: technique.maxLevel, // snake_case
        type: technique.type,
        required_level: technique.requiredLevel, // snake_case
        healing: technique.healing,
        effects: technique.effects.map(effect => ({
          id: effect.id,
          type: effect.type,
          name: effect.name,
          duration: effect.duration,
          damage: effect.damage || 0,
          damage_type: effect.damageType, // snake_case
          healing: effect.healing || 0
        })),
        learnedAt: learned.createdAt,
        level: learned.level, // Уровень, до которого пользователь улучшил технику
        // Функция для расчета стоимости улучшения
        upgradeCost: (targetLevel) => calculateUpgradeCost(learned.level, targetLevel)
      };
    });
  } catch (error) {
    console.error(`Ошибка при получении изученных техник пользователя ${userId}:`, error);
    return [];
  }
};

/**
 * Изучение новой техники
 * @param {string} userId - ID пользователя
 * @param {string} techniqueId - ID техники
 * @returns {Promise<Object|null>} Изученная техника или null, если техника не найдена
 */
exports.learnTechnique = async function(userId, techniqueId) {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Technique = modelRegistry.getModel('Technique');
    const LearnedTechnique = modelRegistry.getModel('LearnedTechnique');
    
    // Проверяем существование техники
    const technique = await Technique.findByPk(techniqueId);
    if (!technique) {
      return null;
    }
    
    // Получаем профиль персонажа
    const userProfile = await CharacterProfileService.getCharacterProfile(userId);
    if (!userProfile) {
      return {
        error: true,
        message: 'Профиль персонажа не найден'
      };
    }
    
    // ВАЖНО: Убрана проверка уровня пользователя, так как она отсутствует в SQL-реализации
    // Это позволяет изучать техники независимо от уровня персонажа, как в оригинальной версии
    
    // Проверяем, не изучена ли уже техника
    const existingTechnique = await LearnedTechnique.findOne({
      where: { userId, techniqueId }
    });
    
    if (existingTechnique) {
      return {
        techniqueId,
        userId,
        level: existingTechnique.level,
        createdAt: existingTechnique.createdAt,
        message: 'Техника уже изучена'
      };
    }
    
    // Используем фиксированную стоимость, как в SQL-реализации
    const experienceCost = 75;
    const goldCost = 100;
    
    // Создаем объект стоимости для обратной совместимости
    const cost = {
      energy: experienceCost,
      currency: {
        gold: goldCost
      }
    };
    
    // Получаем данные о культивации пользователя (энергия)
    // Динамический импорт для разрыва циклической зависимости
    const CultivationServiceDynamic = require('./cultivation-service');
    const cultivationData = await CultivationServiceDynamic.getCultivationProgress(userId);
    if (!cultivationData) {
      return {
        error: true,
        message: 'Данные о культивации не найдены'
      };
    }
    
    // Получаем данные о профиле пользователя (валюта)
    const profileData = await CharacterProfileService.getCharacterProfile(userId);
    if (!profileData) {
      return {
        error: true,
        message: 'Профиль персонажа не найден'
      };
    }
    
    // Проверяем достаточность энергии (опыта культивации)
    // Преобразуем значения в числа для корректного сравнения
    const expToCheck = parseInt(cultivationData.experience) || 0;
    const expCostToCheck = parseInt(experienceCost) || 0;
    
    if (expToCheck < expCostToCheck) {
      return {
        error: true,
        message: `Недостаточно опыта культивации. Требуется: ${experienceCost}, имеется: ${cultivationData.experience}`
      };
    }
    
    // Проверяем достаточность золота, как в SQL-реализации
    // Преобразуем значения в числа для корректного сравнения
    // Используем правильный путь к полю gold через вложенный объект currency
    const goldToCheck = parseInt(profileData.currency && profileData.currency.gold) || 0;
    const goldCostToCheck = parseInt(goldCost) || 0;
    
    console.log(`Проверка золота: имеется ${goldToCheck}, требуется ${goldCostToCheck}`);
    
    if (goldToCheck < goldCostToCheck) {
      return {
        error: true,
        message: `Недостаточно золота. Требуется: ${goldCost}, имеется: ${profileData.currency ? profileData.currency.gold : 0}`
      };
    }
    
    // Списываем ресурсы пользователя, как в SQL-реализации
    // 1. Обновляем опыт культивации
    // Используем динамический импорт
    const CultivationServiceUpdate = require('./cultivation-service');
    
    // Преобразуем значения в числа и проверяем на NaN
    const currentExperience = parseInt(cultivationData.experience) || 0;
    const costExperience = parseInt(experienceCost) || 0;
    
    // Вычисляем новое значение опыта, убедившись, что оно числовое
    const newExperience = Math.max(0, currentExperience - costExperience);
    
    console.log(`Текущий опыт: ${currentExperience}, Стоимость опыта: ${costExperience}, Новый опыт: ${newExperience}`);
    
    // Проверяем, что значение не NaN перед отправкой в базу данных
    if (isNaN(newExperience)) {
      console.error('Ошибка: новое значение опыта равно NaN!');
      throw new Error('Некорректное значение опыта');
    }
    
    await CultivationServiceUpdate.updateCultivationProgress(userId, {
      experience: 0 - costExperience
    });
    
    // 2. Обновляем золото
    // Преобразуем значения в числа и проверяем на NaN
    // Используем правильный путь к полю gold через вложенный объект currency
    const currentGold = parseInt(profileData.currency && profileData.currency.gold) || 0;
    const costGold = parseInt(goldCost) || 0;
    
    // Вычисляем новое значение золота, убедившись, что оно числовое
    const newGold = Math.max(0, currentGold - costGold);
    
    console.log(`Текущее золото: ${currentGold}, Стоимость: ${costGold}, Новое золото: ${newGold}`);
    
    // Проверяем, что значение не NaN перед отправкой в базу данных
    if (isNaN(newGold)) {
      console.error('Ошибка: новое значение золота равно NaN!');
      throw new Error('Некорректное значение золота');
    }
    
    await CharacterProfileService.updateCurrency(userId, {
      gold: newGold
    });
    
    // Создаем запись об изученной технике
    const learnedTechnique = await LearnedTechnique.create({
      userId,
      techniqueId,
      level: 1
    });
    
    // Проверяем, является ли техника стихийной и имеет ли эффекты
    try {
      // Получаем полные данные о технике с эффектами
      const fullTechnique = await Technique.findByPk(techniqueId, {
        include: [
          {
            model: modelRegistry.getModel('TechniqueEffect'),
            as: 'effects',
            attributes: ['id', 'type', 'name', 'duration', 'damage', 'damageType', 'healing']
          }
        ]
      });
      
      // Проверяем, имеет ли техника эффекты
      if (fullTechnique &&
          fullTechnique.effects &&
          fullTechnique.effects.length > 0 &&
          fullTechnique) {
          
          // Инициализируем sequelize
          const sequelize = Technique.sequelize;
          if (sequelize) {
            // Найдем существующую запись прогресса для достижения "Повелитель стихий"
            const [achievementProgress] = await sequelize.query(
              `SELECT * FROM achievement_progress WHERE user_id = :userId AND achievement_id = 10 LIMIT 1`,
              {
                replacements: { userId },
                type: sequelize.QueryTypes.SELECT
              }
            );
            
            if (achievementProgress) {
              // Если запись найдена, увеличиваем счетчик на 1
              const newValue = achievementProgress.current_value + 1;
              const isCompleted = newValue >= 5 || achievementProgress.is_completed;
              
              await sequelize.query(
                `UPDATE achievement_progress
                 SET current_value = :newValue,
                     is_completed = :isCompleted,
                     completion_date = CASE WHEN :isNewlyCompleted THEN CURRENT_TIMESTAMP ELSE completion_date END,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = :userId AND achievement_id = 10`,
                {
                  replacements: {
                    userId,
                    newValue,
                    isCompleted,
                    isNewlyCompleted: !achievementProgress.is_completed && isCompleted
                  },
                  type: sequelize.QueryTypes.UPDATE
                }
              );
              
              console.log(`Обновлен прогресс достижения "Повелитель стихий" для пользователя ${userId}: ${achievementProgress.current_value} -> ${newValue}`);
            } else {
              // Если запись не найдена, создаем новую с начальным значением 1
              await sequelize.query(
                `INSERT INTO achievement_progress
                 (user_id, achievement_id, current_value, is_completed, is_rewarded, created_at, updated_at)
                 VALUES (:userId, 10, 1, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                {
                  replacements: { userId },
                  type: sequelize.QueryTypes.INSERT
                }
              );
              
              console.log(`Создана запись прогресса достижения "Повелитель стихий" для пользователя ${userId} с начальным значением 1`);
            }
          
        }
      }
    } catch (achievementError) {
      // Не прерываем основной процесс в случае ошибки обновления достижения
      console.error('Ошибка при обновлении прогресса достижения "Повелитель стихий":', achievementError);
    }
    
    return {
      techniqueId,
      userId,
      level: 1,
      createdAt: learnedTechnique.createdAt,
      cost: cost
    };
  } catch (error) {
    console.error(`Ошибка при изучении техники ${techniqueId} пользователем ${userId}:`, error);
    return null;
  }
};

/**
 * Улучшение техники
 * @param {string} userId - ID пользователя
 * @param {string} techniqueId - ID техники
 * @param {number} targetLevel - Целевой уровень
 * @returns {Promise<Object|null>} Обновленная техника или null при ошибке
 */
exports.upgradeTechnique = async function(userId, techniqueId, targetLevel) {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Technique = modelRegistry.getModel('Technique');
    const LearnedTechnique = modelRegistry.getModel('LearnedTechnique');
    
    // Проверяем существование техники
    const technique = await Technique.findByPk(techniqueId);
    if (!technique) {
      return null;
    }
    
    // Проверяем, что техника изучена
    const learnedTechnique = await LearnedTechnique.findOne({
      where: { userId, techniqueId }
    });
    
    if (!learnedTechnique) {
      return null;
    }
    
    // Проверяем, что целевой уровень не превышает максимальный
    if (targetLevel > technique.maxLevel) {
      return {
        error: true,
        message: `Уровень не может превышать максимальный (${technique.maxLevel})`
      };
    }
    
    // Проверяем, что целевой уровень выше текущего
    if (targetLevel <= learnedTechnique.level) {
      return {
        error: true,
        message: 'Целевой уровень должен быть выше текущего'
      };
    }
    
    // Используем обновленную функцию расчета стоимости улучшения
    const { experienceCost, goldCost, spiritStonesCost } = calculateUpgradeCost(learnedTechnique.level, targetLevel);
    
    // Получаем данные о культивации пользователя
    // Динамический импорт для разрыва циклической зависимости
    const CultivationServiceDynamic = require('./cultivation-service');
    const cultivationData = await CultivationServiceDynamic.getCultivationProgress(userId);
    if (!cultivationData) {
      return {
        error: true,
        message: 'Данные о культивации не найдены'
      };
    }
    
    // Получаем данные о профиле пользователя (валюта)
    const profileData = await CharacterProfileService.getCharacterProfile(userId);
    if (!profileData) {
      return {
        error: true,
        message: 'Профиль персонажа не найден'
      };
    }
    
    // Проверяем достаточность опыта культивации
    if (cultivationData.experience < experienceCost) {
      return {
        error: true,
        message: `Недостаточно опыта культивации. Требуется: ${experienceCost}, имеется: ${cultivationData.experience}`
      };
    }
    
    // Проверяем достаточность золота
    // Используем правильный путь к полю gold через вложенный объект currency
    const goldToCheck = parseInt(profileData.currency && profileData.currency.gold) || 0;
    const goldCostToCheck = parseInt(goldCost) || 0;
    
    console.log(`Проверка золота для улучшения: имеется ${goldToCheck}, требуется ${goldCostToCheck}`);
    
    if (goldToCheck < goldCostToCheck) {
      return {
        error: true,
        message: `Недостаточно золота. Требуется: ${goldCost}, имеется: ${profileData.currency ? profileData.currency.gold : 0}`
      };
    }
    
    // Проверяем достаточность духовных камней, если требуются
    const spiritStonesToCheck = parseInt(profileData.currency && profileData.currency.spiritStones) || 0;
    const spiritStonesCostToCheck = parseInt(spiritStonesCost) || 0;
    
    console.log(`Проверка духовных камней: имеется ${spiritStonesToCheck}, требуется ${spiritStonesCostToCheck}`);
    
    if (spiritStonesCost > 0 && spiritStonesToCheck < spiritStonesCostToCheck) {
      return {
        error: true,
        message: `Недостаточно духовных камней. Требуется: ${spiritStonesCost}, имеется: ${profileData.currency ? profileData.currency.spiritStones : 0}`
      };
    }
    
    // Списываем ресурсы пользователя
    // 1. Обновляем опыт культивации
    // Используем динамический импорт
    const CultivationServiceUpdate = require('./cultivation-service');
    
    // Преобразуем значения в числа и проверяем на NaN
    const currentExperience = parseInt(cultivationData.experience) || 0;
    const costExperience = parseInt(experienceCost) || 0;
    
    // Вычисляем новое значение опыта, убедившись, что оно числовое
    const newExperience = Math.max(0, currentExperience - costExperience);
    
    console.log(`Текущий опыт: ${currentExperience}, Стоимость опыта: ${costExperience}, Новый опыт: ${newExperience}`);
    
    // Проверяем, что значение не NaN перед отправкой в базу данных
    if (isNaN(newExperience)) {
      console.error('Ошибка: новое значение опыта равно NaN!');
      throw new Error('Некорректное значение опыта');
    }
    
    await CultivationServiceUpdate.updateCultivationProgress(userId, {
      experience: newExperience
    });
    
    // 2. Обновляем валюту
    // Используем правильный путь к полям через вложенный объект currency
    const currentGold = parseInt(profileData.currency && profileData.currency.gold) || 0;
    const costGold = parseInt(goldCost) || 0;
    
    // Вычисляем новое значение золота, убедившись, что оно числовое
    const newGold = Math.max(0, currentGold - costGold);
    
    console.log(`Текущее золото: ${currentGold}, Стоимость: ${costGold}, Новое золото: ${newGold}`);
    
    // Проверяем, что значение не NaN перед отправкой в базу данных
    if (isNaN(newGold)) {
      console.error('Ошибка: новое значение золота равно NaN!');
      throw new Error('Некорректное значение золота');
    }
    
    const currencyUpdate = {
      gold: newGold
    };
    
    // Добавляем духовные камни в обновление, только если они требуются
    if (spiritStonesCost > 0) {
      const currentSpiritStones = parseInt(profileData.currency && profileData.currency.spiritStones) || 0;
      const costSpiritStones = parseInt(spiritStonesCost) || 0;
      
      // Вычисляем новое значение духовных камней, убедившись, что оно числовое
      const newSpiritStones = Math.max(0, currentSpiritStones - costSpiritStones);
      
      console.log(`Текущие духовные камни: ${currentSpiritStones}, Стоимость: ${costSpiritStones}, Новые духовные камни: ${newSpiritStones}`);
      
      // Проверяем, что значение не NaN перед отправкой в базу данных
      if (isNaN(newSpiritStones)) {
        console.error('Ошибка: новое значение духовных камней равно NaN!');
        throw new Error('Некорректное значение духовных камней');
      }
      
      currencyUpdate.spiritStones = newSpiritStones;
    }
    
    await CharacterProfileService.updateCurrency(userId, currencyUpdate);
    
    // Обновляем уровень техники
    await learnedTechnique.update({ level: targetLevel });
    
    return {
      techniqueId,
      userId,
      level: targetLevel,
      createdAt: learnedTechnique.createdAt,
      updatedAt: learnedTechnique.updatedAt,
      cost: {
        experience: experienceCost,
        gold: goldCost,
        spiritStones: spiritStonesCost
      }
    };
  } catch (error) {
    console.error(`Ошибка при улучшении техники ${techniqueId} пользователем ${userId}:`, error);
    return null;
  }
};

/**
 * Получает доступные для изучения техники
 * @param {string} userId - ID пользователя
 * @param {number} userLevel - Уровень пользователя
 * @returns {Promise<Array>} Массив доступных техник
 */
exports.getAvailableTechniques = async function(userId, userLevel) {
  try {
    // Инициализируем реестр моделей, если он еще не инициализирован
    await modelRegistry.initializeRegistry();
    
    // Получаем модели через реестр
    const Technique = modelRegistry.getModel('Technique');
    const TechniqueEffect = modelRegistry.getModel('TechniqueEffect');
    const LearnedTechnique = modelRegistry.getModel('LearnedTechnique');
    
    // Если уровень пользователя не передан, получаем его из профиля
    let validatedUserLevel = userLevel;
    if (!validatedUserLevel) {
      const userProfile = await CharacterProfileService.getCharacterProfile(userId);
      if (userProfile) {
        validatedUserLevel = userProfile.level;
        console.log(`[getAvailableTechniques] Получен уровень пользователя из профиля: ${validatedUserLevel}`);
      } else {
        validatedUserLevel = 1; // Значение по умолчанию, если профиль не найден
        console.log(`[getAvailableTechniques] Профиль пользователя не найден, используем уровень по умолчанию: ${validatedUserLevel}`);
      }
    }
    
    // Получаем список уже изученных техник
    const learnedTechniques = await LearnedTechnique.findAll({
      where: { userId },
      attributes: ['techniqueId']
    });
    
    const learnedTechniqueIds = learnedTechniques.map(lt => lt.techniqueId);
    
    // Загружаем техники, не изученные пользователем (убрана проверка уровня)
    const availableTechniques = await Technique.findAll({
      where: {
        // Убираем проверку уровня, чтобы соответствовать SQL-реализации
        id: { [Technique.sequelize.Op.notIn]: learnedTechniqueIds }
      },
      include: [
        { model: TechniqueEffect, as: 'effects' }
      ]
    });
    
    // Преобразуем в формат snake_case для совместимости с SQL-API
    return availableTechniques.map(technique => ({
      id: technique.id,
      name: technique.name,
      description: technique.description,
      icon: technique.icon,
      level: technique.level || 0,
      damage: technique.damage,
      damage_type: technique.damageType, // snake_case
      energy_cost: technique.energyCost, // snake_case
      cooldown: technique.cooldown,
      max_level: technique.maxLevel, // snake_case
      type: technique.type,
      required_level: technique.requiredLevel, // snake_case
      healing: technique.healing,
      effects: technique.effects.map(effect => ({
        id: effect.id,
        type: effect.type,
        name: effect.name,
        duration: effect.duration,
        damage: effect.damage || 0,
        damage_type: effect.damageType, // snake_case
        healing: effect.healing || 0
      })),
      // Функция для расчета стоимости улучшения
      upgradeCost: (targetLevel) => calculateUpgradeCost(technique.level || 1, targetLevel)
    }));
  } catch (error) {
    console.error(`Ошибка при получении доступных техник для пользователя ${userId} уровня ${userLevel}:`, error);
    return [];
  }
};

// Экспортируем константы
exports.techniqueTypes = techniqueTypes;
exports.elementTypes = elementTypes;
exports.elementColors = elementColors;

// Экспортируем функцию расчета стоимости улучшения
exports.calculateUpgradeCost = calculateUpgradeCost;