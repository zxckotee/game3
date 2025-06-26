# План реализации отправки PUT запроса при покупке/продаже, изменении валюты и отношений

## Текущая ситуация

В игре уже реализованы:
- Механизм покупки/продажи предметов в marketTab
- Система отношений в state.player.relationShips
- Маршрут API `/api/users/:userId/profile` для обновления профиля пользователя
- Функция `CharacterProfileService.updateRelationships` для отправки отношений на сервер

## Проблема

При покупке/продаже предметов, изменении валюты игрока и при изменении отношений необходимо отправлять PUT запрос на маршрут `/api/users/:userId/profile` для сохранения профиля пользователя на сервере.

## Решение

### 1. Модификация функций покупки и продажи в MarketTab.js

Добавить вызов `CharacterProfileService.updateRelationships` после успешной покупки/продажи товаров:

```javascript
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

// Аналогично в handleSellItem
```

### 2. Отслеживание изменений валюты

Добавить в middleware отслеживание действий по изменению валюты игрока:

```javascript
// Список действий, связанных с изменением валюты
const CURRENCY_ACTIONS = [
  ACTION_TYPES.UPDATE_CURRENCY
];

// В middleware добавить проверку
if (CURRENCY_ACTIONS.includes(action.type)) {
  console.log(`[RelationshipsMiddleware] Обнаружено изменение валюты: ${action.type}`, action.payload);
  
  // Отправляем отношения на сервер после изменения валюты
  setTimeout(async () => {
    try {
      const state = store.getState();
      const relationships = state.player.social?.relationships || [];
      const userId = state.player?.id || parseInt(localStorage.getItem('userId') || '1');
      
      // Логируем текущую валюту для отладки
      const currency = state.player.currency || {};
      console.log(`[RelationshipsMiddleware] Текущая валюта:`, currency);
      
      await CharacterProfileService.updateRelationships(userId, relationships);
      console.log(`[RelationshipsMiddleware] Отношения успешно обновлены после изменения валюты`);
    } catch (error) {
      console.error(`[RelationshipsMiddleware] Ошибка при обновлении отношений после изменения валюты:`, error);
    }
  }, 300);
}
```

### 3. Использование полного сохранения профиля

Хотя у нас есть метод `updateRelationships`, который специально обновляет отношения, можно рассмотреть использование полного обновления профиля для гарантии сохранения всех данных:

```javascript
// Альтернативный подход - сохранение всего профиля
const profileData = {
  name: state.player.name,
  level: state.player.level,
  experience: state.player.experience,
  currency: state.player.inventory.currency,
  reputation: state.player.social?.reputation || {},
  relationships: state.player.social?.relationships || []
};

await CharacterProfileService.updateCharacterProfile(userId, profileData);
```

### 4. Создание промежуточного ПО (middleware) для Redux

Создать middleware для автоматического отслеживания различных действий:

```javascript
const relationshipsMiddleware = store => next => action => {
  // Сначала выполняем действие
  const result = next(action);
  
  // Список действий, которые могут изменить отношения
  const RELATIONSHIP_ACTIONS = [
    ACTION_TYPES.UPDATE_RELATIONSHIP,
    ACTION_TYPES.UPDATE_RELATIONSHIP_AND_LOYALTY,
    ACTION_TYPES.UPDATE_SOCIAL_RELATIONSHIPS,
    ACTION_TYPES.SYNC_SECT_TO_SOCIAL,
    ACTION_TYPES.SYNC_SOCIAL_TO_SECT,
    ACTION_TYPES.UPDATE_SECT_LOYALTY
  ];
  
  // Список действий рынка
  const MARKET_ACTIONS = [
    ACTION_TYPES.BUY_MARKET_ITEM,
    ACTION_TYPES.SELL_MARKET_ITEM
  ];
  
  // Список действий, связанных с валютой
  const CURRENCY_ACTIONS = [
    ACTION_TYPES.UPDATE_CURRENCY
  ];
  
  // Функция для отправки отношений на сервер
  const sendRelationshipsToServer = async (source) => {
    try {
      const state = store.getState();
      const relationships = state.player.social?.relationships || [];
      const userId = state.player?.id || parseInt(localStorage.getItem('userId') || '1');
      
      console.log(`[RelationshipsMiddleware] Отправка отношений после ${source}`);
      await CharacterProfileService.updateRelationships(userId, relationships);
      console.log(`[RelationshipsMiddleware] Отношения успешно обновлены после ${source}`);
    } catch (error) {
      console.error(`[RelationshipsMiddleware] Ошибка при обновлении отношений после ${source}:`, error);
      retryUpdateRelationships(store, 3, source);
    }
  };
  
  // Проверяем тип действия и отправляем отношения соответствующим образом
  if (RELATIONSHIP_ACTIONS.includes(action.type)) {
    // Дебаунсинг для отношений
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => sendRelationshipsToServer(`изменения отношений (${action.type})`), 300);
  } else if (MARKET_ACTIONS.includes(action.type)) {
    // Для рыночных операций
    setTimeout(() => sendRelationshipsToServer(`рыночной операции (${action.type})`), 500);
  } else if (CURRENCY_ACTIONS.includes(action.type)) {
    // Для изменений валюты
    setTimeout(() => sendRelationshipsToServer(`изменения валюты (${action.type})`), 300);
  }
  
  return result;
};
```

## Рекомендации по реализации

1. **Комбинированное решение**: Добавить вызов `updateRelationships` в MarketTab и создать middleware для других действий

2. **Логирование**: Добавить подробное логирование для отслеживания процесса отправки запросов

3. **Обработка ошибок**: Добавить механизм повторных попыток в случае ошибок

4. **Дебаунсинг**: Использовать дебаунсинг для предотвращения излишнего количества запросов при быстрых последовательных изменениях

## Преимущества данного подхода

1. **Надежность**: Гарантирует сохранение данных при любых изменениях (отношения, валюта, рыночные операции)
2. **Минимальное вмешательство**: Не требует значительных изменений в существующий код
3. **Расширяемость**: Легко может быть расширен для других типов действий
4. **Тройная гарантия**: Обновления отправляются при изменении отношений, валюты и рыночных операциях

## Рекомендуемые шаги реализации

1. Создать и интегрировать middleware для Redux
2. Модифицировать функции handleBuyItem и handleSellItem в MarketTab.js
3. Добавить отслеживание действий UPDATE_CURRENCY
4. Тестирование функциональности
5. Мониторинг логов сервера и клиента

## Реализованные изменения

Реализована функциональность отправки запросов при изменении валюты игрока путем:
1. Добавления отслеживания действия ACTION_TYPES.UPDATE_CURRENCY в middleware
2. Реализации механизма повторных попыток с указанием источника ошибки
3. Расширенного логирования для лучшей отладки