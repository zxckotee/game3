-- SQL-скрипт для создания таблицы benefits (справочник бонусов)
-- Создание: 08.07.2025
\encoding UTF8

-- Создание таблицы, если она еще не существует
CREATE TABLE IF NOT EXISTS benefits (
    id SERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    modifier INTEGER NOT NULL,
    modifier_type VARCHAR(50) NOT NULL CHECK (modifier_type IN ('percent', 'flat', 'chance')),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии к таблице и полям
COMMENT ON TABLE benefits IS 'Справочник бонусов для различных игровых механик и характеристик';
COMMENT ON COLUMN benefits.type IS 'Тип бонуса (cultivation_speed, physical_defense и т.д.)';
COMMENT ON COLUMN benefits.modifier IS 'Значение модификатора (может быть отрицательным)';
COMMENT ON COLUMN benefits.modifier_type IS 'Тип модификатора (процент, абсолютное значение, шанс)';
COMMENT ON COLUMN benefits.description IS 'Описание бонуса';

-- Создание индекса для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_benefits_type ON benefits (type);

-- Добавление начальных данных

-- Бонусы игровых механик
INSERT INTO benefits (type, modifier, modifier_type, description) VALUES
('cultivation_speed', 5, 'percent', 'Увеличивает скорость культивации на 5%'),
('resource_gathering', 3, 'percent', 'Увеличивает эффективность сбора ресурсов на 3%'),
('technique_discount', 2, 'percent', 'Уменьшает стоимость изучения техник на 2%');

-- Бонусы характеристик персонажа
INSERT INTO benefits (type, modifier, modifier_type, description) VALUES
('physical_defense', 10, 'flat', 'Увеличивает физическую защиту на 10 единиц'),
('spiritual_defense', 8, 'flat', 'Увеличивает духовную защиту на 8 единиц'),
('attack_speed', 5, 'flat', 'Увеличивает атаку на 5 единиц'),
('critical_chance', 2, 'chance', 'Увеличивает шанс критического удара на 2%'),
('movement_speed', 3, 'chance', 'Увеличивает шанс уклонения на 3%'),
('luck', 1, 'chance', 'Увеличивает точность и шанс везения на 1%');

-- Отрицательные бонусы (дебаффы)
INSERT INTO benefits (type, modifier, modifier_type, description) VALUES
('cultivation_speed', -3, 'percent', 'Уменьшает скорость культивации на 3%'),
('physical_defense', -5, 'flat', 'Уменьшает физическую защиту на 5 единиц'),
('critical_chance', -1, 'chance', 'Уменьшает шанс критического удара на 1%');

-- Создание таблицы player_benefits для хранения бонусов пользователей
CREATE TABLE IF NOT EXISTS player_benefits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(255) NOT NULL,
    modifier INTEGER NOT NULL,
    modifier_type VARCHAR(50) NOT NULL CHECK (modifier_type IN ('percent', 'flat', 'chance')),
    source VARCHAR(50) NOT NULL, -- Источник бенефита (sect, equipment, etc.)
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Комментарии к таблице и полям
COMMENT ON TABLE player_benefits IS 'Бонусы пользователей из различных источников';
COMMENT ON COLUMN player_benefits.user_id IS 'ID пользователя';
COMMENT ON COLUMN player_benefits.type IS 'Тип бонуса (cultivation_speed, physical_defense и т.д.)';
COMMENT ON COLUMN player_benefits.modifier IS 'Значение модификатора (может быть отрицательным)';
COMMENT ON COLUMN player_benefits.modifier_type IS 'Тип модификатора (процент, абсолютное значение, шанс)';
COMMENT ON COLUMN player_benefits.source IS 'Источник бенефита (sect, equipment, etc.)';
COMMENT ON COLUMN player_benefits.description IS 'Описание бонуса';

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_player_benefits_user_id ON player_benefits (user_id);
CREATE INDEX IF NOT EXISTS idx_player_benefits_type ON player_benefits (type);
CREATE INDEX IF NOT EXISTS idx_player_benefits_source ON player_benefits (source);