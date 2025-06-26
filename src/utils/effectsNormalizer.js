/**
 * Утилиты для нормализации эффектов
 * Содержит функции для преобразования разных форматов эффектов в единый стандарт
 */

import { standardizeEffect } from './effectsUtils';
import { sectBenefitsToEffects, createCleanEffect, cleanEffects } from './sectUtils';

/**
 * Преобразует объект эффектов в массив с числовыми индексами
 * @param {Object|Array} statusEffects - Эффекты в любом формате
 * @returns {Array} Массив эффектов с числовыми индексами
 */
export const normalizeStatusEffects = (statusEffects) => {
  // Если statusEffects уже массив, возвращаем его
  if (Array.isArray(statusEffects)) return statusEffects;
  
  // Если statusEffects null или undefined, возвращаем пустой массив
  if (!statusEffects) return [];
  
  // Если statusEffects - объект с именованными ключами, преобразуем в массив
  if (typeof statusEffects === 'object') {
    return Object.values(statusEffects);
  }
  
  // В крайнем случае возвращаем пустой массив
  return [];
};


/**
 * Объединяет несколько массивов эффектов, суммируя модификаторы для эффектов одинакового типа
 * @param {...Array} effectArrays - Массивы эффектов для объединения
 * @returns {Array} Объединенный массив эффектов с "чистыми" данными
 */
export const mergeEffects = (...effectArrays) => {
  // Предварительно очищаем все входные массивы эффектов
  const cleanedArrays = effectArrays.map(array => {
    if (!Array.isArray(array)) return [];
    return cleanEffects(array);
  });
  
  // Объединяем все массивы
  const allEffects = [].concat(...cleanedArrays);
  
  // Группируем эффекты по типу и суммируем модификаторы
  const effectModifiersByType = {};
  const effectNamesByType = {}; // Сохраняем лучшие имена для каждого типа эффекта
  
  // Для каждого эффекта выполняем стандартизацию и суммируем модификаторы
  allEffects.forEach(effect => {
    // Стандартизируем эффект
    const standardized = standardizeEffect(effect);
    const effectType = standardized.type;
    
    if (!effectModifiersByType[effectType]) {
      effectModifiersByType[effectType] = 0;
      effectNamesByType[effectType] = effect.name || '';
    }
    
    // Суммируем модификаторы
    effectModifiersByType[effectType] += standardized.modifier;
    
    // Сохраняем наиболее информативное имя (предпочитаем более длинные имена)
    if (effect.name && effect.name.length > effectNamesByType[effectType].length) {
      effectNamesByType[effectType] = effect.name;
    }
  });
  
  // Создаем "чистые" эффекты только на основе типа и суммарного модификатора
  const mergedEffects = Object.entries(effectModifiersByType).map(([type, totalModifier]) => {
    return createCleanEffect(type, totalModifier, {
      name: effectNamesByType[type] || ''
    });
  });
  
  return mergedEffects;
};

/**
 * Преобразует массив эффектов в массив с числовыми индексами (0, 1, 2, ...)
 * @param {Array} effects - Массив эффектов
 * @returns {Array} Массив эффектов с числовыми индексами
 */
export const reindexEffects = (effects) => {
  if (!Array.isArray(effects)) return [];
  
  // Преобразуем в объект с числовыми ключами
  const reindexed = {};
  effects.forEach((effect, index) => {
    reindexed[index] = effect;
  });
  
  // И обратно в массив
  return Object.values(reindexed);
};

/**
 * Комплексная нормализация всех эффектов игрока
 * @param {Object} playerState - Состояние игрока
 * @param {Object} sectState - Состояние секты
 * @returns {Object} Обновленное состояние игрока с нормализованными эффектами
 */
export const normalizePlayerEffects = (playerState, sectState) => {
  if (!playerState) return playerState;
  
  // Получаем имеющиеся статус-эффекты и очищаем их от технических полей и информации об источнике
  const rawStatusEffects = normalizeStatusEffects(playerState.statusEffects);
  const statusEffects = cleanEffects(rawStatusEffects);
  
  // Получаем бонусы секты
  let sectBenefits = [];
  if (sectState && sectState.benefits) {
    // Если benefits уже есть в состоянии секты
    sectBenefits = Array.isArray(sectState.benefits) ? 
                  sectState.benefits : 
                  Object.values(sectState.benefits);
  } else if (playerState.sect && playerState.sect.benefits) {
    // Если benefits есть внутри player.sect
    sectBenefits = Array.isArray(playerState.sect.benefits) ? 
                  playerState.sect.benefits : 
                  Object.values(playerState.sect.benefits);
  }
  
  // Преобразуем бонусы секты в эффекты
  const sectEffects = sectBenefitsToEffects(sectBenefits);
  
  // Объединяем все эффекты с суммацией и еще раз очищаем результат
  const mergedEffects = mergeEffects(statusEffects, sectEffects);
  
  // Присваиваем числовые индексы
  const indexedEffects = reindexEffects(mergedEffects);
  
  // Теперь гарантированно нет полей id и source в эффектах
  // Возвращаем обновленное состояние игрока с очищенными эффектами
  return {
    ...playerState,
    statusEffects: indexedEffects
  };
};
