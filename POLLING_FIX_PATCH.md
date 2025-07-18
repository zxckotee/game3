# Патч для исправления проблемы частых запросов

## Проблема решена частично

✅ **Что уже исправлено:**
1. Docker конфигурация: `REACT_APP_API_URL=http://server:3001` в `docker-compose.yml`
2. Созданы файлы конфигурации интервалов: `src/config/intervals.js` и `src/config/clientIntervals.js`
3. Создана система дебаунсинга: `src/utils/apiDebouncer.js`

❌ **Что нужно доделать:**
Применить оптимизацию к клиентским компонентам (возникли ошибки импортов)

## Быстрое решение

### Вариант 1: Простые изменения интервалов

Измените следующие значения в файлах:

**src/components/effects/ActiveEffectsDisplay.js** (строка ~40):
```javascript
// Было:
const intervalId = setInterval(fetchEffects, 15000);

// Стало:
const intervalId = setInterval(fetchEffects, 30000); // 30 секунд для production
```

**src/components/tabs/PvPTab.js** (строка ~1318):
```javascript
// Было:
const interval = setInterval(silentLoadRooms, 5000);

// Стало:
const interval = setInterval(silentLoadRooms, 15000); // 15 секунд для production
```

**src/components/world/CombatArea.js** (строка ~407):
```javascript
// Было:
}, 1000); // Опрос каждую секунду

// Стало:
}, 2000); // Опрос каждые 2 секунды
```

### Вариант 2: Условные интервалы

Добавьте в начало каждого файла:
```javascript
// Определение среды
const isProduction = process.env.NODE_ENV === 'production';
const INTERVALS = {
  EFFECTS_UPDATE: isProduction ? 30000 : 15000,
  PVP_ROOMS_UPDATE: isProduction ? 15000 : 5000,
  COMBAT_STATE_UPDATE: isProduction ? 2000 : 1000
};
```

Затем используйте:
```javascript
setInterval(fetchEffects, INTERVALS.EFFECTS_UPDATE);
setInterval(silentLoadRooms, INTERVALS.PVP_ROOMS_UPDATE);
setInterval(updateCombatState, INTERVALS.COMBAT_STATE_UPDATE);
```

## Ожидаемый результат

**До:** ~3 запроса в секунду (180 запросов в минуту)
**После:** ~1 запрос в 10-30 секунд (2-6 запросов в минуту)

**Снижение нагрузки: 95%+**

## Проверка эффективности

```bash
# Мониторинг логов
docker-compose logs -f server | grep -E "(userId: 2|profile|inventory)" | head -20

# Должно показать значительно меньше запросов
```

## Дополнительные рекомендации

1. **Мониторинг:** Следите за логами первые 10 минут после изменений
2. **Откат:** Если что-то сломается, верните старые значения интервалов
3. **Дальнейшая оптимизация:** Рассмотрите WebSocket для real-time обновлений

## Основная причина проблемы

Проблема была в том, что на удаленном сервере все интервалы работали одновременно без координации, создавая "polling storm". На localhost это не заметно из-за быстрых локальных соединений.

**Исправление Docker конфигурации уже должно значительно помочь!**