-- SQL скрипт для создания и заполнения справочника предметов
-- Использует PostgreSQL синтаксис
\encoding UTF8

-- Удаление таблицы, если она существует
DROP TABLE IF EXISTS item_catalog CASCADE;

-- Создание таблицы справочника предметов
CREATE TABLE item_catalog (
    item_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    rarity VARCHAR(20) NOT NULL DEFAULT 'common',
    description TEXT,
    price INTEGER,
    source_table VARCHAR(30) NOT NULL
);

-- Импорт данных из merchant_inventories (низший приоритет)
-- Если предмет уже существует, ничего не делаем.
INSERT INTO item_catalog (item_id, name, type, rarity, description, price, source_table)
SELECT DISTINCT
    item_id,
    name,
    item_type,
    rarity,
    description,
    price,
    'merchant_inventories'
FROM merchant_inventory_templates
ON CONFLICT (item_id) DO NOTHING; -- ИСПРАВЛЕНИЕ: Игнорируем дубликаты

-- Импорт данных из alchemy_items (средний приоритет)
-- Если предмет существует, обновляем его, так как у этого источника приоритет выше.
INSERT INTO item_catalog (item_id, name, type, rarity, description, price, source_table)
SELECT
    id,
    name,
    type,
    rarity,
    description,
    value,
    'alchemy_items'
FROM alchemy_items
ON CONFLICT (item_id) 
DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    rarity = EXCLUDED.rarity,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    source_table = EXCLUDED.source_table;

-- Импорт данных из equipment_items (высший приоритет)
-- Если предмет существует, обновляем его, так как у этого источника приоритет самый высокий.
INSERT INTO item_catalog (item_id, name, type, rarity, description, price, source_table)
SELECT
    item_id,
    name,
    type,
    rarity,
    description,
    base_price,
    'equipment_items'
FROM equipment_items
ON CONFLICT (item_id) 
DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    rarity = EXCLUDED.rarity,
    description = EXCLUDED.description, 
    price = EXCLUDED.price,
    source_table = EXCLUDED.source_table;

-- Отдельная вставка для 'basic_cultivation_manual' (низший приоритет)
-- Если предмет уже существует, ничего не делаем.
INSERT INTO item_catalog (item_id, name, type, rarity, description, price, source_table)
VALUES ('basic_cultivation_manual', 'Базовое руководство по культивации', 'book', 'common', 
'Простое руководство для начинающих культиваторов.', 50, 'merchant_inventory_templates')
ON CONFLICT (item_id) DO NOTHING; -- ИСПРАВЛЕНИЕ: Игнорируем дубликаты

-- Создание индексов для оптимизации
CREATE INDEX idx_item_catalog_type ON item_catalog(type);
CREATE INDEX idx_item_catalog_rarity ON item_catalog(rarity);

-- Вывод информации о созданном справочнике
/*SELECT COUNT(*) as total_items FROM item_catalog;
SELECT type, COUNT(*) as type_count FROM item_catalog GROUP BY type ORDER BY type_count DESC;
SELECT rarity, COUNT(*) as rarity_count FROM item_catalog GROUP BY rarity ORDER BY rarity_count DESC;
SELECT source_table, COUNT(*) as source_count FROM item_catalog GROUP BY source_table;*/