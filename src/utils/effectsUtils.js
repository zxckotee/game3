/**
 * Утилиты для работы с эффектами персонажа
 * Содержит функции для сбора, форматирования и обработки эффектов
 */

/**
 * Словарь русских названий для типов эффектов
 * Используется для отображения правильных названий в интерфейсе
 */
const effectTypeNames = {
  // Общие эффекты
  'resource_bonus': 'Бонус ресурсов',
  'cultivation_bonus': 'Культивация',
  'movement_speed': 'Скорость передвижения',
  'movement_penalty': 'Скорость передвижения',
  'perception': 'Восприятие',
  'combat_damage': 'Урон в бою',
  'energy_regen': 'Восстановление энергии',
  'stealth': 'Скрытность',
  'cultivation_insight': 'Шанс получить прозрение',
  'special_resources': 'Особые ресурсы',
  'special_encounters': 'Особые встречи',
  'market_discount': 'Скидка на рынке',
  'double_loot': 'Шанс двойной добычи',
  'reduced_encounter': 'Снижение шанса случайных встреч',
  'resistance_required': 'Требуется сопротивление',
  'energy_drain': 'Расход энергии',
  'max_energy': 'Максимальная энергия',
  
  // Стихийные культивации
  'fire_cultivation': 'Огненная культивация',
  'water_cultivation': 'Водная культивация',
  'earth_cultivation': 'Земляная культивация',
  'wind_cultivation': 'Культивация ветра',
  'lightning_cultivation': 'Культивация молнии',
  'dark_cultivation': 'Тёмная культивация',
  'light_cultivation': 'Светлая культивация',
  
  // Бонусы сбора ресурсов
  'gathering_speed': 'Скорость сбора',
  'mineral_bonus': 'Бонус минералов',
  'herbs': 'Сбор трав',
  'ores': 'Сбор руд',
  'crystals': 'Сбор кристаллов',
  'food': 'Сбор пищи',
  
  // Погодные эффекты грозы
  'combat_damage (thunderstorm)': 'Урон в бою (гроза)',
  'gathering_speed (thunderstorm)': 'Скорость сбора (гроза)',
  'lightning_cultivation (thunderstorm)': 'Культивация молнии (гроза)',
  'movement_speed (thunderstorm)': 'Скорость передвижения (гроза)',
  'perception (thunderstorm)': 'Восприятие (гроза)',
  'resource_bonus (thunderstorm)': 'Бонус ресурсов (гроза)'
};

/**
 * Создает "чистый" эффект грозы с особым типом
 * @param {string} type - Базовый тип эффекта
 * @param {number} modifier - Значение модификатора
 * @returns {Object} Эффект грозы
 */
const createThunderstormEffect = (type, modifier) => {
  // Создаем базовый чистый эффект
  const effect = {
    id: `${type}_thunderstorm`,
    type: `${type}_thunderstorm`, // Добавляем суффикс для особой обработки
    modifier: modifier,
    icon: '⚡', // Специальная иконка для эффектов грозы
    displayValue: `${modifier > 0 ? '+' : ''}${modifier}%`,
  };
  
  // Определяем тип отображения
  if (modifier > 0) {
    effect.displayType = 'positive';
  } else if (modifier < 0) {
    effect.displayType = 'negative';
  } else {
    effect.displayType = 'neutral';
  }
  
  // Задаем название с указанием, что это эффект грозы
  if (effectTypeNames[`${type} (thunderstorm)`]) {
    effect.name = effectTypeNames[`${type} (thunderstorm)`];
  } else {
    effect.name = `${type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} (гроза)`;
  }
  
  return effect;
};

/**
 * Собирает все активные эффекты персонажа из разных источников
 * @param {Object} state - Текущее состояние игры
 * @returns {Array} Массив всех активных эффектов
 */
