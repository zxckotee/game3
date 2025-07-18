# Исправление проблемы частых запросов (Polling Storm)

## Проблема

На удаленном сервере наблюдались частые запросы (3 раза в секунду):
- Аутентификация пользователя zxc (ID: 2)
- Обновление профиля персонажа для пользователя 2
- GET запросы на получение инвентаря от userId: 2
- Обновления валюты через RelationshipsMiddleware
- Постоянные API запросы к ресурсам

## Причины проблемы

1. **Множественные интервалы обновления без координации:**
   - ActiveEffectsDisplay: каждые 15 секунд
   - PvPTab: каждые 5 секунд
   - CombatArea: каждую секунду
   - BattleInterface: каждые 250мс
   - Множество синхронизаторов с разными интервалами

2. **Отсутствие дебаунсинга API запросов:**
   - RelationshipsMiddleware делал частые обновления валюты
   - Achievement API постоянно обновлял профиль и инвентарь
   - Отсутствие кеширования результатов

3. **Неправильная конфигурация Docker:**
   - `REACT_APP_API_URL=http://localhost:3001` вместо `http://server:3001`

4. **Отсутствие различий между development и production:**
   - Одинаковые интервалы для всех сред

## Решение

### 1. Централизованная система интервалов (`src/config/intervals.js`)

Создана единая конфигурация интервалов с разными настройками для development и production:

**Development интервалы:**
- COMBAT_STATE_UPDATE: 1000ms
- EFFECTS_UPDATE: 15000ms
- PVP_ROOMS_UPDATE: 5000ms
- AUTO_SAVE: 300000ms (5 минут)

**Production интервалы (увеличены):**
- COMBAT_STATE_UPDATE: 2000ms (было 1000ms)
- EFFECTS_UPDATE: 30000ms (было 15000ms)
- PVP_ROOMS_UPDATE: 15000ms (было 5000ms)
- AUTO_SAVE: 600000ms (10 минут, было 5)

### 2. Система дебаунсинга (`src/utils/apiDebouncer.js`)

Реализованы утилиты для предотвращения частых запросов:

- **debounce()** - откладывает выполнение до прекращения вызовов
- **throttle()** - ограничивает частоту выполнения
- **debounceApiCall()** - дебаунсинг с кешированием результатов
- **createDebouncedProfileUpdate()** - специально для обновлений профиля
- **createDebouncedInventoryUpdate()** - специально для обновлений инвентаря

### 3. Оптимизированные компоненты

**ActiveEffectsDisplay:**
```javascript
// Было: setInterval(fetchEffects, 15000)
// Стало: throttled версия с настраиваемым интервалом
const throttledFetchEffects = createThrottledUpdate(
  fetchEffects, 
  `effects_${userId}`, 
  getInterval(INTERVAL_TYPES.EFFECTS_UPDATE)
);
```

**PvPTab:**
```javascript
// Было: setInterval(silentLoadRooms, 5000)
// Стало: throttled версия с увеличенным интервалом для production
const throttledSilentLoadRooms = createThrottledUpdate(
  silentLoadRooms, 
  `pvp_rooms_${selectedMode}`, 
  getInterval(INTERVAL_TYPES.PVP_ROOMS_UPDATE)
);
```

**CombatArea:**
```javascript
// Было: setInterval(updateCombatState, 1000)
// Стало: throttled версия с настраиваемым интервалом
const throttledUpdateCombatState = createThrottledUpdate(
  updateCombatState,
  `combat_state_${combatState.id}`,
  getInterval(INTERVAL_TYPES.COMBAT_STATE_UPDATE)
);
```

### 4. Оптимизированный RelationshipsMiddleware

Добавлен дебаунсинг для обновлений валюты и профиля:

```javascript
// Создаем дебаунсированную версию обновления профиля
const debouncedProfileUpdate = createDebouncedProfileUpdate(
  CharacterProfileServiceAPI.updateCharacterProfile,
  action.payload.userId
);
```

### 5. Оптимизированный Achievement API

Добавлен дебаунсинг для запросов профиля и инвентаря:

```javascript
// Дебаунсированные версии API вызовов
const debouncedGetProfile = createDebouncedProfileUpdate(
  CharacterProfileServiceAPI.getCharacterProfile,
  userId
);

const debouncedGetInventory = createDebouncedInventoryUpdate(
  InventoryAdapter.getInventoryItems,
  userId
);
```

### 6. Исправленная Docker конфигурация

```yaml
# Было:
- REACT_APP_API_URL=http://localhost:3001

# Стало:
- REACT_APP_API_URL=http://server:3001
```

## Результат

### Ожидаемое снижение нагрузки:

1. **Production интервалы увеличены в 2-3 раза:**
   - Эффекты: с 15 до 30 секунд (-50% запросов)
   - PvP комнаты: с 5 до 15 секунд (-67% запросов)
   - Автосохранение: с 5 до 10 минут (-50% запросов)

2. **Дебаунсинг API запросов:**
   - Обновления профиля: дебаунс 2 секунды + кеш 1 минута
   - Обновления инвентаря: дебаунс 1.5 секунды + кеш 30 секунд
   - Throttling для частых операций: минимум 3 секунды между запросами

3. **Исправлена сетевая конфигурация Docker**

### Почему на localhost проблемы не было:

1. **Быстрые локальные соединения** маскировали проблему
2. **Отладочные инструменты** могли приостанавливать таймеры
3. **Кеширование браузера** работало эффективнее
4. **Меньше сетевых задержек**

## Мониторинг

Для отслеживания эффективности добавлены логи:

```javascript
console.log(`[IntervalConfig] ${type}: ${interval}ms (${isDevelopment ? 'development' : 'production'})`);
console.log(`[ApiDebouncer] Используем кешированный результат для ${cacheKey}`);
console.log(`[ApiDebouncer] Выполняем API запрос: ${cacheKey}`);
```

## Дополнительные рекомендации

1. **Мониторинг производительности:** Следить за логами сервера после внедрения
2. **Настройка интервалов:** При необходимости можно дополнительно увеличить интервалы в production
3. **WebSocket соединения:** В будущем рассмотреть замену polling на WebSocket для real-time обновлений
4. **Кеширование на сервере:** Добавить Redis для кеширования частых запросов

## Файлы изменены

- `src/config/intervals.js` - новый файл с конфигурацией интервалов
- `src/utils/apiDebouncer.js` - новый файл с утилитами дебаунсинга
- `docker-compose.yml` - исправлен API URL
- `src/components/effects/ActiveEffectsDisplay.js` - добавлен throttling
- `src/components/tabs/PvPTab.js` - добавлен throttling
- `src/components/world/CombatArea.js` - добавлен throttling
- `src/components/pages/GamePage.js` - использование настраиваемых интервалов
- `src/context/middleware/relationshipsMiddleware.js` - добавлен дебаунсинг
- `src/services/achievement-api.js` - добавлен дебаунсинг
- `src/server.js` - использование настраиваемых интервалов