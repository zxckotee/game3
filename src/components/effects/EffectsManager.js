/**
 * Effects Manager Component
 * Manages the game effects system, integrating with GameTimeUpdater
 * and handling the synchronization of effects from various sources
 */
import React, { useEffect, useContext } from 'react';
import { GameContext } from '../../context/GameContext';
import { syncStatusEffects } from '../../utils/effectsUtils';
import { timeUpdateListener } from '../../utils/effectsUpdater';
import ACTION_TYPES from '../../context/actions/actionTypes';

/**
 * Component that manages effects and synchronizes them
 * when game time updates or when other relevant changes occur
 */
const EffectsManager = () => {
  const { state, dispatch } = useContext(GameContext);
  
  // Initialize effects system on component mount
  useEffect(() => {
    console.log('[Effects Manager] Initializing effects system');
    
    // Initial synchronization of effects - проверяем, что dispatch это функция
    if (dispatch && typeof dispatch === 'function') {
      try {
        syncStatusEffects(state, dispatch);
      } catch (error) {
        console.error('[Effects Manager] Ошибка при инициализации эффектов:', error);
        // В случае ошибки пробуем без dispatch
        syncStatusEffects(state, null);
      }
    } else {
      console.warn('[Effects Manager] dispatch не является функцией, используем null');
      syncStatusEffects(state, null);
    }
    
    // Listen for time updates - безопасно вызываем timeUpdateListener
    const handleTimeUpdate = (event) => {
      try {
        if (typeof dispatch === 'function') {
          timeUpdateListener(event, state, dispatch);
        } else {
          console.warn('[Effects Manager] dispatch не является функцией в обработчике времени');
          // В качестве резервного варианта вызываем без dispatch
          timeUpdateListener(event, state, null);
        }
      } catch (error) {
        console.error('[Effects Manager] Ошибка в обработчике времени:', error);
      }
    };
    
    // Listen for effects update requests
    const handleEffectsUpdateRequired = (event) => {
      console.log('[Effects Manager] Effects update required');
      try {
        if (dispatch && typeof dispatch === 'function') {
          dispatch({
            type: ACTION_TYPES.RECALCULATE_PLAYER_EFFECTS
          });
        } else {
          console.warn('[Effects Manager] dispatch не является функцией при обновлении эффектов');
          // Запускаем синхронизацию напрямую
          syncStatusEffects(state, null);
        }
      } catch (error) {
        console.error('[Effects Manager] Ошибка при обновлении эффектов:', error);
        // Вызываем синхронизацию без dispatch
        syncStatusEffects(state, null);
      }
    };
    
    // Add event listeners
    window.addEventListener('time_update', handleTimeUpdate);
    window.addEventListener('effects_update_required', handleEffectsUpdateRequired);
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('time_update', handleTimeUpdate);
      window.removeEventListener('effects_update_required', handleEffectsUpdateRequired);
    };
  }, []);
  
  // Update effects when relevant parts of the state change
  useEffect(() => {
    // Only recalculate if state.world and state.player exist
    if (state.world && state.player) {
      try {
        if (dispatch && typeof dispatch === 'function') {
          dispatch({
            type: ACTION_TYPES.RECALCULATE_PLAYER_EFFECTS
          });
        } else {
          console.warn('[Effects Manager] dispatch не является функцией при изменении состояния');
          // Напрямую запускаем синхронизацию эффектов
          syncStatusEffects(state, null);
        }
      } catch (error) {
        console.error('[Effects Manager] Ошибка при пересчете эффектов:', error);
        // Пробуем без dispatch
        syncStatusEffects(state, null);
      }
    }
  }, [
    // Dependencies that should trigger effects recalculation
    state.world?.weather,
    state.world?.currentLocation,
    state.player?.sect?.benefits,
    state.player?.equipmentBonuses,
    state.spiritPets?.activePet
  ]);
  
  // This is a service component that doesn't render anything
  return null;
};

export default EffectsManager;
