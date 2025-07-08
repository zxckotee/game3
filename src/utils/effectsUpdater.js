/**
 * Effects Updater
 * Handles time-based updates for the effects system
 */

import ACTION_TYPES from '../context/actions/actionTypes';
import { syncStatusEffects } from './effectsUtils';

/**
 * Handles time-based effects update
 * Called when the game time changes
 * 
 * @param {Object} state - Current Redux state
 * @param {Function} dispatch - Redux dispatch function
 */
export const handleTimeBasedEffectsUpdate = (state, dispatch) => {
  // Log debug information
  if (process.env.NODE_ENV === 'development') {
    console.log('[Effects System] Recalculating effects due to time change');
  }
  
  // Проверяем, что dispatch - это функция
  if (dispatch && typeof dispatch === 'function') {
    try {
      // Synchronize and update effects
      syncStatusEffects(state, dispatch);
    } catch (error) {
      console.error('[Effects System] Ошибка при обновлении эффектов:', error);
      // В случае ошибки, пытаемся запустить синхронизацию без dispatch
      syncStatusEffects(state, null);
    }
  } else {
    console.warn('[Effects System] dispatch не является функцией, используем резервный вариант');
    // Если dispatch не передан или не является функцией, используем null
    syncStatusEffects(state, null);
  }
};

/**
 * Reducer function for the RECALCULATE_PLAYER_EFFECTS action
 * Can be used directly in playerReducer
 * 
 * @param {Object} state - The current player state
 * @param {Object} action - The Redux action
 * @returns {Object} - Updated state
 */
export const recalculatePlayerEffectsReducer = (state, action) => {
  // Get the full game state from context or pass it in the action
  const fullState = action.payload?.fullState || { player: state };
  
  // Synchronize effects without dispatching (we're in a reducer)
  const effectsResult = syncStatusEffects(fullState, null);
  
  // Return updated state with new status effects
  return {
    ...state,
    statusEffects: effectsResult
  };
};

/**
 * Middleware to listen for time updates and recalculate effects
 * 
 * @param {Object} store - Redux store
 * @returns {Function} - Middleware function
 */
export const effectsUpdaterMiddleware = store => next => action => {
  // First, pass the action to the next middleware
  const result = next(action);
  
  // After state is updated, check if we need to recalculate effects
  if (action.type === ACTION_TYPES.UPDATE_TIME) {
    const state = store.getState();
    handleTimeBasedEffectsUpdate(state, store.dispatch);
  }
  
  
  // Also recalculate effects when equipment changes
  if (
    action.type === ACTION_TYPES.EQUIP_ITEM ||
    action.type === ACTION_TYPES.UNEQUIP_ITEM ||
    action.type === ACTION_TYPES.APPLY_EQUIPMENT_BONUSES
  ) {
    const state = store.getState();
    handleTimeBasedEffectsUpdate(state, store.dispatch);
  }
  
  // Also recalculate effects when location changes
  if (action.type === ACTION_TYPES.UPDATE_LOCATION) {
    const state = store.getState();
    handleTimeBasedEffectsUpdate(state, store.dispatch);
  }
  
  // Also recalculate effects when sect benefits change
  if (
    action.type === ACTION_TYPES.UPDATE_SECT_BENEFITS ||
    action.type === ACTION_TYPES.UPDATE_SECT_RANK
  ) {
    const state = store.getState();
    handleTimeBasedEffectsUpdate(state, store.dispatch);
  }
  
  // Also recalculate effects when spirit pet changes
  if (
    action.type === ACTION_TYPES.SET_ACTIVE_SPIRIT_PET ||
    action.type === ACTION_TYPES.UPDATE_SPIRIT_PET
  ) {
    const state = store.getState();
    handleTimeBasedEffectsUpdate(state, store.dispatch);
  }
  
  // Special direct recalculation action
  if (action.type === ACTION_TYPES.RECALCULATE_PLAYER_EFFECTS) {
    try {
      const state = store.getState();
      const dispatch = store.dispatch;
      
      if (typeof dispatch === 'function') {
        handleTimeBasedEffectsUpdate(state, dispatch);
      } else {
        console.warn('[Effects Middleware] dispatch не является функцией в RECALCULATE_PLAYER_EFFECTS');
        // Вызываем обновление эффектов без dispatch
        handleTimeBasedEffectsUpdate(state, null);
      }
    } catch (error) {
      console.error('[Effects Middleware] Ошибка при обработке RECALCULATE_PLAYER_EFFECTS:', error);
    }
  }
  
  return result;
};


export default {
  handleTimeBasedEffectsUpdate,
  recalculatePlayerEffectsReducer,
  effectsUpdaterMiddleware,
};
