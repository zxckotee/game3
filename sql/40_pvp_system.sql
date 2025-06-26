-- SQL-скрипт для создания таблиц PvP-системы

\encoding UTF8

DROP TABLE pvp_history CASCADE;
DROP TABLE pvp_rewards CASCADE;
DROP TABLE pvp_ratings CASCADE;
DROP TABLE pvp_actions CASCADE;
DROP TABLE pvp_participants CASCADE;
DROP TABLE pvp_rooms CASCADE;
DROP TABLE pvp_modes CASCADE;

-- 1. Таблица режимов PvP
CREATE TABLE IF NOT EXISTS pvp_modes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    player_count INTEGER NOT NULL, -- количество игроков (2 для 1v1, 6 для 3v3, 10 для 5v5)
    enabled BOOLEAN DEFAULT true,
    rules JSONB, -- правила для конкретного режима
    rewards_config JSONB, -- настройки наград
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблица комнат PvP
CREATE TABLE IF NOT EXISTS pvp_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mode_id INTEGER REFERENCES pvp_modes(id),
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, in_progress, completed
    min_level INTEGER NOT NULL DEFAULT 1,
    max_level INTEGER NOT NULL,
    leader_id INTEGER REFERENCES users(id),
    winner_team INTEGER, -- 1 или 2, NULL если не завершен
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Таблица участников комнаты
CREATE TABLE IF NOT EXISTS pvp_participants (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES pvp_rooms(id),
    user_id INTEGER REFERENCES users(id),
    team INTEGER NOT NULL, -- 1 или 2
    position INTEGER NOT NULL, -- позиция в команде (1-5)
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, defeated, left
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    current_energy INTEGER NOT NULL,
    max_energy INTEGER NOT NULL,
    level INTEGER NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_action_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Таблица действий в бою
CREATE TABLE IF NOT EXISTS pvp_actions (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES pvp_rooms(id),
    participant_id INTEGER REFERENCES pvp_participants(id),
    action_type VARCHAR(50) NOT NULL, -- attack, defend, technique
    target_id INTEGER REFERENCES pvp_participants(id),
    technique_id VARCHAR(100), -- если используется техника
    damage INTEGER,
    healing INTEGER,
    effects JSONB, -- дополнительные эффекты
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Таблица рейтингов PvP
CREATE TABLE IF NOT EXISTS pvp_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    mode_id INTEGER REFERENCES pvp_modes(id),
    rating INTEGER NOT NULL DEFAULT 1000,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    season VARCHAR(50), -- сезон рейтинга
    league VARCHAR(50), -- лига игрока
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, mode_id, season)
);

-- 6. Таблица наград PvP
CREATE TABLE IF NOT EXISTS pvp_rewards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    item_id VARCHAR(100) REFERENCES item_catalog(item_id),
    min_rating INTEGER, -- минимальный рейтинг для получения
    season VARCHAR(50), -- сезон
    is_unique BOOLEAN DEFAULT true,
    rarity VARCHAR(50) NOT NULL,
    stats JSONB, -- характеристики предмета
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Таблица истории боев
CREATE TABLE IF NOT EXISTS pvp_history (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES pvp_rooms(id),
    user_id INTEGER REFERENCES users(id),
    mode_id INTEGER REFERENCES pvp_modes(id),
    result VARCHAR(20) NOT NULL, -- win, loss, draw
    rating_change INTEGER,
    rewards JSONB, -- полученные награды
    opponent_ids INTEGER[], -- массив id противников
    team_ids INTEGER[], -- массив id союзников
    duration INTEGER, -- длительность боя в секундах
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка режимов PvP
INSERT INTO pvp_modes (name, description, player_count, rules, rewards_config) VALUES
('Дуэль 1v1', 'Классический поединок один на один', 2, 
 '{"time_limit": 300, "energy_regen": 5, "allowed_techniques": "all"}',
 '{"win_gold": 100, "lose_gold": 20, "win_exp": 50, "lose_exp": 10}'
),
('Командный бой 3v3', 'Командное сражение три на три', 6, 
 '{"time_limit": 600, "energy_regen": 3, "allowed_techniques": "all"}',
 '{"win_gold": 150, "lose_gold": 30, "win_exp": 75, "lose_exp": 15}'
),
('Битва сект 5v5', 'Масштабное сражение представителей разных сект', 10, 
 '{"time_limit": 900, "energy_regen": 2, "allowed_techniques": "all"}',
 '{"win_gold": 200, "lose_gold": 40, "win_exp": 100, "lose_exp": 20}'
),
('Турнир мастеров', 'Особый режим для высокоуровневых культиваторов', 2, 
 '{"time_limit": 300, "energy_regen": 5, "allowed_techniques": "limited", "min_level": 20}',
 '{"win_gold": 300, "lose_gold": 60, "win_exp": 150, "lose_exp": 30}'
);

-- Вставка PvP наград (уникальные предметы)
INSERT INTO item_catalog (item_id, name, type, rarity, description, price, source_table) VALUES
('pvp_reward_1', 'Медаль Бронзовой Лиги', 'artifact', 'uncommon', 'Награда за достижение бронзовой лиги в PvP', 0, 'pvp_rewards'),
('pvp_reward_2', 'Медаль Серебряной Лиги', 'artifact', 'rare', 'Награда за достижение серебряной лиги в PvP', 0, 'pvp_rewards'),
('pvp_reward_3', 'Медаль Золотой Лиги', 'artifact', 'epic', 'Награда за достижение золотой лиги в PvP', 0, 'pvp_rewards'),
('pvp_reward_4', 'Медаль Платиновой Лиги', 'artifact', 'legendary', 'Награда за достижение платиновой лиги в PvP', 0, 'pvp_rewards'),
('pvp_reward_5', 'Меч Победителя', 'weapon', 'epic', 'Оружие, дарованное лучшим бойцам арены', 0, 'equipment_items'),
('pvp_reward_6', 'Доспех Чемпиона', 'armor', 'epic', 'Броня, дарованная лучшим бойцам арены', 0, 'equipment_items'),
('pvp_reward_7', 'Эликсир Воина', 'consumable', 'rare', 'Эликсир, усиливающий боевые способности', 0, 'alchemy_items'),
('pvp_reward_8', 'Амулет Берсерка', 'accessory', 'epic', 'Увеличивает атаку в обмен на защиту', 0, 'equipment_items');

-- Вставка PvP наград
INSERT INTO pvp_rewards (name, description, item_id, min_rating, season, is_unique, rarity) VALUES
('Бронзовая медаль', 'Награда за достижение бронзовой лиги', 'pvp_reward_1', 1000, 'current', true, 'uncommon'),
('Серебряная медаль', 'Награда за достижение серебряной лиги', 'pvp_reward_2', 1200, 'current', true, 'rare'),
('Золотая медаль', 'Награда за достижение золотой лиги', 'pvp_reward_3', 1500, 'current', true, 'epic'),
('Платиновая медаль', 'Награда за достижение платиновой лиги', 'pvp_reward_4', 1800, 'current', true, 'legendary'),
('Меч Победителя', 'Оружие для настоящих чемпионов', 'pvp_reward_5', 1600, 'current', true, 'epic'),
('Доспех Чемпиона', 'Защита для настоящих чемпионов', 'pvp_reward_6', 1700, 'current', true, 'epic'),
('Эликсир Воина', 'Увеличивает боевые характеристики на время', 'pvp_reward_7', 1100, 'current', false, 'rare'),
('Амулет Берсерка', 'Древний артефакт с мощными свойствами', 'pvp_reward_8', 1900, 'current', true, 'epic');