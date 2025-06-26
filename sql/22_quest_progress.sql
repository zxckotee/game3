-- SQL-скрипт с дополнительными операциями для прогресса квестов
-- Создание: 28.04.2025, обновление: 27.05.2025
\encoding UTF8

-- Этот файл больше не создает таблицу quest_progress, так как она определена в sql/01_quests.sql
-- Вместо этого, здесь могут быть определены дополнительные операции или миграции данных

-- Проверка существования дополнительного индекса
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_quest_progress_user_quest'
  ) THEN
    -- Создаем дополнительный уникальный индекс, если он не существует
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_quest_progress_user_quest ON quest_progress(user_id, quest_id)';
  END IF;
END
$$;

-- Примечание: все комментарии к таблице и полям перенесены в файл sql/01_quests.sql