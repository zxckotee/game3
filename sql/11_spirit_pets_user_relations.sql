-- SQL скрипт для создания таблиц отношений пользователей с питомцами и еды для питомцев
\encoding UTF8

-- Таблица отношений пользователей с духовными питомцами
CREATE TABLE user_spirit_pets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pet_id VARCHAR(30) NOT NULL REFERENCES spirit_pets(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    custom_name VARCHAR(100),
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    hunger INTEGER DEFAULT 100,
    loyalty INTEGER DEFAULT 100,
    strength INTEGER DEFAULT 1,
    intelligence INTEGER DEFAULT 1,
    agility INTEGER DEFAULT 1,
    vitality INTEGER DEFAULT 1,
    spirit INTEGER DEFAULT 1,
    last_fed TIMESTAMP,
    last_trained TIMESTAMP,
    combat_uses_count INTEGER DEFAULT 0,
    combat_flee_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pet_id)
);

-- Индексы для повышения производительности
CREATE INDEX idx_user_spirit_pets_user_id ON user_spirit_pets(user_id);
CREATE INDEX idx_user_spirit_pets_pet_id ON user_spirit_pets(pet_id);
CREATE INDEX idx_user_spirit_pets_is_active ON user_spirit_pets(user_id, is_active);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_user_spirit_pets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_spirit_pets_updated_at
BEFORE UPDATE ON user_spirit_pets
FOR EACH ROW
EXECUTE FUNCTION update_user_spirit_pets_updated_at();

-- Таблица еды для духовных питомцев
CREATE TABLE spirit_pet_food_items (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rarity VARCHAR(20) REFERENCES rarities(id),
    nutrition_value INTEGER NOT NULL DEFAULT 25,
    loyalty_bonus INTEGER NOT NULL DEFAULT 0,
    stat_bonus_type VARCHAR(20) DEFAULT NULL,
    stat_bonus_value INTEGER DEFAULT 0,
    price INTEGER DEFAULT 100,
    icon VARCHAR(50),
    shop_categories JSONB DEFAULT '["pet_supplies"]'
);

-- Заполнение таблицы еды для питомцев
INSERT INTO spirit_pet_food_items (id, name, description, rarity, nutrition_value, loyalty_bonus, price, icon) VALUES
('basic_pet_food', 'Базовый корм для питомцев', 'Простая еда для духовных питомцев', 'common', 20, 0, 50, '🥫'),
('improved_pet_food', 'Улучшенный корм для питомцев', 'Питательная еда с духовными травами для питомцев среднего уровня', 'uncommon', 35, 2, 150, '🍖'),
('premium_pet_food', 'Премиум корм для питомцев', 'Высококачественная еда для духовных питомцев', 'rare', 50, 5, 500, '🍗'),
('elemental_treat_fire', 'Огненное лакомство', 'Особое лакомство для питомцев огненной стихии', 'rare', 40, 8, 800, '🔥'),
('elemental_treat_water', 'Водное лакомство', 'Особое лакомство для питомцев водной стихии', 'rare', 40, 8, 800, '💧'),
('elemental_treat_earth', 'Земляное лакомство', 'Особое лакомство для питомцев земной стихии', 'rare', 40, 8, 800, '🌱'),
('elemental_treat_air', 'Воздушное лакомство', 'Особое лакомство для питомцев воздушной стихии', 'rare', 40, 8, 800, '💨'),
('mystic_pet_feast', 'Мистический пир для питомцев', 'Легендарная еда, значительно повышающая все показатели питомца', 'legendary', 100, 15, 3000, '✨');

-- Интеграция с таблицей предметов
INSERT INTO item_catalog (item_id, name, description, type, rarity)
SELECT id, name, description, 'pet_food', rarity FROM spirit_pet_food_items;
