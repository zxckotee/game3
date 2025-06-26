-- SQL скрипт для миграции данных духовных питомцев из старой структуры в новую
-- 
-- Старая структура: одна таблица spirit_pets с полем userId
-- Новая структура: 
--   - spirit_pets (каталог типов питомцев)
--   - user_spirit_pets (экземпляры питомцев пользователей)

\encoding UTF8

-- Создаем резервную копию текущей таблицы spirit_pets
CREATE TABLE IF NOT EXISTS spirit_pets_backup AS SELECT * FROM spirit_pets;

-- Проверяем существование таблицы user_spirit_pets и создаем её, если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_spirit_pets'
  ) THEN
    -- Создаем таблицу user_spirit_pets
    CREATE TABLE user_spirit_pets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pet_id VARCHAR(30) NOT NULL REFERENCES spirit_pets(id) ON DELETE CASCADE,
      is_active BOOLEAN DEFAULT false,
      custom_name VARCHAR(100),
      level INTEGER DEFAULT 1,
      experience INTEGER DEFAULT 0,
      hunger INTEGER DEFAULT 100,
      loyalty INTEGER DEFAULT 100,
      strength INTEGER DEFAULT 1,
      intelligence INTEGER DEFAULT 1,
      agility INTEGER DEFAULT 1,
      vitality INTEGER DEFAULT 1,
      spirit INTEGER DEFAULT 1,
      last_fed TIMESTAMP,
      last_trained TIMESTAMP,
      combat_uses_count INTEGER DEFAULT 0,
      combat_flee_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, pet_id)
    );
    
    -- Создаем индексы для повышения производительности
    CREATE INDEX idx_user_spirit_pets_user_id ON user_spirit_pets(user_id);
    CREATE INDEX idx_user_spirit_pets_pet_id ON user_spirit_pets(pet_id);
    CREATE INDEX idx_user_spirit_pets_is_active ON user_spirit_pets(user_id, is_active);
    
    -- Создаем триггер для автоматического обновления updated_at
    CREATE OR REPLACE FUNCTION update_user_spirit_pets_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER trigger_update_user_spirit_pets_updated_at
    BEFORE UPDATE ON user_spirit_pets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_spirit_pets_updated_at();
    
    RAISE NOTICE 'Таблица user_spirit_pets успешно создана';
  ELSE
    RAISE NOTICE 'Таблица user_spirit_pets уже существует';
  END IF;
END
$$;

-- Проверяем существование таблицы spirit_pet_food_items и создаем её, если не существует
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'spirit_pet_food_items'
  ) THEN
    -- Создаем таблицу spirit_pet_food_items
    CREATE TABLE spirit_pet_food_items (
      id VARCHAR(30) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      rarity VARCHAR(20) REFERENCES rarities(id),
      nutrition_value INTEGER NOT NULL DEFAULT 25,
      loyalty_bonus INTEGER NOT NULL DEFAULT 0,
      stat_bonus_type VARCHAR(20) DEFAULT NULL,
      stat_bonus_value INTEGER DEFAULT 0,
      price INTEGER DEFAULT 100,
      icon VARCHAR(50),
      shop_categories JSONB DEFAULT '["pet_supplies"]'
    );
    
    -- Заполнение таблицы еды для питомцев
    INSERT INTO spirit_pet_food_items (id, name, description, rarity, nutrition_value, loyalty_bonus, price, icon) VALUES
    ('basic_pet_food', 'Базовый корм для питомцев', 'Простая еда для духовных питомцев', 'common', 20, 0, 50, '🥫'),
    ('improved_pet_food', 'Улучшенный корм для питомцев', 'Питательная еда с духовными травами для питомцев среднего уровня', 'uncommon', 35, 2, 150, '🍖'),
    ('premium_pet_food', 'Премиум корм для питомцев', 'Высококачественная еда для духовных питомцев', 'rare', 50, 5, 500, '🍗'),
    ('elemental_treat_fire', 'Огненное лакомство', 'Особое лакомство для питомцев огненной стихии', 'rare', 40, 8, 800, '🔥'),
    ('elemental_treat_water', 'Водное лакомство', 'Особое лакомство для питомцев водной стихии', 'rare', 40, 8, 800, '💧'),
    ('elemental_treat_earth', 'Земляное лакомство', 'Особое лакомство для питомцев земной стихии', 'rare', 40, 8, 800, '🌱'),
    ('elemental_treat_air', 'Воздушное лакомство', 'Особое лакомство для питомцев воздушной стихии', 'rare', 40, 8, 800, '💨'),
    ('mystic_pet_feast', 'Мистический пир для питомцев', 'Легендарная еда, значительно повышающая все показатели питомца', 'legendary', 100, 15, 3000, '✨');
    
    -- Интеграция с таблицей предметов, если она существует
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'item_catalog'
    ) THEN
      INSERT INTO item_catalog (item_id, name, description, type, rarity)
      SELECT id, name, description, 'pet_food', rarity FROM spirit_pet_food_items
      ON CONFLICT (item_id) DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Таблица spirit_pet_food_items успешно создана';
  ELSE
    RAISE NOTICE 'Таблица spirit_pet_food_items уже существует';
  END IF;
