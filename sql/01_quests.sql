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
    objective_text TEXT NOT NULL
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
('q1', 'Первые шаги в культивации', 'main', 'Легко', 'Освойте базовые техники культивации и достигните первого уровня духовной силы.', 'available', 0, false),
('q2', 'Помощь старейшине', 'sect', 'Средне', 'Старейшина Ли нуждается в редких травах для создания важного эликсира.', 'available', 2, false),
('q3', 'Ежедневная медитация', 'daily', 'Легко', 'Выполните ежедневные упражнения для укрепления духовного тела.', 'available', 1, true),
('q4', 'Тайны горы Тысячи Духов', 'side', 'Сложно', 'Исследуйте загадочную гору, где по слухам обитают древние духи.', 'available', 5, false),
('q5', 'Турнир молодых мастеров', 'main', 'Средне', 'Примите участие в турнире молодых мастеров культивации и докажите свою силу.', 'available', 3, false),
('q6', 'Начало пути', 'main', 'Легко', 'Сделайте первые шаги на пути к бессмертию.', 'available', 1, false),
('q7', 'Поиск духовных трав', 'side', 'Средне', 'Найдите редкие травы для мастера алхимии.', 'available', 2, false),
('q8', 'Секретная техника', 'sect', 'Сложно', 'Изучите древнюю технику из запретной библиотеки.', 'available', 3, false);

-- Заполнение таблицы целей квестов с критериями автоматической проверки
INSERT INTO quest_objectives (id, quest_id, objective_text) VALUES
('q1_obj1', 'q1', 'Достичь 1 уровня культивации'),
('q1_obj2', 'q1', 'Накопить 100 единиц духовной энергии'),
('q1_obj3', 'q1', 'Изучить технику "Дыхание Небес"'),
('q2_obj1', 'q2', 'Найти Багряную траву'),
('q2_obj2', 'q2', 'Собрать Лунный цветок'),
('q3_obj1', 'q3', 'Медитировать 30 минут'),
('q3_obj2', 'q3', 'Накопить 50 единиц духовной энергии'),
('q4_obj1', 'q4', 'Достичь вершины горы'),
('q4_obj2', 'q4', 'Найти следы древних духов'),
('q4_obj3', 'q4', 'Получить благословение духа'),
('q5_obj1', 'q5', 'Зарегистрироваться на турнир'),
('q5_obj2', 'q5', 'Победить в отборочном раунде'),
('q5_obj3', 'q5', 'Дойти до полуфинала'),
('q5_obj4', 'q5', 'Занять призовое место'),
('q6_obj1', 'q6', 'Достигните 2 уровня базового дыхания ци'),
('q6_obj2', 'q6', 'Соберите 5 единиц ци трав' ),
('q7_obj1', 'q7', 'Соберите 10 единиц духовных трав'),
('q7_obj2', 'q7', 'Победите 3 духовных зверей'),
('q8_obj1', 'q8', 'Найдите 3 фрагмента древнего свитка'),
('q8_obj2', 'q8', 'Достигните 5 уровня понимания Ци'),
('q8_obj3', 'q8', 'Победите хранителя библиотеки');

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
('q4', 'item', 'Эссенция горного духа', NULL, NULL, NULL, NULL, '🌟'),
('q4', 'currency', NULL, NULL, 1, 50, NULL, '🪙'),
('q5', 'experience', NULL, 300, NULL, NULL, NULL, '✨'),
('q5', 'technique', 'Искусство Небесного Меча', NULL, NULL, NULL, NULL, '⚔️'),
('q5', 'currency', NULL, NULL, 2, 0, NULL, '🪙'),
('q5', 'item', 'Медаль турнира', NULL, NULL, NULL, NULL, '🏅'),
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
    progress INTEGER DEFAULT 0,
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
COMMENT ON COLUMN quest_progress.progress IS 'Процент выполнения квеста (0-100)';
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
        0,
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
    0,
    '[]'::JSONB
FROM
    quests q
CROSS JOIN
    users u
WHERE
    1=1 -- Добавляем все квесты независимо от уровня пользователя
ON CONFLICT (user_id, quest_id) DO NOTHING;
