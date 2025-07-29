# План проверки требований для прорыва в культивации

## Анализ моделей и сервисов

### 1. Модель CultivationProgress
**Поля для проверки прорыва:**
- `experience` (INTEGER) - текущий опыт
- `experienceToNextLevel` (INTEGER) - требуемый опыт для следующего уровня
- `energy` (INTEGER) - текущая энергия
- `maxEnergy` (INTEGER) - максимальная энергия
- `bottleneckProgress` (INTEGER) - прогресс бутылочного горлышка
- `requiredBottleneckProgress` (INTEGER) - требуемый прогресс
- `tribulationCompleted` (BOOLEAN) - пройдена ли трибуляция
- `stage` (ENUM) - текущая ступень культивации
- `level` (INTEGER) - текущий уровень

### 2. Модель InventoryItem
**Поля для проверки ресурсов:**
- `userId` (INTEGER) - ID пользователя
- `itemId` (STRING) - ID предмета
- `quantity` (INTEGER) - количество предметов
- `name` (STRING) - название предмета
- `type` (STRING) - тип предмета

### 3. Доступные методы сервисов

#### InventoryService:
- `checkInventoryItem(userId, itemId, quantity)` - проверка наличия предмета
- `removeInventoryItem(userId, itemId, quantity)` - удаление предмета
- `getInventoryItems(userId)` - получение всех предметов пользователя

#### CultivationService:
- `getCultivationProgress(userId)` - получение данных культивации
- `updateCultivationProgress(userId, data)` - обновление данных

## Статические данные ресурсов (скопированы с фронтенда)

```javascript
const getBreakthroughResources = (stage, level) => {
  const stageResourceSets = {
    'Закалка тела': [
      // Набор 1 (уровни 1, 4, 7, 10...)
      {
        'herb_qigathering': { name: 'Трава сбора ци', baseAmount: 5 },
        'mineral_dust': { name: 'Минеральная пыль', baseAmount: 2 }
      },
      // Набор 2 (уровни 2, 5, 8, 11...)
      {
        'herb_ironroot': { name: 'Железный корень', baseAmount: 3 },
        'water_pure': { name: 'Очищенная вода', baseAmount: 2 }
      },
      // Набор 3 (уровни 3, 6, 9, 12...)
      {
        'herb_clearflow': { name: 'Кристальный цветок', baseAmount: 4 },
        'crystal_clear': { name: 'Чистый кристалл', baseAmount: 1 }
      }
    ],
    'Очищение Ци': [
      // Набор 1
      {
        'herb_spiritbloom': { name: 'Духовный цвет', baseAmount: 4 },
        'essence_concentration': { name: 'Эссенция концентрации', baseAmount: 2 },
        'crystal_mind': { name: 'Кристалл разума', baseAmount: 1 }
      },
      // Набор 2
      {
        'herb_goldensage': { name: 'Золотой шалфей', baseAmount: 3 },
        'essence_purity': { name: 'Эссенция чистоты', baseAmount: 2 },
        'metal_celestial': { name: 'Небесный металл', baseAmount: 1 }
      },
      // Набор 3
      {
        'water_spirit': { name: 'Духовная вода', baseAmount: 5 },
        'crystal_formation': { name: 'Кристалл формирования', baseAmount: 2 }
      }
    ],
    'Золотое ядро': [
      // Набор 1
      {
        'herb_soulwhisper': { name: 'Шепот души', baseAmount: 3 },
        'essence_enlightenment': { name: 'Эссенция просветления', baseAmount: 2 },
        'crystal_soul': { name: 'Кристалл души', baseAmount: 1 }
      },
      // Набор 2
      {
        'metal_heavenly': { name: 'Небожительный металл', baseAmount: 2 },
        'essence_heaven': { name: 'Эссенция небес', baseAmount: 1 },
        'crystal_star': { name: 'Звездный кристалл', baseAmount: 1 }
      },
      // Набор 3
      {
        'feather_phoenix': { name: 'Перо феникса', baseAmount: 1 },
        'dust_stardust': { name: 'Звездная пыль', baseAmount: 3 }
      }
    ],
    'Формирование души': [
      // Набор 1
      {
        'spirit_ancient': { name: 'Древний дух', baseAmount: 1 },
        'essence_heaven': { name: 'Эссенция небес', baseAmount: 2 },
        'crystal_star': { name: 'Звездный кристалл', baseAmount: 2 }
      },
      // Набор 2
      {
        'herb_soulwhisper': { name: 'Шепот души', baseAmount: 4 },
        'essence_enlightenment': { name: 'Эссенция просветления', baseAmount: 3 },
        'dust_stardust': { name: 'Звездная пыль', baseAmount: 2 }
      },
      // Набор 3
      {
        'metal_heavenly': { name: 'Небожительный металл', baseAmount: 3 },
        'crystal_soul': { name: 'Кристалл души', baseAmount: 2 },
        'feather_phoenix': { name: 'Перо феникса', baseAmount: 1 }
      }
    ]
  };

  // Получаем наборы ресурсов для текущей стадии
  const stageSets = stageResourceSets[stage] || stageResourceSets['Закалка тела'];
  
  // Определяем какой набор использовать (циклически каждые 3 уровня)
  const setIndex = (level - 1) % 3;
  const resourceSet = stageSets[setIndex];
  
  // Вычисляем множитель на основе уровня
  const multiplier = Math.ceil(level / 3);
  
  // Формируем финальный объект ресурсов
  const finalResources = {};
  Object.keys(resourceSet).forEach(resourceId => {
    const resource = resourceSet[resourceId];
    finalResources[resourceId] = resource.baseAmount * multiplier;
  });
  
  return finalResources;
};
```

