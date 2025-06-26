/**
 * Утилиты для работы с сектами и их бонусами
 * Централизует логику взаимодействия с секционными бонусами
 */

import { standardizeEffect } from './effectsUtils';

/**
 * Создает чистый эффект без информации о источнике
 * @param {string} type - Тип эффекта
 * @param {number} modifier - Значение модификатора
 * @param {Object} [options] - Дополнительные опции для эффекта
 * @returns {Object} Чистый эффект без полей id и source
 */
export const createCleanEffect = (type, modifier, options = {}) => {
  let displayType = 'neutral';
  let icon = '⚪';
  
  if (modifier > 0) {
    displayType = 'positive';
    icon = '🔼';
  } else if (modifier < 0) {
    displayType = 'negative';
    icon = '🔽';
  }
  
  // Получаем чистое название из типа, заменяя подчеркивания на пробелы и с заглавной буквы
  let cleanName = type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Если есть имя в опциях, используем его, но удаляем информацию о источнике
  if (options.name) {
    // Удаляем информацию о источнике в скобках, например: "Название (Источник)"
    cleanName = options.name.replace(/\s*\([^)]*\)\s*$/, '');
  }
  
  // Объект эффекта без полей id и source
  return {
    type: type,
    modifier: modifier,
    displayType: displayType,
    displayValue: `${modifier > 0 ? '+' : ''}${modifier}%`,
    icon: icon,
    name: cleanName
  };
};

/**
 * Преобразует бонусы секты в формат эффектов
 * @param {Array} sectBenefits - Бонусы секты в формате массива {type, modifier}
 * @returns {Array} Эффекты в стандартном формате без привязки к источнику
 */
export const sectBenefitsToEffects = (sectBenefits) => {
  if (!sectBenefits || !Array.isArray(sectBenefits)) return [];
  
  return sectBenefits.map(benefit => {
    let effectType;
    
    // Сопоставляем типы бонусов секты с типами эффектов
    switch (benefit.type) {
      case 'cultivation_speed':
        effectType = 'cultivation_bonus';
        break;
      case 'resource_gathering':
        effectType = 'resource_bonus';
        break;
      case 'energy_regen':
        effectType = 'energy_regen';
        break;
      case 'technique_discount':
        effectType = 'technique_discount';
        break;
      case 'max_energy':
        effectType = 'max_energy';
        break;
      default:
        effectType = benefit.type;
    }
    
    // Передаем оригинальное имя, если оно есть, для очистки от информации об источнике
    const options = {
      name: benefit.name || ''
    };
    
    // Используем createCleanEffect для создания чистого эффекта
    return createCleanEffect(effectType, benefit.modifier, options);
  });
};

/**
 * Очищает эффекты от ID, источника и другой технической информации
 * @param {Array|Object} effects - Массив или объект эффектов для очистки
 * @returns {Array} Очищенные эффекты
 */
export const cleanEffects = (effects) => {
  if (!effects) return [];
  
  // Преобразуем в массив, если передан объект
  const effectsArray = Array.isArray(effects) ? effects : Object.values(effects);
  
  return effectsArray.map(effect => {
    // Если это не объект, создаем базовый эффект
    if (typeof effect !== 'object' || effect === null) {
      return createCleanEffect('unknown', 0);
    }
    
    // Создаем чистый эффект из существующего
    return createCleanEffect(
      effect.type || 'unknown',
      effect.modifier || 0,
      {
        name: effect.name || ''
      }
    );
  });
};

/**
 * Нормализует бонусы секты из разных возможных форматов в стандартный массив бонусов
 * @param {Object|Array} rawBenefits - Необработанные бонусы секты в любом формате
 * @returns {Array} Массив нормализованных бонусов секты в виде {type, modifier}
 */