export const collectAllEffects = (state) => {
  // Массивы для хранения обычных эффектов и эффектов грозы отдельно
  const standardEffects = [];
  const thunderstormEffects = [];
  
  // 1. Добавляем эффекты статуса игрока (если есть)
  if (Array.isArray(state.player.statusEffects)) {
    standardEffects.push(...state.player.statusEffects);
  }
  
  // 2. Добавляем эффекты от секты (если игрок состоит в секте)
  if (state.player.sect && Array.isArray(state.player.sect.benefits)) {
    standardEffects.push(...state.player.sect.benefits);
  }
  
  // 3. Добавляем эффекты от экипировки
  if (state.player.inventory && state.player.inventory.equipment) {
    const equipment = state.player.inventory.equipment;
    
    // Перебираем все слоты экипировки
    Object.values(equipment).forEach(item => {
      if (item && Array.isArray(item.effects)) {
        standardEffects.push(...item.effects);
      }
    });
  }
  
  // 4. Добавляем эффекты от активного духовного питомца
  if (state.player.spiritPets && 
      state.player.spiritPets.activePetId && 
      state.player.spiritPets.pets) {
    
    const activePet = state.player.spiritPets.pets.find(
      pet => pet.id === state.player.spiritPets.activePetId
    );
    
    if (activePet && Array.isArray(activePet.effects)) {
      standardEffects.push(...activePet.effects);
    }
  }
  
  // 5. Добавляем эффекты от погоды и окружения
  if (state.world && state.world.weather) {
    // Проверка разных путей к эффектам погоды
    const weatherEffectsArray = Array.isArray(state.world.weather.effects) ? state.world.weather.effects :
                            Array.isArray(state.world.weather.weatherEffects) ? state.world.weather.weatherEffects : [];
    
    //console.log('🌤️ collectAllEffects: Найдены эффекты погоды:', weatherEffectsArray);
    
    if (weatherEffectsArray.length > 0) {
      if (state.world.weather.currentWeather === 'thunderstorm') {
        // Для грозы создаем специальные эффекты с отдельным типом
        weatherEffectsArray.forEach(effect => {
          thunderstormEffects.push(
            createThunderstormEffect(effect.type, effect.modifier || effect.value || 0)
          );
        });
      } else {
        // Обычные погодные эффекты
        standardEffects.push(...weatherEffectsArray);
      }
    }
  }
  
  // 6. Добавляем эффекты от локации
  if (state.world && state.world.currentLocation && Array.isArray(state.world.currentLocation.effects)) {
    standardEffects.push(...state.world.currentLocation.effects);
  }
  
  // 7. Временные боевые эффекты (если в бою)
  if (state.gameState && 
      state.gameState.combat && 
      state.gameState.combat.active && 
      Array.isArray(state.gameState.combat.temporaryEffects)) {
    
    standardEffects.push(...state.gameState.combat.temporaryEffects);
  }
  
  // Фильтруем недействительные эффекты
  const validStandardEffects = standardEffects.filter(effect => effect !== null && effect !== undefined);
  
  // Импортируем функцию mergeEffects из effectsNormalizer.js
  const { mergeEffects } = require('./effectsNormalizer');
  
  // Нормализуем и объединяем стандартные эффекты
  const mergedStandardEffects = mergeEffects(validStandardEffects);
  
  // Объединяем оба массива эффектов (стандартные и грозы)
  return [...mergedStandardEffects, ...thunderstormEffects];
};

/**
 * Стандартизирует формат эффекта для обеспечения совместимости,
 * очищая его от лишней информации
 * @param {Object} effect - Эффект для стандартизации
 * @returns {Object} Стандартизированный эффект
 */
