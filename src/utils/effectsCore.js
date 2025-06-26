/**
 * Базовые утилиты для работы с эффектами
 * ВАЖНО: Этот файл содержит только основные утилиты без зависимостей для избежания кольцевых импортов
 */

/**
 * Глубокое сравнение двух объектов
 * @param {*} obj1 - Первый объект для сравнения
 * @param {*} obj2 - Второй объект для сравнения
 * @returns {boolean} - true если объекты идентичны, false в противном случае
 */
export function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || obj1 === null || 
      typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Нормализует и очищает объект эффектов
 * @param {Object} effects - Объект эффектов для нормализации
 * @returns {Object} - Нормализованный объект эффектов
 */
export function normalizeEffects(effects) {
  if (!effects || typeof effects !== 'object') return {};
  
  const result = {};
  
  // Если это массив, преобразуем его в объект
  if (Array.isArray(effects)) {
    effects.forEach(effect => {
      if (!effect || !effect.type) return;
      
      const type = effect.type;
      const value = effect.value || effect.modifier || 0;
      
      if (!result[type]) {
        result[type] = {
          type,
          modifier: value,
          source: effect.source || 'unknown'
        };
      } else {
        result[type].modifier += value;
      }
    });
    return result;
  }
  
  // Если это уже объект, просто копируем его, удаляя нулевые эффекты
  for (const [key, effect] of Object.entries(effects)) {
    if (!effect || effect.modifier === 0) continue;
    result[key] = { ...effect };
  }
  
  return result;
}

/**
 * Преобразует объект эффектов в массив для обратной совместимости
 * @param {Object} effectsObject - Объект эффектов, где ключи - типы эффектов
 * @returns {Array} - Массив эффектов с добавленными информационными полями
 */
export function effectsObjectToArray(effectsObject) {
  if (!effectsObject || typeof effectsObject !== 'object') {
    return [];
  }
  
  // Если это уже массив, просто возвращаем его
  if (Array.isArray(effectsObject)) {
    return effectsObject;
  }
  
  const result = [];
  
  // Преобразуем объект в массив с добавлением type как имени свойства
  for (const [type, effect] of Object.entries(effectsObject)) {
    // Пропускаем служебные поля и null/undefined значения
    if (type.startsWith('_') || effect === null || effect === undefined) {
      continue;
    }
    
    // Базовый эффект с обязательными полями
    const baseEffect = {
      id: effect.id || `${type}_${Date.now()}`,
      type: type,
      name: effect.name || getEffectDisplayName(type),
      modifier: effect.value || effect.modifier || 0,
      source: effect.source || 'unknown',
      icon: effect.icon || getDefaultEffectIcon(type),
      // Добавляем отформатированное значение для отображения (например, "+10%")
      displayValue: effect.displayValue || formatModifier(effect.value || effect.modifier || 0),
      // Тип отображения (положительный/отрицательный/нейтральный)
      displayType: getDisplayType(effect.value || effect.modifier || 0, type)
    };
    
    // Добавляем остальные свойства если они есть
    const finalEffect = { ...effect, ...baseEffect };
    
    result.push(finalEffect);
  }
  
  return result;
}

/**
 * Форматирует модификатор для отображения
 * @param {Number} value - Числовое значение модификатора
 * @param {String} format - Формат (percent, flat или auto)
 * @returns {String} - Отформатированная строка (например, "+10%")
 */
export function formatModifier(value, format = 'percent') {
  if (value === undefined || value === null) return '';
  
  // Определяем знак
  const sign = value > 0 ? '+' : '';
  
  // Форматируем в зависимости от типа
  if (format === 'percent' || format === 'auto') {
    return `${sign}${value}%`;
  } else if (format === 'flat') {
    return `${sign}${value}`;
  }
  
  return `${sign}${value}`;
}