export const normalizeSectBenefits = (rawBenefits) => {
  // Если бонусы уже в формате массива
  if (Array.isArray(rawBenefits)) {
    return rawBenefits.map(benefit => ({
      type: benefit.type,
      modifier: typeof benefit.modifier === 'number' ? benefit.modifier : 0
    }));
  }
  
  // Если бонусы не определены, возвращаем пустой массив
  if (!rawBenefits) {
    return [];
  }
  
  // Если бонусы в формате объекта с полями
  if (typeof rawBenefits === 'object') {
    return [
      { type: 'cultivation_speed', modifier: Math.round((rawBenefits.cultivationSpeedBonus || 0) * 100) },
      { type: 'resource_gathering', modifier: Math.round((rawBenefits.resourceGatheringBonus || 0) * 100) },
      { type: 'energy_regen', modifier: rawBenefits.energyRegenBonus || 0 },
      { type: 'technique_discount', modifier: Math.round((rawBenefits.techniqueDiscountPercent || 0) * 100) },
      { type: 'max_energy', modifier: rawBenefits.maxEnergyBonus || 0 }
    ];
  }
  
  // В крайнем случае возвращаем пустой массив
  return [];
};

/**
 * Собирает все бонусы секты из разных источников в состоянии игры
 * @param {Object} sectState - Состояние секты из Redux
 * @param {Object} sectData - Данные о секте (если они отличаются от sectState)
 * @returns {Array} Объединенный массив нормализованных бонусов
 */
export const collectAllSectBenefits = (sectState, sectData = null) => {
  const benefits = [];
  
  // 1. Если есть бонусы в состоянии секты
  if (sectState && sectState.benefits) {
    benefits.push(...normalizeSectBenefits(sectState.benefits));
  }
  
  // 2. Если есть дополнительные данные секты и в них есть бонусы
  if (sectData && sectData.benefits && sectData !== sectState) {
    benefits.push(...normalizeSectBenefits(sectData.benefits));
  }
  
  // Удаляем дубликаты бонусов одного типа, сохраняя бонус с наибольшим модификатором
  const uniqueBenefits = {};
  
  benefits.forEach(benefit => {
    const type = benefit.type;
    
    if (!uniqueBenefits[type] || Math.abs(benefit.modifier) > Math.abs(uniqueBenefits[type].modifier)) {
      uniqueBenefits[type] = benefit;
    }
  });
  
  return Object.values(uniqueBenefits);
};

/**
 * Получает значение бонуса секты по типу
 * @param {Array} benefits - Массив бонусов секты
 * @param {string} type - Тип бонуса для поиска
 * @param {number} defaultValue - Значение по умолчанию, если бонус не найден
 * @returns {number} Значение модификатора бонуса
 */
export const getBenefitValueByType = (benefits, type, defaultValue = 0) => {
  if (!Array.isArray(benefits) || benefits.length === 0) {
    return defaultValue;
  }
  
  const benefit = benefits.find(b => b.type === type);
  return benefit ? benefit.modifier : defaultValue;
};

/**
 * Преобразует бонусы секты в формат эффектов и возвращает их в виде объекта 
 * для более удобного доступа по ключу
 * @param {Array} benefits - Массив бонусов секты
 * @returns {Object} Объект, где ключи - типы бонусов, а значения - эффекты
 */
export const getSectEffectsObject = (benefits) => {
  const effects = sectBenefitsToEffects(benefits);
  
  // Преобразуем массив эффектов в объект для удобного доступа по типу
  const effectsObject = {};
  effects.forEach(effect => {
    effectsObject[effect.type] = effect;
  });
  
  return effectsObject;
};

/**
 * Создает полный объект данных о секте с нормализованными бонусами
 * @param {Object} sectState - Состояние секты
 * @param {Object} sectData - Дополнительные данные секты (если есть)
 * @returns {Object} Объект с данными секты и нормализованными бонусами
 */
export const createNormalizedSectData = (sectState, sectData = null) => {
  const benefitsArray = collectAllSectBenefits(sectState, sectData);
  const normalizedEffects = sectBenefitsToEffects(benefitsArray);
  
  // Определяем основной источник данных о секте
  const baseData = sectData || sectState?.sect || {};
  
  return {
    ...baseData,
    normalizedBenefits: benefitsArray,
    effectsArray: normalizedEffects,
    // Добавляем удобную функцию для получения значения бонуса по типу
    getBenefitValue: (type, defaultValue = 0) => getBenefitValueByType(benefitsArray, type, defaultValue)
  };
};

