import { playerReducer } from './playerReducer';
import { uiReducer } from './uiReducer';
import { worldReducer } from './worldReducer';
import { combatReducer } from './combatReducer';
import { questsReducer } from './questsReducer';
import { achievementsReducer } from './achievementsReducer';
import { spiritPetsReducer } from './spiritPetsReducer';
import { gameStateReducer } from './gameStateReducer';
import marketReducer from './marketReducer';
import sectReducer from './sectReducer';
import reputationReducer from './reputationReducer';
import groupReducer from './groupReducer';
import initialState from '../state/initialState';
import ACTION_TYPES from '../actions/actionTypes';

// Корневой редуктор, объединяющий все остальные редукторы
export const rootReducer = (state, action) => {
  // Обработка полного сброса состояния
  if (action.type === ACTION_TYPES.RESET_STATE) {
    console.log('🔄 rootReducer: Выполняем полный сброс состояния Redux');
    return initialState;
  }

  // Применяем каждый редуктор последовательно
  let newState = state;
  
  // Обработка состояния игры (сохранение/загрузка)
  newState = gameStateReducer(newState, action);
  
  // Специальная обработка для инициализации состояния погоды
  if (action.type === 'INITIALIZE_WEATHER_STATE' && action.payload) {
    console.log('🔄 rootReducer: Применяем INITIALIZE_WEATHER_STATE');
    newState = action.payload;
  }
  
  // Обработка игрока
  newState = playerReducer(newState, action);
  
  // Обработка мира
  newState = worldReducer(newState, action);
  
  // Обработка интерфейса
  newState = uiReducer(newState, action);
  
  // Обработка боевой системы
  newState = combatReducer(newState, action);
  
  // Обработка квестов
  newState = questsReducer(newState, action);
  
  // Обработка достижений
  newState = achievementsReducer(newState, action);
  
  // Обработка духовных питомцев
  newState = spiritPetsReducer(newState, action);
  
  // Обработка рынка и торговли
  newState = {
    ...newState,
    market: marketReducer(newState.market, action)
  };
  
  // Обработка сект
  newState = {
    ...newState,
    sect: sectReducer(newState.sect, action)
  };
  
  // Обработка репутации
  newState = {
    ...newState,
    reputation: reputationReducer(newState.reputation, action)
  };
  
  // Обработка групп и групповых активностей
  newState = {
    ...newState,
    groups: groupReducer(newState.groups, action)
  };
  
  return newState;
};
