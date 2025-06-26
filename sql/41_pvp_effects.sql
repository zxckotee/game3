-- SQL-скрипт для добавления поддержки эффектов в PvP-систему

-- Проверяем существование таблицы pvp_participants
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pvp_participants'
    ) THEN
        -- Добавляем поле effects для хранения активных эффектов
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pvp_participants' 
            AND column_name = 'effects'
        ) THEN
            ALTER TABLE pvp_participants ADD COLUMN effects JSONB DEFAULT '[]'::jsonb;
            RAISE NOTICE 'Добавлено поле effects в таблицу pvp_participants';
        ELSE
            RAISE NOTICE 'Поле effects уже существует в таблице pvp_participants';
        END IF;

        -- Добавляем поле cooldowns для хранения информации о перезарядке техник
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pvp_participants' 
            AND column_name = 'cooldowns'
        ) THEN
            ALTER TABLE pvp_participants ADD COLUMN cooldowns JSONB DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Добавлено поле cooldowns в таблицу pvp_participants';
        ELSE
            RAISE NOTICE 'Поле cooldowns уже существует в таблице pvp_participants';
        END IF;
    ELSE
        RAISE NOTICE 'Таблица pvp_participants не существует. Создаем таблицу...';
        
        -- Создаем таблицу pvp_participants, если она не существует
        CREATE TABLE pvp_participants (
            id SERIAL PRIMARY KEY,
            room_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            username VARCHAR(255) NOT NULL,
            level INTEGER NOT NULL DEFAULT 1,
            team INTEGER NOT NULL,
            position INTEGER NOT NULL,
            max_hp INTEGER NOT NULL DEFAULT 100,
            current_hp INTEGER NOT NULL DEFAULT 100,
            max_energy INTEGER NOT NULL DEFAULT 100,
            current_energy INTEGER NOT NULL DEFAULT 100,
            effects JSONB DEFAULT '[]'::jsonb,
            cooldowns JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Создаем индексы для оптимизации запросов
        CREATE INDEX idx_pvp_participants_room_id ON pvp_participants(room_id);
        CREATE INDEX idx_pvp_participants_user_id ON pvp_participants(user_id);
        CREATE INDEX idx_pvp_participants_team ON pvp_participants(team);
        
        RAISE NOTICE 'Таблица pvp_participants создана с полями effects и cooldowns';
    END IF;
END $$;

-- Проверяем существование таблицы pvp_actions
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pvp_actions'
    ) THEN
        -- Добавляем поле applied_effects для хранения информации о наложенных эффектах
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pvp_actions' 
            AND column_name = 'applied_effects'
        ) THEN
            ALTER TABLE pvp_actions ADD COLUMN applied_effects JSONB DEFAULT '[]'::jsonb;
            RAISE NOTICE 'Добавлено поле applied_effects в таблицу pvp_actions';
        ELSE
            RAISE NOTICE 'Поле applied_effects уже существует в таблице pvp_actions';
        END IF;

        -- Добавляем поле technique_name для хранения названия техники
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'pvp_actions' 
            AND column_name = 'technique_name'
        ) THEN
            ALTER TABLE pvp_actions ADD COLUMN technique_name VARCHAR(255);
            RAISE NOTICE 'Добавлено поле technique_name в таблицу pvp_actions';
        ELSE
            RAISE NOTICE 'Поле technique_name уже существует в таблице pvp_actions';
        END IF;
    ELSE
        RAISE NOTICE 'Таблица pvp_actions не существует. Пропускаем...';
    END IF;
END $$;

-- Создаем или обновляем функцию для применения эффекта
CREATE OR REPLACE FUNCTION apply_pvp_effect(
    p_participant_id INTEGER,
    p_effect JSONB
) RETURNS VOID AS $$
DECLARE
    v_effects JSONB;
    v_effect_exists BOOLEAN := FALSE;
    v_i INTEGER;