/**
 * Определяет тип отображения эффекта (положительный/отрицательный/нейтральный)
 * @param {Number} value - Числовое значение модификатора
 * @param {String} type - Тип эффекта
 * @returns {String} - Тип отображения (positive, negative, neutral)
 */
function getDisplayType(value, type) {
  // Некоторые эффекты могут иметь инвертированную логику
  const inverted = [
    'cooldown_reduction',
    'movement_penalty',
    'energy_drain',
    'reduced_encounter'
  ].includes(type);
  
  if (value === 0) return 'neutral';
  
  // Для обычных эффектов: положительные значения = положительный эффект
  // Для инвертированных: отрицательные значения = положительный эффект
  if (inverted) {
    return value < 0 ? 'positive' : 'negative';
  } else {
    return value > 0 ? 'positive' : 'negative';
  }
}

/**
 * Возвращает отображаемое название для типа эффекта
 * @param {String} type - Тип эффекта
 * @returns {String} - Отображаемое название
 */
function getEffectDisplayName(type) {
  const effectNames = {
    // Базовые эффекты
    'combat_damage': 'Урон в бою',
    'stealth': 'Скрытность',
    'resource_bonus': 'Бонус ресурсов',
    
    // Культивационные эффекты
    'cultivation_speed': 'Скорость культивации',
    'fire_cultivation': 'Огненная культивация',
    'water_cultivation': 'Водная культивация',
    'earth_cultivation': 'Земляная культивация',
    'air_cultivation': 'Воздушная культивация',
    'wood_cultivation': 'Древесная культивация',
    'metal_cultivation': 'Металлическая культивация',
    'dark_cultivation': 'Тёмная культивация',
    'light_cultivation': 'Светлая культивация',
    
    // Статы
    'strength': 'Сила',
    'agility': 'Ловкость',
    'endurance': 'Выносливость',
    'intelligence': 'Интеллект',
    'wisdom': 'Мудрость',
    'perception': 'Восприятие',
    
    // Энергетические эффекты
    'energy_regen': 'Восстановление энергии',
    'max_energy': 'Максимальная энергия',
    'energy_drain': 'Расход энергии',
    
    // Боевые эффекты
    'attack_speed': 'Скорость атаки',
    'critical_chance': 'Шанс крита',
    'critical_damage': 'Урон крита',
    'dodge_chance': 'Шанс уклонения',
    'block_chance': 'Шанс блока',
    
    // Движение
    'movement_speed': 'Скорость передвижения',
    'movement_penalty': 'Штраф к передвижению',
    
    // Ресурсы
    'gathering_speed': 'Скорость сбора',
    'herb_quality': 'Качество трав',
    'mineral_bonus': 'Бонус минералов',
    
    // Социальные
    'market_discount': 'Скидка на рынке',
    'sect_bonus': 'Бонус секты',
    
    // Прочие
    'cooldown_reduction': 'Снижение перезарядки',
    'reduced_encounter': 'Снижение случайных встреч',
    'cultivation_insight': 'Шанс озарения',
    'double_loot': 'Шанс двойной добычи'
  };
  
  return effectNames[type] || type;
}

/**
 * Возвращает иконку по умолчанию для типа эффекта
 * @param {String} type - Тип эффекта
 * @returns {String} - Эмодзи иконка
 */
