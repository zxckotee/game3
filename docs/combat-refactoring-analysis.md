# Анализ дублирующих расчетов в боевых системах

## Обзор проблемы

После анализа [`combat-service.js`](../src/services/combat-service.js) и [`pvp-service.js`](../src/services/pvp-service.js) выявлены значительные дублирования логики расчета характеристик и применения эффектов. Оба сервиса реализуют собственные версии функций, которые уже централизованы в [`CharacterStatsService`](../src/services/character-stats-service.js).

## Выявленные дублирования

### 1. Расчет характеристик игрока

#### Combat Service (строки 67-97)
```javascript
// Получаем полное состояние игрока, включая все модификаторы
const fullPlayerStats = await CharacterStatsService.getCombinedCharacterState(userId);

// Рассчитываем здоровье по формуле: 100 + (level * 2) + (health * 2)
const playerLevel = fullPlayerStats.base.level || 1;
const healthStat = fullPlayerStats.modified.health || 10;
const calculatedMaxHp = 100 + (playerLevel * 2) + (healthStat * 2);

// Рассчитываем энергию аналогично
const energyStat = fullPlayerStats.modified.energy || 50;
const calculatedMaxEnergy = 50 + (playerLevel * 1) + (energyStat * 1);
```

**Проблема**: Combat Service правильно использует `CharacterStatsService.getCombinedCharacterState()`, но затем дублирует формулы расчета HP/Energy.

#### PvP Service
PvP Service не использует централизованные функции `CharacterStatsService` и имеет собственную логику применения эффектов.

### 2. Применение эффектов

#### Combat Service (строки 466-506)
```javascript
static _recalculateCombatStats(entityState) {
  // 1. Применяем эффекты к базовым характеристикам
  const modifiedStats = CharacterStatsService.applyEffectsToStats(
    entityState.baseStats,
    entityState.effects || []
  );

  // 2. Пересчитываем вторичные характеристики на основе модифицированных
  const secondaryStats = CharacterStatsService.calculateSecondaryStats(
    modifiedStats,
    modifiedStats
  );
}
```

**Хорошо**: Combat Service правильно использует централизованные функции.

#### PvP Service (строки 189-522)
```javascript
static async applyPeriodicEffects(participant, transaction) {
  // Собственная логика применения эффектов
  // Дублирует функциональность CharacterStatsService.applyEffectsToStats
}
```

**Проблема**: PvP Service имеет собственную сложную логику применения эффектов, которая дублирует и конфликтует с `CharacterStatsService`.

### 3. Расчет урона

#### Combat Service (строки 519-627)
```javascript
static _calculateDamage(attackerState, defenderState, techniqueDamage = null, damageType = 'physical', actionType = 'attack') {
  // Собственная логика расчета урона
  // Использует вторичные характеристики из CharacterStatsService
}
```

#### PvP Service
PvP Service имеет собственную логику расчета урона, которая не использует централизованные вторичные характеристики.

### 4. Обработка периодических эффектов

#### Combat Service (строки 743-948)
```javascript
static applyPeriodicEffects(entityState, ticks, entityName = 'Сущность') {
  // Собственная логика периодических эффектов
}
```

#### PvP Service (строки 189-522)
```javascript
static async applyPeriodicEffects(participant, transaction) {
  // Другая реализация периодических эффектов
}
```

**Проблема**: Две разные реализации одной и той же логики с разными результатами.

## Архитектурные проблемы

### 1. Нарушение принципа DRY (Don't Repeat Yourself)
- Одинаковая логика реализована в нескольких местах
- Изменения требуют модификации в нескольких файлах
- Высокий риск рассинхронизации логики

### 2. Несогласованность данных
- Combat Service использует `CharacterStatsService` частично
- PvP Service игнорирует централизованные расчеты
- Разные формулы для одних и тех же вычислений

### 3. Сложность поддержки
- Трудно отследить, где применяется какая логика
- Баги могут проявляться только в одной из систем
- Сложно добавлять новые типы эффектов

## План рефакторинга

### Этап 1: Унификация интерфейсов

