-- SQL-скрипт для миграции таблицы quest_progress
-- Создание: 27.05.2025
\encoding UTF8

-- Сохраняем существующие данные во временную таблицу (если таблица существует)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quest_progress') THEN
    CREATE TEMP TABLE temp_quest_progress AS
    SELECT 
      user_id, 
      quest_id, 
      status, 
      CASE 
        WHEN jsonb_typeof(progress) = 'object' THEN 0 -- Конвертируем JSONB в INTEGER если прогресс был в старом формате
        ELSE progress::integer
      END as progress,
      started_at,
      completed_at,
      created_at,
      updated_at
    FROM quest_progress;
  END IF;
END
$$;

-- Удаляем триггер
DROP TRIGGER IF EXISTS user_quests_init_trigger ON users;

-- Удаляем функцию
DROP FUNCTION IF EXISTS initialize_user_quests();

-- Удаляем таблицу
DROP TABLE IF EXISTS quest_progress CASCADE;

-- Пересоздаем таблицу с правильной структурой
CREATE TABLE quest_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    quest_id VARCHAR(20) NOT NULL REFERENCES quests(id) ON DELETE CASCADE ON UPDATE CASCADE,
    status VARCHAR(20) CHECK (status IN ('не начато', 'в процессе', 'выполнено', 'провалено', 'available')) DEFAULT 'не начато',
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_quest_progress_user_quest ON quest_progress(user_id, quest_id);

-- Комментарии к таблице
COMMENT ON TABLE quest_progress IS 'Прогресс выполнения квестов пользователями';
COMMENT ON COLUMN quest_progress.user_id IS 'Идентификатор пользователя';
COMMENT ON COLUMN quest_progress.quest_id IS 'Идентификатор квеста';
COMMENT ON COLUMN quest_progress.status IS 'Статус выполнения квеста';
COMMENT ON COLUMN quest_progress.progress IS 'Процент выполнения квеста (0-100)';
COMMENT ON COLUMN quest_progress.completed_objectives IS 'Список выполненных целей квеста';
COMMENT ON COLUMN quest_progress.started_at IS 'Дата и время начала квеста';
COMMENT ON COLUMN quest_progress.completed_at IS 'Дата и время завершения квеста';

-- Пересоздаем функцию для автоматической инициализации квестов
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

-- Пересоздаем триггер
CREATE TRIGGER user_quests_init_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION initialize_user_quests();

-- Восстанавливаем данные из временной таблицы (если она существует)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'temp_quest_progress' AND schemaname = 'pg_temp') THEN
    INSERT INTO quest_progress (user_id, quest_id, status, progress, completed_objectives, started_at, completed_at, created_at, updated_at)
    SELECT 
      user_id, 
      quest_id, 
      status, 
      progress,
      '[]'::JSONB, -- Устанавливаем пустой массив для новой колонки
      started_at,
      completed_at,
      created_at,
      updated_at
    FROM 
      temp_quest_progress
    ON CONFLICT (user_id, quest_id) DO NOTHING;
    
    DROP TABLE temp_quest_progress;
  END IF;
END
$$;

-- Добавляем прогресс квестов для всех существующих пользователей, у которых его еще нет
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

-- Сообщение об успешном выполнении
SELECT 'Миграция таблицы quest_progress успешно завершена!' AS message;