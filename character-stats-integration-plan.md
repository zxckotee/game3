# План интеграции системы характеристик с EquipmentTab

## Проблема

Вторичные характеристики не попадают в baseStats и не модифицируются эффектами, что приводит к получению нулевых значений везде.

## Анализ текущей структуры

### Текущий API ответ от `/api/users/:userId/stats/combined`:
```json
{
  "base": {
    "strength": 20,
    "intellect": 10,
    "spirit": 10,
    "agility": 10,
    "health": 10,
    "physicalDefense": 0,
    "spiritualDefense": 0,
    "attackSpeed": 0,
    "criticalChance": 0,
    "movementSpeed": 0,
    "luck": 0,
    // ... cultivation fields
  },
  "modified": { /* same as base */ },
  "secondary": {
    "physicalAttack": 20,
    "physicalDefense": 32,
    "spiritualAttack": 15,
    "spiritualDefense": 27,
    "attackSpeed": 15,
    "criticalChance": 5,
    "movementSpeed": 13,
    "luck": 4
  }
}
```

### Проблемы:
1. **Разделение характеристик**: Базовые и вторичные характеристики разделены, что не позволяет эффектам модифицировать вторичные характеристики
2. **Дублирование полей**: Некоторые поля есть и в base, и в secondary (physicalDefense, attackSpeed, criticalChance, movementSpeed, luck)
3. **Неправильное отображение**: В EquipmentTab используются неправильные названия полей

## Решение

### 1. Исправить метод `getCharacterStats(userId)`

**Файл**: `src/services/character-stats-service.js`

**Изменения**:
- Включить вторичные характеристики в базовые данные
- Убрать разделение на base/secondary
- Оставить secondary как дубляж base для совместимости

**Новая логика**:
```javascript
static async getCharacterStats(userId, transaction) {
  // 1. Получить базовые характеристики из БД
  // 2. Получить данные культивации
  // 3. Рассчитать вторичные характеристики
  // 4. Объединить все в один объект
  // 5. Вернуть полный набор характеристик
}
```

### 2. Обновить метод `getCombinedCharacterState(userId)`

**Изменения**:
```javascript
static async getCombinedCharacterState(userId, transaction) {
  // 1. Получить полные характеристики (базовые + вторичные)
  const fullStats = await this.getCharacterStats(userId, transaction);
  
  // 2. Применить эффекты ко всем характеристикам
  const modifiedStats = this.applyEffectsToStats(fullStats, activeEffects);
  
  // 3. Вернуть результат
  return {
    base: modifiedStats,           // Все характеристики в одном объекте
    modified: modifiedStats,       // То же самое (для совместимости)
    secondary: modifiedStats       // Дубляж для совместимости
  };
}
```

### 3. Создать компонент CharacterStatsDisplay

**Файл**: `src/components/tabs/CharacterStatsDisplay.js`

**Функциональность**:
- Запрос данных от API `/api/users/:userId/stats/combined`
- Правильное отображение характеристик
- Обработка процентных значений
- Автоматическое обновление при изменениях

**Структура**:
```javascript
const CharacterStatsDisplay = ({ userId, onStatsUpdate }) => {
  const [stats, setStats] = useState(null);
  
  // Загрузка характеристик
  const loadStats = async () => {
    const response = await fetch(`/api/users/${userId}/stats/combined`);
    const data = await response.json();
    setStats(data.base); // Используем base, который теперь содержит все
    onStatsUpdate?.(data.base);
  };
  
  // Маппинг полей
  const statLabels = {
    // Базовые характеристики
    strength: 'Сила',
    intellect: 'Интеллект',
    spirit: 'Дух',
    agility: 'Ловкость',
    health: 'Здоровье',
    luck: 'Удача',
    
    // Боевые характеристики
    physicalAttack: 'Физический урон',
    spiritualAttack: 'Магический урон',
    physicalDefense: 'Физическая защита',
    spiritualDefense: 'Магическая защита',
    attackSpeed: 'Скорость атаки',
    criticalChance: 'Шанс крит. удара',
    movementSpeed: 'Скорость передвижения'
  };
  
  // Поля, отображаемые в процентах
  const percentageStats = ['criticalChance'];
  
  return (
    <StatsContainer>
      <SectionTitle>Базовые характеристики</SectionTitle>
      <StatGrid>
        {['strength', 'intellect', 'spirit', 'agility', 'health', 'luck'].map(stat => (
          <StatItem key={stat}>
            <StatLabel>{statLabels[stat]}</StatLabel>
            <StatValue>{stats?.[stat] || 0}</StatValue>
          </StatItem>
        ))}
      </StatGrid>
      
      <SectionTitle>Боевые характеристики</SectionTitle>
      <StatGrid>
        {['physicalAttack', 'spiritualAttack', 'physicalDefense', 'spiritualDefense', 
          'attackSpeed', 'criticalChance', 'movementSpeed'].map(stat => (
          <StatItem key={stat}>
            <StatLabel>{statLabels[stat]}</StatLabel>
            <StatValue>
              {stats?.[stat] || 0}
              {percentageStats.includes(stat) ? '%' : ''}
            </StatValue>
          </StatItem>
        ))}
      </StatGrid>
    </StatsContainer>
  );
};
```

### 4. Интегрировать в EquipmentTab

**Файл**: `src/components/tabs/EquipmentTab.js`

**Изменения**:
1. Заменить текущую панель характеристик на `CharacterStatsDisplay`
2. Добавить вызов `loadStats()` при:
   - Монтировании компонента
   - Экипировке предмета
   - Снятии предмета

**Интеграция**:
```javascript
// В EquipmentTab.js
import CharacterStatsDisplay from './CharacterStatsDisplay';

function EquipmentTab() {
  const [characterStats, setCharacterStats] = useState(null);
  
  // Обновление характеристик
  const refreshStats = async () => {
    // Будет вызываться CharacterStatsDisplay
  };
  
  // При экипировке/снятии
  const handleEquipmentChange = async () => {
    // ... логика экипировки
    await refreshStats(); // Обновляем характеристики
  };
  
  return (
    <Container>
      {/* Панель экипировки */}
      <EquipmentDisplay>
        {/* ... слоты экипировки */}
      </EquipmentDisplay>
      
      {/* Панель характеристик */}
      <CharacterStatsDisplay 
        userId={state.player?.id}
        onStatsUpdate={setCharacterStats}
      />
    </Container>
  );
}
```

## Последовательность реализации

1. **Исправить `getCharacterStats(userId)`** - включить вторичные характеристики в базовые
2. **Обновить `getCombinedCharacterState(userId)`** - убрать разделение на base/secondary
3. **Создать `CharacterStatsDisplay`** - компонент для отображения характеристик
4. **Интегрировать в `EquipmentTab`** - заменить текущую панель характеристик
5. **Добавить обновление при экипировке** - вызывать API при изменениях экипировки
6. **Протестировать** - убедиться в корректности отображения

## Ожидаемый результат

После исправлений:
- Все характеристики (базовые + вторичные) будут в одном объекте `base`
- Эффекты смогут модифицировать любые характеристики
- В EquipmentTab будут отображаться актуальные значения характеристик
- При экипировке/снятии предметов характеристики будут обновляться автоматически
- Процентные значения будут отображаться корректно

## Совместимость

- Поле `secondary` останется как дубляж `base` для обратной совместимости
- Существующий код, использующий `secondary`, продолжит работать
- API `/api/users/:userId/stats/combined` сохранит текущую структуру ответа