BEGIN
    -- Получаем текущие эффекты участника
    SELECT effects INTO v_effects FROM pvp_participants WHERE id = p_participant_id;
    
    -- Если эффектов нет, инициализируем пустым массивом
    IF v_effects IS NULL THEN
        v_effects := '[]'::jsonb;
    END IF;
    
    -- Проверяем, существует ли уже эффект с таким именем
    FOR v_i IN 0..jsonb_array_length(v_effects) - 1 LOOP
        IF v_effects->v_i->>'name' = p_effect->>'name' THEN
            -- Обновляем существующий эффект
            v_effects := jsonb_set(v_effects, ARRAY[v_i::text], p_effect);
            v_effect_exists := TRUE;
            EXIT;
        END IF;
    END LOOP;
    
    -- Если эффект не существует, добавляем его
    IF NOT v_effect_exists THEN
        v_effects := v_effects || jsonb_build_array(p_effect);
    END IF;
    
    -- Обновляем эффекты участника
    UPDATE pvp_participants SET effects = v_effects WHERE id = p_participant_id;
END;
$$ LANGUAGE plpgsql;

-- Создаем или обновляем функцию для обновления перезарядки техники
CREATE OR REPLACE FUNCTION set_pvp_cooldown(
    p_participant_id INTEGER,
    p_technique_id VARCHAR(255),
    p_duration INTEGER
) RETURNS VOID AS $$
DECLARE
    v_cooldowns JSONB;
    v_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Получаем текущие перезарядки участника
    SELECT cooldowns INTO v_cooldowns FROM pvp_participants WHERE id = p_participant_id;
    
    -- Если перезарядок нет, инициализируем пустым объектом
    IF v_cooldowns IS NULL THEN
        v_cooldowns := '{}'::jsonb;
    END IF;
    
    -- Вычисляем время окончания перезарядки
    v_end_time := CURRENT_TIMESTAMP + (p_duration || ' seconds')::interval;
    
    -- Обновляем перезарядку техники
    v_cooldowns := jsonb_set(v_cooldowns, ARRAY[p_technique_id], to_jsonb(v_end_time));
    
    -- Обновляем перезарядки участника
    UPDATE pvp_participants SET cooldowns = v_cooldowns WHERE id = p_participant_id;
END;
$$ LANGUAGE plpgsql;

