-- Скрипт для создания таблицы game_states (состояния игры)
-- Хранит состояния игры для каждого пользователя в формате JSON
\encoding UTF8
-- Создание таблицы, если она еще не существует
CREATE TABLE IF NOT EXISTS game_states (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    game_state JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    last_saved TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Комментарии к таблице и полям
COMMENT ON TABLE game_states IS 'Сохраненные состояния игры для пользователей';
COMMENT ON COLUMN game_states.game_state IS 'JSON структура включает данные игрока, мира, интерфейса и боя';

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_game_states_user_id ON game_states (user_id);
CREATE INDEX IF NOT EXISTS idx_game_states_last_saved ON game_states (last_saved);
