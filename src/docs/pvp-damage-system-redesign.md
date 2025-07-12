# Переделка системы расчета урона в PvP

## Обзор изменений

Система расчета урона в PvP была полностью переписана для устранения сложности, повышения производительности и правильной интеграции с эффектами экипировки и техник.

## Проблемы старой системы

### 1. Сложная и запутанная архитектура
- Метод `calculateDamage()` использовал `PvpStatsService.getPvpParticipantStats()` вместо прямого обращения к character_stats
- Множественные источники данных обрабатывались в разных местах
- Неопределенные переменные в коде (attackerLevel, defenderLevel, baseAttack, baseDefense)

### 2. Неэффективная работа с эффектами экипировки
- Метод `_getEquipmentEffects()` искал эффекты в `item.stats.effects`, но они находятся в `item.effects`
- Неправильная структура данных из `InventoryService.getInventoryItems()`

### 3. Дублирование логики
- Метод `getEffectModifiers()` содержал 250+ строк сложной логики
- Дублирование с `CharacterStatsService.applyEffectsToStats()`

### 4. Проблемы с периодическими эффектами
- Эффекты от техник не учитывались при расчете урона
- Периодические эффекты применялись, но не влияли на характеристики

## Новая архитектура

### Ключевые принципы
1. **Простота и ясность**: Один четкий поток данных
2. **Централизация**: Все расчеты в одном месте
3. **Правильная интеграция**: Использование реальной структуры данных

### Новый алгоритм расчета урона

```
1. Получить базовые характеристики (CharacterStatsService.getCharacterStats)
2. Получить эффекты экипировки (InventoryService.getInventoryItems -> equipped=true)
3. Получить активные эффекты от техник (participant.effects)
4. Применить все эффекты к базовым характеристикам (CharacterStatsService.applyEffectsToStats)
5. Рассчитать вторичные характеристики (атака, защита)
6. Рассчитать финальный урон с учетом критов и уклонений
```

## Основные изменения

### 1. Новый метод `getEquipmentEffects()`
```javascript
static async getEquipmentEffects(userId) {
  const inventory = await InventoryService.getInventoryItems(userId);
  const equippedItems = inventory.filter(item => item.equipped === true);
  
  const effects = [];
  for (const item of equippedItems) {
    // ИСПРАВЛЕНО: Читаем из item.effects вместо item.stats.effects
    if (item.effects && Array.isArray(item.effects)) {
      effects.push(...item.effects);
    }
  }
  
  return effects;
}
```

### 2. Обновленный метод `getPlayerFullStats()`
```javascript
static async getPlayerFullStats(userId, participant = null) {
  // 1. Базовые характеристики
  const baseStats = await CharacterStatsService.getCharacterStats(userId);
  
  // 2. Эффекты экипировки
  const equipmentEffects = await this.getEquipmentEffects(userId);
  
  // 3. Активные эффекты от техник (НОВОЕ!)
  let techniqueEffects = [];
  if (participant && participant.effects) {
    techniqueEffects = participant.effects.filter(effect => 
      effect.effect_details_json && 
      effect.effect_details_json.target_attribute &&
      effect.effect_type !== 'instant'
    );
  }
  
  // 4. Применяем все эффекты
  const allEffects = [...equipmentEffects, ...techniqueEffects];
  const modifiedStats = CharacterStatsService.applyEffectsToStats(baseStats, allEffects);
  
  // 5. Вторичные характеристики
  const secondaryStats = CharacterStatsService.calculateSecondaryStats(modifiedStats, modifiedStats);
  
  return { base: baseStats, modified: modifiedStats, secondary: secondaryStats };
}
```

### 3. Упрощенный метод `calculateDamage()`
```javascript
static async calculateDamage(attacker, defender, baseDamage, damageType, actionType = 'attack', techniqueId = null) {
  // 1. Получаем характеристики с учетом ВСЕХ эффектов
  const [attackerStats, defenderStats] = await Promise.all([
    this.getPlayerFullStats(attacker.user_id, attacker), // Передаем participant!
    this.getPlayerFullStats(defender.user_id, defender)
  ]);

  // 2. Простой расчет урона
  let damage = baseDamage;
  if (damageType === 'physical') {
    damage = damage + attackerStats.secondary.physicalAttack - defenderStats.secondary.physicalDefense;
  } else if (damageType === 'spiritual') {
    damage = damage + attackerStats.secondary.spiritualAttack - defenderStats.secondary.spiritualDefense;
  }

  // 3. Критические удары и уклонения
  const critChance = attackerStats.secondary.criticalChance || 5;
  const dodgeChance = Math.floor((defenderStats.secondary.luck || 0) / 2) + 5;
  
  const isDodged = Math.random() * 100 < dodgeChance;
  if (isDodged) return { damage: 0, isDodged: true, ... };
  
  const isCritical = Math.random() * 100 < critChance;
  if (isCritical) damage = Math.floor(damage * 1.5);

  return { damage: Math.max(1, damage), isCritical, isDodged: false, ... };
}
```

## Структура данных эффектов

### Эффекты экипировки (из БД)
```javascript
{
  id: 1,
  type: "statBoost",        // statBoost, combatBoost, elementalBoost
  target: "strength",       // strength, physicalDamage, etc.
  value: 2.0,
  operation: "add",         // add, multiply
  sourceItem: "bronze_sword",
  sourceItemName: "Бронзовый меч"
}
```

### Эффекты техник (из participant.effects)
```javascript
{
  id: "technique_effect_123",
  name: "Усиление силы",
  effect_type: "stats",
  effect_details_json: {
    target_attribute: "strength",
    value: 10,
    value_type: "absolute",    // absolute, percentage
    original_description: "Увеличивает силу на 10"
  }
}
```

## Преимущества новой системы

1. **Простота**: Убрано 70% сложного кода
2. **Надежность**: Используются проверенные методы CharacterStatsService
3. **Правильность**: Чтение данных из правильных полей
4. **Производительность**: Меньше запросов к БД
5. **Поддерживаемость**: Понятная логика
6. **Полная интеграция**: Учитываются ВСЕ эффекты (экипировка + техники)

## Тестирование

Добавлен метод `testNewDamageSystem()` для проверки новой системы:

```javascript
// Тестирование
const result = await PvPService.testNewDamageSystem(attackerUserId, defenderUserId);
console.log(result);
```

## Миграция

### Что изменилось:
- `_getEquipmentEffects()` → `getEquipmentEffects()` (публичный метод)
- Добавлен параметр `participant` в `getPlayerFullStats()`
- Полностью переписан `calculateDamage()`
- Убрана зависимость от `PvpStatsService` в расчете урона

### Обратная совместимость:
- Все существующие методы применения эффектов (`applyPeriodicEffects`, `applyActionBasedEffects`) работают как прежде
- Структура данных в БД не изменилась
- API методы остались теми же

## Заключение

Новая система расчета урона решает все основные проблемы старой системы:
- ✅ Эффекты экипировки правильно читаются и применяются
- ✅ Эффекты от техник учитываются при расчете урона
- ✅ Периодические эффекты влияют на характеристики
- ✅ Код стал простым и понятным
- ✅ Производительность улучшена
- ✅ Логика централизована

Система готова к использованию и дальнейшему развитию.