#### 1.1 Создать унифицированные функции в CharacterStatsService
```javascript
// Новые функции для боевых систем
static async getCombatCharacterState(userId, transaction)
static calculateCombatStats(baseStats, effects, level)
static applyBattleEffects(entityState, effects)
static calculateDamage(attackerStats, defenderStats, options)
```

#### 1.2 Стандартизировать структуры данных
```javascript
// Унифицированная структура состояния в бою
const combatEntityState = {
  baseStats: {},      // Базовые характеристики
  modifiedStats: {},  // Модифицированные первичные
  secondaryStats: {}, // Вторичные характеристики
  currentHp: 0,
  maxHp: 0,
  currentEnergy: 0,
  maxEnergy: 0,
  effects: [],
  level: 1
}
```

### Этап 2: Рефакторинг Combat Service

#### 2.1 Заменить дублированные расчеты
- Удалить `_recalculateCombatStats()` 
- Использовать `CharacterStatsService.getCombatCharacterState()`
- Унифицировать формулы HP/Energy

#### 2.2 Стандартизировать применение эффектов
- Заменить `applyPeriodicEffects()` на централизованную версию
- Использовать единую логику для всех типов эффектов

### Этап 3: Рефакторинг PvP Service

#### 3.1 Интеграция с CharacterStatsService
- Заменить `applyPeriodicEffects()` на централизованную версию
- Использовать `CharacterStatsService.applyEffectsToStats()`
- Унифицировать структуры эффектов

#### 3.2 Миграция логики эффектов
- Перенести специфичную для PvP логику в CharacterStatsService
- Сохранить обратную совместимость
- Добавить поддержку PvP-специфичных эффектов

### Этап 4: Тестирование и валидация

#### 4.1 Модульные тесты
- Тесты для новых унифицированных функций
- Тесты совместимости с существующими данными
- Тесты производительности

#### 4.2 Интеграционные тесты
- Тесты боевой системы PvE
- Тесты боевой системы PvP
- Тесты применения эффектов экипировки

## Ожидаемые результаты

### Преимущества
1. **Единообразие**: Все боевые системы используют одну логику
2. **Поддерживаемость**: Изменения в одном месте
3. **Надежность**: Меньше багов из-за рассинхронизации
4. **Расширяемость**: Легче добавлять новые типы эффектов

### Риски
1. **Регрессии**: Изменение поведения существующих систем
2. **Производительность**: Возможное снижение из-за унификации
3. **Совместимость**: Проблемы с существующими данными

## Детальный план реализации

### Шаг 1: Создание унифицированных функций
- [ ] `getCombatCharacterState()` - получение состояния для боя
- [ ] `calculateCombatDamage()` - расчет урона
- [ ] `applyCombatEffects()` - применение боевых эффектов
- [ ] `updateCombatStats()` - обновление характеристик в бою

### Шаг 2: Рефакторинг Combat Service
- [ ] Заменить `startCombat()` на использование новых функций
- [ ] Обновить `_calculateDamage()` 
- [ ] Заменить `_recalculateCombatStats()`
- [ ] Унифицировать `applyPeriodicEffects()`

### Шаг 3: Рефакторинг PvP Service  
- [ ] Интегрировать с `CharacterStatsService`
- [ ] Заменить `applyPeriodicEffects()`
- [ ] Обновить `getEffectModifiers()`
- [ ] Стандартизировать структуры данных

### Шаг 4: Тестирование
- [ ] Создать тесты для новых функций
- [ ] Протестировать Combat Service
- [ ] Протестировать PvP Service
- [ ] Провести интеграционные тесты

### Шаг 5: Документация
- [ ] Обновить API документацию
- [ ] Создать руководство по миграции
- [ ] Документировать новую архитектуру

## Заключение

Рефакторинг боевых систем критически важен для поддерживаемости и надежности кода. Централизация логики в `CharacterStatsService` обеспечит единообразие расчетов и упростит добавление новых функций.

Основной фокус должен быть на сохранении обратной совместимости и тщательном тестировании каждого этапа рефакторинга.