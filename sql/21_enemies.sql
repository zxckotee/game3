-- SQL-скрипт для создания таблиц, связанных с врагами
-- Создание: 28.04.2025
\encoding UTF8

-- Таблица атак врагов
CREATE TABLE IF NOT EXISTS enemy_attacks (
  id SERIAL PRIMARY KEY,
  enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  damage_type VARCHAR(50) NOT NULL,
  damage_min INTEGER NOT NULL,
  damage_max INTEGER NOT NULL,
  accuracy INTEGER NOT NULL,
  cooldown INTEGER DEFAULT 0,
  is_special BOOLEAN DEFAULT FALSE,
  energy_cost INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица эффектов атак врагов
CREATE TABLE IF NOT EXISTS enemy_attack_effects (
  id SERIAL PRIMARY KEY,
  attack_id INTEGER NOT NULL REFERENCES enemy_attacks(id) ON DELETE CASCADE,
  effect_type VARCHAR(100) NOT NULL,
  chance FLOAT NOT NULL DEFAULT 1.0,
  duration INTEGER,
  value INTEGER,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица добычи с врагов
CREATE TABLE IF NOT EXISTS enemy_loot (
  id SERIAL PRIMARY KEY,
  enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  item_id INTEGER,
  chance FLOAT NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER DEFAULT 1,
  required_level INTEGER DEFAULT 0,
  required_rep INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица валюты с врагов
CREATE TABLE IF NOT EXISTS enemy_currency (
  id SERIAL PRIMARY KEY,
  enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  currency_type VARCHAR(50) NOT NULL,
  min_amount INTEGER NOT NULL,
  max_amount INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица спавна врагов
CREATE TABLE IF NOT EXISTS enemy_spawns (
  id SERIAL PRIMARY KEY,
  enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  location_id INTEGER,
  min_level INTEGER NOT NULL DEFAULT 1,
  max_level INTEGER NOT NULL DEFAULT 1,
  spawn_rate FLOAT NOT NULL,
  max_count INTEGER NOT NULL DEFAULT 1,
  respawn_time INTEGER DEFAULT 300,
  conditions JSONB,
  time_restrictions JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица характеристик врагов
CREATE TABLE IF NOT EXISTS enemy_stats (
  id SERIAL PRIMARY KEY,
  enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  health INTEGER NOT NULL,
  energy INTEGER NOT NULL,
  attack INTEGER NOT NULL,
  defense INTEGER NOT NULL,
  speed INTEGER NOT NULL,
  critical FLOAT DEFAULT 0.05,
  cultivation INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(enemy_id, level)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_enemy_attacks_enemy ON enemy_attacks(enemy_id);
CREATE INDEX IF NOT EXISTS idx_enemy_attack_effects_attack ON enemy_attack_effects(attack_id);
CREATE INDEX IF NOT EXISTS idx_enemy_attack_effects_type ON enemy_attack_effects(effect_type);
CREATE INDEX IF NOT EXISTS idx_enemy_loot_enemy ON enemy_loot(enemy_id);
CREATE INDEX IF NOT EXISTS idx_enemy_loot_type ON enemy_loot(item_type);
CREATE INDEX IF NOT EXISTS idx_enemy_currency_enemy ON enemy_currency(enemy_id);
CREATE INDEX IF NOT EXISTS idx_enemy_spawns_enemy ON enemy_spawns(enemy_id);
CREATE INDEX IF NOT EXISTS idx_enemy_spawns_location ON enemy_spawns(location_id);
CREATE INDEX IF NOT EXISTS idx_enemy_stats_enemy ON enemy_stats(enemy_id);
CREATE INDEX IF NOT EXISTS idx_enemy_stats_level ON enemy_stats(level);

-- Комментарии к таблицам
COMMENT ON TABLE enemy_attacks IS 'Атаки, которые могут использовать враги';
COMMENT ON TABLE enemy_attack_effects IS 'Эффекты атак врагов (яд, оглушение и т.д.)';
COMMENT ON TABLE enemy_loot IS 'Предметы, которые могут выпасть с врагов';
COMMENT ON TABLE enemy_currency IS 'Валюта, выпадающая с врагов';
COMMENT ON TABLE enemy_spawns IS 'Места и условия появления врагов';
COMMENT ON TABLE enemy_stats IS 'Характеристики врагов в зависимости от уровня';

-- Таблица способностей врагов (опционально)
CREATE TABLE IF NOT EXISTS enemy_abilities (
  id SERIAL PRIMARY KEY,
  enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100) NOT NULL,
  cooldown INTEGER DEFAULT 0,
  trigger_condition TEXT,
  effect_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_enemy_abilities_enemy ON enemy_abilities(enemy_id);
CREATE INDEX IF NOT EXISTS idx_enemy_abilities_type ON enemy_abilities(type);

-- Комментарий к таблице
COMMENT ON TABLE enemy_abilities IS 'Пассивные и активные способности врагов';

-- Таблица фракций врагов (опционально)
CREATE TABLE IF NOT EXISTS enemy_factions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  alignment VARCHAR(50) DEFAULT 'hostile',
  relations JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица связи врагов и фракций
CREATE TABLE IF NOT EXISTS enemy_faction_memberships (
  enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  faction_id INTEGER NOT NULL REFERENCES enemy_factions(id) ON DELETE CASCADE,
  rank VARCHAR(100) DEFAULT 'common',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (enemy_id, faction_id)
);

-- Индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_enemy_faction_memberships_faction ON enemy_faction_memberships(faction_id);

-- Комментарии к таблицам
COMMENT ON TABLE enemy_factions IS 'Фракции и группировки врагов';
COMMENT ON TABLE enemy_faction_memberships IS 'Принадлежность врагов к фракциям';

-- Таблица истории убийств врагов (опционально)
CREATE TABLE IF NOT EXISTS enemy_kill_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enemy_id INTEGER NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  enemy_level INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  location_id INTEGER,
  experience_gained INTEGER NOT NULL DEFAULT 0,
  items_dropped JSONB,
  currency_dropped JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_enemy_kill_history_user ON enemy_kill_history(user_id);
CREATE INDEX IF NOT EXISTS idx_enemy_kill_history_enemy ON enemy_kill_history(enemy_id);
CREATE INDEX IF NOT EXISTS idx_enemy_kill_history_time ON enemy_kill_history(timestamp);

-- Комментарий к таблице
COMMENT ON TABLE enemy_kill_history IS 'История убийств врагов игроками';