import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import apiService from '../services/api';
import SectService from '../services/sect-api';
import InventoryServiceAPI from '../services/inventory-api';
import CharacterProfileServiceAPI from '../services/character-profile-service-api';
import InventoryService from '../services/inventory-adapter';
import initialState from './state/initialState';
import { rootReducer } from './reducers/rootReducer';
import ACTION_TYPES from './actions/actionTypes';
import relationshipsMiddleware from './middleware/relationshipsMiddleware';
import { checkAndNormalizeSectData } from '../utils/sectUtils';
import { normalizePlayerEffects } from '../utils/effectsNormalizer';
// import itemService from '../services/item-service'; // Удалено, так как больше не используется

// Проверка доступности импортированного сервиса
// console.log('[GameContext] Импорт itemService:', !!itemService); // Удалено
// console.log('[GameContext] Методы itemService:', itemService ? Object.keys(itemService) : 'недоступно'); // Удалено
import { initRelationshipSync } from '../utils/sectRelationshipSyncer';

// Очередь предметов для обогащения и флаг запланированного обогащения - Удалено
// let itemEnrichmentQueue = [];
// let isEnrichmentScheduled = false;

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
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  
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
      getState: () => stateRef.current, // Теперь всегда актуальный state, а не замороженный processedState
      dispatch: dispatchBase
    };
    
    // Создаем цепочку middleware
    // Создаем цепочку middleware
    // В конце обрабатываем отношения, отправляя обновления на сервер
    const relationshipsResult = relationshipsMiddleware(middlewareAPI)(next)(action);
    
    return relationshipsResult;
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
    
    // Для удобства отладки показываем обновленные данные
    setTimeout(() => {
      console.log('✅ Данные секты после нормализации:', state.sect);
    }, 100);
    
    return state.sect;
  };
  
  // Функция для нормализации эффектов персонажа
  const normalizeEffectsAction = () => {
    console.log('🧹 Запуск нормализации эффектов персонажа...');
    
    // Выполняем нормализацию через редуктор
    dispatch({ type: ACTION_TYPES.NORMALIZE_EFFECTS });
    
    // Добавляем уведомление в интерфейс
    dispatch({ 
      type: ACTION_TYPES.ADD_NOTIFICATION, 
      payload: { 
        message: 'Структура данных эффектов была нормализована', 
        type: 'info' 
      } 
    });
    
    // Для удобства отладки показываем обновленные данные
    setTimeout(() => {
      console.log('✅ Эффекты персонажа после нормализации:', state.player.statusEffects);
    }, 100);
    
    return state.player.statusEffects;
  };
  
  // Дополняем эффект инициализации - добавляем код нормализации секты и эффектов
  useEffect(() => {
    if (state.isInitialized) {
      // После инициализации игры выполняем проверку и нормализацию данных
      setTimeout(() => {
        try {
          // 1. Проверка и нормализация данных секты
          const sectCheckResult = checkAndNormalizeSectData(state);
          
          // Если данные были изменены в результате проверки, выполняем обновление
          if (sectCheckResult !== state) {
            console.log('🔍 Обнаружены проблемы в данных секты, выполняем автоматическую нормализацию...');
            normalizeSectDataAction();
          }
          
          // Инициализируем синхронизацию отношений между сектой и социальными отношениями
          console.log('🔄 Инициализация синхронизации отношений секты и социальных отношений...');
          initRelationshipSync({
            getState: () => state,
            dispatch
          });
          
          // 2. Проверка и нормализация эффектов персонажа
          if (state.player && state.player.statusEffects) {
            // Проверяем, является ли statusEffects массивом
            if (!Array.isArray(state.player.statusEffects)) {
              console.log('🔍 Обнаружен неправильный формат эффектов (объект вместо массива), выполняем автоматическую нормализацию...');
              normalizeEffectsAction();
            } else {
              // Также проверяем, если statusEffects пустой массив, но есть бонусы секты
              if (state.player.statusEffects.length === 0 && 
                  state.player.sect && 
                  state.player.sect.benefits && 
                  state.player.sect.benefits.length > 0) {
                console.log('🔍 Эффекты секты не включены в список эффектов персонажа, выполняем нормализацию...');
                normalizeEffectsAction();
              }
            }
          }
        } catch (error) {
          console.error('❌ Ошибка при проверке данных секты или эффектов:', error);
        }
      }, 1500); // Даем небольшую задержку, чтобы игра успела полностью инициализироваться
    }
  }, [state.isInitialized]);

