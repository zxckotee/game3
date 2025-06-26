-- SQL скрипт для создания таблицы active_player_effects
-- Использует PostgreSQL синтаксис
\encoding UTF8

DROP TABLE IF EXISTS active_player_effects CASCADE;

CREATE TABLE active_player_effects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_item_id VARCHAR(30) REFERENCES alchemy_items(id) ON DELETE SET NULL, -- ID предмета, вызвавшего эффект (может быть NULL, если эффект от другого источника)
    effect_type VARCHAR(50) NOT NULL, -- Тип эффекта (например, BUFF_CULTIVATION_SPEED, STAT_MOD_STRENGTH)
    effect_details_json JSONB NOT NULL, -- Детали эффекта: { "target_stat": "cultivation_speed", "modifier_type": "percent", "value": 10 }
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER NOT NULL, -- Длительность эффекта в секундах
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Рассчитывается как applied_at + duration_seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_active_player_effects_user_id ON active_player_effects(user_id);
CREATE INDEX idx_active_player_effects_expires_at ON active_player_effects(expires_at);
CREATE INDEX idx_active_player_effects_user_id_effect_type ON active_player_effects(user_id, effect_type);

-- Триггер для автоматического обновления поля updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column_active_player_effects()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_active_player_effects_updated_at
BEFORE UPDATE ON active_player_effects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column_active_player_effects();

COMMENT ON TABLE active_player_effects IS 'Таблица для хранения активных временных эффектов (баффов/дебаффов), действующих на игроков.';
COMMENT ON COLUMN active_player_effects.user_id IS 'ID пользователя, на которого действует эффект.';
COMMENT ON COLUMN active_player_effects.source_item_id IS 'ID предмета (из alchemy_items), который вызвал этот эффект. Может быть NULL.';
COMMENT ON COLUMN active_player_effects.effect_type IS 'Категория или конкретный тип эффекта для его идентификации и обработки.';
COMMENT ON COLUMN active_player_effects.effect_details_json IS 'JSON объект с параметрами эффекта (например, какой стат изменяется, на сколько, тип модификатора).';
COMMENT ON COLUMN active_player_effects.applied_at IS 'Время начала действия эффекта.';
COMMENT ON COLUMN active_player_effects.duration_seconds IS 'Общая длительность эффекта в секундах.';
COMMENT ON COLUMN active_player_effects.expires_at IS 'Точное время, когда эффект должен закончиться.';