-- SQL-скрипт для создания таблиц системы погоды
-- Создание: 28.04.2025
\encoding UTF8

-- Таблица системы погоды
CREATE TABLE IF NOT EXISTS weather_system (
  id SERIAL PRIMARY KEY,
  current_weather VARCHAR(100) NOT NULL DEFAULT 'ясно',
  intensity INTEGER DEFAULT 1,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP,
  affected_regions JSONB DEFAULT '[]'::JSONB,
  effects JSONB DEFAULT '[]'::JSONB,
  is_special_event BOOLEAN DEFAULT FALSE,
  event_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_weather_system_current ON weather_system(current_weather);
CREATE INDEX IF NOT EXISTS idx_weather_system_special ON weather_system(is_special_event);
CREATE INDEX IF NOT EXISTS idx_weather_system_timerange ON weather_system(started_at, ends_at);

-- Комментарий к таблице
COMMENT ON TABLE weather_system IS 'Система погоды в игровом мире';

-- Таблица истории погоды (опционально)
CREATE TABLE IF NOT EXISTS weather_history (
  id SERIAL PRIMARY KEY,
  weather_type VARCHAR(100) NOT NULL,
  intensity INTEGER DEFAULT 1,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL, -- в минутах
  affected_regions JSONB DEFAULT '[]'::JSONB,
  effects JSONB DEFAULT '[]'::JSONB,
  is_special_event BOOLEAN DEFAULT FALSE,
  event_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_weather_history_type ON weather_history(weather_type);
CREATE INDEX IF NOT EXISTS idx_weather_history_timerange ON weather_history(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_weather_history_special ON weather_history(is_special_event);

-- Комментарий к таблице
COMMENT ON TABLE weather_history IS 'История погодных условий в игровом мире';

-- Таблица погодных эффектов (опционально)
CREATE TABLE IF NOT EXISTS weather_effects (
  id SERIAL PRIMARY KEY,
  weather_type VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  effects_on_cultivation JSONB,
  effects_on_resources JSONB,
  effects_on_combat JSONB,
  effects_on_alchemy JSONB,
  effects_on_movement JSONB,
  visual_effects TEXT,
  sound_effects TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Комментарий к таблице
COMMENT ON TABLE weather_effects IS 'Определения различных типов погоды и их эффектов';

-- Заполнение базовых типов погоды
INSERT INTO weather_effects 
  (weather_type, name, description, effects_on_cultivation, effects_on_resources, effects_on_combat, effects_on_movement) 
VALUES
  ('ясно', 'Ясное небо', 'Чистое небо без облаков', 
    '{"meditationRate": 1.1, "spiritGatheringRate": 1.05}', 
    '{"commonDropRate": 1.0, "rareDropRate": 1.0}', 
    '{"attackBonus": 0, "defenseBonus": 0}', 
    '{"movementSpeed": 1.0}'
  ),
  ('облачно', 'Облачное небо', 'Небо затянуто облаками', 
    '{"meditationRate": 0.9, "spiritGatheringRate": 0.95}', 
    '{"commonDropRate": 1.0, "rareDropRate": 1.0}', 
    '{"attackBonus": 0, "defenseBonus": 0}', 
    '{"movementSpeed": 1.0}'
  ),
  ('дождь', 'Дождь', 'Идет дождь разной интенсивности', 
    '{"meditationRate": 0.7, "spiritGatheringRate": 1.2, "waterAffinity": 1.3}', 
    '{"commonDropRate": 1.2, "rareDropRate": 1.1, "waterResourceDropRate": 1.5}', 
    '{"attackBonus": -2, "defenseBonus": 0, "waterAttackBonus": 5, "fireAttackBonus": -5}', 
    '{"movementSpeed": 0.8}'
  ),
  ('гроза', 'Гроза', 'Сильный дождь с молниями и громом', 
    '{"meditationRate": 0.5, "spiritGatheringRate": 1.5, "waterAffinity": 1.5, "lightningAffinity": 2.0}', 
    '{"commonDropRate": 1.3, "rareDropRate": 1.2, "waterResourceDropRate": 1.8, "lightningEssenceDropRate": 2.0}', 
    '{"attackBonus": -5, "defenseBonus": -2, "waterAttackBonus": 10, "lightningAttackBonus": 15, "fireAttackBonus": -10}', 
    '{"movementSpeed": 0.6}'
  ),
  ('туман', 'Туман', 'Густой туман, ограничивающий видимость', 
    '{"meditationRate": 1.2, "spiritGatheringRate": 1.0, "waterAffinity": 1.1}', 
    '{"commonDropRate": 0.9, "rareDropRate": 1.2, "mysteriousResourceDropRate": 1.3}', 
    '{"attackBonus": -8, "defenseBonus": 5, "accuracyPenalty": 15}', 
    '{"movementSpeed": 0.7}'
  ),
  ('снег', 'Снегопад', 'Падающий снег разной интенсивности', 
    '{"meditationRate": 0.8, "spiritGatheringRate": 0.9, "iceAffinity": 1.4, "fireAffinity": 0.7}', 
    '{"commonDropRate": 0.8, "rareDropRate": 1.1, "iceResourceDropRate": 1.6}', 
    '{"attackBonus": -3, "defenseBonus": -2, "iceAttackBonus": 10, "fireAttackBonus": -5}', 
    '{"movementSpeed": 0.6}'
  ),
  ('метель', 'Метель', 'Сильный снег с ветром, ограничивающий видимость', 
    '{"meditationRate": 0.5, "spiritGatheringRate": 1.1, "iceAffinity": 1.8, "fireAffinity": 0.5}', 
    '{"commonDropRate": 0.7, "rareDropRate": 1.3, "iceResourceDropRate": 2.0}', 
    '{"attackBonus": -10, "defenseBonus": -5, "iceAttackBonus": 15, "fireAttackBonus": -10, "accuracyPenalty": 20}', 
    '{"movementSpeed": 0.4}'
  ),
  ('жара', 'Экстремальная жара', 'Палящая жара, затрудняющая активность', 
    '{"meditationRate": 0.6, "spiritGatheringRate": 0.7, "fireAffinity": 1.5, "waterAffinity": 0.7}', 
    '{"commonDropRate": 0.8, "rareDropRate": 0.9, "fireResourceDropRate": 1.5}', 
    '{"attackBonus": -5, "defenseBonus": -3, "fireAttackBonus": 10, "waterAttackBonus": -5}', 
    '{"movementSpeed": 0.8, "staminaDrainRate": 1.5}'
  ),
  ('духовный_шторм', 'Духовный шторм', 'Редкое природное явление, насыщающее область духовной энергией', 
    '{"meditationRate": 2.0, "spiritGatheringRate": 3.0, "allAffinities": 1.5}', 
    '{"commonDropRate": 1.5, "rareDropRate": 2.0, "allResourceTypes": 1.5, "spiritualEssenceDropRate": 5.0}', 
    '{"attackBonus": 10, "defenseBonus": 10, "spiritualDamageBonus": 20}', 
    '{"movementSpeed": 1.1}'
  );

-- Таблица регионального прогноза погоды (опционально)
CREATE TABLE IF NOT EXISTS regional_weather (
  id SERIAL PRIMARY KEY,
  region_id INTEGER NOT NULL,
  region_name VARCHAR(100) NOT NULL,
  current_weather VARCHAR(100) NOT NULL DEFAULT 'ясно',
  intensity INTEGER DEFAULT 1,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at TIMESTAMP,
  effects JSONB DEFAULT '[]'::JSONB,
  is_special_event BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_regional_weather_region ON regional_weather(region_id);
CREATE INDEX IF NOT EXISTS idx_regional_weather_weather ON regional_weather(current_weather);

-- Комментарий к таблице
COMMENT ON TABLE regional_weather IS 'Погода в разных регионах игрового мира';