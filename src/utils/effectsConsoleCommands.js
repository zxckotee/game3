/**
 * Консольные команды для работы с эффектами персонажа
 */

import { normalizeStatusEffects, mergeEffects, reindexEffects, normalizePlayerEffects } from './effectsNormalizer';
import { sectBenefitsToEffects } from './sectUtils';

/**
 * Получает текущее состояние игры из глобальной переменной или локального хранилища
 * @returns {Object} Состояние игры
 */
function getGameState() {
  try {
    // Пытаемся получить состояние из глобальной переменной, если игра запущена
    if (typeof window.__GAME_STATE__ !== 'undefined' && window.__GAME_STATE__) {
      return window.__GAME_STATE__;
    }
    
    // Иначе пытаемся загрузить из localStorage
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      return JSON.parse(savedState);
    }
    
    console.error('❌ Не удалось получить состояние игры');
    return null;
  } catch (error) {
    console.error('❌ Ошибка при получении состояния игры:', error);
    return null;
  }
}

/**
 * Сохраняет обновленное состояние игры
 * @param {Object} newState - Обновленное состояние для сохранения
 * @returns {Boolean} Успешность операции
 */
function saveGameState(newState) {
  try {
    // Обновляем глобальную переменную, если она существует
    if (typeof window.__GAME_STATE__ !== 'undefined') {
      window.__GAME_STATE__ = newState;
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('gameState', JSON.stringify(newState));
    
    console.log('✅ Состояние игры успешно сохранено');
    return true;
  } catch (error) {
    console.error('❌ Ошибка при сохранении состояния игры:', error);
    return false;
  }
}

/**
 * Отображает текущие эффекты персонажа
 */
export function printEffectsData() {
  const state = getGameState();
  if (!state || !state.player) {
    console.error('❌ Не удалось получить данные игрока');
    return;
  }
  
  console.log('🔍 Текущие эффекты персонажа:');
  
  // Получаем и отображаем текущие эффекты
  const effects = state.player.statusEffects;
  
  if (!effects) {
    console.log('❕ Эффекты отсутствуют');
    return;
  }
  
  // Проверяем формат данных
  if (Array.isArray(effects)) {
    console.log('✅ Формат: массив (корректный)');
    console.log('📊 Количество эффектов:', effects.length);
    console.table(effects);
  } else {
    console.log('⚠️ Формат: объект (устаревший формат)');
    console.log('📊 Количество эффектов:', Object.keys(effects).length);
    console.table(effects);
  }
  
  // Отображаем бонусы секты для сравнения
  if (state.player.sect && state.player.sect.benefits) {
    console.log('🏯 Бонусы секты:');
    const sectBenefits = state.player.sect.benefits;
    
    if (Array.isArray(sectBenefits)) {
      console.log('✅ Формат бонусов секты: массив (корректный)');
      console.table(sectBenefits);
    } else {
      console.log('⚠️ Формат бонусов секты: объект (устаревший формат)');
      console.table(sectBenefits);
    }
  } else {
    console.log('❕ Бонусы секты отсутствуют');
  }
}

/**
 * Русский вариант команды printEffectsData
 */
export function показатьЭффекты() {
  printEffectsData();
}

/**
 * Нормализует эффекты персонажа, преобразуя их в массив
 * и объединяя с бонусами секты
 */
export function normalizeEffectsData() {
  const state = getGameState();
  if (!state || !state.player) {
    console.error('❌ Не удалось получить данные игрока');
    return;
  }
  
  console.log('🔄 Начинаем нормализацию эффектов...');
  
  // Получаем текущие эффекты
  const currentEffects = state.player.statusEffects;
  
  // Преобразуем в массив, если это объект
  const normalizedEffects = normalizeStatusEffects(currentEffects);
  console.log('✅ Эффекты преобразованы в массив');
  console.log('📊 Количество эффектов после нормализации:', normalizedEffects.length);
  
  // Получаем бонусы секты, если они есть
  let sectBenefits = [];
  if (state.player.sect && state.player.sect.benefits) {
    sectBenefits = Array.isArray(state.player.sect.benefits) ? 
                  state.player.sect.benefits : 
                  Object.values(state.player.sect.benefits);
  }
  
  // Преобразуем бонусы секты в эффекты
  const sectEffects = sectBenefitsToEffects(sectBenefits);
  console.log('✅ Бонусы секты преобразованы в эффекты');
  console.log('📊 Количество эффектов от секты:', sectEffects.length);
  
  // Объединяем эффекты с суммированием одинаковых типов
  const mergedEffects = mergeEffects(normalizedEffects, sectEffects);
  console.log('✅ Эффекты объединены с суммированием по типам');
  console.log('📊 Количество эффектов после объединения:', mergedEffects.length);
  
  // Создаем массив с числовыми индексами
  const indexedEffects = reindexEffects(mergedEffects);
  console.log('✅ Создан массив эффектов с числовыми индексами');
  
  // Создаем обновленное состояние
  const newPlayerState = {
    ...state.player,
    statusEffects: indexedEffects
  };
  
  const newState = {
    ...state,
    player: newPlayerState
  };
  
  // Сохраняем новое состояние
  if (saveGameState(newState)) {
    console.log('🎉 Эффекты успешно нормализованы и сохранены!');
    console.table(indexedEffects);
  } else {
    console.error('❌ Не удалось сохранить нормализованные эффекты');
  }
}

/**
 * Русский вариант команды normalizeEffectsData
 */
export function нормализоватьЭффекты() {
  normalizeEffectsData();
}

/**
 * Комплексная нормализация всех эффектов и бонусов в игре
 */
export function repairAllEffects() {
  const state = getGameState();
  if (!state || !state.player) {
    console.error('❌ Не удалось получить данные игрока');
    return;
  }
  
  console.log('🔨 Запуск комплексного восстановления всех эффектов...');
  
  // Используем функцию комплексной нормализации
  const normalizedPlayer = normalizePlayerEffects(state.player, state.sect);
  
  // Создаем обновленное состояние
  const newState = {
    ...state,
    player: normalizedPlayer
  };
  
  // Сохраняем новое состояние
  if (saveGameState(newState)) {
    console.log('🎉 Все эффекты успешно восстановлены и нормализованы!');
    console.log('📊 Итоговые эффекты:');
    console.table(normalizedPlayer.statusEffects);
  } else {
    console.error('❌ Не удалось сохранить восстановленные эффекты');
  }
}

/**
 * Русский вариант команды repairAllEffects
 */
export function восстановитьЭффекты() {
  repairAllEffects();
}

/**
 * Нормализует эффекты через Redux-действие NORMALIZE_EFFECTS
 * Это предпочтительный способ нормализации эффектов, поскольку 
 * он использует существующие механизмы Redux
 */
export function dispatchNormalizeEffectsAction() {
  console.log('🔄 Отправка действия нормализации эффектов через Redux...');
  
  // Проверяем, доступен ли глобальный диспетчер
  if (typeof window.__GAME_DISPATCH__ === 'undefined') {
    console.error('❌ Глобальный диспетчер игры недоступен');
    
    // Предлагаем альтернативу
    console.log('⚠️ Попробуйте использовать метод normalizeEffectsData() вместо этого');
    return;
  }
  
  try {
    // Импортируем типы действий
    const ACTION_TYPES = window.__GAME_CONTEXT__.actions?.ACTION_TYPES || 
                         { NORMALIZE_EFFECTS: 'NORMALIZE_EFFECTS' };
    
    // Диспатчим действие нормализации
    window.__GAME_DISPATCH__({ 
      type: ACTION_TYPES.NORMALIZE_EFFECTS 
    });
    
    console.log('✅ Действие нормализации эффектов успешно отправлено');
    console.log('🔍 Проверьте обновленные эффекты с помощью printEffectsData()');
    
    // Делаем небольшую паузу и показываем обновленные эффекты
    setTimeout(() => {
      console.log('📊 Текущие эффекты после нормализации:');
      printEffectsData();
    }, 300);
    
  } catch (error) {
    console.error('❌ Ошибка при отправке действия нормализации:', error);
    console.log('⚠️ Попробуйте использовать метод normalizeEffectsData() вместо этого');
  }
}

/**
 * Русский вариант команды dispatchNormalizeEffectsAction
 */
export function нормализоватьЭффектыЧерезРедукс() {
  dispatchNormalizeEffectsAction();
}

/**
 * Добавляет все консольные команды в окружение
 */
export function initEffectsConsoleCommands() {
  if (typeof window !== 'undefined') {
    // Команды для работы с эффектами
    window.printEffectsData = printEffectsData;
    window.показатьЭффекты = показатьЭффекты;
    window.normalizeEffectsData = normalizeEffectsData;
    window.нормализоватьЭффекты = нормализоватьЭффекты;
    window.repairAllEffects = repairAllEffects;
    window.восстановитьЭффекты = восстановитьЭффекты;
    window.dispatchNormalizeEffectsAction = dispatchNormalizeEffectsAction;
    window.нормализоватьЭффектыЧерезРедукс = нормализоватьЭффектыЧерезРедукс;
    
    console.log('✅ Консольные команды для работы с эффектами инициализированы');
    console.log('🔍 Доступные команды:');
    console.log('   - printEffectsData() или показатьЭффекты() - показать текущие эффекты');
    console.log('   - normalizeEffectsData() или нормализоватьЭффекты() - нормализовать эффекты напрямую');
    console.log('   - repairAllEffects() или восстановитьЭффекты() - восстановить все эффекты');
    console.log('   - dispatchNormalizeEffectsAction() или нормализоватьЭффектыЧерезРедукс() - нормализовать эффекты через Redux (рекомендуется)');
  }
}

export default {
  printEffectsData,
  показатьЭффекты,
  normalizeEffectsData,
  нормализоватьЭффекты,
  repairAllEffects,
  восстановитьЭффекты,
  dispatchNormalizeEffectsAction,
  нормализоватьЭффектыЧерезРедукс,
  initEffectsConsoleCommands
};
