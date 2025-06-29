-- Файл: 11_cultivation_progress.sql
-- Скрипт создает таблицу для прогресса культивации
\encoding UTF8;

-- Создание таблицы cultivation_progresses (которую система пытается найти)
CREATE TABLE IF NOT EXISTS cultivation_progresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, -- ссылка на Users будет добавлена после создания всех таблиц
    stage VARCHAR(100) DEFAULT 'Закалка тела',
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    experience_to_next_level INTEGER DEFAULT 100,
    breakthrough_progress INTEGER DEFAULT 0,
    daily_cultivation_limit INTEGER DEFAULT 1000,
    daily_cultivation_used INTEGER DEFAULT 0,
    last_cultivation_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    energy INTEGER DEFAULT 100,
    max_energy INTEGER DEFAULT 100,
    tribulation_completed BOOLEAN DEFAULT FALSE,
    insight_points INTEGER DEFAULT 0,
    bottleneck_progress INTEGER DEFAULT 0,
    required_bottleneck_progress INTEGER DEFAULT 100,
    last_insight_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cultivation_efficiency FLOAT DEFAULT 1.0,
    required_resources JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание альтернативного представления в CamelCase для совместимости с кодом
CREATE OR REPLACE VIEW "CultivationProgress" AS
    SELECT 
        id,
        user_id AS "userId",
        stage,
        level,
        experience,
        experience_to_next_level AS "experienceToNextLevel",
        breakthrough_progress AS "breakthroughProgress",
        daily_cultivation_limit AS "dailyCultivationLimit",
        daily_cultivation_used AS "dailyCultivationUsed",
        last_cultivation_reset AS "lastCultivationReset",
        energy,
        max_energy AS "maxEnergy",
        tribulation_completed AS "tribulationCompleted",
        insight_points AS "insightPoints",
        bottleneck_progress AS "bottleneckProgress",
        required_bottleneck_progress AS "requiredBottleneckProgress",
        last_insight_time AS "lastInsightTime",
        cultivation_efficiency AS "cultivationEfficiency",
        required_resources AS "requiredResources",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    FROM cultivation_progresses;

-- Добавление внешнего ключа (будет выполнено после создания всех таблиц)
-- Этот блок будет выполнен после того, как таблица Users уже создана
DO $$
BEGIN
    -- Проверяем, существует ли таблица Users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Добавляем ограничение внешнего ключа
        BEGIN
            ALTER TABLE cultivation_progresses 
            ADD CONSTRAINT fk_cultivation_user 
            FOREIGN KEY (user_id) 
            REFERENCES users(id) 
            ON UPDATE CASCADE 
            ON DELETE CASCADE;
        EXCEPTION 
            WHEN duplicate_object THEN
                RAISE NOTICE 'Ограничение внешнего ключа для cultivation_progresses уже существует';
        END;
    END IF;
END$$;

-- Создание функции триггера для синхронизации данных культивации
CREATE OR REPLACE FUNCTION sync_cultivation_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем данные в таблице users
    UPDATE users
    SET cultivation_level = NEW.level,
        experience = NEW.experience,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    
    -- Обновляем данные в таблице character_profile
    UPDATE character_profile
    SET level = NEW.level,
        experience = NEW.experience,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера для автоматического обновления связанных данных
DROP TRIGGER IF EXISTS cultivation_sync_trigger ON cultivation_progresses;
CREATE TRIGGER cultivation_sync_trigger
AFTER UPDATE ON cultivation_progresses
FOR EACH ROW
EXECUTE FUNCTION sync_cultivation_data();

-- Добавляем комментарии для документации
COMMENT ON TABLE cultivation_progresses IS 'Таблица для хранения прогресса культивации пользователей';
COMMENT ON VIEW "CultivationProgress" IS 'Представление таблицы cultivation_progresses в формате CamelCase для совместимости';
COMMENT ON FUNCTION sync_cultivation_data() IS 'Функция триггера для синхронизации данных культивации между таблицами';
COMMENT ON TRIGGER cultivation_sync_trigger ON cultivation_progresses IS 'Триггер для автоматического обновления данных культивации в таблицах users и character_profile';

--
-- Триггер для автоматического создания записи о прогрессе культивации для нового пользователя
--

-- 1. Функция-триггер
CREATE OR REPLACE FUNCTION create_cultivation_progress_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Вставляем новую запись в cultivation_progresses с user_id нового пользователя
    -- Все остальные поля получат значения по умолчанию, определенные в таблице
    INSERT INTO cultivation_progresses (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Создание триггера на таблице users
-- Убедимся, что предыдущая версия триггера удалена, если она существует
DROP TRIGGER IF EXISTS new_user_cultivation_trigger ON users;
CREATE TRIGGER new_user_cultivation_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_cultivation_progress_for_new_user();

-- 3. Комментарии для документации
COMMENT ON FUNCTION create_cultivation_progress_for_new_user() IS 'Функция-триггер для создания записи о прогрессе культивации для нового пользователя';
COMMENT ON TRIGGER new_user_cultivation_trigger ON users IS 'Триггер, который автоматически создает запись о прогрессе культивации при создании нового пользователя';