/**
 * Проверяет и нормализует данные секты
 * @param {Object} gameState - Общее состояние игры из Redux
 * @returns {Object} Исходное состояние, если проблем не обнаружено, или нормализованное состояние, если были проблемы
 */
export const checkAndNormalizeSectData = (gameState) => {
  // Получаем данные о секте из состояния игры
  const sectState = gameState?.sect || {};
  
  // Проверяем наличие данных о секте
  if (!sectState.sect) {
    console.log('❓ Данные о секте отсутствуют или некорректны, пропускаем проверку');
    return gameState;
  }
  
  // Флаг, указывающий, были ли обнаружены проблемы
  let hasProblems = false;
  
  // Клонируем объект состояния секты для безопасной модификации
  const normalizedSectState = { ...sectState };
  
  // 1. Проверяем формат бонусов
  if (sectState.benefits) {
    if (!Array.isArray(sectState.benefits)) {
      console.log('⚠️ Бонусы секты не в формате массива, нормализуем');
      normalizedSectState.benefits = normalizeSectBenefits(sectState.benefits);
      hasProblems = true;
    } else if (sectState.benefits.some(b => typeof b !== 'object' || typeof b.type !== 'string' || typeof b.modifier !== 'number')) {
      console.log('⚠️ Некоторые бонусы секты имеют некорректный формат, нормализуем');
      normalizedSectState.benefits = normalizeSectBenefits(sectState.benefits);
      hasProblems = true;
    }
  }
  
  // 2. Проверяем формат данных секты
  if (normalizedSectState.sect) {
    const sect = { ...normalizedSectState.sect };
    
    // Проверяем формат бонусов внутри секты
    if (sect.benefits) {
      if (!Array.isArray(sect.benefits)) {
        console.log('⚠️ Бонусы внутри секты не в формате массива, нормализуем');
        sect.benefits = normalizeSectBenefits(sect.benefits);
        hasProblems = true;
      } else if (sect.benefits.some(b => typeof b !== 'object' || typeof b.type !== 'string' || typeof b.modifier !== 'number')) {
        console.log('⚠️ Некоторые бонусы внутри секты имеют некорректный формат, нормализуем');
        sect.benefits = normalizeSectBenefits(sect.benefits);
        hasProblems = true;
      }
    }
    
    // Проверяем наличие необходимых полей в объекте секты
    if (!sect.id || !sect.name) {
      console.log('⚠️ В объекте секты отсутствуют обязательные поля (id или name)');
      // Не можем исправить отсутствующие id/name, но отмечаем проблему
      hasProblems = true;
    }
    
    // Обновляем объект секты в нормализованном состоянии
    normalizedSectState.sect = sect;
  }
  
  // Если проблем не обнаружено, возвращаем исходное состояние
  if (!hasProblems) {
    return gameState;
  }
  
  // Если обнаружены проблемы, создаем новое состояние с нормализованными данными секты
  console.log('🔧 Обнаружены проблемы в данных секты, возвращаем нормализованное состояние');
  return {
    ...gameState,
    sect: normalizedSectState
  };
};

/**
 * Функция для нормализации формата данных секты
 * @param {Object} state - Состояние секты из Redux
 * @returns {Object} Нормализованное состояние секты
 */
export const normalizeSectData = (state) => {
  // Если состояние пустое или нет секты, возвращаем исходное состояние
  if (!state || !state.sect) return state;
  
  // Нормализуем бонусы
  const benefits = normalizeSectBenefits(state.benefits || []);
  
  // Нормализуем бонусы в секте
  let sect = { ...state.sect };
  if (sect.benefits) {
    sect.benefits = normalizeSectBenefits(sect.benefits);
  }
  
  // Создаем эффекты из бонусов
  const effectsArray = sectBenefitsToEffects(benefits);
  
  // Формируем новое состояние
  return {
    ...state,
    benefits: benefits,
    sect: sect,
    // Добавляем дополнительные данные для удобного доступа
    effectsArray: effectsArray,
    // Функция для получения значения бонуса по типу
    getBenefitValue: (type, defaultValue = 0) => getBenefitValueByType(benefits, type, defaultValue)
  };
};
