-- SQL-скрипт для создания таблиц системы сект
-- Создание: 28.04.2025
-- Обновление: 20.05.2025
\encoding UTF8

-- Удаление существующих таблиц (в обратном порядке зависимостей)
DROP TABLE IF EXISTS sect_privileges CASCADE;
DROP TABLE IF EXISTS sect_benefits CASCADE;
DROP TABLE IF EXISTS sect_memberships CASCADE;
DROP TABLE IF EXISTS sects CASCADE;

-- Таблица сект
CREATE TABLE IF NOT EXISTS sects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(255) CHECK (type IN ('праведная', 'демоническая', 'нейтральная')) NOT NULL,
  level INTEGER DEFAULT 1,
  reputation INTEGER DEFAULT 0,
  -- Новые поля для соответствия JS-моделям
  experience INTEGER DEFAULT 0,
  required_experience INTEGER DEFAULT 100,
  influence INTEGER DEFAULT 0,
  -- поле loyalty удалено, так как оно избыточно для игроков
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица членства в сектах
CREATE TABLE IF NOT EXISTS sect_memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  sect_id INTEGER NOT NULL REFERENCES sects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  rank VARCHAR(255) CHECK (rank IN ('ученик', 'внутренний ученик', 'старший ученик', 'старейшина', 'глава')) DEFAULT 'ученик',
  contribution INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_contribution TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица бонусов от секты
CREATE TABLE IF NOT EXISTS sect_benefits (
  id SERIAL PRIMARY KEY,
  sect_id INTEGER NOT NULL REFERENCES sects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  type VARCHAR(255) CHECK (type IN ('cultivation_speed', 'resource_gathering', 'energy_regen', 'technique_discount', 'max_energy')) NOT NULL,
  modifier FLOAT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Таблица привилегий секты
CREATE TABLE IF NOT EXISTS sect_privileges (
  id SERIAL PRIMARY KEY,
  sect_id INTEGER NOT NULL REFERENCES sects(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  min_rank VARCHAR(255) CHECK (min_rank IN ('ученик', 'внутренний ученик', 'старший ученик', 'старейшина', 'глава')) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_sect_memberships_user_id ON sect_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_sect_memberships_sect_id ON sect_memberships(sect_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_sect ON sect_memberships(user_id, sect_id);

-- Индексы для новых таблиц
CREATE INDEX IF NOT EXISTS idx_sect_benefits_sect_id ON sect_benefits(sect_id);
CREATE INDEX IF NOT EXISTS idx_sect_benefits_type ON sect_benefits(type);
CREATE INDEX IF NOT EXISTS idx_sect_privileges_sect_id ON sect_privileges(sect_id);
CREATE INDEX IF NOT EXISTS idx_sect_privileges_min_rank ON sect_privileges(min_rank);

-- Комментарий к таблицам
COMMENT ON TABLE sects IS 'Секты культиваторов, к которым могут присоединяться игроки';
COMMENT ON TABLE sect_memberships IS 'Членство игроков в сектах, включая ранг и вклад';
COMMENT ON TABLE sect_benefits IS 'Бонусы, предоставляемые сектами своим членам';
COMMENT ON TABLE sect_privileges IS 'Привилегии, доступные членам секты в зависимости от ранга';