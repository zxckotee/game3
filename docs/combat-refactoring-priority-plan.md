# План приоритетного рефакторинга Combat Service

## 🎯 ЦЕЛЬ РЕФАКТОРИНГА

Интегрировать Combat Service с централизованной системой характеристик (CharacterStatsService) для обеспечения консистентности, устранения дублирования кода и корректной работы эффектов экипировки в PvE боях.

## 📊 ПРИОРИТИЗАЦИЯ ЗАДАЧ

### 🔴 КРИТИЧЕСКИЙ ПРИОРИТЕТ (Блокирующие проблемы)

#### 1. Унификация формул HP/Energy
**Проблема**: Дублирование формул в `startCombat()` и `_recalculateCombatStats()`
**Риск**: Рассинхронизация расчетов, баги с HP/Energy
**Решение**: Перенести формулы в CharacterStatsService

#### 2. Интеграция physicalAttack в расчет урона
**Проблема**: physicalAttack не используется в PvE боях
**Риск**: Характеристика бесполезна, эффекты экипировки не работают
**Решение**: Модифицировать `_calculateDamage()` для использования вторичных характеристик

### 🟡 ВЫСОКИЙ ПРИОРИТЕТ (Функциональные проблемы)

#### 3. Добавление учета защиты в расчет урона
**Проблема**: physicalDefense и spiritualDefense не учитываются
**Риск**: Неполная боевая механика, дисбаланс
**Решение**: Интегрировать защиту в формулу урона

#### 4. Унификация логики эффектов
**Проблема**: Дублирование логики между Combat Service и PvP Service
**Риск**: Сложность поддержки, рассинхронизация
**Решение**: Создать общую систему обработки эффектов

### 🟢 СРЕДНИЙ ПРИОРИТЕТ (Архитектурные улучшения)

#### 5. Упрощение определения типов эффектов
#### 6. Создание общих интерфейсов
#### 7. Упрощение структуры состояния боя

## 🚀 ПЛАН РЕАЛИЗАЦИИ

### ЭТАП 1: Критические исправления (1-2 дня)

#### Задача 1.1: Создание унифицированных функций HP/Energy в CharacterStatsService

**Файл**: `src/services/character-stats-service.js`

```javascript
/**
 * Рассчитывает максимальное здоровье персонажа
 * @param {number} level - Уровень персонажа
 * @param {number} healthStat - Характеристика здоровья
 * @returns {number} Максимальное здоровье
 */
static calculateMaxHp(level, healthStat) {
  return 100 + (level * 2) + (healthStat * 2);
}

/**
 * Рассчитывает максимальную энергию персонажа
 * @param {number} level - Уровень персонажа
 * @param {number} energyStat - Характеристика энергии
 * @returns {number} Максимальная энергия
 */
static calculateMaxEnergy(level, energyStat) {
  return 50 + (level * 1) + (energyStat * 1);
}

/**
 * Получает полное боевое состояние персонажа для использования в боях
 * @param {number} userId - ID пользователя
 * @param {Object} transaction - Транзакция Sequelize
 * @returns {Promise<Object>} Боевое состояние персонажа
 */
static async getCombatCharacterState(userId, transaction) {
  const combinedState = await this.getCombinedCharacterState(userId, transaction);
  
  const level = combinedState.primary.level || 1;
  const healthStat = combinedState.primary.health || 10;
  const energyStat = combinedState.primary.energy || 50;
  
  return {
    ...combinedState,
    combat: {
      maxHp: this.calculateMaxHp(level, healthStat),
      maxEnergy: this.calculateMaxEnergy(level, energyStat),
      currentHp: this.calculateMaxHp(level, healthStat),
      currentEnergy: this.calculateMaxEnergy(level, energyStat)
    }
  };
}
```

#### Задача 1.2: Обновление Combat Service для использования новых функций

**Файл**: `src/services/combat-service.js`

**Изменения в `startCombat()`**:
```javascript
// БЫЛО:
const calculatedMaxHp = 100 + (playerLevel * 2) + (healthStat * 2);
const calculatedMaxEnergy = 50 + (playerLevel * 1) + (energyStat * 1);

// СТАЛО:
const combatState = await CharacterStatsService.getCombatCharacterState(userId);
const calculatedMaxHp = combatState.combat.maxHp;
const calculatedMaxEnergy = combatState.combat.maxEnergy;
```

**Изменения в `_recalculateCombatStats()`**:
```javascript
// БЫЛО:
const newMaxHp = 100 + (playerLevel * 2) + (healthStat * 2);
const newMaxEnergy = 50 + (playerLevel * 1) + (energyStat * 1);

// СТАЛО:
const newMaxHp = CharacterStatsService.calculateMaxHp(playerLevel, healthStat);
const newMaxEnergy = CharacterStatsService.calculateMaxEnergy(playerLevel, energyStat);
```

#### Задача 1.3: Интеграция physicalAttack в расчет урона

