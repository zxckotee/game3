-- SQL скрипт для создания и заполнения таблиц квестов
-- Использует PostgreSQL синтаксис
\encoding UTF8
-- Удаление существующих таблиц
DROP TABLE IF EXISTS quest_objective_progress CASCADE;
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

-- Таблица прогресса по отдельным целям квестов
CREATE TABLE quest_objective_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    objective_id VARCHAR(30) NOT NULL REFERENCES quest_objectives(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    required_progress INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Уникальный индекс: один пользователь - одна цель
    UNIQUE(user_id, objective_id)
);

-- Индексы для производительности
CREATE INDEX idx_quest_obj_progress_user ON quest_objective_progress(user_id);
CREATE INDEX idx_quest_obj_progress_objective ON quest_objective_progress(objective_id);
CREATE INDEX idx_quest_obj_progress_completed ON quest_objective_progress(completed);
CREATE INDEX idx_quest_obj_progress_user_completed ON quest_objective_progress(user_id, completed);

-- Заполнение таблицы квестов (из quests.js)
INSERT INTO quests (id, title, category, difficulty, description, status, required_level, repeatable) VALUES
('q1', 'Первые шаги культиватора', 'main', 'Легко', 'Соберите базовые травы для начала пути культивации.', 'available', 1, false),
('q2', 'Основы алхимии', 'side', 'Легко', 'Изучите основы алхимии, создав первое зелье.', 'available', 2, false),
('q3', 'Первый бой', 'main', 'Легко', 'Проверьте свои боевые навыки на тренировочном манекене.', 'available', 3, false),
('q4', 'Путь совершенствования', 'main', 'Средне', 'Продолжите культивацию до 5 уровня.', 'available', 5, false),
('q5', 'Охота на духовных зверей', 'side', 'Средне', 'Испытайте себя в бою с духовными зверями.', 'available', 5, false),
('q6', 'Испытание разбойником', 'side', 'Средне', 'Сразитесь с опасным горным разбойником.', 'available', 6, false),
('q7', 'Встреча с призраком', 'side', 'Сложно', 'Сразитесь с мстительным духом ночи.', 'available', 7, false),
('q8', 'Сбор минералов', 'side', 'Легко', 'Соберите минералы для продвинутой алхимии.', 'available', 3, false),
('q9', 'Эликсир концентрации', 'side', 'Средне', 'Создайте мощный эликсир для усиления разума.', 'available', 8, false),
('q10', 'Первая дуэль', 'side', 'Средне', 'Докажите свое мастерство в честной дуэли.', 'available', 8, false),
('q11', 'Бронзовая лига', 'side', 'Сложно', 'Поднимитесь до бронзовой лиги в PvP арене.', 'available', 10, false),
('q12', 'Командная работа', 'side', 'Сложно', 'Сражайтесь в команде и одержите победу.', 'available', 12, false),
('q13', 'Испытание стихий', 'side', 'Сложно', 'Сразитесь с силами природы.', 'available', 10, false),
('q14', 'Древний страж', 'main', 'Очень сложно', 'Сразитесь с могущественным стражем древних руин.', 'available', 15, false),
('q15', 'Ежедневная медитация', 'daily', 'Легко', 'Выполните ежедневную медитацию для укрепления духа.', 'available', 1, true);

-- Заполнение таблицы целей квестов с критериями автоматической проверки
INSERT INTO quest_objectives (id, quest_id, objective_text, required_progress, type, target) VALUES
-- q1: Первые шаги культиватора
('q1_obj1', 'q1', 'Собрать 5 трав для сбора ци', 5, 'GATHER_ITEM', 'herb_qigathering'),

-- q2: Основы алхимии
('q2_obj1', 'q2', 'Создать 1 базовое зелье', 1, 'CRAFT_ITEM', 'alchemy_basic_potion'),

-- q3: Первый бой
('q3_obj1', 'q3', 'Победить тренировочный манекен', 1, 'DEFEAT_ENEMY', 'training_dummy'),

-- q4: Путь совершенствования
('q4_obj1', 'q4', 'Достичь 5 уровня культивации', 5, 'REACH_LEVEL', '5'),