const actions = {
    // Добавляем dispatch в actions, чтобы он был доступен компонентам
    dispatch,
    
    // Действие для установки данных пользователя (для решения проблем авторизации)
    setUser: (userData) => {
      console.log('🔄 Обновление данных пользователя:', userData);
      dispatch({ type: ACTION_TYPES.SET_USER, payload: userData });
    },
    
    // Действие для полного сброса состояния Redux
    resetState: () => {
      console.log('🔄 Выполняем полный сброс состояния Redux');
      dispatch({ type: ACTION_TYPES.RESET_STATE });
      
      // Также отправляем событие для уведомления других компонентов о сбросе состояния
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reset-state'));
      }
    },
    
    // Действие для нормализации эффектов
    normalizeEffects: () => {
      console.log('🧹 Ручной запуск нормализации эффектов персонажа...');
      return normalizeEffectsAction();
    },
    
    // Действия для игрока
    updatePlayer: (data) => dispatch({ type: ACTION_TYPES.UPDATE_PLAYER, payload: data }),
    updatePlayerStats: (stats) => dispatch({ type: ACTION_TYPES.UPDATE_PLAYER_STATS, payload: stats }),
    updateCultivation: (data) => dispatch({ type: ACTION_TYPES.UPDATE_CULTIVATION, payload: data }),
    
    // Действия для инвентаря
    updateInventoryItems: (items) => dispatch({ type: ACTION_TYPES.UPDATE_INVENTORY, payload: items }),
    updateInventoryCurrency: (currency) => dispatch({ type: ACTION_TYPES.UPDATE_CURRENCY, payload: currency }),
    loadInventoryData: async (userIdToLoad) => {
      const currentUserId = userIdToLoad || state.player?.id;
      if (!currentUserId) {
        console.warn('[GameContext] loadInventoryData: userId не предоставлен и не найден в state.');
        // Возможно, стоит диспатчить ошибку или уведомление
        return;
      }
      console.log(`[GameContext] Загрузка данных инвентаря для userId: ${currentUserId}`);
      try {
        const items = await InventoryServiceAPI.getInventoryItems(currentUserId);
        const profile = await CharacterProfileServiceAPI.getCharacterProfile(currentUserId);
        
        dispatch({ type: ACTION_TYPES.UPDATE_INVENTORY, payload: items || [] });
        if (profile && profile.currency) {
          dispatch({ type: ACTION_TYPES.UPDATE_CURRENCY, payload: profile.currency });
        } else {
          console.warn(`[GameContext] Профиль или валюта не получены для userId: ${currentUserId}`);
          // Диспатчим пустой объект или текущее состояние валюты, чтобы избежать ошибки undefined
          dispatch({ type: ACTION_TYPES.UPDATE_CURRENCY, payload: state.player.inventory.currency || {} });
        }
        console.log(`[GameContext] Данные инвентаря успешно загружены и обновлены для userId: ${currentUserId}`);
      } catch (error) {
        console.error(`[GameContext] Ошибка при загрузке данных инвентаря для userId ${currentUserId}:`, error);
        // Опционально: диспатчить action для отображения ошибки пользователю
        dispatch({
          type: ACTION_TYPES.ADD_NOTIFICATION,
          payload: {
            message: `Ошибка загрузки инвентаря: ${error.message}`,
            type: 'error'
          }
        });
      }
    },
    refreshInventory: async () => {
      try {
        // Проверяем, авторизован ли пользователь
        if (!state.player || !state.player.id) {
          console.log('❌ Невозможно обновить инвентарь: пользователь не авторизован');
          return;
        }
        
        console.log('🔄 Обновление инвентаря из API...');
        const userId = state.player.id;
        
        // Используем API-сервис для получения инвентаря
        const items = await InventoryServiceAPI.getInventoryItems(userId);
        console.log(`📦 Получено ${items.length} предметов из API`);
        dispatch({ type: ACTION_TYPES.UPDATE_INVENTORY, payload: items });
      } catch (error) {
        console.error('Ошибка при обновлении инвентаря из API:', error);
      }
    },
    
    addItem: (item) => dispatch({ type: ACTION_TYPES.ADD_ITEM, payload: item }),
    removeItem: (itemId) => {
      // Ensure we're passing an object with id property as payload as expected by the reducer
      const payload = typeof itemId === 'object' ? itemId : { id: itemId };
      console.log('Removing item with payload:', payload);
      dispatch({ type: ACTION_TYPES.REMOVE_ITEM, payload });
    },
    clearInventory: () => {
      console.log('Очистка инвентаря пользователя в Redux');
      // Диспатчим действие для очистки инвентаря в Redux
      dispatch({ type: ACTION_TYPES.CLEAR_INVENTORY });
      // Также отправляем событие для очистки инвентаря в других компонентах
      window.dispatchEvent(new CustomEvent('clear-inventory'));
    },
    
    equipItem: (item) => {
      console.log('📋 GameContextProvider - Запрос на экипировку предмета:', item?.name || item?.id);
      
      // ПРИНУДИТЕЛЬНАЯ БЛОКИРОВКА ЭКИПИРОВКИ ПРЕДМЕТОВ С ТРЕБОВАНИЯМИ
      // К УРОВНЮ И/ИЛИ ХАРАКТЕРИСТИКАМ
      if (item) {
        // Получаем все возможные требования предмета (из разных мест)
        const itemReqs = item.requirements || (item.properties && item.properties.requirements);
        
        // Если есть требования в любом формате
        if (itemReqs) {
          console.log('🔒 НАЙДЕНЫ ТРЕБОВАНИЯ ПРЕДМЕТА:', JSON.stringify(itemReqs));
          
          // ВСЕГДА БЛОКИРУЕМ ЭКИПИРОВКУ ПРЕДМЕТОВ С ТРЕБОВАНИЯМИ
          // Отправляем явное уведомление о блокировке
          dispatch({
            type: ACTION_TYPES.ADD_NOTIFICATION,
            payload: {
              message: `Нельзя экипировать предмет ${item.name || 'Unknown'}: не соответствует требованиям`,
              type: 'error'
            }
          });
          
          // Возвращаем информацию о блокировке
          return {
            success: false,
            reason: 'requirements_blocked',
            message: 'Экипировка предметов с требованиями отключена администрацией'
          };
        }
      }
      
      // Если предмет НЕ имеет требований, можно экипировать
      dispatch({ type: ACTION_TYPES.EQUIP_ITEM, payload: item });
      
      // Возвращаем успешный результат
      return { success: true, item };
    },
    unequipItem: (slot) => dispatch({ type: ACTION_TYPES.UNEQUIP_ITEM, payload: slot }),
    updateCurrency: (currency, isAdditive = false) => dispatch({
      type: ACTION_TYPES.UPDATE_CURRENCY,
      payload: currency,
      isAdditive: isAdditive
    }),
    
    // Методы для обогащения предметов удалены, так как сервер теперь возвращает предметы уже обогащенными.
    // Метод для добавления валюты к существующей
    addCurrency: (currency) => {
      console.log('Добавление валюты в инвентарь:', currency);
      
      // Передаем валюту с явным флагом isAdditive=true, указывая что нужно добавить, а не заменить
      dispatch({ 
        type: ACTION_TYPES.UPDATE_CURRENCY, 
        payload: currency,
        isAdditive: true
      });
    },
    
    // Действия для мира
    updateLocation: (location) => dispatch({ type: ACTION_TYPES.UPDATE_LOCATION, payload: location }),
    updateTime: (time) => dispatch({ type: ACTION_TYPES.UPDATE_TIME, payload: time }),
    addEvent: (event) => dispatch({ type: ACTION_TYPES.ADD_EVENT, payload: event }),
    removeEvent: (eventId) => dispatch({ type: ACTION_TYPES.REMOVE_EVENT, payload: eventId }),
    cacheGeneratedEnemy: (areaId, enemyId, enemy) => 
      dispatch({ 
        type: ACTION_TYPES.CACHE_GENERATED_ENEMY, 
        payload: { areaId, enemyId, enemy } 
      }),
    
    // Действия для интерфейса
    changeScreen: (screen) => dispatch({ type: ACTION_TYPES.CHANGE_SCREEN, payload: screen }),
    addNotification: (notification) => dispatch({ type: ACTION_TYPES.ADD_NOTIFICATION, payload: notification }),
    removeNotification: (notificationId) => dispatch({ type: ACTION_TYPES.REMOVE_NOTIFICATION, payload: notificationId }),
    updateSettings: (settings) => dispatch({ type: ACTION_TYPES.UPDATE_SETTINGS, payload: settings }),
    
    // Действия для сохранения/загрузки
    saveGame: (callbacks) => dispatch({ type: ACTION_TYPES.SAVE_GAME, payload: callbacks }),
    loadGame: (state) => dispatch({ type: ACTION_TYPES.LOAD_GAME, payload: state }),
    
    // Действия для квестов
    acceptQuest: (questId) => dispatch({ type: ACTION_TYPES.ACCEPT_QUEST, payload: questId }),
    completeQuest: (questId) => dispatch({ type: ACTION_TYPES.COMPLETE_QUEST, payload: questId }),
    updateQuestObjective: (data) => dispatch({ type: ACTION_TYPES.UPDATE_QUEST_OBJECTIVE, payload: data }),
    
    // Действия для достижений
    checkAchievements: (achievements) => dispatch({ type: ACTION_TYPES.CHECK_ACHIEVEMENTS, payload: { achievements } }),
    completeAchievement: (achievement) => dispatch({ type: ACTION_TYPES.COMPLETE_ACHIEVEMENT, payload: achievement }),
    
    // Действия для техник
    learnTechnique: (technique) => dispatch({ type: ACTION_TYPES.LEARN_TECHNIQUE, payload: technique }),
    upgradeTechnique: (data) => dispatch({ type: ACTION_TYPES.UPGRADE_TECHNIQUE, payload: data }),
    useTechnique: (data) => dispatch({ type: ACTION_TYPES.USE_TECHNIQUE, payload: data }),
    repairTechniques: () => {
      console.log('🔧 Запуск ручного восстановления техник');
      dispatch({ type: ACTION_TYPES.REPAIR_TECHNIQUES });
      // Добавляем уведомление о восстановлении техник
      dispatch({ 
        type: ACTION_TYPES.ADD_NOTIFICATION, 
        payload: { 
          message: 'Техники были восстановлены', 
          type: 'success' 
        } 
      });
    },
    
    updateRelationship: (relationshipData) => {
      dispatch({ type: ACTION_TYPES.UPDATE_RELATIONSHIP, payload: relationshipData });
    },
    // Действия для боя
    startCombat: (enemy) => dispatch({ type: ACTION_TYPES.START_COMBAT, payload: enemy }),
    endCombat: () => dispatch({ type: ACTION_TYPES.END_COMBAT }),
    updateCombat: (data) => dispatch({ type: ACTION_TYPES.UPDATE_COMBAT, payload: data }),
    updateCombatState: (state) => dispatch({ type: ACTION_TYPES.UPDATE_COMBAT_STATE, payload: state }),
    addCombatLog: (log) => dispatch({ type: ACTION_TYPES.ADD_COMBAT_LOG, payload: log }),
    // Новое действие для сохранения истории боев
    addCombatHistory: (combatResult) => {
      console.log('Сохранение результата боя в историю:', combatResult);
      dispatch({ type: ACTION_TYPES.ADD_COMBAT_HISTORY, payload: combatResult });
    },
    
    // Действия для эффектов статуса
    addStatusEffect: (effect) => dispatch({ type: ACTION_TYPES.ADD_STATUS_EFFECT, payload: effect }),
    updateStatusEffect: (effect) => dispatch({ type: ACTION_TYPES.UPDATE_STATUS_EFFECT, payload: effect }),
    removeStatusEffect: (effectId) => dispatch({ type: ACTION_TYPES.REMOVE_STATUS_EFFECT, payload: effectId }),
    
    // Действия для духовных питомцев
    addSpiritPet: (pet) => dispatch({ type: ACTION_TYPES.ADD_SPIRIT_PET, payload: pet }),
    removeSpiritPet: (petId) => dispatch({ type: ACTION_TYPES.REMOVE_SPIRIT_PET, payload: petId }),
    updateSpiritPet: (data) => dispatch({ type: ACTION_TYPES.UPDATE_SPIRIT_PET, payload: data }),
    setActiveSpiritPet: (petId) => dispatch({ type: ACTION_TYPES.SET_ACTIVE_SPIRIT_PET, payload: petId }),
    feedSpiritPet: (data) => dispatch({ type: ACTION_TYPES.FEED_SPIRIT_PET, payload: data }),
    trainSpiritPet: (data) => dispatch({ type: ACTION_TYPES.TRAIN_SPIRIT_PET, payload: data }),
    usePetAbility: (data) => dispatch({ type: ACTION_TYPES.USE_PET_ABILITY, payload: data }),
    removeFleePet: (petId) => dispatch({ type: ACTION_TYPES.REMOVE_FLEEING_PET, payload: petId }),
    updatePetsState: () => dispatch({ type: ACTION_TYPES.UPDATE_PETS_STATE }),
    
    // Действие для применения бонусов от экипировки
    applyEquipmentBonuses: (equippedItems) => {
      console.log('===== ПРИМЕНЕНИЕ БОНУСОВ ЭКИПИРОВКИ =====');
      console.log('Запрос на применение бонусов от экипировки:', equippedItems);
      
      // Проверяем, есть ли предметы для применения бонусов
      if (!equippedItems || typeof equippedItems !== 'object') {
        console.error('Ошибка: некорректные данные equippedItems', equippedItems);
        return;
      }
      
      // Фильтруем null и undefined значения для безопасности
      const validEquippedItems = {};
      Object.entries(equippedItems).forEach(([key, item]) => {
        if (item) {
          validEquippedItems[key] = item;
          
          // Проверяем наличие предрассчитанных бонусов и получаем их если возможно
          if (!item.calculatedBonuses && item.itemId) {
            try {
              // Попытка получить предрассчитанные бонусы из equipment-items.js
              const { getEquipmentItemById } = require('../data/equipment-items');
              const detailedItem = getEquipmentItemById(parseInt(item.itemId));
              if (detailedItem && detailedItem.calculatedBonuses) {
                console.log(`🔍 Получены предрассчитанные бонусы для предмета ${item.name} (ID: ${item.itemId})`);
                validEquippedItems[key] = {
                  ...item,
                  calculatedBonuses: detailedItem.calculatedBonuses
                };
              }
            } catch (error) {
              console.error(`❌ Ошибка при получении детальной информации о предмете ${item.name}:`, error);
            }
          }
        }
      });
      
      console.log('Отправка экипировки для применения бонусов:', validEquippedItems);
      
      // Используем мгновенное обновление для лучшей синхронизации 
      // (незамедлительно вызывает редюсер)
      dispatchBase({ 
        type: ACTION_TYPES.APPLY_EQUIPMENT_BONUSES, 
        payload: validEquippedItems 
      });
      
      // Для отладки показываем обновленные бонусы
      setTimeout(() => {
        console.log('🔄 Обновленные бонусы:', state.player.equipmentBonuses);
      }, 100);
    },
    
    // Действие для обновления отношений с персонажами
    updateRelationship: (character) => {
      console.log('Обновление отношений с персонажем:', character);
      
      if (!character || !character.id || !character.name || character.level === undefined) {
        console.error('Ошибка: некорректные данные персонажа', character);
        return;
      }
      
      // Используем централизованную функцию синхронизации для обновления
      // сразу и социальных отношений, и лояльности в секте
      dispatch({ 
        type: ACTION_TYPES.UPDATE_RELATIONSHIP_AND_LOYALTY, 
        payload: {
          name: character.name,
          value: character.level
        }
      });
      
      // После обновления отношений, синхронизируем массив friends
      try {
        setTimeout(() => {
          if (state.player && state.player.social) {
            let relationships = state.player.social.relationships || [];
            
            // Проверка, что relationships - это массив
            if (!Array.isArray(relationships)) {
              console.warn('Отношения не являются массивом, преобразуем их:', relationships);
              relationships = typeof relationships === 'object' && relationships !== null 
                ? Object.values(relationships) 
                : [];
            }
            
            // Создаем массив friends из отношений с уровнем >= 75
            let friends = [];
            try {
              friends = relationships
                .filter(relation => relation && typeof relation === 'object' && typeof relation.level === 'number' && relation.level >= 75)
                .map(relation => relation.id);
            } catch (filterError) {
              console.error('Ошибка при фильтрации отношений для друзей:', filterError);
              // Ручная фильтрация в случае ошибки
              friends = [];
              for (let i = 0; i < relationships.length; i++) {
                const relation = relationships[i];
                if (relation && typeof relation === 'object' && typeof relation.level === 'number' && relation.level >= 75) {
                  friends.push(relation.id);
                }
              }
            }
            
            // Обновляем массив friends
            if (friends.length > 0) {
              console.log('👫 Автоматическое обновление списка друзей:', friends);
              dispatch({
                type: 'UPDATE_SOCIAL_FRIENDS',
                payload: friends
              });
              
              // Также проверяем достижение "Социальные связи"
              actions.checkAchievements(['ach8']);
            }
          }
        }, 100);
      } catch (error) {
        console.error('Ошибка при синхронизации друзей:', error);
      }
    },
    
    // Действия для сект
    loadUserSect: async () => {
      try {
        // Получаем информацию о секте пользователя
        const sectData = await sectService.getUserSect(state.player.id);
        
        if (sectData) {
          // Проверяем формат benefits в sectData и преобразуем при необходимости
          if (sectData.benefits && !Array.isArray(sectData.benefits)) {
            console.warn('Бонусы секты не в формате массива, преобразуем в массив');
            const benefitsObj = sectData.benefits;
            sectData.benefits = [
              {type: 'cultivation_speed', modifier: Math.round((benefitsObj.cultivationSpeedBonus || 0) * 100)},
              {type: 'resource_gathering', modifier: Math.round((benefitsObj.resourceGatheringBonus || 0) * 100)},
              {type: 'technique_discount', modifier: Math.round((benefitsObj.techniqueDiscountPercent || 0) * 100)}
            ];
          }
          
          // Если пользователь состоит в секте, загружаем информацию с преобразованными бонусами
          dispatch({ type: ACTION_TYPES.SET_SECT, payload: sectData });
          
          // Загружаем бонусы от секты через отдельный метод
          const benefits = await sectService.getSectBenefits(state.player.id);
          
          // Бонусы уже должны быть в формате массива после обновления sect-service.js
          // но на всякий случай проверяем формат и преобразуем, если нужно
          let processedBenefits = benefits;
          if (benefits && !Array.isArray(benefits)) {
            console.warn('Полученные бонусы не в формате массива, преобразуем');
            const benefitsObj = benefits;
            processedBenefits = [
              {type: 'cultivation_speed', modifier: Math.round((benefitsObj.cultivationSpeedBonus || 0) * 100)},
              {type: 'resource_gathering', modifier: Math.round((benefitsObj.resourceGatheringBonus || 0) * 100)},
              {type: 'technique_discount', modifier: Math.round((benefitsObj.techniqueDiscountPercent || 0) * 100)}
            ];
          }
          
          // Отправляем обработанные бонусы
          dispatch({ type: ACTION_TYPES.UPDATE_SECT_BENEFITS, payload: processedBenefits });
          
          // Загружаем ранг пользователя в секте
          const rankInfo = await sectService.getUserSectRank(state.player.id);
          dispatch({ type: ACTION_TYPES.UPDATE_SECT_RANK, payload: rankInfo });
        }
        
        return sectData;
      } catch (error) {
        console.error('Ошибка при загрузке информации о секте:', error);
        dispatch({ 
          type: ACTION_TYPES.ADD_NOTIFICATION, 
          payload: { 
            message: 'Не удалось загрузить информацию о секте', 
            type: 'error' 
          } 
        });
        return null;
      }
    },
    
    contributeToSect: async (userId, sectId, energyAmount) => {
      try {
        // Вносим вклад в секту
        const result = await sectService.contributeToSect(userId, sectId, energyAmount);
        
        // Обновляем энергию пользователя
        dispatch({ 
          type: ACTION_TYPES.UPDATE_CULTIVATION, 
          payload: { energy: state.player.cultivation.energy - energyAmount } 
        });
        
        // Обновляем информацию о секте
        dispatch({ 
          type: `${ACTION_TYPES.CONTRIBUTE_TO_SECT}_SUCCESS`, 
          payload: result 
        });
        
        return result;
      } catch (error) {
        console.error('Ошибка при внесении вклада в секту:', error);
        dispatch({ 
          type: `${ACTION_TYPES.CONTRIBUTE_TO_SECT}_ERROR`, 
          payload: error.message 
        });
        throw error;
      }
    },
    
    trainSectMember: async (userId, memberId, duration) => {
      try {
        // Тренируем члена секты
        const result = await sectService.trainWithMember(userId, memberId, duration);
        
        // Обновляем энергию пользователя
        dispatch({ 
          type: ACTION_TYPES.UPDATE_CULTIVATION, 
          payload: { 
            energy: state.player.cultivation.energy - result.energySpent,
            experience: state.player.cultivation.experience + result.userGainedXP
          } 
        });
        
        // Находим текущее значение лояльности
        const sectData = state.sect?.sect;
        let currentLoyalty = 0;
        
        if (sectData && Array.isArray(sectData.members)) {
          const member = sectData.members.find(m => m.id === memberId);
          if (member) {
            currentLoyalty = member.loyalty || 0;
          }
        }
        
        // Ограничиваем прирост лояльности до максимального значения 10
        const loyaltyIncrease = result.memberLoyalty - currentLoyalty;
        const cappedLoyaltyIncrease = Math.min(10, loyaltyIncrease);
        const cappedLoyalty = currentLoyalty + cappedLoyaltyIncrease;
        
        console.log(`✅ Лояльность ограничена: Текущая=${currentLoyalty}, Прирост=${loyaltyIncrease}, Макс.прирост=10, Новая=${cappedLoyalty}`);
        
        // Обновляем информацию о члене секты с ограниченной лояльностью
        dispatch({ 
          type: `${ACTION_TYPES.TRAIN_SECT_MEMBER}_SUCCESS`, 
          payload: {
            memberId,
            memberLevel: result.memberLevel,
            memberExperience: result.memberExperience,
            memberRequiredExperience: result.memberRequiredExperience,
            memberRole: result.memberRole,
            memberLoyalty: cappedLoyalty // Используем ограниченное значение лояльности
          } 
        });
        
        // Синхронизируем лояльность секты с социальными отношениями
        // Находим члена секты в данных секты
        if (sectData && Array.isArray(sectData.members)) {
          const member = sectData.members.find(m => m.id === memberId);
          if (member && member.name) {
            console.log(`🔄 Синхронизация лояльности -> отношения для ${member.name}: ${cappedLoyalty}`);
            // Используем централизованную функцию синхронизации с ограниченным значением лояльности
            dispatch({ 
              type: ACTION_TYPES.UPDATE_RELATIONSHIP_AND_LOYALTY, 
              payload: {
                name: member.name,
                value: cappedLoyalty
              }
            });
          }
        }
        
        // Возвращаем результат с ограниченной лояльностью
        return {
          ...result,
          memberLoyalty: cappedLoyalty
        };
      } catch (error) {
        console.error('Ошибка при тренировке члена секты:', error);
        dispatch({ 
          type: `${ACTION_TYPES.TRAIN_SECT_MEMBER}_ERROR`, 
          payload: error.message 
        });
        throw error;
      }
    },
    
    joinSect: async (userId, sectId) => {
      try {
        // Присоединяемся к секте
        const result = await sectService.joinSect(userId, sectId);
        
        // Логирование и проверка sectId перед вызовом getSectById
        console.log(`joinSect: готовимся загрузить информацию о секте с ID=${sectId}, тип: ${typeof sectId}`);
        
        // Проверка, чтобы избежать передачи 'available' в getSectById
        if (sectId === 'available' || isNaN(parseInt(sectId))) {
          console.error(`Попытка вызова getSectById с некорректным ID: ${sectId}`);
          throw new Error(`Некорректный ID секты: ${sectId}`);
        }
        
        // Загружаем информацию о секте
        const sectData = await sectService.getSectById(sectId);
        
        // Обновляем информацию о секте
        dispatch({ type: ACTION_TYPES.JOIN_SECT, payload: sectData });
        
        return result;
      } catch (error) {
        console.error('Ошибка при присоединении к секте:', error);
        dispatch({ 
          type: ACTION_TYPES.ADD_NOTIFICATION, 
          payload: { 
            message: 'Не удалось присоединиться к секте: ' + error.message, 
            type: 'error' 
          } 
        });
        throw error;
      }
    },
    
    leaveSect: async (userId) => {
      try {
        // В реальной реализации здесь должен быть метод для выхода из секты
        // await sectService.leaveSect(userId);
        
        // Очищаем информацию о секте
        dispatch({ type: ACTION_TYPES.LEAVE_SECT });
        
        return true;
      } catch (error) {
        console.error('Ошибка при выходе из секты:', error);
        dispatch({ 
          type: ACTION_TYPES.ADD_NOTIFICATION, 
          payload: { 
            message: 'Не удалось выйти из секты: ' + error.message, 
            type: 'error' 
          } 
        });
        throw error;
      }
    },
    
    // Для выбора члена секты для взаимодействия
    selectSectMember: (member) => {
      dispatch({ type: 'SELECT_SECT_MEMBER', payload: member });
    },

  };
  
  // Экспортируем actions в глобальную переменную
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Обновляем actions в глобальном контексте, если контекст уже создан
      if (window.__GAME_CONTEXT__) {
        window.__GAME_CONTEXT__.actions = actions;
      }
      
      // Также экспортируем dispatch отдельно для прямого доступа
      window.__GAME_DISPATCH__ = dispatch;
      
      // Создаём глобальную функцию для принудительного обновления состояния игры
      window.refreshGameState = () => {
        console.log('🔄 Принудительное обновление состояния игры');
        try {
          const stateUpdateEvent = new CustomEvent('game-state-updated', { 
            detail: { timestamp: Date.now(), forced: true } 
          });
          window.dispatchEvent(stateUpdateEvent);
          
          // Возвращаем текущее состояние для удобства
          return window.__GAME_STATE__;
        } catch (error) {
          console.error('Ошибка при обновлении состояния:', error);
          return null;
        }
      };
    }
  }, [actions, dispatch]); // Выполняем при изменении actions или dispatch
  
  // Возвращаем провайдер с состоянием и действиями
  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
};
