import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';
import SectService from '../services/sect-adapter';
import initialState from './state/initialState';
import { rootReducer } from './reducers/rootReducer';
import { initializeWeatherState } from './reducers/worldReducer';
import ACTION_TYPES from './actions/actionTypes';
import { weatherMiddleware } from './middleware/weatherMiddleware';
import { checkAndNormalizeSectData } from '../utils/sectUtils';
import { normalizePlayerEffects } from '../utils/effectsNormalizer';
import itemService from '../services/item-service';

// НОВОЕ: Импортируем модули для работы с бонусами экипировки
import { initializeBonusSystem, debugBonusSystem } from '../utils/equipmentBonusInitializer';
import { integrateWithGameContext } from '../utils/equipmentBonusIntegration';

// Проверка доступности импортированного сервиса
console.log('[GameContext] Импорт itemService:', !!itemService);
console.log('[GameContext] Методы itemService:', itemService ? Object.keys(itemService) : 'недоступно');
import { initRelationshipSync } from '../utils/sectRelationshipSyncer';

// Очередь предметов для обогащения и флаг запланированного обогащения
let itemEnrichmentQueue = [];
let isEnrichmentScheduled = false;
import { 
  updateWeather, 
  setTimeOfDay, 
  triggerWeatherEvent,
  updateGameTime 
} from './actions/weather-actions';

// Создаем контекст
export const GameContext = createContext();

// Хук для использования контекста
export const useGameContext = () => useContext(GameContext);

// Используем готовый экземпляр SectService из адаптера
// Он уже настроен для правильной работы в браузере или на сервере
const sectService = SectService;

