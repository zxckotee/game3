-- SQL скрипт для создания и заполнения таблиц духовных питомцев
-- Использует PostgreSQL синтаксис
\encoding UTF8
-- Удаление существующих таблиц
DROP TABLE IF EXISTS spirit_pet_growth_rates CASCADE;
DROP TABLE IF EXISTS spirit_pet_stats CASCADE;
DROP TABLE IF EXISTS spirit_pet_abilities CASCADE;
DROP TABLE IF EXISTS spirit_pets CASCADE;

-- Зависимость: element_types должна быть создана ранее (00_reference_tables.sql)
-- Зависимость: rarities должна быть создана ранее (00_reference_tables.sql)

-- Таблица духовных питомцев
CREATE TABLE spirit_pets (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL,
    element VARCHAR(20) REFERENCES element_types(id),
    rarity VARCHAR(20) REFERENCES rarities(id),
    unlock_condition TEXT,
    max_level INTEGER DEFAULT 100,
    evolution_path JSONB DEFAULT '[]',
    icon VARCHAR(50)
);

-- Таблица способностей духовных питомцев
CREATE TABLE spirit_pet_abilities (
    id SERIAL PRIMARY KEY,
    pet_id VARCHAR(30) REFERENCES spirit_pets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unlock_level INTEGER DEFAULT 1,
    cooldown INTEGER DEFAULT 0,
    energy_cost INTEGER DEFAULT 0,
    effects JSONB DEFAULT '{}'
);

-- Таблица характеристик духовных питомцев
CREATE TABLE spirit_pet_stats (
    pet_id VARCHAR(30) REFERENCES spirit_pets(id) ON DELETE CASCADE,
    stat_name VARCHAR(30) NOT NULL,
    stat_value INTEGER NOT NULL,
    PRIMARY KEY (pet_id, stat_name)
);

-- Таблица показателей роста духовных питомцев
CREATE TABLE spirit_pet_growth_rates (
    pet_id VARCHAR(30) REFERENCES spirit_pets(id) ON DELETE CASCADE,
    stat_name VARCHAR(30) NOT NULL,
    growth_rate DECIMAL(5, 2) NOT NULL,
    PRIMARY KEY (pet_id, stat_name)
);

-- Заполнение таблицы духовных питомцев
INSERT INTO spirit_pets (id, name, type, element, rarity, description, unlock_condition, max_level, icon) VALUES
('fire_fox', 'Огненный лис', 'beast', 'fire', 'uncommon', 'Духовный питомец с элементом огня, способный к быстрому передвижению и атакам огненного типа', 'Победить 10 огненных существ', 100, '🦊'),
('water_dragon', 'Водяной дракон', 'mythical', 'water', 'rare', 'Редкий водяной дракон с мощными атаками и способностью к регенерации', 'Исследовать Озеро Духов и победить Хранителя Вод', 120, '🐉'),
('earth_turtle', 'Земляная черепаха', 'beast', 'earth', 'common', 'Прочная земляная черепаха с высокой защитой', 'Собрать 20 единиц духовных минералов', 80, '🐢'),
('lightning_bird', 'Громовая птица', 'celestial', 'lightning', 'epic', 'Редкая птица, управляющая молниями и способная к быстрым атакам', 'Пережить небесную трибуляцию', 150, '⚡'),
('shadow_wolf', 'Теневой волк', 'demonic', 'darkness', 'legendary', 'Легендарный теневой волк с способностью к скрытности и мощными темными атаками', 'Найти и победить Хранителя Теней', 200, '🐺');

-- Заполнение таблицы способностей духовных питомцев
INSERT INTO spirit_pet_abilities (pet_id, name, description, unlock_level, cooldown, energy_cost, effects) VALUES
-- Огненный лис
('fire_fox', 'Огненное дыхание', 'Выдыхает поток пламени', 1, 2, 15, '{"damage": 20, "damageType": "fire"}'),
('fire_fox', 'Быстрый рывок', 'Совершает стремительный рывок к цели', 5, 4, 10, '{"damage": 15, "speedBoost": 30, "duration": 2}'),

-- Водяной дракон
('water_dragon', 'Водяной смерч', 'Создает мощный водяной смерч', 1, 3, 25, '{"damage": 30, "damageType": "water"}'),
('water_dragon', 'Регенерация', 'Восстанавливает здоровье', 5, 10, 40, '{"healing": 50}'),
('water_dragon', 'Ледяной панцирь', 'Создает защитный ледяной панцирь', 10, 15, 35, '{"defenseBoost": 40, "duration": 3}'),

