-- SQL-скрипт для создания таблицы характеристик игрока в PvP
-- Создание: 29.05.2025

-- Создаем таблицу для хранения характеристик игрока в PvP
CREATE TABLE IF NOT EXISTS pvp_player_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    physical_attack INTEGER DEFAULT 0,
    physical_defense INTEGER DEFAULT 0,
    spiritual_attack INTEGER DEFAULT 0,
    spiritual_defense INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, room_id)
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_pvp_player_stats_user_id ON pvp_player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_pvp_player_stats_room_id ON pvp_player_stats(room_id);

-- Добавляем комментарии к таблице и полям
COMMENT ON TABLE pvp_player_stats IS 'Характеристики игрока в PvP-комнате';
COMMENT ON COLUMN pvp_player_stats.physical_attack IS 'Физическая атака (для обычной атаки и техник типа attack)';
COMMENT ON COLUMN pvp_player_stats.physical_defense IS 'Физическая защита (от обычной атаки и техник типа attack)';
COMMENT ON COLUMN pvp_player_stats.spiritual_attack IS 'Духовная атака (для техник)';
COMMENT ON COLUMN pvp_player_stats.spiritual_defense IS 'Духовная защита (от техник)';

-- Создаем функцию для добавления или обновления характеристик игрока
CREATE OR REPLACE FUNCTION upsert_pvp_player_stats(
    p_user_id INTEGER,
    p_room_id INTEGER,
    p_physical_attack INTEGER,
    p_physical_defense INTEGER,
    p_spiritual_attack INTEGER,
    p_spiritual_defense INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO pvp_player_stats (
        user_id, 
        room_id, 
        physical_attack, 
        physical_defense, 
        spiritual_attack, 
        spiritual_defense,
        updated_at
    ) VALUES (
        p_user_id, 
        p_room_id, 
        COALESCE(p_physical_attack, 0), 
        COALESCE(p_physical_defense, 0), 
        COALESCE(p_spiritual_attack, 0), 
        COALESCE(p_spiritual_defense, 0),
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id, room_id) DO UPDATE SET
        physical_attack = COALESCE(p_physical_attack, 0),
        physical_defense = COALESCE(p_physical_defense, 0),
        spiritual_attack = COALESCE(p_spiritual_attack, 0),
        spiritual_defense = COALESCE(p_spiritual_defense, 0),
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для получения характеристик игрока
CREATE OR REPLACE FUNCTION get_pvp_player_stats(
    p_user_id INTEGER,
    p_room_id INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'physical_attack', COALESCE(physical_attack, 0),
        'physical_defense', COALESCE(physical_defense, 0),
        'spiritual_attack', COALESCE(spiritual_attack, 0),
        'spiritual_defense', COALESCE(spiritual_defense, 0)
    ) INTO v_stats
    FROM pvp_player_stats
    WHERE user_id = p_user_id AND room_id = p_room_id;
    
    IF v_stats IS NULL THEN
        v_stats := jsonb_build_object(
            'physical_attack', 0,
            'physical_defense', 0,
            'spiritual_attack', 0,
            'spiritual_defense', 0
        );
    END IF;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для удаления характеристик игрока
CREATE OR REPLACE FUNCTION delete_pvp_player_stats(
    p_user_id INTEGER,
    p_room_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_deleted BOOLEAN;
BEGIN
    DELETE FROM pvp_player_stats
    WHERE user_id = p_user_id AND room_id = p_room_id
    RETURNING TRUE INTO v_deleted;
    
    RETURN COALESCE(v_deleted, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Сообщение об успешном выполнении скрипта
DO $$
BEGIN
    RAISE NOTICE 'SQL-скрипт для создания таблицы характеристик игрока в PvP успешно выполнен';
END $$;