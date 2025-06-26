-- SQL-скрипт для создания таблиц системы достижений
-- Создание: 28.04.2025
-- Обновление: 08.06.2025
\encoding UTF8

-- Удаление существующих таблиц для предотвращения конфликтов
DROP TABLE IF EXISTS achievement_progress CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS achievement_types CASCADE;

-- Создание таблицы типов достижений
CREATE TABLE IF NOT EXISTS achievement_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  icon VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица предопределенных достижений
-- Изменяем тип id на SERIAL (INTEGER с автоинкрементом)
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  rewards TEXT NOT NULL,
  required_value INTEGER NOT NULL DEFAULT 1,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для отслеживания прогресса пользователей
CREATE TABLE IF NOT EXISTS achievement_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_rewarded BOOLEAN NOT NULL DEFAULT FALSE,
  completion_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_achievement_types_category ON achievement_types(category);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_hidden ON achievements(is_hidden);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_id ON achievement_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_achievement_id ON achievement_progress(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_completed ON achievement_progress(is_completed);

-- Комментарий к таблицам
COMMENT ON TABLE achievement_types IS 'Типы достижений, доступных в игре';
COMMENT ON TABLE achievements IS 'Предопределенные достижения в игре';
COMMENT ON TABLE achievement_progress IS 'Прогресс пользователей по достижениям';

-- Заполнение таблицы типов достижений
INSERT INTO achievement_types (name, description, category, icon) VALUES
('cultivation_level', 'Достижения за достижение определенного уровня культивации', 'cultivation', 'cultivation-icon'),
('quest_complete', 'Достижения за выполнение определенного количества квестов', 'quests', 'quest-icon'),
('technique_master', 'Достижения за освоение техник', 'combat', 'technique-icon'),
('alchemy_create', 'Достижения за создание алхимических предметов', 'crafting', 'alchemy-icon'),
('sect_contribution', 'Достижения за вклад в секту', 'social', 'sect-icon'),
('merchant_trades', 'Достижения за торговлю с торговцами', 'economy', 'merchant-icon'),
('enemy_defeat', 'Достижения за победу над врагами', 'combat', 'battle-icon'),
('resource_collect', 'Достижения за сбор ресурсов', 'exploration', 'resource-icon'),
('group_activity', 'Достижения за участие в групповых активностях', 'social', 'group-icon');

-- Заполнение таблицы предопределенными достижениями с разнообразными типами предметов
INSERT INTO achievements (title, description, icon, category, rewards, required_value, is_hidden, display_order) VALUES
('Первые шаги', 'Достигните 1-го уровня культивации', '🧘', 'культивация', 
 '[{"type":"currency","amount":100,"icon":"💰","currency_type":"gold"}]', 1, false, 10),

('Коллекционер техник', 'Изучите 5 различных техник', '📚', 'техники', 
 '[{"type":"experience","amount":200,"icon":"⭐"},{"type":"item","item_id":"basic_cultivation_manual","name":"Базовое руководство по культивации","icon":"📖","item_type":"book","rarity":"common"}]', 5, false, 20),

('Мастер алхимии', 'Создайте 10 алхимических предметов', '⚗️', 'алхимия', 
 '[{"type":"currency","amount":300,"icon":"💰","currency_type":"gold"},{"type":"item","item_id":"essence_concentration","name":"Эссенция концентрации","icon":"⚗️","item_type":"ingredient","rarity":"rare","description":"Концентрированная эссенция, усиливающая ментальную фокусировку."}]', 10, false, 40),

('Воин', 'Победите 30 врагов', '⚔️', 'битвы', 
 '[{"type":"experience","amount":300,"icon":"⭐"},{"type":"item","item_id":"eastern_wind_blade","name":"Клинок Восточного Ветра","icon":"🗡️","item_type":"weapon","rarity":"rare","description":"Легкий и острый меч, созданный по древним техникам Восточного региона."}]', 30, false, 60),

('Гранд-мастер культивации', 'Достигните 10-го уровня культивации', '🌟', 'культивация', 
 '[{"type":"currency","amount":1000,"icon":"💰","currency_type":"gold"},{"type":"experience","amount":1000,"icon":"⭐"},{"type":"item","item_id":"essence_heaven","name":"Эссенция небес","icon":"☁️","item_type":"ingredient","rarity":"legendary","description":"Капля чистой энергии небесной стихии."}]', 10, false, 100),

('Мастер медитации', 'Проведите в медитации 24 часа', '🧘', 'культивация', 
 '[{"type":"experience","amount":500,"icon":"⭐"},{"type":"currency","amount":300,"icon":"💰","currency_type":"spirit_stones"},{"type":"item","item_id":"crystal_star","name":"Звездный кристалл","icon":"🌟","item_type":"ingredient","rarity":"legendary","description":"Кристалл, сформировавшийся из осколка упавшей звезды."}]', 24, false, 45),

('Победитель духовных питомцев', 'Приручите 5 духовных питомцев', '🐉', 'битвы', 
 '[{"type":"item","item_id":"deluxe_pet_food","name":"Деликатесы для питомцев","icon":"🍖","item_type":"pet_food","rarity":"rare","description":"Редкие деликатесы, которые очень нравятся всем духовным питомцам","quantity":5}]', 5, false, 55),

('Бессмертный культиватор', 'Достигните 20-го уровня культивации', '☯️', 'культивация', 
 '[{"type":"currency","amount":5000,"icon":"💰","currency_type":"spirit_stones"},{"type":"item","item_id":"essence_purity","name":"Эссенция чистоты","icon":"✨","item_type":"ingredient","rarity":"epic","description":"Редкая субстанция с абсолютной чистотой, используемая в высокоуровневой алхимии."},{"type":"experience","amount":2000,"icon":"⭐"}]', 20, false, 110),

('Собиратель редкостей', 'Соберите 5 легендарных предметов', '🏆', 'экономика', 
 '[{"type":"currency","amount":1500,"icon":"💰","currency_type":"gold"},{"type":"item","item_id":"essence_reflection","name":"Эссенция отражения","icon":"🪞","item_type":"ingredient","rarity":"uncommon","description":"Жидкая субстанция с зеркальной поверхностью, отражающая энергетические атаки."}]', 5, false, 80);

-- Создание триггера для автоматического создания записей прогресса достижений при регистрации пользователя
-- Добавлено: 07.06.2025

-- Удаление существующего триггера и функции для предотвращения конфликтов
DROP TRIGGER IF EXISTS create_achievement_progress_trigger ON users;
DROP FUNCTION IF EXISTS create_achievement_progress_for_new_user();

-- Создаем триггерную функцию
CREATE OR REPLACE FUNCTION create_achievement_progress_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
    achievement_record RECORD;
    current_val INTEGER;
    is_completed_val BOOLEAN;
BEGIN
    -- Для каждого достижения создаем запись в таблице achievement_progress
    FOR achievement_record IN SELECT * FROM achievements LOOP
        -- Определяем начальное значение прогресса в зависимости от типа достижения
        IF achievement_record.title = 'Первые шаги' AND achievement_record.category = 'культивация' THEN
            -- Для достижения "Первые шаги" устанавливаем текущее значение равным начальному уровню культивации
            current_val := NEW.cultivation_level;
        ELSE
            -- Для остальных достижений устанавливаем начальное значение 0
            current_val := 0;
        END IF;
        
        -- Проверяем, выполнено ли достижение
        is_completed_val := (current_val >= achievement_record.required_value);
        
        -- Вставляем запись в таблицу achievement_progress
        INSERT INTO achievement_progress (
            user_id,
            achievement_id,
            current_value,
            is_completed,
            is_rewarded,
            completion_date,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            achievement_record.id,
            current_val,
            is_completed_val,
            FALSE,
            CASE WHEN is_completed_val THEN CURRENT_TIMESTAMP ELSE NULL END,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер, который будет вызывать функцию после вставки в таблицу users
CREATE TRIGGER create_achievement_progress_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_achievement_progress_for_new_user();

-- Комментарий к триггеру
COMMENT ON TRIGGER create_achievement_progress_trigger ON users IS 'Триггер для автоматического создания записей прогресса достижений при регистрации нового пользователя';
COMMENT ON FUNCTION create_achievement_progress_for_new_user() IS 'Функция, создающая записи в таблице achievement_progress для каждого достижения при регистрации нового пользователя';