## Алгоритм проверки требований для прорыва

### 1. Проверка через CultivationProgress:

```javascript
static async checkBreakthroughRequirements(userId) {
  // 1. Получаем данные культивации
  const cultivation = await CultivationProgress.findOne({ where: { userId } });
  
  if (!cultivation) {
    return { canBreakthrough: false, message: 'Данные о культивации не найдены' };
  }

  const missingRequirements = [];

  // 2. Проверяем опыт
  const hasEnoughExperience = cultivation.experience >= cultivation.experienceToNextLevel;
  if (!hasEnoughExperience) {
    missingRequirements.push(`Недостаточно опыта (${cultivation.experience}/${cultivation.experienceToNextLevel})`);
  }

  // 3. Проверяем энергию (80% от максимума)
  const requiredEnergy = Math.floor(cultivation.maxEnergy * 0.8);
  const hasEnoughEnergy = cultivation.energy >= requiredEnergy;
  if (!hasEnoughEnergy) {
    missingRequirements.push(`Недостаточно энергии (${cultivation.energy}/${requiredEnergy})`);
  }

  // 4. Проверяем бутылочное горлышко
  const passedBottleneck = cultivation.bottleneckProgress >= cultivation.requiredBottleneckProgress;
  if (!passedBottleneck) {
    missingRequirements.push(`Не пройдено бутылочное горлышко (${cultivation.bottleneckProgress}/${cultivation.requiredBottleneckProgress})`);
  }

  // 5. Проверяем трибуляцию (если требуется)
  const needsTribulation = (cultivation.level === 3 || cultivation.level === 6 || cultivation.level === 9);
  const passedTribulation = !needsTribulation || cultivation.tribulationCompleted;
  if (!passedTribulation) {
    missingRequirements.push('Не пройдена трибуляция');
  }

  // 6. Проверяем ресурсы через InventoryService
  const requiredResources = getBreakthroughResources(cultivation.stage, cultivation.level);
  const resourceCheckResults = await checkResourceRequirements(userId, requiredResources);
  
  if (!resourceCheckResults.hasAllResources) {
    missingRequirements.push(...resourceCheckResults.missingResources);
  }

  const canBreakthrough = missingRequirements.length === 0;

  return {
    canBreakthrough,
    missingRequirements,
    requiredResources,
    message: canBreakthrough ? 'Готов к прорыву!' : 'Не выполнены требования для прорыва'
  };
}
```

### 2. Проверка ресурсов через InventoryService:

```javascript
static async checkResourceRequirements(userId, requiredResources) {
  const missingResources = [];
  let hasAllResources = true;

  for (const [resourceId, requiredAmount] of Object.entries(requiredResources)) {
    const checkResult = await InventoryService.checkInventoryItem(userId, resourceId, requiredAmount);
    
    if (!checkResult.success) {
      hasAllResources = false;
      
      // Получаем текущее количество для более детального сообщения
      const inventoryItems = await InventoryService.getInventoryItems(userId);
      const currentItem = inventoryItems.find(item => 
        item.itemId === resourceId || item.item_id === resourceId || item.id === resourceId
      );
      const currentAmount = currentItem ? currentItem.quantity : 0;
      
      missingResources.push(`${resourceId}: ${currentAmount}/${requiredAmount}`);
    }
  }

  return { hasAllResources, missingResources };
}
```

### 3. Расходование ресурсов при успешном прорыве:

```javascript
static async consumeBreakthroughResources(userId, requiredResources, transaction) {
  for (const [resourceId, requiredAmount] of Object.entries(requiredResources)) {
    await InventoryService.removeInventoryItem(userId, resourceId, requiredAmount);
  }
}
```

## Интеграция в performBreakthrough

```javascript
static async performBreakthrough(userId) {
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Проверяем все требования (включая ресурсы)
    const checkResult = await this.checkBreakthroughRequirements(userId);
    
    if (!checkResult.canBreakthrough) {
      await transaction.rollback();
      return {
        success: false,
        message: 'Невозможно выполнить прорыв',
        missingRequirements: checkResult.missingRequirements
      };
    }

    // 2. Расходуем ресурсы
    await this.consumeBreakthroughResources(userId, checkResult.requiredResources, transaction);

    // 3. Обновляем данные культивации (существующая логика)
    const cultivation = await CultivationProgress.findOne({ where: { userId }, transaction });
    // ... остальная логика обновления уровня ...

    await transaction.commit();
    
    return {
      success: true,
      message: 'Прорыв выполнен успешно!',
      // ... остальные данные результата ...
    };
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

## Преимущества этого подхода:

1. **Атомарность**: Использование транзакций гарантирует, что либо все изменения применяются, либо ничего не изменяется
2. **Консистентность**: Одинаковая логика определения ресурсов на клиенте и сервере
3. **Детальная диагностика**: Точные сообщения о недостающих ресурсах
4. **Масштабируемость**: Легко добавлять новые типы требований
5. **Безопасность**: Все проверки выполняются на сервере