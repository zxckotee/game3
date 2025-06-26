import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { collectAllEffects } from '../../utils/effectsUtils';

/**
 * Компонент для синхронизации эффектов игрока в боевом состоянии
 * Обеспечивает перенос эффектов из основного состояния игры в боевое состояние
 */
const EffectsSynchronizer = () => {
  const { state, dispatch } = useGame();

  useEffect(() => {
    // Проверяем, что игрок находится в бою
    if (state.combat && state.combat.inCombat) {
      // Собираем все эффекты из разных источников с помощью утилиты
      // Они уже стандартизированы и объединены
      const allEffects = collectAllEffects(state);
      
      console.log('EffectsSynchronizer: Синхронизация эффектов игрока в бою', { 
        количествоЭффектов: allEffects.length,
        эффекты: allEffects 
      });

      // Преобразуем в боевой формат
      const combatEffects = allEffects.map(effect => {
        // Определяем тип эффекта для боевой системы
        let combatEffectType;
        if (effect.displayType) {
          combatEffectType = effect.displayType === 'positive' ? 'buff' : 
                           effect.displayType === 'negative' ? 'debuff' : 'neutral';
        } else {
          combatEffectType = effect.modifier > 0 ? 'buff' : 
                           effect.modifier < 0 ? 'debuff' : 'neutral';
        }
        
        // Сохраняем информацию о типе эффекта для боевой системы
        let combatType = effect.type;
        // Для эффектов грозы сохраняем полный тип с пометкой thunderstorm
        if (effect.source === 'weather' && 
            (effect.name.includes('гроза') || effect.name.includes('thunderstorm'))) {
          combatType = `${effect.type} (thunderstorm)`;
        }
        
        // Определяем, влияет ли эффект на боевую статистику
        const isCombatEffect = effect.type === 'combat_damage' || 
                              combatType.includes('combat_damage') ||
                              effect.name.includes('Урон в бою');
        
        // Создаем боевой эффект со всей необходимой информацией
        return {
          name: effect.name, // Используем русское название
          icon: effect.icon || '✨',
          type: combatEffectType, // buff/debuff/neutral
          effectType: combatType, // Сохраняем тип с учетом источника
          originalType: effect.type, // Оригинальный тип для проверки
          source: effect.source || 'unknown',
          modifier: effect.modifier, // Числовое значение эффекта
          displayValue: effect.displayValue, // Отформатированное значение (например, "+5%")
          isCombatEffect: isCombatEffect, // Флаг, влияет ли на бой
          duration: effect.duration || -1, // Длительность эффекта (-1 = постоянный)
          target: effect.target || null, // Цель эффекта (если есть)
          stats: effect.stats || null // Дополнительные статы (если есть)
        };
      });

      console.log('EffectsSynchronizer: Сформированы боевые эффекты:', combatEffects);

      // Отправляем действие для обновления эффектов в боевом состоянии
      dispatch({
        type: 'UPDATE_COMBAT_EFFECTS',
        payload: combatEffects
      });
      
      // Дополнительно отправляем боевые статусы для использования в бою
      dispatch({
        type: 'SET_COMBAT_STATUS_EFFECTS',
        payload: {
          effects: combatEffects.filter(effect => effect.isCombatEffect)
        }
      });
    }
  }, [state.player.statusEffects, state.world.weather, state.world.currentLocation, state.combat.inCombat, dispatch]);

  // Этот компонент не рендерит UI
  return null;
};

export default EffectsSynchronizer;
