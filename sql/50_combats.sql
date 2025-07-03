-- Скрипт для создания таблицы combats
-- Хранит состояние активных и завершенных PvE боев

CREATE TABLE IF NOT EXISTS combats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enemy_id VARCHAR(255) NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,

    player_state JSONB NOT NULL,
    enemy_state JSONB NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'fled'
    turn VARCHAR(50) NOT NULL DEFAULT 'player', -- 'player', 'enemy'
    winner VARCHAR(50), -- 'player' или 'enemy'

    log JSONB DEFAULT '[]',
    rewards JSONB,

    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE combats IS 'Таблица для хранения состояний PvE боев';
COMMENT ON COLUMN combats.winner IS 'Победитель в бою';

-- Индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_combats_user_id ON combats (user_id);
CREATE INDEX IF NOT EXISTS idx_combats_status ON combats (status);