// Провайдер контекста
export const GameContextProvider = ({ children }) => {
  // Используем useReducer с корневым редуктором и начальным состоянием
  const [state, dispatchBase] = useReducer(rootReducer, initialState);
  
  // Инициализируем состояние погоды при первой загрузке
  useEffect(() => {
    if (state) {
      const initialProcessedState = initializeWeatherState(state);
      // Если state был изменен функцией инициализации погоды, применяем это изменение
      if (initialProcessedState !== state) {
        dispatchBase({ type: 'INITIALIZE_WEATHER_STATE', payload: initialProcessedState });
      }
    }
  }, []);
  
  // Экспорт состояния игры в глобальные переменные для доступа из отладочных инструментов
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Экспортируем состояние и контекст в глобальные переменные
      window.__GAME_STATE__ = state;
      // Для инициализации - экспортируем пустой объект actions
      if (!window.__GAME_CONTEXT__) {
        window.__GAME_CONTEXT__ = { state, actions: {} };
      } else {
        // Если контекст уже был создан, обновляем только состояние
        window.__GAME_CONTEXT__.state = state;
      }
      
      // Создаем или обновляем data-атрибут на body для доступа из DOM
      try {
        // Вместо сохранения всего состояния в DOM (что может быть избыточно),
        // создаем атрибут-индикатор для отладочных инструментов
        document.body.setAttribute('data-gamestate-available', 'true');
        
        // Сохраняем основные метрики в data-атрибуты для быстрого доступа
        if (state.player) {
          document.body.setAttribute('data-player-health', 
            `${state.player.stats?.health || 0}/${state.player.stats?.maxHealth || 100}`);
          document.body.setAttribute('data-player-level', 
            state.player.cultivation?.level || 1);
        }
      } catch (error) {
        // Безопасно игнорируем ошибки DOM-операций
        console.debug('Не удалось обновить DOM-атрибуты:', error);
      }
      
      // Отправляем событие для уведомления отладочных инструментов об обновлении состояния
      try {
        const stateUpdateEvent = new CustomEvent('game-state-updated', { 
          detail: { timestamp: Date.now() } 
        });
        window.dispatchEvent(stateUpdateEvent);
      } catch (error) {
        // Безопасно игнорируем ошибки событий
        console.debug('Не удалось отправить событие об обновлении состояния:', error);
      }
    }
  }, [state]); // Выполняем при каждом изменении состояния
  
  // Создаем промежуточное ПО (middleware) для обработки действий
  const middlewareEnhancer = next => action => {
    // ⚠️ КРИТИЧЕСКИ ВАЖНО: Передаем актуальный state при каждом вызове middleware
    const middlewareAPI = {
      getState: () => state, // Теперь всегда актуальный state, а не замороженный processedState
      dispatch: dispatchBase
    };
    
    // Вызываем middleware и получаем результат
    const middlewareResult = weatherMiddleware(middlewareAPI)(next)(action);
    
    return middlewareResult;
  };
  
  // Создаем dispatch с применением middleware
  const dispatch = action => {
    return middlewareEnhancer(dispatchBase)(action);
  };
  
  // Эффект для инициализации игры при загрузке
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Пытаемся загрузить сохраненное состояние из localStorage
        const savedState = localStorage.getItem('gameState');
        
        if (savedState) {
          // Если есть сохраненное состояние, загружаем его
          dispatch({
            type: ACTION_TYPES.LOAD_GAME,
            payload: JSON.parse(savedState)
          });
        } else {
          // Если нет сохраненного состояния, инициализируем новую игру
          // Здесь можно загрузить начальные данные с сервера, если нужно
          const userData = await apiService.getCurrentUser();
          
          if (userData) {
            dispatch({
              type: ACTION_TYPES.UPDATE_PLAYER,
              payload: userData
            });
          }
        }
        
        // Устанавливаем флаг инициализации
        dispatch({
          type: ACTION_TYPES.SET_INITIALIZED,
          payload: true
        });
        
        console.log('🔄 Инициализация игры завершена');
      } catch (error) {
        console.error('Ошибка при инициализации игры:', error);
        
        // Устанавливаем ошибку
        dispatch({
          type: ACTION_TYPES.SET_ERROR,
          payload: error.message
        });
      }
    };
    
    // Вызываем функцию инициализации
    initializeGame();
  }, []);
  
  // НОВОЕ: Эффект для инициализации системы бонусов после инициализации игры
  useEffect(() => {
    // Запускаем инициализацию бонусов экипировки только после полной инициализации игры
    if (state.isInitialized && state.player && state.player.inventory) {
      console.log('🌟 Запуск инициализации системы бонусов экипировки...');
      
      // Небольшая задержка для гарантии, что все компоненты уже загружены
      const timer = setTimeout(() => {
        try {
          // Инициализируем систему бонусов
          initializeBonusSystem(state, dispatch);
          console.log('✅ Инициализация системы бонусов экипировки завершена');
          
          // Выводим отладочную информацию
          setTimeout(() => {
            debugBonusSystem(state);
          }, 100);
        } catch (error) {
          console.error('❌ Ошибка при инициализации системы бонусов:', error);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [state.isInitialized, state.player?.inventory]);
  
  // Эффект для принудительного восстановления техник после полной инициализации игры
  useEffect(() => {
    // Запускаем восстановление техник только после полной инициализации игры
    if (state.isInitialized && Array.isArray(state.player?.techniques) && state.player.techniques.length > 0) {
      // Небольшая задержка для гарантии, что все компоненты уже загружены
      const timer = setTimeout(() => {
        console.log('🛠️ Запуск автоматического восстановления техник после инициализации...');
        try {
          // Запускаем восстановление техник
          dispatch({
            type: ACTION_TYPES.REPAIR_TECHNIQUES
          });
          console.log('✅ Автоматическое восстановление техник выполнено');
        } catch (error) {
          console.error('❌ Ошибка при автоматическом восстановлении техник:', error);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [state.isInitialized, state.player?.techniques]);
  
  // Создаем объект с действиями для использования в компонентах
  // Функция для нормализации данных секты
  const normalizeSectDataAction = () => {
    console.log('🧹 Запуск нормализации данных секты...');
    
    // Выполняем нормализацию через редуктор
    dispatch({ type: ACTION_TYPES.NORMALIZE_SECT_DATA });
    
    // Добавляем уведомление в интерфейс
    dispatch({ 
      type: ACTION_TYPES.ADD_NOTIFICATION, 
      payload: { 
        message: 'Структура данных секты была нормализована', 
        type: 'info' 
      }
    });
  };
  
  // Обработка обогащенных данных предметов
  const processEnrichmentQueue = () => {
    if (itemEnrichmentQueue.length === 0 || isEnrichmentScheduled) {
      return;
    }
    
    isEnrichmentScheduled = true;
    
    setTimeout(() => {
      // Обрабатываем всю очередь предметов за одну операцию
      const items = [...itemEnrichmentQueue];
      itemEnrichmentQueue = [];
      
      console.log(`[GameContext] Обработка очереди обогащения: ${items.length} предметов`);
      
      // Обновляем инвентарь в состоянии
      if (items.length > 0) {
        dispatch({
          type: ACTION_TYPES.BULK_ENRICH_ITEMS,
          payload: items
        });
      }
      
      isEnrichmentScheduled = false;
      
      // Проверяем, не появились ли новые предметы в очереди во время обработки
      if (itemEnrichmentQueue.length > 0) {
        processEnrichmentQueue();
      }
    }, 50);
  };
  
  // Функции для работы с предметами инвентаря
  // Получение полной информации о предмете (обогащение данных)
  const enrichItem = async (itemId) => {
    if (!itemId) {
      console.warn('[GameContext] Невозможно обогатить предмет: ID не предоставлен');
      return null;
    }
    
    try {
      // Сначала проверяем, есть ли предмет в инвентаре и не был ли он уже обогащен
      const existingItem = state.player.inventory.items.find(
        item => (item.id === itemId || item.itemId === itemId) && item.enriched
      );
      
      if (existingItem) {
        console.log(`[GameContext] Предмет ${itemId} уже обогащен`);
        return existingItem;
      }
      
      console.log(`[GameContext] Запрос обогащения предмета: ${itemId}`);
      
      // Получаем детали предмета с сервера или из базы данных
      const itemDetails = await itemService.getItemDetails(itemId);
      
      if (!itemDetails) {
        console.warn(`[GameContext] Не удалось получить данные предмета: ${itemId}`);
        return null;
      }
      
      // Получаем предмет из инвентаря для обновления
      const inventoryItem = state.player.inventory.items.find(
        item => item.id === itemId || item.itemId === itemId
      );
      
      if (!inventoryItem) {
        console.warn(`[GameContext] Предмет ${itemId} не найден в инвентаре`);
        return null;
      }
      
      // Обогащаем предмет полной информацией
      const enrichedItem = {
        ...inventoryItem,
        ...itemDetails,
        // Помечаем, что предмет обогащен
        enriched: true,
        enrichedAt: Date.now()
      };
      
      // Добавляем предмет в очередь для обновления состояния
      itemEnrichmentQueue.push(enrichedItem);
      
      // Запускаем обработку очереди
      processEnrichmentQueue();
      
      return enrichedItem;
    } catch (error) {
      console.error(`[GameContext] Ошибка при обогащении предмета ${itemId}:`, error);
      return null;
    }
  };
  
  // НОВОЕ: Функции для работы с экипировкой
  // Экипировка предмета
  const equipItem = (item) => {
    if (!item || !item.id) {
      console.warn('[GameContext] Невозможно экипировать предмет: неверные данные');
      return;
    }
    
    console.log(`[GameContext] Экипировка предмета: ${item.name || item.id}`);
    
    // Используем обновленные функции из наших модулей
    dispatch({
      type: 'EQUIP_ITEM',
      payload: { 
        itemId: item.id,
        itemType: item.type,
        armorType: item.properties?.armorType || item.armorType
      }
    });
    
    // Обновляем бонусы экипировки после изменений
    setTimeout(() => {
      try {
        const { updatePlayerEquipmentBonuses } = require('../utils/equipmentStateUpdater');
        updatePlayerEquipmentBonuses(state, dispatch);
      } catch (error) {
        console.error('[GameContext] Ошибка при обновлении бонусов:', error);
      }
    }, 50);
  };
  
  // Снятие предмета
  const unequipItem = (itemId) => {
    if (!itemId) {
      console.warn('[GameContext] Невозможно снять предмет: ID не предоставлен');
      return;
    }
    
    console.log(`[GameContext] Снятие предмета: ${itemId}`);
    
    dispatch({
      type: 'UNEQUIP_ITEM',
      payload: { itemId }
    });
    
    // Обновляем бонусы экипировки после изменений
    setTimeout(() => {
      try {
        const { updatePlayerEquipmentBonuses } = require('../utils/equipmentStateUpdater');
        updatePlayerEquipmentBonuses(state, dispatch);
      } catch (error) {
        console.error('[GameContext] Ошибка при обновлении бонусов:', error);
      }
    }, 50);
  };
  
  // Явное обновление бонусов экипировки
  const updateEquipmentBonuses = () => {
    console.log('[GameContext] Явное обновление бонусов экипировки');
    
    try {
      const { updatePlayerEquipmentBonuses } = require('../utils/equipmentStateUpdater');
      return updatePlayerEquipmentBonuses(state, dispatch);
    } catch (error) {
      console.error('[GameContext] Ошибка при обновлении бонусов:', error);
      return null;
    }
  };
  
  // Объект с действиями для использования в компонентах
  const actions = {
    dispatch,
    // Действия для работы с сектой
    normalizeSectData: normalizeSectDataAction,
    // Действия для работы с предметами
    enrichItem,
    // НОВОЕ: Действия для работы с экипировкой
    equipItem,
    unequipItem,
    updateEquipmentBonuses,
    // Другие действия...
  };
  
  // НОВОЕ: Создаем контекст для интеграции с системой бонусов
  const gameContext = { state, actions };
  
  // НОВОЕ: Интегрируем контекст с системой бонусов
  useEffect(() => {
    if (state.isInitialized) {
      try {
        // Интегрируем с существующим контекстом
        integrateWithGameContext(gameContext);
      } catch (error) {
        console.error('[GameContext] Ошибка при интеграции с системой бонусов:', error);
      }
      
      // Сохраняем контекст в глобальной переменной для отладки
      if (typeof window !== 'undefined') {
        window.__GAME_CONTEXT__ = gameContext;
      }
    }
  }, [state.isInitialized]);
  
  // Возвращаем провайдер контекста
  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
};