function getDefaultEffectIcon(type) {
  const effectIcons = {
    // Базовые эффекты
    'combat_damage': '⚔️',
    'stealth': '👁️',
    'resource_bonus': '📦',
    
    // Культивационные эффекты
    'cultivation_speed': '⏱️',
    'fire_cultivation': '🔥',
    'water_cultivation': '💧',
    'earth_cultivation': '🌍',
    'air_cultivation': '🌪️',
    'wood_cultivation': '🌲',
    'metal_cultivation': '⚒️',
    'dark_cultivation': '🌑',
    'light_cultivation': '☀️',
    
    // Статы
    'strength': '💪',
    'agility': '🏃',
    'endurance': '🛡️',
    'intelligence': '🧠',
    'wisdom': '📚',
    'perception': '👁️',
    
    // Энергетические эффекты
    'energy_regen': '⚡',
    'max_energy': '🔋',
    'energy_drain': '⚠️',
    
    // Боевые эффекты
    'attack_speed': '⚡',
    'critical_chance': '🎯',
    'critical_damage': '💥',
    'dodge_chance': '💨',
    'block_chance': '🛡️',
    
    // Движение
    'movement_speed': '👣',
    'movement_penalty': '⚓',
    
    // Ресурсы
    'gathering_speed': '⛏️',
    'herb_quality': '🌿',
    'mineral_bonus': '💎',
    
    // Социальные
    'market_discount': '💰',
    'sect_bonus': '🏯',
    
    // Прочие
    'cooldown_reduction': '⏱️',
    'reduced_encounter': '🚶',
    'cultivation_insight': '💡',
    'double_loot': '🎁'
  };
  
  return effectIcons[type] || '✨';
}

/**
 * Объединяет эффекты одного типа, суммируя модификаторы
 * @param {Array} effects - Массив эффектов
 * @returns {Object} - Объект с объединенными эффектами, где ключи - типы эффектов
 */
export function mergeEffectsByType(effects) {
  if (!effects || !Array.isArray(effects) || effects.length === 0) {
    return {};
  }
  
  const mergedEffects = {};
  
  // Группируем эффекты по типу и суммируем модификаторы
  for (const effect of effects) {
    if (!effect.type) continue;
    
    const type = effect.type;
    const modifier = effect.modifier || effect.value || 0;
    
    // Если такой тип уже есть, обновляем значение
    if (mergedEffects[type]) {
      mergedEffects[type].modifier += modifier;
      mergedEffects[type].sources.push(effect.source || 'unknown');
    } else {
      // Создаем новый объединенный эффект
      mergedEffects[type] = {
        type: type,
        modifier: modifier,
        name: effect.name || getEffectDisplayName(type),
        sources: [effect.source || 'unknown'],
        icon: effect.icon || getDefaultEffectIcon(type)
      };
    }
  }
  
  // Обновляем displayValue и displayType в соответствии с новыми значениями
  for (const type in mergedEffects) {
    const effect = mergedEffects[type];
    effect.displayValue = formatModifier(effect.modifier);
    effect.displayType = getDisplayType(effect.modifier, type);
  }
  
  return mergedEffects;
}

/**
 * Вспомогательная функция для отладки эффектов, выводит дамп состояния эффектов
 * @param {Object} state - состояние игры
 * @returns {Object} - объект с информацией о всех источниках эффектов
 */
export function dumpEffectsState(state) {
  if (!state) {
    console.error('dumpEffectsState: State is undefined');
    return { error: 'State is undefined' };
  }
  
  const result = {
    playerEffects: state.player?.statusEffects || {},
    weatherEffects: state.world?.weather?.weatherEffects || [],
    locationEffects: state.world?.currentLocation?.effects || [],
    sectEffects: state.player?.sect?.benefits || {},
    spiritPetEffects: (() => {
      if (!state.player?.spiritPets?.activePetId || !state.player?.spiritPets?.pets) {
        return [];
      }
      const activePet = state.player.spiritPets.pets.find(
        pet => pet.id === state.player.spiritPets.activePetId
      );
      return activePet?.effects || [];
    })(),
    effectsCount: {
      player: Object.keys(state.player?.statusEffects || {}).length,
      weather: (state.world?.weather?.weatherEffects || []).length,
      location: (state.world?.currentLocation?.effects || []).length,
      spiritPet: (() => {
        if (!state.player?.spiritPets?.activePetId || !state.player?.spiritPets?.pets) {
          return 0;
        }
        const activePet = state.player.spiritPets.pets.find(
          pet => pet.id === state.player.spiritPets.activePetId
        );
        return (activePet?.effects || []).length;
      })()
    }
  };
  
  console.table(result.effectsCount);
  return result;
}
