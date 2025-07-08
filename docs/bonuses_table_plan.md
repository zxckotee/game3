# План создания таблицы bonuses

## Описание задачи

Необходимо создать таблицу-справочник `bonuses`, которая будет содержать информацию о различных бонусах в игре. Таблица будет использоваться для хранения типов бонусов, их модификаторов и типов модификаторов.

## Структура таблицы

Таблица `bonuses` будет иметь следующую структуру:

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL PRIMARY KEY | Уникальный идентификатор бонуса |
| type | VARCHAR(255) NOT NULL | Тип бонуса (например, 'cultivation_speed', 'physical_defense') |
| modifier | INTEGER | Значение модификатора (может быть отрицательным) |
| modifier_type | VARCHAR(50) NOT NULL | Тип модификатора ('percent', 'flat', 'chance') |
| description | TEXT | Описание бонуса |
| created_at | TIMESTAMP | Время создания записи |
| updated_at | TIMESTAMP | Время последнего обновления записи |

## Типы бонусов

Таблица будет содержать следующие типы бонусов:

### Бонусы игровых механик
- `cultivation_speed` - скорость культивации
- `resource_gathering` - сбор ресурсов
- `technique_discount` - скидка на техники

### Бонусы характеристик персонажа
- `physical_defense` - физическая защита (абсолютная добавка)
- `spiritual_defense` - духовная защита (абсолютная добавка)
- `attack_speed` - добавка к атаке (абсолютное число, а не скорость)
- `critical_chance` - шанс критического удара
- `movement_speed` - шанс уклонения (а не скорость)
- `luck` - уменьшение шанса уклонения противнику (точность и шанс везения)

## Типы модификаторов

- `percent` - процентный модификатор (например, +5% к скорости культивации)
- `flat` - абсолютное значение (например, +10 к физической защите)
- `chance` - модификатор шанса (например, +2% к шансу критического удара)

## SQL-код для создания таблицы

```sql
-- SQL-скрипт для создания таблицы bonuses (справочник бонусов)
-- Создание: 08.07.2025
\encoding UTF8

-- Создание таблицы, если она еще не существует
CREATE TABLE IF NOT EXISTS bonuses (
    id SERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    modifier INTEGER NOT NULL,
    modifier_type VARCHAR(50) NOT NULL CHECK (modifier_type IN ('percent', 'flat', 'chance')),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии к таблице и полям
COMMENT ON TABLE bonuses IS 'Справочник бонусов для различных игровых механик и характеристик';
COMMENT ON COLUMN bonuses.type IS 'Тип бонуса (cultivation_speed, physical_defense и т.д.)';
COMMENT ON COLUMN bonuses.modifier IS 'Значение модификатора (может быть отрицательным)';
COMMENT ON COLUMN bonuses.modifier_type IS 'Тип модификатора (процент, абсолютное значение, шанс)';
COMMENT ON COLUMN bonuses.description IS 'Описание бонуса';

-- Создание индекса для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_bonuses_type ON bonuses (type);

-- Добавление начальных данных

-- Бонусы игровых механик
INSERT INTO bonuses (type, modifier, modifier_type, description) VALUES
('cultivation_speed', 5, 'percent', 'Увеличивает скорость культивации на 5%'),
('resource_gathering', 3, 'percent', 'Увеличивает эффективность сбора ресурсов на 3%'),
('technique_discount', 2, 'percent', 'Уменьшает стоимость изучения техник на 2%');

-- Бонусы характеристик персонажа
INSERT INTO bonuses (type, modifier, modifier_type, description) VALUES
('physical_defense', 10, 'flat', 'Увеличивает физическую защиту на 10 единиц'),
('spiritual_defense', 8, 'flat', 'Увеличивает духовную защиту на 8 единиц'),
('attack_speed', 5, 'flat', 'Увеличивает атаку на 5 единиц'),
('critical_chance', 2, 'chance', 'Увеличивает шанс критического удара на 2%'),
('movement_speed', 3, 'chance', 'Увеличивает шанс уклонения на 3%'),
('luck', 1, 'chance', 'Увеличивает точность и шанс везения на 1%');
```

## Интеграция с существующим кодом

После создания таблицы `bonuses` необходимо будет обновить сервис `bonus-service.js`, чтобы он мог работать с новой таблицей. Также потребуется создать API-методы для получения и управления бонусами.

## Следующие шаги

1. Создать SQL-файл `51_bonuses.sql` с приведенным выше кодом
2. Выполнить SQL-скрипт для создания таблицы в базе данных
3. Обновить сервис `bonus-service.js` для работы с новой таблицей
4. Создать API-методы для работы с бонусами
5. Интегрировать бонусы с существующими игровыми механиками