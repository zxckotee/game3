-- SQL скрипт для создания таблицы предметов инвентаря
-- Хранит информацию о предметах, которыми владеют пользователи
\encoding UTF8

-- Удаление существующей таблицы, если она есть
DROP TABLE IF EXISTS inventory_items CASCADE;

-- Создание таблицы предметов инвентаря
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(45),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN (
        'оружие', 'броня', 'артефакт', 'расходник', 'ресурс', -- русскоязычные типы (существующие)
        'weapon', 'armor', 'artifact', 'consumable', 'resource', -- англоязычные эквиваленты
        'ingredient', 'elixir', 'pill', 'talisman', 'accessory', -- дополнительные типы
        'currency', 'pet_food', 'book' -- специфические типы
    )),
    rarity VARCHAR(20) DEFAULT 'обычный',
    stats JSONB DEFAULT '{}',
    quantity INTEGER DEFAULT 1,
    equipped BOOLEAN DEFAULT FALSE,
    slot VARCHAR(30) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии к таблице и полям
COMMENT ON TABLE inventory_items IS 'Предметы инвентаря пользователей';
COMMENT ON COLUMN inventory_items.user_id IS 'Идентификатор владельца предмета';
COMMENT ON COLUMN inventory_items.name IS 'Название предмета';
COMMENT ON COLUMN inventory_items.description IS 'Описание предмета';
COMMENT ON COLUMN inventory_items.item_type IS 'Тип предмета: оружие, броня, артефакт, расходник или ресурс';
COMMENT ON COLUMN inventory_items.rarity IS 'Редкость предмета: обычный, необычный, редкий, эпический или легендарный';
COMMENT ON COLUMN inventory_items.stats IS 'JSON с характеристиками предмета';
COMMENT ON COLUMN inventory_items.quantity IS 'Количество предметов данного типа';
COMMENT ON COLUMN inventory_items.equipped IS 'Флаг экипировки предмета';
COMMENT ON COLUMN inventory_items.slot IS 'Слот, в который экипирован предмет (оружие, голова, тело и т.д.)';

-- Создание индексов для оптимизации запросов
CREATE INDEX idx_inventory_items_user_id ON inventory_items (user_id);
CREATE INDEX idx_inventory_items_type ON inventory_items (item_type);
CREATE INDEX idx_inventory_items_equipped ON inventory_items (user_id, equipped) WHERE equipped = true;
CREATE INDEX idx_inventory_items_slot ON inventory_items (user_id, slot) WHERE slot IS NOT NULL;