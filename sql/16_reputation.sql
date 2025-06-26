-- SQL-скрипт для создания таблиц системы репутации
-- Создание: 28.04.2025
\encoding UTF8

-- Таблица репутаций
CREATE TABLE IF NOT EXISTS reputations (
  user_id INTEGER NOT NULL,
  entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('city', 'faction', 'global')),
  entity_id INTEGER,
  sphere VARCHAR(30) NOT NULL CHECK (sphere IN ('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general')),
  value INTEGER DEFAULT 0,
  level VARCHAR(30) CHECK (level IN ('враждебный', 'неприязненный', 'подозрительный', 'нейтральный', 'дружелюбный', 'уважаемый', 'почитаемый', 'легендарный')) DEFAULT 'нейтральный',
  title VARCHAR(255),
  history JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, entity_type, entity_id, sphere)
);

-- Таблица функций репутации
CREATE TABLE IF NOT EXISTS reputation_features (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  required_level VARCHAR(30) NOT NULL CHECK (required_level IN ('дружелюбный', 'уважаемый', 'почитаемый', 'легендарный')),
  entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('city', 'faction', 'global')),
  entity_id INTEGER,
  sphere VARCHAR(30) NOT NULL CHECK (sphere IN ('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general')),
  feature_type VARCHAR(30) NOT NULL CHECK (feature_type IN ('discount', 'access', 'quest', 'item', 'training', 'title')),
  data JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица связей репутаций
CREATE TABLE IF NOT EXISTS reputation_relations (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('city', 'faction', 'global')),
  source_id INTEGER,
  source_sphere VARCHAR(30) NOT NULL CHECK (source_sphere IN ('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general')),
  target_type VARCHAR(30) NOT NULL CHECK (target_type IN ('city', 'faction', 'global')),
  target_id INTEGER,
  target_sphere VARCHAR(30) NOT NULL CHECK (target_sphere IN ('combat', 'trade', 'spiritual', 'alchemy', 'political', 'general')),
  impact_factor FLOAT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_reputations_user_id ON reputations(user_id);
CREATE INDEX IF NOT EXISTS idx_reputations_entity ON reputations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reputation_features_entity ON reputation_features(entity_type, entity_id, sphere);
CREATE INDEX IF NOT EXISTS idx_reputation_relations_source ON reputation_relations(source_type, source_id, source_sphere);
CREATE INDEX IF NOT EXISTS idx_reputation_relations_target ON reputation_relations(target_type, target_id, target_sphere);

-- Комментарии к таблицам
COMMENT ON TABLE reputations IS 'Репутация игроков по отношению к различным фракциям и городам';
COMMENT ON TABLE reputation_features IS 'Возможности, которые открываются при определенном уровне репутации';
COMMENT ON TABLE reputation_relations IS 'Взаимосвязи между различными репутациями, влияние изменений репутации';