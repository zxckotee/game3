/**
 * Middleware для отслеживания изменений в отношениях и отправки их на сервер
 */
import CharacterProfileService from '../../services/character-profile-service-api';
import ACTION_TYPES from '../actions/actionTypes';

// Список действий, которые могут изменить отношения
const RELATIONSHIP_ACTIONS = [
  ACTION_TYPES.UPDATE_RELATIONSHIP,
  ACTION_TYPES.UPDATE_RELATIONSHIP_AND_LOYALTY,
  ACTION_TYPES.UPDATE_SOCIAL_RELATIONSHIPS,
  ACTION_TYPES.SYNC_SECT_TO_SOCIAL,
  ACTION_TYPES.SYNC_SOCIAL_TO_SECT,
  ACTION_TYPES.UPDATE_SECT_LOYALTY
];

// Список действий рынка, которые нужно отслеживать
const MARKET_ACTIONS = [
  ACTION_TYPES.BUY_MARKET_ITEM,
  ACTION_TYPES.SELL_MARKET_ITEM
];

// Список действий, связанных с изменением валюты
const CURRENCY_ACTIONS = [
  ACTION_TYPES.UPDATE_CURRENCY
];

// Переменные для дебаунсинга
let debounceTimeout = null;
let isUpdateScheduled = false;

// Добавляем прослушиватель DOM-событий для действий рынка
if (typeof document !== 'undefined') {
  document.addEventListener('redux-action', (event) => {
    if (event && event.detail && MARKET_ACTIONS.includes(event.detail.type)) {
      console.log(`[RelationshipsMiddleware] Получено событие: ${event.detail.type} через DOM-события`);
      
      // Обрабатываем рыночное действие
      setTimeout(async () => {
        try {
          // Получаем userId из localStorage или других источников
          const userId = parseInt(localStorage.getItem('userId') || '1');
          
          // Получаем отношения из localStorage или другого хранилища
          const gameState = JSON.parse(localStorage.getItem('gameState') || '{}');
          const relationships = gameState?.player?.social?.relationships || [];
          
          console.log(`[RelationshipsMiddleware] Отправка отношений после рыночной операции через DOM-событие`);
          await CharacterProfileService.updateRelationships(userId, relationships);
          console.log(`[RelationshipsMiddleware] Отношения успешно обновлены после рыночной операции через DOM-событие`);
        } catch (error) {
          console.error(`[RelationshipsMiddleware] Ошибка при обновлении отношений после рыночной операции:`, error);
        }
      }, 500);
    }
  });
}

/**
 * Middleware для отслеживания изменений в отношениях
 * @param {Object} store - Redux store
 * @returns {Function} - middleware функция
 */