-- q5: Охота на духовных зверей
('q5_obj1', 'q5', 'Победить 3 слабых духовных зверей', 3, 'DEFEAT_ENEMY', 'weak_spirit_beast'),

-- q6: Испытание разбойником
('q6_obj1', 'q6', 'Победить горного разбойника', 1, 'DEFEAT_ENEMY', 'mountain_bandit'),

-- q7: Встреча с призраком
('q7_obj1', 'q7', 'Победить ночного призрака', 1, 'DEFEAT_ENEMY', 'night_wraith'),

-- q8: Сбор минералов
('q8_obj1', 'q8', 'Собрать 10 минеральной пыли', 10, 'GATHER_ITEM', 'mineral_dust'),

-- q9: Эликсир концентрации
('q9_obj1', 'q9', 'Создать 1 эссенцию концентрации', 1, 'CRAFT_ITEM', 'essence_concentration'),

-- q10: Первая дуэль
('q10_obj1', 'q10', 'Выиграть 1 дуэль 1v1', 1, 'PVP_WIN', 'duel_1v1'),

-- q11: Бронзовая лига
('q11_obj1', 'q11', 'Достичь рейтинга 1200 в PvP', 1200, 'PVP_RATING', '1200'),

-- q12: Командная работа
('q12_obj1', 'q12', 'Выиграть 1 командный бой 3v3', 1, 'PVP_WIN', 'team_3v3'),

-- q13: Испытание стихий
('q13_obj1', 'q13', 'Победить духа молнии', 1, 'DEFEAT_ENEMY', 'lightning_spirit'),
('q13_obj2', 'q13', 'Победить водного элементаля', 1, 'DEFEAT_ENEMY', 'water_elemental'),

-- q14: Древний страж
('q14_obj1', 'q14', 'Победить древнего стража', 1, 'DEFEAT_ENEMY', 'ancient_guardian'),

-- q15: Ежедневная медитация
('q15_obj1', 'q15', 'Выполнить медитацию 1 раз', 1, 'MEDITATION', 'daily_meditation');

-- Заполнение таблицы наград за квесты
INSERT INTO quest_rewards (quest_id, type, name, amount, gold, silver, copper, icon) VALUES
-- q1: Первые шаги культиватора
('q1', 'experience', NULL, 50, NULL, NULL, NULL, '✨'),
('q1', 'currency', NULL, NULL, 0, 10, NULL, '🪙'),

-- q2: Основы алхимии
('q2', 'experience', NULL, 75, NULL, NULL, NULL, '✨'),
('q2', 'item', 'Рецепт базового зелья', NULL, NULL, NULL, NULL, '📜'),
('q2', 'currency', NULL, NULL, 0, 15, NULL, '🪙'),

-- q3: Первый бой
('q3', 'experience', NULL, 100, NULL, NULL, NULL, '✨'),
('q3', 'item', 'Деревянный меч', NULL, NULL, NULL, NULL, '🗡️'),
('q3', 'currency', NULL, NULL, 0, 20, NULL, '🪙'),

-- q4: Путь совершенствования
('q4', 'experience', NULL, 200, NULL, NULL, NULL, '✨'),
('q4', 'item', 'Кольцо культиватора', NULL, NULL, NULL, NULL, '💍'),
('q4', 'currency', NULL, NULL, 1, 0, NULL, '🪙'),

-- q5: Охота на духовных зверей
('q5', 'experience', NULL, 150, NULL, NULL, NULL, '✨'),
('q5', 'item', 'Амулет духовной защиты', NULL, NULL, NULL, NULL, '🧿'),
('q5', 'currency', NULL, NULL, 0, 50, NULL, '🪙'),

-- q6: Испытание разбойником
('q6', 'experience', NULL, 180, NULL, NULL, NULL, '✨'),
('q6', 'item', 'Железный клинок', NULL, NULL, NULL, NULL, '⚔️'),
('q6', 'currency', NULL, NULL, 0, 75, NULL, '🪙'),

-- q7: Встреча с призраком
('q7', 'experience', NULL, 250, NULL, NULL, NULL, '✨'),
('q7', 'item', 'Талисман изгнания духов', NULL, NULL, NULL, NULL, '🔮'),
('q7', 'currency', NULL, NULL, 1, 25, NULL, '🪙'),

