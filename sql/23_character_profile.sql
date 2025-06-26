-- Скрипт для создания таблицы character_profile (профили персонажей)
-- Хранит информацию о персонажах пользователей
\encoding UTF8

-- Создание таблицы, если она еще не существует
CREATE TABLE IF NOT EXISTS character_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(50) DEFAULT 'male',
    region VARCHAR(255) DEFAULT 'central',
    background VARCHAR(255) DEFAULT 'commoner',
    description TEXT,
    avatar VARCHAR(255),
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 0,
    silver INTEGER DEFAULT 0,
    copper INTEGER DEFAULT 0,
    spirit_stones INTEGER DEFAULT 0,
    reputation JSONB DEFAULT '{}',
    relationships JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии к таблице и полям
COMMENT ON TABLE character_profile IS 'Профили персонажей пользователей';
COMMENT ON COLUMN character_profile.user_id IS 'Связь с таблицей пользователей';
COMMENT ON COLUMN character_profile.name IS 'Имя персонажа';
COMMENT ON COLUMN character_profile.gender IS 'Пол персонажа';
COMMENT ON COLUMN character_profile.region IS 'Регион происхождения персонажа';
COMMENT ON COLUMN character_profile.background IS 'Предыстория персонажа';

-- Создание индекса для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_character_profile_user_id ON character_profile (user_id);