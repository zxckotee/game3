import ACTION_TYPES from './actionTypes';
import { collectAllEffects } from '../../utils/effectsUtils';

/**
 * Создает действие для обновления всех статус-эффектов игрока на основе 
 * собранных из разных источников
 * @returns {Object} Действие для редьюсера
 */
export const updateAllStatusEffects = () => {
  return (dispatch, getState) => {
    try {
      const state = getState();
      
      // Собираем эффекты из всех источников
      const allEffects = collectAllEffects(state);
      
      // Очищаем эффекты от id, source и другой технической информации
      const cleanedEffects = allEffects.map(effect => ({
        type: effect.type || 'unknown',
        modifier: effect.modifier || 0,
        displayType: effect.displayType || 'neutral',
        displayValue: effect.displayValue || '0%',
        icon: effect.icon || '⚪',
        name: (effect.name || 'Неизвестный эффект').replace(/\s*\([^)]*\)\s*$/, '') // Удаляем информацию в скобках
      }));
      
      // Отправляем действие с очищенными эффектами
      dispatch({
        type: ACTION_TYPES.UPDATE_ALL_STATUS_EFFECTS,
        payload: cleanedEffects
      });
      
      return cleanedEffects;
    } catch (error) {
      console.error('❌ Ошибка при обновлении эффектов:', error);
      return [];
    }
  };
};

// Глобальная переменная для хранения идентификатора таймера дебаунсинга
let effectsUpdateTimer = null;

// Дебаунсинг для предотвращения слишком частых обновлений эффектов
const debounceEffectsUpdate = (store, delay = 300) => {
  if (effectsUpdateTimer) {
    clearTimeout(effectsUpdateTimer);
  }
  
  effectsUpdateTimer = setTimeout(() => {
    store.dispatch(updateAllStatusEffects());
    effectsUpdateTimer = null;
  }, delay);
};

/**
 * Запускает обновление статус-эффектов при изменении 
 * любого из источников эффектов (middleware)
 */
export const effectsMiddleware = store => next => action => {
  // Сначала выполняем исходное действие
  const result = next(action);
  
  // Ключевые события, требующие обновления эффектов
  const criticalActionsRequiringImmediateUpdate = [
    ACTION_TYPES.LOAD_GAME, // Загрузка игры требует немедленного обновления
    ACTION_TYPES.SET_INITIALIZED, // Инициализация игры
    ACTION_TYPES.NORMALIZE_EFFECTS // Явная нормализация эффектов
  ];
  
  // События, для которых можно использовать дебаунсинг
  const actionsRequiringDebouncedUpdate = [
    ACTION_TYPES.UPDATE_WEATHER,
    ACTION_TYPES.EQUIP_ITEM,
    ACTION_TYPES.UNEQUIP_ITEM,
    ACTION_TYPES.UPDATE_SECT_BENEFITS,
    ACTION_TYPES.SET_ACTIVE_SPIRIT_PET,
    ACTION_TYPES.UPDATE_LOCATION,
    ACTION_TYPES.UPDATE_PLAYER
  ];
  
  // События, которые НЕ должны вызывать обновления эффектов
  const actionsToIgnore = [
    ACTION_TYPES.UPDATE_ALL_STATUS_EFFECTS, // Предотвращаем зацикливание
    ACTION_TYPES.ADD_STATUS_EFFECT,
    ACTION_TYPES.UPDATE_STATUS_EFFECT,
    ACTION_TYPES.REMOVE_STATUS_EFFECT
  ];
  
  // Если это критическое действие, требующее немедленного обновления
  if (criticalActionsRequiringImmediateUpdate.includes(action.type)) {
    // Очищаем таймер дебаунсинга, если он установлен
    if (effectsUpdateTimer) {
      clearTimeout(effectsUpdateTimer);
      effectsUpdateTimer = null;
    }
    // Обновляем эффекты немедленно
    store.dispatch(updateAllStatusEffects());
  } 
  // Если действие требует дебаунсинга, используем его
  else if (actionsRequiringDebouncedUpdate.includes(action.type)) {
    debounceEffectsUpdate(store, 300);
  }
  
  return result;
};