-- q8: Сбор минералов
('q8', 'experience', NULL, 120, NULL, NULL, NULL, '✨'),
('q8', 'item', 'Кирка горняка', NULL, NULL, NULL, NULL, '⛏️'),
('q8', 'currency', NULL, NULL, 0, 40, NULL, '🪙'),

-- q9: Эликсир концентрации
('q9', 'experience', NULL, 300, NULL, NULL, NULL, '✨'),
('q9', 'item', 'Формула эликсира разума', NULL, NULL, NULL, NULL, '📋'),
('q9', 'currency', NULL, NULL, 1, 50, NULL, '🪙'),

-- q10: Первая дуэль
('q10', 'experience', NULL, 200, NULL, NULL, NULL, '✨'),
('q10', 'item', 'Медаль дуэлянта', NULL, NULL, NULL, NULL, '🏅'),
('q10', 'currency', NULL, NULL, 1, 0, NULL, '🪙'),

-- q11: Бронзовая лига
('q11', 'experience', NULL, 400, NULL, NULL, NULL, '✨'),
('q11', 'item', 'Бронзовый значок', NULL, NULL, NULL, NULL, '🥉'),
('q11', 'currency', NULL, NULL, 2, 0, NULL, '🪙'),

-- q12: Командная работа
('q12', 'experience', NULL, 350, NULL, NULL, NULL, '✨'),
('q12', 'item', 'Знак командира', NULL, NULL, NULL, NULL, '🎖️'),
('q12', 'currency', NULL, NULL, 1, 75, NULL, '🪙'),

-- q13: Испытание стихий
('q13', 'experience', NULL, 500, NULL, NULL, NULL, '✨'),
('q13', 'item', 'Кольцо стихий', NULL, NULL, NULL, NULL, '💎'),
('q13', 'currency', NULL, NULL, 2, 50, NULL, '🪙'),

-- q14: Древний страж
('q14', 'experience', NULL, 800, NULL, NULL, NULL, '✨'),
('q14', 'item', 'Реликвия древних', NULL, NULL, NULL, NULL, '🏺'),
('q14', 'currency', NULL, NULL, 5, 0, NULL, '🪙'),

-- q15: Ежедневная медитация
('q15', 'experience', NULL, 25, NULL, NULL, NULL, '✨'),
('q15', 'currency', NULL, NULL, 0, 5, NULL, '🪙');

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
    
    -- Добавляем ВСЕ цели квестов в прогресс пользователя
    INSERT INTO quest_objective_progress (user_id, objective_id, current_progress, required_progress, completed, metadata)
    SELECT
        NEW.id,
        qo.id,
        0,
        qo.required_progress,
        false,
        '{}'::JSONB
    FROM
        quest_objectives qo;
    
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

-- Добавляем прогресс целей квестов для всех существующих пользователей
INSERT INTO quest_objective_progress (user_id, objective_id, current_progress, required_progress, completed, metadata)
SELECT
    u.id,
    qo.id,
    0,
    qo.required_progress,
    false,
    '{}'::JSONB
FROM
    quest_objectives qo
CROSS JOIN
    users u
WHERE
    1=1 -- Добавляем все цели квестов независимо от уровня пользователя
ON CONFLICT (user_id, objective_id) DO NOTHING;


-- Функция для автоматического обновления поля updated_at
CREATE OR REPLACE FUNCTION update_quest_objective_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления поля updated_at в quest_objective_progress
DROP TRIGGER IF EXISTS trigger_update_quest_objective_progress_updated_at ON quest_objective_progress;
CREATE TRIGGER trigger_update_quest_objective_progress_updated_at
BEFORE UPDATE ON quest_objective_progress
FOR EACH ROW
EXECUTE FUNCTION update_quest_objective_progress_updated_at();

-- Триггер для автоматического обновления поля updated_at в quest_progress (если еще не существует)
CREATE OR REPLACE FUNCTION update_quest_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_quest_progress_updated_at ON quest_progress;
CREATE TRIGGER trigger_update_quest_progress_updated_at
BEFORE UPDATE ON quest_progress
FOR EACH ROW
EXECUTE FUNCTION update_quest_progress_updated_at();