-- Создаем или обновляем функцию для обработки эффектов в начале хода
CREATE OR REPLACE FUNCTION process_pvp_effects_turn(
    p_participant_id INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_effects JSONB;
    v_updated_effects JSONB := '[]'::jsonb;
    v_expired_effects JSONB := '[]'::jsonb;
    v_effect JSONB;
    v_i INTEGER;
    v_elapsed_turns INTEGER;
    v_duration INTEGER;
    v_damage_over_time INTEGER := 0;
    v_healing_over_time INTEGER := 0;
    v_energy_regen INTEGER := 0;
    v_result JSONB;
BEGIN
    -- Получаем текущие эффекты участника
    SELECT effects INTO v_effects FROM pvp_participants WHERE id = p_participant_id;
    
    -- Если эффектов нет, возвращаем пустой результат
    IF v_effects IS NULL OR jsonb_array_length(v_effects) = 0 THEN
        v_result := jsonb_build_object(
            'damage', 0,
            'healing', 0,
            'energy', 0,
            'expired_effects', '[]'::jsonb
        );
        RETURN v_result;
    END IF;
    
    -- Обрабатываем каждый эффект
    FOR v_i IN 0..jsonb_array_length(v_effects) - 1 LOOP
        v_effect := v_effects->v_i;
        v_elapsed_turns := COALESCE((v_effect->>'elapsedTurns')::INTEGER, 0) + 1;
        v_duration := COALESCE((v_effect->>'duration')::INTEGER, 1);
        
        -- Проверяем, истек ли эффект
        IF v_elapsed_turns >= v_duration THEN
            v_expired_effects := v_expired_effects || v_effect;
        ELSE
            -- Обновляем счетчик ходов
            v_effect := jsonb_set(v_effect, '{elapsedTurns}', to_jsonb(v_elapsed_turns));
            v_updated_effects := v_updated_effects || v_effect;
            
            -- Обрабатываем эффекты урона и лечения за ход
            IF (v_effect->>'damage_over_time')::INTEGER > 0 THEN
                v_damage_over_time := v_damage_over_time + (v_effect->>'damage_over_time')::INTEGER;
            END IF;
            
            IF (v_effect->>'healing_over_time')::INTEGER > 0 THEN
                v_healing_over_time := v_healing_over_time + (v_effect->>'healing_over_time')::INTEGER;
            END IF;
            
            IF (v_effect->>'energy_regen')::INTEGER > 0 THEN
                v_energy_regen := v_energy_regen + (v_effect->>'energy_regen')::INTEGER;
            END IF;
        END IF;
    END LOOP;
    
    -- Обновляем эффекты участника
    UPDATE pvp_participants SET effects = v_updated_effects WHERE id = p_participant_id;
    
    -- Применяем урон и лечение от эффектов
    IF v_damage_over_time > 0 THEN
        UPDATE pvp_participants 
        SET current_hp = GREATEST(0, current_hp - v_damage_over_time)
        WHERE id = p_participant_id;
    END IF;
    
    IF v_healing_over_time > 0 THEN
        UPDATE pvp_participants 
        SET current_hp = LEAST(max_hp, current_hp + v_healing_over_time)
        WHERE id = p_participant_id;
    END IF;
    
    IF v_energy_regen > 0 THEN
        UPDATE pvp_participants 
        SET current_energy = LEAST(max_energy, current_energy + v_energy_regen)
        WHERE id = p_participant_id;
    END IF;
    
    -- Формируем результат
    v_result := jsonb_build_object(
        'damage', v_damage_over_time,
        'healing', v_healing_over_time,
        'energy', v_energy_regen,
        'expired_effects', v_expired_effects
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Создаем или обновляем функцию для проверки перезарядок
CREATE OR REPLACE FUNCTION check_pvp_cooldowns(
    p_participant_id INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_cooldowns JSONB;
    v_updated_cooldowns JSONB := '{}'::jsonb;
    v_technique_id TEXT;
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_expired_cooldowns JSONB := '[]'::jsonb;
BEGIN
    -- Получаем текущие перезарядки участника
    SELECT cooldowns INTO v_cooldowns FROM pvp_participants WHERE id = p_participant_id;
    
    -- Если перезарядок нет, возвращаем пустой результат
    IF v_cooldowns IS NULL OR jsonb_object_keys(v_cooldowns) IS NULL THEN
        RETURN jsonb_build_object('expired_cooldowns', '[]'::jsonb);
    END IF;
    
    -- Обрабатываем каждую перезарядку
    FOR v_technique_id IN SELECT jsonb_object_keys(v_cooldowns) LOOP
        v_end_time := (v_cooldowns->>v_technique_id)::TIMESTAMP WITH TIME ZONE;
        
        -- Проверяем, истекла ли перезарядка
        IF v_end_time <= CURRENT_TIMESTAMP THEN
            v_expired_cooldowns := v_expired_cooldowns || to_jsonb(v_technique_id);
        ELSE
            v_updated_cooldowns := jsonb_set(v_updated_cooldowns, ARRAY[v_technique_id], to_jsonb(v_end_time));
        END IF;
    END LOOP;
    
    -- Обновляем перезарядки участника
    UPDATE pvp_participants SET cooldowns = v_updated_cooldowns WHERE id = p_participant_id;
    
    -- Возвращаем результат
    RETURN jsonb_build_object('expired_cooldowns', v_expired_cooldowns);
END;
$$ LANGUAGE plpgsql;

-- Сообщение об успешном выполнении скрипта
DO $$
BEGIN
    RAISE NOTICE 'SQL-скрипт для добавления поддержки эффектов в PvP-систему успешно выполнен';
END $$;