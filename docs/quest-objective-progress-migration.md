# Миграция системы прогресса квестов

## Обзор

Данная миграция переводит систему отслеживания прогресса квестов с JSONB полей на нормализованную таблицу `quest_objective_progress`. Это обеспечивает лучшую производительность, возможности аналитики и целостность данных.

## Изменения в архитектуре

### До миграции
- Прогресс целей хранился в JSONB поле `progress` таблицы `quest_progress`
- Завершенные цели хранились в JSONB поле `completed_objectives`
- Ограниченные возможности для запросов и аналитики

### После миграции
- Каждая цель квеста имеет отдельную запись в таблице `quest_objective_progress`
- Нормализованная структура данных
- Улучшенная производительность запросов
- Возможности для детальной аналитики
- Сохранена обратная совместимость

## Новая таблица `quest_objective_progress`

```sql
CREATE TABLE quest_objective_progress (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    objectiveId INTEGER NOT NULL,
    currentProgress INTEGER DEFAULT 0,
    requiredProgress INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completedAt TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    UNIQUE(userId, objectiveId)
);
```

## Новые методы API

### QuestService

1. **`addObjectiveProgress(userId, objectiveId, amount, metadata)`**
   - Основной метод для обновления прогресса цели
   - Автоматически проверяет завершение цели и квеста
   - Обновляет JSONB поля для обратной совместимости

2. **`getObjectiveProgress(userId, objectiveId)`**
   - Получает прогресс конкретной цели

3. **`getQuestObjectivesProgress(userId, questId)`**
   - Получает прогресс всех целей квеста

4. **`updateQuestProgressFromObjectives(userId, questId)`**
   - Синхронизирует JSONB поля с нормализованной таблицей

5. **`checkQuestCompletion(userId, questId)`**
   - Проверяет завершение квеста на основе прогресса целей

## Процесс миграции

### 1. Подготовка

```bash
# Создание резервной копии
pg_dump game3 > backup_before_migration.sql

# Применение SQL миграции
psql game3 < sql/01_quests.sql
```

### 2. Запуск миграции данных

```bash
# Миграция существующих данных
node scripts/migrate-quest-progress.js

# Проверка результатов
node scripts/migrate-quest-progress.js --verify
```

### 3. Откат (при необходимости)

```bash
# Откат миграции данных
node scripts/migrate-quest-progress.js rollback

# Восстановление из резервной копии
psql game3 < backup_before_migration.sql
```

## Обратная совместимость

Система сохраняет полную обратную совместимость:

1. **JSONB поля остаются**: `progress` и `completed_objectives` продолжают обновляться
2. **Старые методы работают**: `updateQuestProgress` использует новую систему внутри
3. **Постепенный переход**: можно мигрировать код постепенно

## Интеграция с игровыми событиями

Система автоматически отслеживает прогресс через события:

```javascript
// Пример использования в combat-service.js
await QuestService.checkQuestEvent(userId, 'ENEMY_DEFEATED', {
  enemyType: 'weak_spirit_beast',
  enemyLevel: 5,
  location: 'training_grounds'
});
```

### Поддерживаемые события

- `ENEMY_DEFEATED` - победа над врагом
- `ITEM_CRAFTED` - создание предмета
- `ITEM_GATHERED` - сбор предмета
- `LEVEL_REACHED` - достижение уровня
- `PVP_WIN` - победа в PvP
- `PVP_RATING_GAINED` - получение рейтинга PvP
- `MEDITATION_COMPLETED` - завершение медитации

## Производительность

### Преимущества новой системы

1. **Индексы**: Оптимизированные индексы для быстрых запросов
2. **Нормализация**: Избежание дублирования данных
3. **Аналитика**: Возможность сложных аналитических запросов
4. **Масштабируемость**: Лучшая производительность при росте данных

### Рекомендуемые индексы

```sql
-- Основные индексы (уже созданы)
CREATE INDEX idx_quest_objective_progress_user_objective ON quest_objective_progress(userId, objectiveId);
CREATE INDEX idx_quest_objective_progress_completed ON quest_objective_progress(completed);
CREATE INDEX idx_quest_objective_progress_user_completed ON quest_objective_progress(userId, completed);

-- Дополнительные индексы для аналитики
CREATE INDEX idx_quest_objective_progress_completed_at ON quest_objective_progress(completedAt) WHERE completedAt IS NOT NULL;
```

## Мониторинг и отладка

### Проверка целостности данных

```sql
-- Сравнение количества записей
SELECT 
  'JSONB' as source, 
  COUNT(*) as total_progress_records
FROM quest_progress 
WHERE progress != '{}'
UNION ALL
SELECT 
  'Normalized' as source, 
  COUNT(*) as total_progress_records
FROM quest_objective_progress;
```

### Поиск несоответствий

```sql
-- Поиск целей с прогрессом только в JSONB
SELECT qp.userId, qp.questId, qp.progress
FROM quest_progress qp
LEFT JOIN quest_objective_progress qop ON qp.userId = qop.userId
WHERE qp.progress != '{}' AND qop.id IS NULL;
```

## Планы развития

1. **Фаза 1** (текущая): Миграция данных и обратная совместимость
2. **Фаза 2**: Постепенный переход кода на новые методы
3. **Фаза 3**: Удаление JSONB полей (после полного перехода)
4. **Фаза 4**: Расширенная аналитика и отчеты

## Поддержка

При возникновении проблем:

1. Проверьте логи миграции
2. Убедитесь в целостности данных
3. При необходимости выполните откат
4. Обратитесь к документации API

## Примеры использования

### Обновление прогресса цели

```javascript
// Новый способ (рекомендуется)
await QuestService.addObjectiveProgress(userId, objectiveId, 1, {
  source: 'combat',
  enemyType: 'weak_spirit_beast'
});

// Старый способ (совместимость)
await QuestService.updateQuestProgress(userId, questId, {
  [objectiveId]: currentProgress + 1
});
```

### Получение прогресса

```javascript
// Прогресс конкретной цели
const progress = await QuestService.getObjectiveProgress(userId, objectiveId);

// Прогресс всех целей квеста
const allProgress = await QuestService.getQuestObjectivesProgress(userId, questId);