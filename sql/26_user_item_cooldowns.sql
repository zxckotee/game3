-- SQL скрипт для создания таблицы user_item_cooldowns
-- Использует PostgreSQL синтаксис
\encoding UTF8

DROP TABLE IF EXISTS user_item_cooldowns CASCADE;

CREATE TABLE user_item_cooldowns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(30) NOT NULL REFERENCES alchemy_items(id) ON DELETE CASCADE, -- Соответствует типу alchemy_items.id
    cooldown_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_user_item_cooldowns_user_id_item_id ON user_item_cooldowns(user_id, item_id);
CREATE INDEX idx_user_item_cooldowns_cooldown_ends_at ON user_item_cooldowns(cooldown_ends_at);

-- Триггер для автоматического обновления поля updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column_user_item_cooldowns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_item_cooldowns_updated_at
BEFORE UPDATE ON user_item_cooldowns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_user_item_cooldowns();

COMMENT ON TABLE user_item_cooldowns IS 'Таблица для отслеживания времени восстановления (cooldown) использованных предметов пользователями.';
COMMENT ON COLUMN user_item_cooldowns.user_id IS 'ID пользователя, использовавшего предмет.';
COMMENT ON COLUMN user_item_cooldowns.item_id IS 'ID использованного предмета (из alchemy_items).';
COMMENT ON COLUMN user_item_cooldowns.cooldown_ends_at IS 'Время, когда закончится cooldown для данного предмета у данного пользователя.';