**Файл**: `src/services/combat-service.js`

**Модификация `_calculateDamage()`**:
```javascript
static _calculateDamage(attackerState, defenderState, techniqueDamage = null, damageType = 'physical', actionType = 'attack') {
  // 1. Определяем базовый урон атакующего
  let baseDamage = 0;
  
  if (actionType === 'technique' && techniqueDamage) {
    baseDamage = techniqueDamage;
  } else {
    // Используем physicalAttack или spiritualAttack из вторичных характеристик
    if (damageType === 'physical' && attackerState.secondaryStats?.physicalAttack) {
      baseDamage = attackerState.secondaryStats.physicalAttack;
    } else if (damageType === 'spiritual' && attackerState.secondaryStats?.spiritualAttack) {
      baseDamage = attackerState.secondaryStats.spiritualAttack;
    } else {
      // Fallback к старой формуле для врагов
      const attackerLevel = attackerState.baseStats?.level || attackerState.enemyLevel || 1;
      const defenderMaxHp = defenderState.maxHp || 100;
      const damagePercent = 10 + attackerLevel;
      baseDamage = Math.floor((defenderMaxHp * damagePercent) / 100);
    }
  }
  
  // 2. Применяем защиту
  let defense = 0;
  if (damageType === 'physical' && defenderState.secondaryStats?.physicalDefense) {
    defense = defenderState.secondaryStats.physicalDefense;
  } else if (damageType === 'spiritual' && defenderState.secondaryStats?.spiritualDefense) {
    defense = defenderState.secondaryStats.spiritualDefense;
  }
  
  // 3. Рассчитываем финальный урон
  let finalDamage = Math.max(1, baseDamage - defense);
  
  // 4. Остальная логика (критические удары, уклонение, эффекты)
  // ... существующий код
  
  return {
    damage: finalDamage,
    baseDamage: baseDamage,
    defense: defense,
    // ... остальные поля
  };
}
```

### ЭТАП 2: Функциональные улучшения (2-3 дня)

#### Задача 2.1: Создание унифицированной системы эффектов

**Файл**: `src/services/character-stats-service.js`

```javascript
/**
 * Применяет боевые эффекты к состоянию сущности
 * @param {Object} entityState - Состояние сущности
 * @param {Array} effects - Массив эффектов
 * @param {number} deltaTime - Время с последнего применения (в секундах)
 * @returns {Object} Результат применения эффектов
 */
static applyCombatEffects(entityState, effects, deltaTime = 1) {
  const results = {
    healthChange: 0,
    energyChange: 0,
    appliedEffects: [],
    expiredEffects: []
  };
  
  // Унифицированная логика для Combat и PvP
  // ...
  
  return results;
}

/**
 * Обновляет длительность эффектов
 * @param {Array} effects - Массив эффектов
 * @returns {Array} Обновленный массив эффектов
 */
static updateEffectsDuration(effects) {
  const now = Date.now();
  return effects.filter(effect => {
    if (effect.permanent) return true;
    if (!effect.durationMs || !effect.startTime) return true;
    return (now - effect.startTime) < effect.durationMs;
  });
}
```

#### Задача 2.2: Обновление Combat Service для использования унифицированных эффектов

**Замена `applyPeriodicEffects()` и `updateEffectsDuration()`**:
```javascript
// В Combat Service
static applyPeriodicEffects(entityState, ticks, entityName = 'Сущность') {
  return CharacterStatsService.applyCombatEffects(entityState, entityState.effects, ticks);
}

static updateEffectsDuration(entityState) {
  const initialCount = entityState.effects.length;
  entityState.effects = CharacterStatsService.updateEffectsDuration(entityState.effects);
  return entityState.effects.length !== initialCount;
}
```

### ЭТАП 3: Архитектурные улучшения (3-4 дня)

#### Задача 3.1: Создание общих интерфейсов

**Файл**: `src/services/combat-interfaces.js`

```javascript
/**
 * Интерфейс для боевой сущности
 */
class CombatEntity {
  constructor(baseStats, secondaryStats, effects = []) {
    this.baseStats = baseStats;
    this.secondaryStats = secondaryStats;
    this.effects = effects;
    this.currentHp = 0;
    this.maxHp = 0;
    this.currentEnergy = 0;
    this.maxEnergy = 0;
  }
  
  applyEffect(effect) {
    // Унифицированная логика применения эффекта
  }
  
  calculateDamage(target, damageType = 'physical') {
    // Унифицированная логика расчета урона
  }
}

/**
 * Интерфейс для боевого действия
 */
class CombatAction {
  constructor(type, source, target, data = {}) {
    this.type = type; // 'attack', 'technique', 'defense'
    this.source = source;
    this.target = target;
    this.data = data;
  }
  
  execute() {
    // Выполнение действия
  }
}
```

#### Задача 3.2: Упрощение структуры состояния боя

