-- Скрипт для создания таблицы game_states
-- Эта таблица будет хранить централизованное состояние игрока в формате JSONB
\encoding UTF8
-- Убеждаемся, что расширение для работы с JSONB включено
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создаем таблицу game_states, если она не существует
CREATE TABLE IF NOT EXISTS game_states (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_game_state UNIQUE (user_id)
);

-- Создаем индексы для оптимизации запросов
-- Индекс по user_id для быстрого поиска
CREATE INDEX IF NOT EXISTS game_states_user_id_idx ON game_states (user_id);

-- Индекс по времени обновления для возможных запросов по времени
CREATE INDEX IF NOT EXISTS game_states_updated_at_idx ON game_states (updated_at);

-- Создаем GIN-индексы для быстрого поиска по JSONB-полям
-- Индекс для техник игрока
CREATE INDEX IF NOT EXISTS game_states_player_techniques_idx 
ON game_states USING GIN ((data->'player'->'techniques'));

-- Индекс для предметов инвентаря
CREATE INDEX IF NOT EXISTS game_states_player_inventory_items_idx 
ON game_states USING GIN ((data->'player'->'inventory'->'items'));

-- Индекс для квестов
CREATE INDEX IF NOT EXISTS game_states_player_quests_idx 
ON game_states USING GIN ((data->'player'->'progress'->'quests'));

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_game_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления updated_at при изменении данных
DROP TRIGGER IF EXISTS update_game_states_updated_at ON game_states;
CREATE TRIGGER update_game_states_updated_at
BEFORE UPDATE ON game_states
FOR EACH ROW
EXECUTE FUNCTION update_game_states_updated_at();

-- Комментарии к таблице и колонкам для облегчения понимания структуры
COMMENT ON TABLE game_states IS 'Централизованное хранилище состояния игрока в формате JSONB';
COMMENT ON COLUMN game_states.id IS 'Уникальный идентификатор записи состояния';
COMMENT ON COLUMN game_states.user_id IS 'ID пользователя, которому принадлежит состояние';
COMMENT ON COLUMN game_states.data IS 'JSON-документ с состоянием игры';
COMMENT ON COLUMN game_states.created_at IS 'Время создания записи';
COMMENT ON COLUMN game_states.updated_at IS 'Время последнего обновления записи';