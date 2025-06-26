# Пример реализации промежуточного ПО (middleware) для отношений

```javascript
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

// Переменные для дебаунсинга
let debounceTimeout = null;
let isUpdateScheduled = false;

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
    
    debounceTimeout = setTimeout(async () => {
      try {
        const state = store.getState();
        const relationships = state.player.social?.relationships || [];
        const userId = state.player?.id || parseInt(localStorage.getItem('userId') || '1');
        
        console.log(`[RelationshipsMiddleware] Отправка обновленных отношений на сервер (количество: ${relationships.length})`);
        
        // Отправляем обновленные отношения на сервер
        const updateResult = await CharacterProfileService.updateRelationships(userId, relationships);
        
        console.log(`[RelationshipsMiddleware] Отношения успешно обновлены на сервере`);
        
        // Также сохраняем полный профиль для гарантии сохранения всех данных
        try {
          const profileData = {
            // Включаем только те поля, которые действительно нужны для обновления
            relationships: relationships,
            // Добавляем другие важные поля профиля
            reputation: state.player.social?.reputation || {}
          };
          
          await CharacterProfileService.updateCharacterProfile(userId, profileData);
          console.log(`[RelationshipsMiddleware] Полный профиль также обновлен на сервере`);
        } catch (profileError) {
          console.error(`[RelationshipsMiddleware] Ошибка при обновлении полного профиля:`, profileError);
        }
      } catch (error) {
        console.error(`[RelationshipsMiddleware] Ошибка при обновлении отношений:`, error);
        
        // Можно реализовать механизм повторных попыток
        // retryUpdateRelationships(store);
      } finally {
        isUpdateScheduled = false;
      }
    }, 300); // Задержка в 300мс для дебаунсинга
  }
  
  // Также отслеживаем действия покупки/продажи предметов на рынке
  if (action.type === ACTION_TYPES.BUY_MARKET_ITEM || action.type === ACTION_TYPES.SELL_MARKET_ITEM) {
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
  
  return result;
};

/**
 * Механизм повторных попыток для обновления отношений
 * @param {Object} store - Redux store
 * @param {number} attempts - Количество оставшихся попыток
 */
function retryUpdateRelationships(store, attempts = 3) {
  if (attempts <= 0) {
    console.error('[RelationshipsMiddleware] Превышено максимальное количество попыток обновления отношений');
    return;
  }
  
  setTimeout(async () => {
    try {
      const state = store.getState();
      const relationships = state.player.social?.relationships || [];
      const userId = state.player?.id || parseInt(localStorage.getItem('userId') || '1');
      
      console.log(`[RelationshipsMiddleware] Повторная попытка обновления отношений (осталось попыток: ${attempts})`);
      await CharacterProfileService.updateRelationships(userId, relationships);
      console.log(`[RelationshipsMiddleware] Успешно обновлены отношения после повторной попытки`);
    } catch (error) {
      console.error(`[RelationshipsMiddleware] Ошибка при повторной попытке:`, error);
      retryUpdateRelationships(store, attempts - 1);
    }
  }, 1000); // Ожидаем 1 секунду перед повторной попыткой
}

export default relationshipsMiddleware;
```

## Как использовать middleware

1. Создайте файл `src/context/middleware/relationshipsMiddleware.js` с приведенным выше кодом
2. Импортируйте и добавьте middleware в цепочку middleware в `src/context/GameContextProvider.js`:

```javascript
// В начале файла
import relationshipsMiddleware from './middleware/relationshipsMiddleware';

// В функции middlewareEnhancer
const middlewareEnhancer = next => action => {
  // ⚠️ КРИТИЧЕСКИ ВАЖНО: Передаем актуальный state при каждом вызове middleware
  const middlewareAPI = {
    getState: () => state, // Теперь всегда актуальный state, а не замороженный processedState
    dispatch: dispatchBase
  };
  
  // Создаем цепочку middleware
  // Сначала обрабатываем погоду
  const weatherResult = weatherMiddleware(middlewareAPI)(next)(action);
  
  // Затем обрабатываем инвентарь (только если действие прошло weatherMiddleware)
  const inventoryResult = inventoryMiddleware(middlewareAPI)(() => weatherResult)(action);
  
  // В конце обрабатываем отношения
  const relationshipsResult = relationshipsMiddleware(middlewareAPI)(() => inventoryResult)(action);
  
  return relationshipsResult;
};
```

## Модификация MarketTab.js

Для дополнительной надежности можно также модифицировать функции покупки и продажи в MarketTab.js:

```javascript
// В начале файла
import CharacterProfileService from '../../services/character-profile-service-api';

// В функции handleBuyItem после успешной покупки
if (result.success) {
  // Существующий код...
  
  // Отправляем отношения на сервер
  try {
    const relationships = state.player.social?.relationships || [];
    await CharacterProfileService.updateRelationships(userId, relationships);
    console.log('Отношения обновлены на сервере после покупки товара');
  } catch (error) {
    console.error('Ошибка при обновлении отношений после покупки:', error);
  }
}

// Аналогично в функции handleSellItem