-- Земляная черепаха
('earth_turtle', 'Каменный панцирь', 'Повышает защиту на короткое время', 1, 8, 20, '{"defenseBoost": 50, "duration": 3}'),
('earth_turtle', 'Землетрясение', 'Создает небольшое землетрясение', 10, 15, 35, '{"damage": 25, "damageType": "earth", "aoe": true}'),

-- Громовая птица
('lightning_bird', 'Молниеносный удар', 'Наносит быстрый удар молнией', 1, 1, 10, '{"damage": 15, "damageType": "lightning"}'),
('lightning_bird', 'Призыв грозы', 'Вызывает грозу, наносящую урон всем врагам', 15, 20, 50, '{"damage": 40, "damageType": "lightning", "aoe": true, "duration": 2}'),
('lightning_bird', 'Электрический щит', 'Создает щит из электричества', 8, 12, 30, '{"defenseBoost": 30, "reflectDamage": 15, "duration": 4}'),

-- Теневой волк
('shadow_wolf', 'Теневое растворение', 'Становится невидимым на короткое время', 1, 12, 30, '{"invisibility": true, "duration": 5}'),
('shadow_wolf', 'Укус тьмы', 'Мощный укус, наносящий урон и ослабляющий цель', 10, 8, 25, '{"damage": 35, "damageType": "darkness", "weakenDefense": 20, "duration": 3}'),
('shadow_wolf', 'Призыв теней', 'Призывает теневых сущностей для помощи в бою', 20, 25, 60, '{"summonMinions": 2, "minionDamage": 20, "duration": 8}');

-- Заполнение таблицы характеристик духовных питомцев
INSERT INTO spirit_pet_stats (pet_id, stat_name, stat_value) VALUES
-- Огненный лис
('fire_fox', 'health', 100),
('fire_fox', 'energy', 80),
('fire_fox', 'attack', 15),
('fire_fox', 'defense', 8),
('fire_fox', 'speed', 12),

-- Водяной дракон
('water_dragon', 'health', 150),
('water_dragon', 'energy', 120),
('water_dragon', 'attack', 20),
('water_dragon', 'defense', 15),
('water_dragon', 'speed', 8),

-- Земляная черепаха
('earth_turtle', 'health', 200),
('earth_turtle', 'energy', 60),
('earth_turtle', 'attack', 10),
('earth_turtle', 'defense', 25),
('earth_turtle', 'speed', 5),

-- Громовая птица
('lightning_bird', 'health', 120),
('lightning_bird', 'energy', 100),
('lightning_bird', 'attack', 25),
('lightning_bird', 'defense', 10),
('lightning_bird', 'speed', 18),

-- Теневой волк
('shadow_wolf', 'health', 180),
('shadow_wolf', 'energy', 150),
('shadow_wolf', 'attack', 30),
('shadow_wolf', 'defense', 15),
('shadow_wolf', 'speed', 20);

-- Заполнение таблицы показателей роста духовных питомцев
INSERT INTO spirit_pet_growth_rates (pet_id, stat_name, growth_rate) VALUES
-- Огненный лис
('fire_fox', 'health', 10.00),
('fire_fox', 'energy', 8.00),
('fire_fox', 'attack', 2.00),
('fire_fox', 'defense', 1.00),
('fire_fox', 'speed', 1.50),

-- Водяной дракон
('water_dragon', 'health', 15.00),
('water_dragon', 'energy', 12.00),
('water_dragon', 'attack', 2.50),
('water_dragon', 'defense', 1.80),
('water_dragon', 'speed', 0.80),

-- Земляная черепаха
('earth_turtle', 'health', 20.00),
('earth_turtle', 'energy', 6.00),
('earth_turtle', 'attack', 1.00),
('earth_turtle', 'defense', 3.00),
('earth_turtle', 'speed', 0.50),

-- Громовая птица
('lightning_bird', 'health', 12.00),
('lightning_bird', 'energy', 10.00),
('lightning_bird', 'attack', 3.00),
('lightning_bird', 'defense', 1.00),
('lightning_bird', 'speed', 2.00),

-- Теневой волк
('shadow_wolf', 'health', 18.00),
('shadow_wolf', 'energy', 15.00),
('shadow_wolf', 'attack', 3.50),
('shadow_wolf', 'defense', 1.50),
('shadow_wolf', 'speed', 2.20);
