-- Скрипт для создания таблицы character_stats (характеристики персонажей)
-- Хранит статистические показатели и характеристики персонажей пользователей
\encoding UTF8

-- Создание таблицы, если она еще не существует
CREATE TABLE IF NOT EXISTS character_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    strength INTEGER DEFAULT 10,
    intellect INTEGER DEFAULT 10,
    spirit INTEGER DEFAULT 10,
    agility INTEGER DEFAULT 10,
    health INTEGER DEFAULT 10,
    current_health INTEGER DEFAULT 100,
    max_health INTEGER DEFAULT 100,
    current_energy INTEGER DEFAULT 100,
    max_energy INTEGER DEFAULT 100,
    physical_defense INTEGER DEFAULT 5,
    spiritual_defense INTEGER DEFAULT 5,
    attack_speed FLOAT DEFAULT 1.0,
    critical_chance FLOAT DEFAULT 0.05,
    movement_speed FLOAT DEFAULT 1.0,
    luck INTEGER DEFAULT 5,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии к таблице и полям
COMMENT ON TABLE character_stats IS 'Характеристики персонажей пользователей';
COMMENT ON COLUMN character_stats.user_id IS 'Связь с таблицей пользователей';
COMMENT ON COLUMN character_stats.strength IS 'Сила персонажа';
COMMENT ON COLUMN character_stats.intellect IS 'Интеллект персонажа';
COMMENT ON COLUMN character_stats.spirit IS 'Дух персонажа';
COMMENT ON COLUMN character_stats.agility IS 'Ловкость персонажа';
COMMENT ON COLUMN character_stats.health IS 'Базовое здоровье персонажа';

-- Создание индекса для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_character_stats_user_id ON character_stats (user_id);