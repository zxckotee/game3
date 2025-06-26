import ACTION_TYPES from '../actions/actionTypes';

// Редуктор для обработки действий, связанных с боевой системой
export const combatReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.START_COMBAT:
      // Сразу инициализируем и enemy, и enemyCombatState одинаковыми данными
      return {
        ...state,
        combat: {
          inCombat: true,
          enemy: action.payload,
          enemyCombatState: action.payload, // Дублируем данные для совместимости с CombatManager
          log: [],
          turn: 1,
          isPlayerTurn: true, // Явно указываем, что ход игрока первый
          isProcessingAction: false, // Добавляем флаг для отслеживания состояния обработки действия
          forceNPCTurn: false, // Добавляем флаг для принудительного выполнения хода NPC
          playerCombatState: null,
          combatStats: {
            player: { damageDealt: 0, techniquesUsed: 0, criticalHits: 0, dodges: 0 },
            enemy: { damageDealt: 0, techniquesUsed: 0, criticalHits: 0, dodges: 0 }
          }
        }
      };
      
    case ACTION_TYPES.END_COMBAT:
      return {
        ...state,
        combat: {
          ...state.combat,
          inCombat: false,
          enemy: null,
          enemyCombatState: null, // Очищаем также enemyCombatState
          playerCombatState: null,
          isProcessingAction: false, // Сбрасываем флаг обработки действия
          forceNPCTurn: false // Сбрасываем флаг принудительного хода NPC
        }
      };
      
    case ACTION_TYPES.UPDATE_COMBAT:
      // Убедимся, что при обновлении enemyCombatState также обновляется enemy
      const payload = action.payload;
      
      // Если обновляется enemyCombatState, но не обновляется enemy, синхронизируем их
      if (payload.enemyCombatState && !payload.enemy) {
        payload.enemy = payload.enemyCombatState;
      }
      
      // И наоборот - если обновляется enemy, но не enemyCombatState
      if (payload.enemy && !payload.enemyCombatState) {
        payload.enemyCombatState = payload.enemy;
      }
      
      return {
        ...state,
        combat: {
          ...state.combat,
          ...payload
        }
      };
      
    case ACTION_TYPES.ADD_COMBAT_LOG:
      return {
        ...state,
        combat: {
          ...state.combat,
          log: [...state.combat.log, action.payload]
        }
      };
      
    case ACTION_TYPES.USE_TECHNIQUE:
      // Логика использования техники в бою
      // Обычно здесь будет сложная логика с вычислением урона, применением эффектов и т.д.
      return {
        ...state,
        combat: {
          ...state.combat,
          log: [...state.combat.log, {
            message: `Использована техника: ${action.payload.name}`,
            timestamp: new Date().toISOString()
          }]
        }
      };
      
    default:
      return state;
  }
};
