-- SQL-скрипт для создания таблицы изученных техник
-- Создание: 28.04.2025
\encoding UTF8

-- Таблица изученных техник
CREATE TABLE IF NOT EXISTS learned_techniques (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  technique_id VARCHAR(30) NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  mastery_level INTEGER DEFAULT 1,
  is_mastered BOOLEAN DEFAULT FALSE,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  learned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, technique_id)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_learned_techniques_user_id ON learned_techniques(user_id);
CREATE INDEX IF NOT EXISTS idx_learned_techniques_technique_id ON learned_techniques(technique_id);
CREATE INDEX IF NOT EXISTS idx_learned_techniques_mastery ON learned_techniques(mastery_level);
CREATE INDEX IF NOT EXISTS idx_learned_techniques_ismastered ON learned_techniques(is_mastered);

-- Комментарий к таблице
COMMENT ON TABLE learned_techniques IS 'Техники, изученные игроками, с уровнем мастерства и прогрессом';

-- Создание представления с объединением learned_techniques и techniques
CREATE OR REPLACE VIEW user_techniques_view AS
SELECT 
  lt.id AS learned_id,
  lt.user_id,
  lt.technique_id,
  lt.level,
  lt.experience,
  lt.mastery_level,
  lt.is_mastered,
  lt.learned_at,
  t.name,
  t.description,
  t.type,
  t.damage_type,
  t.damage,
  t.energy_cost,
  t.cooldown,
  t.required_level
FROM learned_techniques lt
JOIN techniques t ON lt.technique_id = t.id;

-- Комментарий к представлению
COMMENT ON VIEW user_techniques_view IS 'Представление, объединяющее данные изученных техник с их базовыми характеристиками';

-- Создание таблицы прогресса техник (опционально)
CREATE TABLE IF NOT EXISTS technique_progression (
  id SERIAL PRIMARY KEY,
  learned_technique_id INTEGER NOT NULL REFERENCES learned_techniques(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  practice_time INTEGER NOT NULL DEFAULT 0,
  experience_gained INTEGER NOT NULL DEFAULT 0,
  level_up BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_technique_progression_technique ON technique_progression(learned_technique_id);
CREATE INDEX IF NOT EXISTS idx_technique_progression_date ON technique_progression(date);

-- Комментарий к таблице
COMMENT ON TABLE technique_progression IS 'История прогресса изучения техник по дням';