**Новая структура playerState/enemyState**:
```javascript
const entityState = {
  // Базовая информация
  id: userId,
  type: 'player', // или 'enemy'
  level: 1,
  
  // Характеристики
  baseStats: {},
  modifiedStats: {},
  secondaryStats: {},
  
  // Боевое состояние
  currentHp: 0,
  maxHp: 0,
  currentEnergy: 0,
  maxEnergy: 0,
  
  // Эффекты и способности
  effects: [],
  techniques: [],
  
  // Метаданные
  lastActionTime: null,
  status: 'active' // 'active', 'defeated', 'stunned'
};
```

## 🧪 ПЛАН ТЕСТИРОВАНИЯ

### Критические тесты (после каждого этапа)

#### Тесты Этапа 1:
```javascript
describe('Combat Service HP/Energy Integration', () => {
  test('HP calculation consistency', async () => {
    const userId = 1;
    const combatState = await CharacterStatsService.getCombatCharacterState(userId);
    const combat = await CombatService.startCombat(userId, 'enemy1');
    
    expect(combat.player_state.maxHp).toBe(combatState.combat.maxHp);
  });
  
  test('physicalAttack affects damage', async () => {
    // Тест что physicalAttack влияет на урон
  });
  
  test('defense reduces damage', async () => {
    // Тест что защита уменьшает урон
  });
});
```

#### Тесты Этапа 2:
```javascript
describe('Unified Effects System', () => {
  test('effects consistency between PvE and PvP', () => {
    // Тест консистентности эффектов
  });
  
  test('equipment effects work in combat', () => {
    // Тест работы эффектов экипировки в бою
  });
});
```

### Регрессионные тесты:
```javascript
describe('Combat Service Regression', () => {
  test('existing combats still work', () => {
    // Тест что существующие бои не сломались
  });
  
  test('techniques work as before', () => {
    // Тест что техники работают как раньше
  });
});
```

## 📋 ЧЕКЛИСТ ВЫПОЛНЕНИЯ

### Этап 1: Критические исправления
- [ ] Создать `calculateMaxHp()` в CharacterStatsService
- [ ] Создать `calculateMaxEnergy()` в CharacterStatsService
- [ ] Создать `getCombatCharacterState()` в CharacterStatsService
- [ ] Обновить `startCombat()` для использования новых функций
- [ ] Обновить `_recalculateCombatStats()` для использования новых функций
- [ ] Модифицировать `_calculateDamage()` для использования physicalAttack
- [ ] Добавить учет защиты в расчет урона
- [ ] Написать тесты для критических изменений
- [ ] Провести тестирование на dev окружении

### Этап 2: Функциональные улучшения
- [ ] Создать `applyCombatEffects()` в CharacterStatsService
- [ ] Создать `updateEffectsDuration()` в CharacterStatsService
- [ ] Обновить Combat Service для использования унифицированных эффектов
- [ ] Протестировать совместимость с PvP Service
- [ ] Написать тесты для эффектов
- [ ] Провести интеграционное тестирование

### Этап 3: Архитектурные улучшения
- [ ] Создать общие интерфейсы для боевых операций
- [ ] Упростить структуру состояния боя
- [ ] Рефакторить сложные функции
- [ ] Обновить документацию
- [ ] Провести полное тестирование системы

## ⚠️ РИСКИ И МИТИГАЦИЯ

### Высокие риски:
1. **Поломка существующих боев**
   - Митигация: Поэтапное внедрение с feature flags
   - Откат: Сохранение старых функций как fallback

2. **Изменение баланса игры**
   - Митигация: Тщательная настройка параметров урона
   - Мониторинг: Логирование изменений урона

3. **Регрессии в PvP системе**
   - Митигация: Изоляция изменений, отдельные тесты
   - Валидация: Проверка PvP после каждого изменения

### Средние риски:
1. **Производительность**
   - Митигация: Профилирование критических путей
   - Оптимизация: Кэширование расчетов

2. **Совместимость данных**
   - Митигация: Миграции для существующих боев
   - Валидация: Проверка целостности данных

## 🎯 КРИТЕРИИ УСПЕХА

### Функциональные:
- [ ] physicalAttack влияет на урон в PvE боях
- [ ] Защита корректно уменьшает урон
- [ ] Эффекты экипировки работают в боях
- [ ] HP/Energy рассчитываются консистентно
- [ ] Все существующие бои продолжают работать

### Технические:
- [ ] Устранено дублирование формул
- [ ] Унифицирована логика эффектов
- [ ] Упрощена архитектура Combat Service
- [ ] Покрытие тестами > 80%
- [ ] Производительность не ухудшилась

### Качественные:
- [ ] Код стал более читаемым
- [ ] Упростилось добавление новых эффектов
- [ ] Улучшилась поддерживаемость
- [ ] Документация актуальна

Этот план обеспечивает поэтапный и безопасный рефакторинг Combat Service с минимизацией рисков и максимизацией пользы для системы.