END
$$;

-- Проверяем, имеет ли таблица spirit_pets правильную структуру каталога
DO $$
DECLARE
  catalog_count INTEGER;
BEGIN
  -- Проверяем, есть ли в таблице записи с текстовыми ID (каталог типов питомцев)
  SELECT COUNT(*) INTO catalog_count FROM spirit_pets 
  WHERE id::text ~ '^[a-z_]+$';
  
  -- Если записей каталога нет, преобразуем таблицу
  IF catalog_count = 0 THEN
    RAISE NOTICE 'Преобразуем таблицу spirit_pets в каталог типов питомцев...';
    
    -- Создаем временную таблицу для хранения старых данных
    CREATE TEMPORARY TABLE tmp_spirit_pets AS SELECT * FROM spirit_pets;
    
    -- Очищаем таблицу spirit_pets
    TRUNCATE TABLE spirit_pets CASCADE;
    
    -- Изменяем структуру таблицы spirit_pets для каталога
    ALTER TABLE spirit_pets 
      ALTER COLUMN id TYPE VARCHAR(30),
      DROP COLUMN IF EXISTS user_id,
      DROP COLUMN IF EXISTS is_active,
      DROP COLUMN IF EXISTS experience,
      DROP COLUMN IF EXISTS hunger,
      DROP COLUMN IF EXISTS loyalty,
      DROP COLUMN IF EXISTS abilities,
      DROP COLUMN IF EXISTS evolution_stage,
      DROP COLUMN IF EXISTS last_fed,
      DROP COLUMN IF EXISTS last_trained;
    
    -- Добавляем новые колонки для каталога
    ALTER TABLE spirit_pets 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS element VARCHAR(20),
      ADD COLUMN IF NOT EXISTS rarity VARCHAR(20),
      ADD COLUMN IF NOT EXISTS unlock_condition TEXT,
      ADD COLUMN IF NOT EXISTS max_level INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS evolution_path JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
    
    -- Заполняем каталог базовыми типами питомцев
    INSERT INTO spirit_pets (id, name, description, type, element, rarity, unlock_condition, max_level, icon, evolution_path) VALUES
    ('fire_fox', 'Огненный лис', 'Духовный питомец с элементом огня, способный к быстрому передвижению и атакам огненного типа', 'beast', 'fire', 'uncommon', 'Победить 10 огненных существ', 100, '🦊', '[]'),
    ('water_dragon', 'Водяной дракон', 'Редкий водяной дракон с мощными атаками и способностью к регенерации', 'mythical', 'water', 'rare', 'Исследовать Озеро Духов и победить Хранителя Вод', 120, '🐉', '[]'),
    ('earth_turtle', 'Земляная черепаха', 'Прочная земляная черепаха с высокой защитой', 'beast', 'earth', 'common', 'Собрать 20 единиц духовных минералов', 80, '🐢', '[]'),
    ('lightning_bird', 'Громовая птица', 'Редкая птица, управляющая молниями и способная к быстрым атакам', 'celestial', 'lightning', 'epic', 'Пережить небесную трибуляцию', 150, '⚡', '[]'),
    ('shadow_wolf', 'Теневой волк', 'Легендарный теневой волк с способностью к скрытности и мощными темными атаками', 'demonic', 'darkness', 'legendary', 'Найти и победить Хранителя Теней', 200, '🐺', '[]');
    
    RAISE NOTICE 'Таблица spirit_pets успешно преобразована в каталог типов питомцев';
    
    -- Мигрируем старые данные в новую структуру
    INSERT INTO user_spirit_pets (
      user_id, pet_id, is_active, custom_name, level, experience,
      hunger, loyalty, strength, intelligence, agility, vitality,
      spirit, last_fed, last_trained, created_at, updated_at
    )
    SELECT 
      userId, 
      CASE 
        WHEN type = 'fire' THEN 'fire_fox'
        WHEN type = 'water' THEN 'water_dragon'
        WHEN type = 'earth' THEN 'earth_turtle'
        WHEN type = 'lightning' THEN 'lightning_bird'
        WHEN type = 'darkness' THEN 'shadow_wolf'
        ELSE 'fire_fox'
      END,
      isActive,
      name,
      level,
      experience,
      hunger,
      loyalty,
      strength,
      intelligence,
      agility,
      vitality,
      spirit,
      lastFed,
      lastTrained,
      created_at,
      updated_at
    FROM tmp_spirit_pets
    ON CONFLICT (user_id, pet_id) DO NOTHING;
    
    -- Удаляем временную таблицу
    DROP TABLE tmp_spirit_pets;
    
    RAISE NOTICE 'Данные успешно мигрированы в новую структуру';
  ELSE
    RAISE NOTICE 'Таблица spirit_pets уже имеет структуру каталога типов питомцев';
  END IF;
END
$$;

-- Выводим информацию о завершении миграции
DO $$
BEGIN
  RAISE NOTICE 'Миграция структуры духовных питомцев успешно завершена';
END
$$;