export const standardizeEffect = (effect) => {
  // Создаем новый объект (не меняем оригинальный)
  const standardized = {};
  
  // Устанавливаем тип (самое важное поле)
  standardized.type = effect.type || 'unknown';
  
  // Преобразование модификатора - основная функциональная часть эффекта
  if (typeof effect.modifier === 'number') {
    standardized.modifier = effect.modifier;
  } else if (typeof effect.value === 'string') {
    // Если модификатор указан в виде строки (например, "+5%")
    const match = effect.value.match(/([+-]?\d+(?:\.\d+)?)%?/);
    if (match) {
      const value = parseFloat(match[1]);
      standardized.modifier = match[0].includes('%') ? value / 100 : value;
    } else {
      standardized.modifier = 0;
    }
  } else if (typeof effect.value === 'number') {
    standardized.modifier = effect.value;
  } else {
    standardized.modifier = 0;
  }
  
  // Получаем тип эффекта для дальнейшей русификации (без учета источника)
  let effectKey = standardized.type;
  
  // Находим русское название без привязки к источнику
  if (effectTypeNames[effectKey]) {
    standardized.name = effectTypeNames[effectKey];
  } else {
    // Если нет русификации, создаем понятное имя из типа
    standardized.name = standardized.type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Определение типа отображения только на основе модификатора
  if (standardized.modifier > 0) {
    standardized.displayType = 'positive';
  } else if (standardized.modifier < 0) {
    standardized.displayType = 'negative';
  } else {
    standardized.displayType = 'neutral';
  }
  
  // Форматирование значения для отображения
  const absModifier = Math.abs(standardized.modifier);
  let formattedValue;
  
  if (absModifier < 1 && absModifier > 0) {
    // Дробное число (меньше 1) - умножаем на 100 для процентов
    formattedValue = `${standardized.modifier > 0 ? '+' : '-'}${(absModifier * 100).toFixed(0)}%`;
  } else {
    // Целое или большое дробное число
    formattedValue = `${standardized.modifier > 0 ? '+' : '-'}${absModifier}%`;
  }
  
  standardized.displayValue = formattedValue;
  
  // Установка стандартного значка на основе типа
  standardized.icon = standardized.displayType === 'positive' 
    ? '✨' 
    : standardized.displayType === 'negative' 
      ? '🔻' 
      : '⚪';
  
  // Используем тип в качестве ID для группировки одинаковых эффектов
  standardized.id = standardized.type;
  
  return standardized;
};

/**
 * Применяет эффекты к базовым характеристикам
 * @param {Object} baseStats - Базовые характеристики
 * @param {Array} effects - Массив эффектов для применения
 * @returns {Object} Характеристики с примененными эффектами
 */
export const applyEffectsToStats = (baseStats, effects) => {
  if (!Array.isArray(effects) || effects.length === 0) {
    return baseStats;
  }
  
  const result = { ...baseStats };
  
  // Группируем эффекты по типу статистики, к которой они применяются
  const effectsByType = {};
  
  effects.forEach(effect => {
    if (!effect.type) return;
    
    if (!effectsByType[effect.type]) {
      effectsByType[effect.type] = [];
    }
    effectsByType[effect.type].push(effect);
  });
  
  // Применяем эффекты к соответствующим характеристикам
  const statMapping = {
    'strength_bonus': 'strength',
    'agility_bonus': 'agility',
    'constitution_bonus': 'constitution',
    'intelligence_bonus': 'intelligence',
    'perception_bonus': 'perception',
    'willpower_bonus': 'willpower',
    'cultivation_bonus': 'cultivationSpeed',
    'resource_bonus': 'resourceGatheringSpeed',
    'stealth_bonus': 'stealth',
    'perception_bonus': 'perception',
    'cultivation_regen': 'energyRegen',
    'movement_bonus': 'movementSpeed',
    'equipment_discount': 'equipmentDiscount'
  };
  
  // Применяем эффекты с процентными модификаторами
  Object.entries(effectsByType).forEach(([type, typeEffects]) => {
    const statName = statMapping[type];
    
    if (statName && result[statName] !== undefined) {
      // Получаем базовое значение характеристики
      const baseValue = result[statName];
      
      // Применяем процентные модификаторы
      const percentModifier = typeEffects.reduce((total, effect) => {
        if (typeof effect.modifier === 'number') {
          return total + effect.modifier;
        }
        return total;
      }, 0);
      
      // Применяем абсолютные модификаторы (если есть)
      const absoluteModifier = typeEffects.reduce((total, effect) => {
        if (effect.absoluteValue && typeof effect.absoluteValue === 'number') {
          return total + effect.absoluteValue;
        }
        return total;
      }, 0);
      
      // Вычисляем новое значение с учетом процентного и абсолютного модификаторов
      result[statName] = baseValue * (1 + percentModifier) + absoluteModifier;
    }
  });
  
  return result;
};