export const relationshipsMiddleware = store => next => action => {
  // Сначала выполняем действие
  const result = next(action);
  
  // Проверяем, было ли это действие связано с отношениями
  if (RELATIONSHIP_ACTIONS.includes(action.type)) {
    // Реализуем дебаунсинг для предотвращения частых запросов
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    if (!isUpdateScheduled) {
      console.log(`[RelationshipsMiddleware] Запланировано обновление отношений после действия ${action.type}`);
      isUpdateScheduled = true;
    }
    
    // Создаем дебаунсированную версию обновления профиля
    const debouncedProfileUpdate = createDebouncedProfileUpdate(
      CharacterProfileServiceAPI.updateCharacterProfile,
      action.payload.userId
    );

    debounceTimeout = setTimeout(async () => {
      try {
        const state = store.getState();
        const relationships = state.player.social?.relationships || [];
        const userId = state.player?.id || parseInt(localStorage.getItem('userId') || '1');
        
        console.log(`[RelationshipsMiddleware] Отправка обновленных отношений на сервер (количество: ${relationships.length})`);
        
        // Отправляем обновленные отношения на сервер
        await CharacterProfileService.updateRelationships(userId, relationships);
        
        console.log(`[RelationshipsMiddleware] Отношения успешно обновлены на сервере`);
      } catch (error) {
        console.error(`[RelationshipsMiddleware] Ошибка при обновлении отношений:`, error);
        
        // Можно реализовать механизм повторных попыток
        retryUpdateRelationships(store);
      } finally {
        isUpdateScheduled = false;
      }
    }, 300); // Задержка в 300мс для дебаунсинга
  }
  
  // Также отслеживаем действия покупки/продажи предметов на рынке
  if (MARKET_ACTIONS.includes(action.type)) {
    console.log(`[RelationshipsMiddleware] Обнаружена операция на рынке: ${action.type}`);
    
    // Используем отдельный таймаут для рыночных операций
    setTimeout(async () => {
      try {
        const state = store.getState();
        const relationships = state.player.social?.relationships || [];
        const userId = state.player?.id || parseInt(localStorage.getItem('userId') || '1');
        
        console.log(`[RelationshipsMiddleware] Отправка отношений после рыночной операции`);
        await CharacterProfileService.updateRelationships(userId, relationships);
        console.log(`[RelationshipsMiddleware] Отношения успешно обновлены после рыночной операции`);
      } catch (error) {
        console.error(`[RelationshipsMiddleware] Ошибка при обновлении отношений после рыночной операции:`, error);
      }
    }, 500);
  }
  
  // Отслеживаем действия изменения валюты
  if (CURRENCY_ACTIONS.includes(action.type)) {
    console.log(`[RelationshipsMiddleware] Обнаружено изменение валюты: ${action.type}`, action.payload);
    
    // Используем отдельный таймаут для операций с валютой
    setTimeout(async () => {
      try {
        const state = store.getState();
        const relationships = state.player.social?.relationships || [];
        const userId = state.player?.id || parseInt(localStorage.getItem('userId') || '1');
        
        console.log(`[RelationshipsMiddleware] Отправка отношений после изменения валюты. UserId: ${userId}, Relationships:`, relationships);
        
        // Получаем текущую валюту для логирования
        const currency = state.player.currency || {};
        console.log(`[RelationshipsMiddleware] Текущая валюта:`, currency);
        
        // Отправляем обновленные отношения на сервер
        const result = await CharacterProfileService.updateRelationships(userId, relationships);
        console.log(`[RelationshipsMiddleware] Отношения успешно обновлены после изменения валюты. Результат:`, result);
      } catch (error) {
        console.error(`[RelationshipsMiddleware] Ошибка при обновлении отношений после изменения валюты:`, error);
        
        // Можно реализовать механизм повторных попыток
        retryUpdateRelationships(store, 3, 'CURRENCY_UPDATE');
      }
    }, 300);
  }
  
  return result;
};

/**
 * Механизм повторных попыток для обновления отношений
 * @param {Object} store - Redux store
 * @param {number} attempts - Количество оставшихся попыток
 * @param {string} source - Источник запроса повторной попытки для логирования
 */
function retryUpdateRelationships(store, attempts = 3, source = 'UNKNOWN') {
  if (attempts <= 0) {
    console.error(`[RelationshipsMiddleware] Превышено максимальное количество попыток обновления отношений (источник: ${source})`);
    return;
  }
  
  setTimeout(async () => {
    try {
      const state = store.getState();
      const relationships = state.player.social?.relationships || [];
      const userId = state.player?.id || parseInt(localStorage.getItem('userId') || '1');
      
      console.log(`[RelationshipsMiddleware] Повторная попытка обновления отношений (источник: ${source}, осталось попыток: ${attempts})`);
      await CharacterProfileService.updateRelationships(userId, relationships);
      console.log(`[RelationshipsMiddleware] Успешно обновлены отношения после повторной попытки (источник: ${source})`);
    } catch (error) {
      console.error(`[RelationshipsMiddleware] Ошибка при повторной попытке (источник: ${source}):`, error);
      retryUpdateRelationships(store, attempts - 1, source);
    }
  }, 1000); // Ожидаем 1 секунду перед повторной попыткой
}

export default relationshipsMiddleware;