-- SQL скрипт для создания и заполнения таблиц квестов
-- Использует PostgreSQL синтаксис
\encoding UTF8
-- Удаление существующих таблиц
DROP TABLE IF EXISTS quest_rewards CASCADE;
DROP TABLE IF EXISTS quest_objectives CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS quest_progress CASCADE;

-- Зависимость: quest_categories должна быть создана ранее (00_reference_tables.sql)

-- Таблица квестов
CREATE TABLE quests (
    id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50) REFERENCES quest_categories(id),
    difficulty VARCHAR(20),
    description TEXT,
    status VARCHAR(20),
    required_level INTEGER DEFAULT 0,
    repeatable BOOLEAN DEFAULT FALSE
);

-- Таблица целей квестов
CREATE TABLE quest_objectives (
    id VARCHAR(30) PRIMARY KEY,
    quest_id VARCHAR(20) REFERENCES quests(id) ON DELETE CASCADE,
    objective_text TEXT NOT NULL,
    required_progress INTEGER DEFAULT 1,
    type VARCHAR(50),
    target VARCHAR(100)
    -- Поле completed удалено, т.к. прогресс хранится индивидуально для каждого пользователя
);

-- Таблица наград за квесты
CREATE TABLE quest_rewards (
    id SERIAL PRIMARY KEY,
    quest_id VARCHAR(20) REFERENCES quests(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    amount INTEGER,
    gold INTEGER,
    silver INTEGER,
    copper INTEGER,
    icon VARCHAR(10)
);

-- Заполнение таблицы квестов (из quests.js)
INSERT INTO quests (id, title, category, difficulty, description, status, required_level, repeatable) VALUES
('q1', 'Первые шаги в культивации', 'main', 'Легко', 'Освойте базовые техники культивации и докажите свою силу в бою.', 'available', 0, false),
('q2', 'Помощь старейшине', 'sect', 'Средне', 'Старейшина Ли нуждается в редких травах для создания важного эликсира.', 'available', 2, false),
('q3', 'Ежедневная закалка', 'daily', 'Легко', 'Выполните ежедневные боевые упражнения для укрепления духа и тела.', 'available', 1, true),
('q4', 'Путь алхимика', 'side', 'Средне', 'Мастер алхимии ищет способного ученика. Докажите ему свои навыки, создав базовые эликсиры.', 'available', 5, false),
('q5', 'Охота на кабанов', 'side', 'Легко', 'Староста деревни жалуется на диких кабанов, которые портят урожай. Помогите жителям.', 'available', 3, false),
('q6', 'Начало пути', 'main', 'Легко', 'Сделайте первые шаги на пути к бессмертию, собрав полезные травы.', 'available', 1, false),
('q7', 'Поиск духовных трав', 'side', 'Средне', 'Найдите редкие травы для мастера алхимии, сражаясь с их хранителями.', 'available', 2, false),
('q8', 'Секретная техника', 'sect', 'Сложно', 'Изучите древнюю технику из запретной библиотеки, собрав свитки и победив хранителя.', 'available', 3, false);

-- Заполнение таблицы целей квестов с критериями автоматической проверки
INSERT INTO quest_objectives (id, quest_id, objective_text, required_progress, type, target) VALUES
-- q1: Первые шаги в культивации
('q1_obj1', 'q1', 'Достичь 2 уровня культивации', 2, 'REACH_LEVEL', '2'),
('q1_obj2', 'q1', 'Победить 3 слизняков', 3, 'DEFEAT_ENEMY', 'slime'),
('q1_obj3', 'q1', 'Изучить технику "Дыхание Небес"', 1, 'LEARN_TECHNIQUE', 't_breath_of_heavens'),

-- q2: Помощь старейшине
('q2_obj1', 'q2', 'Собрать 5 Багряных трав', 5, 'GATHER_ITEM', 'herb_crimson'),
('q2_obj2', 'q2', 'Создать 1 Пилюлю очищения', 1, 'CRAFT_ITEM', 'alchemy_pill_purification'),

-- q3: Ежедневная закалка
('q3_obj1', 'q3', 'Победить 5 любых врагов', 5, 'DEFEAT_ANY_ENEMY', '5'),

-- q4: Путь алхимика
('q4_obj1', 'q4', 'Создать 3 Пилюли очищения', 3, 'CRAFT_ITEM', 'alchemy_pill_purification'),
('q4_obj2', 'q4', 'Создать 1 Эликсир малой ци', 1, 'CRAFT_ITEM', 'alchemy_elixir_lesser_qi'),

-- q5: Охота на кабанов
('q5_obj1', 'q5', 'Победить 10 диких кабанов', 10, 'DEFEAT_ENEMY', 'enemy_wild_boar'),
('q5_obj2', 'q5', 'Собрать 5 клыков кабана', 5, 'GATHER_ITEM', 'item_boar_tusk'),

-- q6: Начало пути
('q6_obj1', 'q6', 'Достигните 2 уровня базового дыхания ци', 2, 'REACH_LEVEL', '2'),
('q6_obj2', 'q6', 'Соберите 5 единиц ци трав', 5, 'GATHER_ITEM', 'item_qi_herb'),

-- q7: Поиск духовных трав
('q7_obj1', 'q7', 'Соберите 10 единиц духовных трав', 10, 'GATHER_ITEM', 'item_spiritual_herb'),
('q7_obj2', 'q7', 'Победите 3 духовных зверей', 3, 'DEFEAT_ENEMY', 'enemy_spirit_beast'),

-- q8: Секретная техника
('q8_obj1', 'q8', 'Найдите 3 фрагмента древнего свитка', 3, 'GATHER_ITEM', 'item_scroll_fragment'),
('q8_obj2', 'q8', 'Достигните 5 уровня понимания Ци', 5, 'REACH_LEVEL', '5'),
('q8_obj3', 'q8', 'Победите хранителя библиотеки', 1, 'DEFEAT_ENEMY', 'enemy_library_guardian');

-- Заполнение таблицы наград за квесты
INSERT INTO quest_rewards (quest_id, type, name, amount, gold, silver, copper, icon) VALUES
('q1', 'experience', NULL, 100, NULL, NULL, NULL, '✨'),
('q1', 'item', 'Пилюля очищения', NULL, NULL, NULL, NULL, '💊'),
('q1', 'currency', NULL, NULL, 0, 5, NULL, '🪙'),
('q2', 'technique', 'Искусство Багряного Пламени', NULL, NULL, NULL, NULL, '🔥'),
('q2', 'currency', NULL, NULL, 1, 0, NULL, '🪙'),
('q3', 'experience', NULL, 50, NULL, NULL, NULL, '✨'),
('q3', 'currency', NULL, NULL, NULL, 20, 0, '💿'),
('q4', 'experience', NULL, 200, NULL, NULL, NULL, '✨'),
('q4', 'item', 'Формула эликсира ци', NULL, NULL, NULL, NULL, '📜'),
('q4', 'currency', NULL, NULL, 1, 50, NULL, '🪙'),
('q5', 'experience', NULL, 150, NULL, NULL, NULL, '✨'),
('q5', 'item', 'Кольцо охотника', NULL, NULL, NULL, NULL, '💍'),
('q5', 'currency', NULL, NULL, 0, 75, NULL, '🪙'),
('q6', 'experience', NULL, 50, NULL, NULL, NULL, '✨'),
('q6', 'item', 'Бронзовый меч', NULL, NULL, NULL, NULL, '🗡️'),
('q6', 'currency', NULL, NULL, 0, 10, NULL, '🪙'),
('q7', 'experience', NULL, 100, NULL, NULL, NULL, '✨'),
('q7', 'item', 'Нефритовый амулет', NULL, NULL, NULL, NULL, '🧿'),
('q7', 'currency', NULL, NULL, 0, 15, NULL, '🪙'),
('q8', 'experience', NULL, 200, NULL, NULL, NULL, '✨'),
('q8', 'technique', 'Техника защиты Ци', NULL, NULL, NULL, NULL, '🛡️'),
('q8', 'currency', NULL, NULL, 0, 25, NULL, '🪙');

-- Создание таблицы прогресса квестов
CREATE TABLE quest_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    quest_id VARCHAR(20) NOT NULL REFERENCES quests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    status VARCHAR(20) CHECK (status IN ('available', 'active', 'completed', 'failed')) DEFAULT 'available',
    progress JSONB DEFAULT '{}'::JSONB,
    completed_objectives JSONB DEFAULT '[]'::JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, quest_id)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_quest_progress_user ON quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_quest ON quest_progress(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_status ON quest_progress(status);

-- Комментарий к таблице
COMMENT ON TABLE quest_progress IS 'Прогресс выполнения квестов пользователями';
COMMENT ON COLUMN quest_progress.user_id IS 'Идентификатор пользователя';
COMMENT ON COLUMN quest_progress.quest_id IS 'Идентификатор квеста';
COMMENT ON COLUMN quest_progress.status IS 'Статус выполнения квеста';
COMMENT ON COLUMN quest_progress.progress IS 'Прогресс выполнения целей в формате JSON (objective_id: current_progress)';
COMMENT ON COLUMN quest_progress.completed_objectives IS 'Список выполненных целей квеста';
COMMENT ON COLUMN quest_progress.started_at IS 'Дата и время начала квеста';
COMMENT ON COLUMN quest_progress.completed_at IS 'Дата и время завершения квеста';

-- Создаем функцию для автоматической инициализации квестов при создании пользователя
CREATE OR REPLACE FUNCTION initialize_user_quests()
RETURNS TRIGGER AS $$
BEGIN
    -- Добавляем ВСЕ квесты в прогресс пользователя
    INSERT INTO quest_progress (user_id, quest_id, status, progress, completed_objectives)
    SELECT
        NEW.id,
        q.id,
        'available',
        '{}'::JSONB,
        '[]'::JSONB
    FROM
        quests q;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматической инициализации квестов
DROP TRIGGER IF EXISTS user_quests_init_trigger ON users;
CREATE TRIGGER user_quests_init_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION initialize_user_quests();

-- Добавляем прогресс квестов для всех существующих пользователей
INSERT INTO quest_progress (user_id, quest_id, status, progress, completed_objectives)
SELECT
    u.id,
    q.id,
    'available',
    '{}'::JSONB,
    '[]'::JSONB
FROM
    quests q
CROSS JOIN
    users u
WHERE
    1=1 -- Добавляем все квесты независимо от уровня пользователя
ON CONFLICT (user_id, quest_id) DO NOTHING;
