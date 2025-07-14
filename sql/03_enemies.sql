-- SQL скрипт для создания и заполнения таблиц врагов
-- Использует PostgreSQL синтаксис
\encoding UTF8
-- Удаление существующих таблиц
DROP TABLE IF EXISTS enemy_loot CASCADE;
DROP TABLE IF EXISTS enemy_attacks_effects CASCADE;
DROP TABLE IF EXISTS enemy_attacks CASCADE;
DROP TABLE IF EXISTS enemy_stats CASCADE;
DROP TABLE IF EXISTS enemy_currency CASCADE;
DROP TABLE IF EXISTS enemy_spawns CASCADE;
DROP TABLE IF EXISTS enemy_time_modifiers CASCADE;
DROP TABLE IF EXISTS enemy_weather_modifiers CASCADE;
DROP TABLE IF EXISTS enemies CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

-- Таблица врагов
CREATE TABLE enemies (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    description TEXT,
    level INTEGER DEFAULT 1,
    category VARCHAR(30) NOT NULL,
    experience INTEGER DEFAULT 0
);

-- Таблица характеристик врагов
CREATE TABLE enemy_stats (
    enemy_id VARCHAR(30) REFERENCES enemies(id) ON DELETE CASCADE,
    health INTEGER NOT NULL,
    energy INTEGER DEFAULT 0,
    physical_defense INTEGER DEFAULT 0,
    spiritual_defense INTEGER DEFAULT 0,
    accuracy INTEGER DEFAULT 0,
    evasion INTEGER DEFAULT 0,
    PRIMARY KEY (enemy_id)
);

-- Таблица атак врагов
CREATE TABLE enemy_attacks (
    id SERIAL PRIMARY KEY,
    enemy_id VARCHAR(30) REFERENCES enemies(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    damage INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    chance INTEGER NOT NULL,
    energy_cost INTEGER DEFAULT 0
);

-- Таблица эффектов атак врагов
CREATE TABLE enemy_attacks_effects (
    id SERIAL PRIMARY KEY,
    attack_id INTEGER REFERENCES enemy_attacks(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    duration INTEGER,
    stat_name VARCHAR(50),
    stat_value INTEGER
);

-- Таблица добычи с врагов
CREATE TABLE enemy_loot (
    id SERIAL PRIMARY KEY,
    enemy_id VARCHAR(30) REFERENCES enemies(id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    chance INTEGER NOT NULL,
    icon VARCHAR(10)
);

-- Таблица валюты с врагов
CREATE TABLE enemy_currency (
    enemy_id VARCHAR(30) REFERENCES enemies(id) ON DELETE CASCADE,
    min_amount INTEGER NOT NULL,
    max_amount INTEGER NOT NULL,
    PRIMARY KEY (enemy_id)
);

-- Таблица точек появления врагов
CREATE TABLE enemy_spawns (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(30) NOT NULL,
    enemy_id VARCHAR(30) REFERENCES enemies(id),
    min_level INTEGER DEFAULT 1,
    max_level INTEGER DEFAULT 1,
    weight INTEGER NOT NULL,
    time_of_day VARCHAR(20),
    weather_condition VARCHAR(20)
);

-- Таблица модификаторов времени суток
CREATE TABLE enemy_time_modifiers (
    time_of_day VARCHAR(30) NOT NULL,
    category VARCHAR(30) NOT NULL,
    modifier DECIMAL(3, 2) NOT NULL,
    PRIMARY KEY (time_of_day, category)
);

-- Таблица модификаторов погоды
CREATE TABLE enemy_weather_modifiers (
    weather_type VARCHAR(30) NOT NULL,
    category VARCHAR(30) NOT NULL,
    modifier DECIMAL(3, 2) NOT NULL,
    PRIMARY KEY (weather_type, category)
);

-- Заполнение таблицы врагов (из enemies.js)
INSERT INTO enemies (id, name, icon, description, level, category, experience) VALUES
('training_dummy', 'Тренировочный манекен', '🎯', 'Простой деревянный манекен для тренировки базовых приёмов.', 1, 'construct', 10),
('weak_spirit_beast', 'Слабый духовный зверь', '🐾', 'Молодой духовный зверь, только начавший свой путь совершенствования.', 3, 'spirit_beast', 25),
('mountain_bandit', 'Горный разбойник', '🗡️', 'Бандит, промышляющий на горных тропах. Владеет базовыми боевыми техниками.', 5, 'bandit', 50),
('ancient_guardian', 'Древний страж', '👻', 'Духовная сущность, охраняющая руины древней цивилизации.', 10, 'elemental', 100),
('night_wraith', 'Ночной призрак', '👻', 'Мстительный дух, появляющийся только в ночной тьме.', 7, 'undead', 70),
('lightning_spirit', 'Дух молнии', '⚡', 'Элементальное существо, черпающее силу из грозовых облаков.', 8, 'lightning_elemental', 80),
('water_elemental', 'Водный элементаль', '💧', 'Существо, состоящее из живой воды. Особенно сильно во время дождя.', 6, 'water_elemental', 65);

-- Заполнение таблицы характеристик врагов
INSERT INTO enemy_stats (enemy_id, health, energy, physical_defense, spiritual_defense, accuracy, evasion) VALUES
('training_dummy', 50, 0, 5, 0, 50, 0),
('weak_spirit_beast', 80, 30, 8, 5, 60, 20),
('mountain_bandit', 120, 50, 15, 10, 70, 30),
('ancient_guardian', 200, 100, 20, 30, 80, 40),
('night_wraith', 150, 80, 10, 25, 75, 50),
('lightning_spirit', 160, 120, 15, 22, 85, 45),
('water_elemental', 140, 100, 18, 20, 70, 40);

-- Заполнение таблицы атак врагов
INSERT INTO enemy_attacks (enemy_id, name, damage, type, chance, energy_cost) VALUES
('training_dummy', 'Контратака', 5, 'physical', 30, 0),
('weak_spirit_beast', 'Укус', 10, 'physical', 60, 0),
('weak_spirit_beast', 'Духовный рык', 15, 'spiritual', 30, 10),
('mountain_bandit', 'Удар мечом', 20, 'physical', 50, 0),
('mountain_bandit', 'Стремительный выпад', 25, 'physical', 30, 15),
('ancient_guardian', 'Призрачное касание', 30, 'spiritual', 40, 0),
('ancient_guardian', 'Древнее проклятие', 45, 'spiritual', 30, 25),
('night_wraith', 'Прикосновение тьмы', 25, 'spiritual', 60, 0),
('night_wraith', 'Вопль ужаса', 35, 'spiritual', 30, 20),
('lightning_spirit', 'Электрический разряд', 30, 'lightning', 50, 0),
('lightning_spirit', 'Цепная молния', 40, 'lightning', 35, 30),
('water_elemental', 'Водяной кнут', 25, 'water', 55, 0),
('water_elemental', 'Поток', 35, 'water', 30, 25);

-- Заполнение таблицы эффектов атак
INSERT INTO enemy_attacks_effects (attack_id, type, duration, stat_name, stat_value) VALUES
(7, 'curse', 3, 'spiritualDefense', -5),
(9, 'fear', 2, 'accuracy', -10),
(9, 'fear', 2, 'evasion', -10),
(11, 'paralysis', 2, 'accuracy', -15),
(11, 'paralysis', 2, 'evasion', -15),
(13, 'slow', 2, 'evasion', -20);

-- Заполнение таблицы добычи с врагов
INSERT INTO enemy_loot (enemy_id, item_id, name, chance, icon) VALUES
('training_dummy', 'wood_splinter', 'Щепка', 50, '🪵'),
('weak_spirit_beast', 'beast_essence', 'Эссенция зверя', 30, '💫'),
('weak_spirit_beast', 'spirit_fur', 'Духовный мех', 20, '🦊'),
('mountain_bandit', 'iron_sword', 'Железный меч', 10, '⚔️'),
('mountain_bandit', 'bandit_pouch', 'Кошель разбойника', 40, '👝'),
('ancient_guardian', 'ancient_relic', 'Древняя реликвия', 5, '🏺'),
('ancient_guardian', 'spirit_essence', 'Эссенция духа', 20, '✨'),
('ancient_guardian', 'guardian_core', 'Ядро стража', 10, '💎'),
('night_wraith', 'ghost_essence', 'Эссенция призрака', 40, '✨'),
('night_wraith', 'night_pearl', 'Ночная жемчужина', 15, '🔮'),
('lightning_spirit', 'lightning_essence', 'Эссенция молнии', 35, '⚡'),
('lightning_spirit', 'thunder_crystal', 'Кристалл грома', 20, '💎'),
('water_elemental', 'water_essence', 'Эссенция воды', 40, '💧'),
('water_elemental', 'pure_dewdrop', 'Чистая росинка', 25, '💎');

-- Заполнение таблицы валюты с врагов
INSERT INTO enemy_currency (enemy_id, min_amount, max_amount) VALUES
('training_dummy', 1, 3),
('weak_spirit_beast', 5, 10),
('mountain_bandit', 20, 40),
('ancient_guardian', 50, 100),
('night_wraith', 30, 60),
('lightning_spirit', 35, 70),
('water_elemental', 25, 50);

-- Заполнение таблицы точек появления врагов
INSERT INTO enemy_spawns (location_id, enemy_id, min_level, max_level, weight, time_of_day, weather_condition) VALUES
('starting_area', 'training_dummy', 1, 2, 70, NULL, NULL),
('starting_area', 'weak_spirit_beast', 3, 4, 30, NULL, NULL),
('mountain_path', 'weak_spirit_beast', 3, 5, 40, NULL, NULL),
('mountain_path', 'mountain_bandit', 5, 7, 60, NULL, NULL),
('mountain_path', 'night_wraith', 7, 9, 20, 'ночь', NULL),
('ancient_ruins', 'mountain_bandit', 6, 8, 30, NULL, NULL),
('ancient_ruins', 'ancient_guardian', 10, 12, 70, NULL, NULL),
('ancient_ruins', 'night_wraith', 8, 10, 50, 'ночь', NULL),
('forest_lake', 'weak_spirit_beast', 4, 6, 60, NULL, NULL),
('forest_lake', 'water_elemental', 6, 8, 40, NULL, 'Дождь'),
('thunder_peak', 'weak_spirit_beast', 5, 7, 30, NULL, NULL),
('thunder_peak', 'mountain_bandit', 7, 9, 40, NULL, NULL),
('thunder_peak', 'lightning_spirit', 8, 10, 30, NULL, 'Гроза');

-- Заполнение таблицы модификаторов времени суток
INSERT INTO enemy_time_modifiers (time_of_day, category, modifier) VALUES
('рассвет', 'spirit_beast', 1.2),
('рассвет', 'bandit', 0.8),
('рассвет', 'undead', 0.5),
('рассвет', 'elemental', 1.1),
('утро', 'spirit_beast', 1.1),
('утро', 'bandit', 1.0),
('утро', 'undead', 0.3),
('утро', 'elemental', 1.0),
('полдень', 'spirit_beast', 1.0),
('полдень', 'bandit', 1.2),
('полдень', 'undead', 0.2),
('полдень', 'elemental', 0.9),
('день', 'spirit_beast', 1.0),
('день', 'bandit', 1.2),
('день', 'undead', 0.1),
('день', 'elemental', 0.8),
('вечер', 'spirit_beast', 1.1),
('вечер', 'bandit', 1.0),
('вечер', 'undead', 0.7),
('вечер', 'elemental', 1.0),
('ночь', 'spirit_beast', 0.8),
('ночь', 'bandit', 0.6),
('ночь', 'undead', 1.5),
('ночь', 'elemental', 1.2);

-- Заполнение таблицы модификаторов погоды
INSERT INTO enemy_weather_modifiers (weather_type, category, modifier) VALUES
('Ясно', 'spirit_beast', 1.0),
('Ясно', 'bandit', 1.1),
('Ясно', 'undead', 0.9),
('Ясно', 'elemental', 1.0),
('Облачно', 'spirit_beast', 1.0),
('Облачно', 'bandit', 1.0),
('Облачно', 'undead', 1.0),
('Облачно', 'elemental', 1.0),
('Дождь', 'spirit_beast', 0.8),
('Дождь', 'bandit', 0.7),
('Дождь', 'undead', 1.0),
('Дождь', 'elemental', 1.2),
('Дождь', 'water_elemental', 1.5),
('Гроза', 'spirit_beast', 0.6),
('Гроза', 'bandit', 0.5),
('Гроза', 'undead', 1.1),
('Гроза', 'elemental', 1.3),
('Гроза', 'lightning_elemental', 2.0),
('Туман', 'spirit_beast', 0.9),
('Туман', 'bandit', 1.1),
('Туман', 'undead', 1.3),
('Туман', 'elemental', 0.8),
('Туман', 'ghost', 1.6),
('Снег', 'spirit_beast', 0.7),
('Снег', 'bandit', 0.6),
('Снег', 'undead', 0.9),
('Снег', 'elemental', 1.1),
('Снег', 'ice_elemental', 1.8);

-- Таблица локаций
CREATE TABLE locations (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL,
    energy_cost INTEGER DEFAULT 0,
    background_image VARCHAR(200),
    enemies JSON,
    coordinates JSON,
    effects JSON,
    requirements JSON
);

-- Заполнение таблицы locations
INSERT INTO locations (id, name, description, type, energy_cost, background_image, enemies, coordinates, effects, requirements) VALUES
('starting_valley', 'Долина Начала', 'Мирная долина, где начинают свой путь молодые культиваторы. Здесь растут базовые духовные травы и обитают слабые духовные звери.', 'forest', 0, '/assets/images/map/starting_valley.png', '["training_dummy", "weak_spirit_beast"]', '{"x": 1, "y": 1}', '[]', 'null'),
('misty_swamps', 'Туманные Болота', 'Опасные болота, окутанные вечным туманом. Здесь скрываются ядовитые существа и блуждающие души.', 'swamp', 15, '/assets/images/map/misty_swamps.png', '["swamp_wraith", "poison_toad", "mist_spirit"]', '{"x": 2, "y": 1}', '[{"type": "fog_bonus", "modifier": 20}]', 'null'),
('crystal_caves', 'Кристальные Пещеры', 'Подземные пещеры, наполненные магическими кристаллами. Источник земной энергии и редких минералов.', 'cave', 25, '/assets/images/map/crystal_caves.png', '["crystal_golem", "cave_bat", "earth_elemental"]', '{"x": 3, "y": 1}', '[{"type": "earth_cultivation_bonus", "modifier": 15}]', '{"cultivation": {"level": 5}}'),
('burning_wastelands', 'Пылающие Пустоши', 'Выжженная пустыня с активными вулканами. Место силы для практиков огненного пути.', 'desert', 35, '/assets/images/map/burning_wastelands.png', '["fire_salamander", "lava_beast", "desert_scorpion"]', '{"x": 4, "y": 1}', '[{"type": "fire_cultivation_bonus", "modifier": 20}, {"type": "water_cultivation_penalty", "modifier": -10}]', '{"cultivation": {"level": 10}}'),
('frozen_peaks', 'Ледяные Вершины', 'Заснеженные горные пики с ледяными ветрами. Испытание холодом для сильных культиваторов.', 'mountain', 45, '/assets/images/map/frozen_peaks.png', '["ice_wolf", "frost_giant", "blizzard_spirit"]', '{"x": 5, "y": 1}', '[{"type": "ice_cultivation_bonus", "modifier": 20}, {"type": "fire_cultivation_penalty", "modifier": -15}]', '{"cultivation": {"level": 15}}'),
('ancient_forest', 'Древний Лес', 'Древний лес с могущественными духами природы. Место силы для друидов и натуралистов.', 'forest', 55, '/assets/images/map/ancient_forest.png', '["treant_guardian", "forest_drake", "nature_spirit"]', '{"x": 6, "y": 1}', '[{"type": "nature_cultivation_bonus", "modifier": 25}, {"type": "herb_gathering_bonus", "modifier": 30}]', '{"cultivation": {"level": 20}}'),
('celestial_observatory', 'Небесная Обсерватория', 'Мистическая башня, достигающая небес. Место изучения звездной магии и высших искусств.', 'tower', 70, '/assets/images/map/celestial_observatory.png', '["star_guardian", "void_wraith", "celestial_construct"]', '{"x": 7, "y": 1}', '[{"type": "astral_cultivation_bonus", "modifier": 30}, {"type": "technique_learning_bonus", "modifier": 20}]', '{"cultivation": {"level": 25}}');

-- Новые враги для разнообразия в локациях
INSERT INTO enemies (id, name, icon, description, level, category, experience) VALUES
('swamp_wraith', 'Болотный призрак', '👻', 'Мстительный дух, утонувший в болоте. Использует ядовитые атаки.', 4, 'undead', 35),
('poison_toad', 'Ядовитая жаба', '🐸', 'Огромная жаба с ядовитой кожей. Плюется кислотой.', 3, 'beast', 25),
('mist_spirit', 'Дух тумана', '🌫️', 'Элементальное существо из тумана. Может становиться неосязаемым.', 5, 'elemental', 45),
('crystal_golem', 'Кристальный голем', '💎', 'Конструкт из магических кристаллов. Очень прочный.', 8, 'construct', 80),
('cave_bat', 'Пещерная летучая мышь', '🦇', 'Гигантская летучая мышь. Атакует ультразвуком.', 4, 'beast', 30),
('earth_elemental', 'Земляной элементаль', '🗿', 'Существо из камня и земли. Медленный, но мощный.', 7, 'elemental', 70),
('fire_salamander', 'Огненная саламандра', '🦎', 'Ящерица, пылающая внутренним огнем. Иммунна к огню.', 9, 'elemental', 90),
('lava_beast', 'Лавовый зверь', '🌋', 'Чудовище из расплавленной лавы. Крайне опасно.', 12, 'elemental', 120),
('desert_scorpion', 'Пустынный скорпион', '🦂', 'Огромный скорпион с ядовитым жалом.', 6, 'beast', 60),
('ice_wolf', 'Ледяной волк', '🐺', 'Волк из вечных льдов. Дышит морозом.', 10, 'beast', 100),
('frost_giant', 'Ледяной великан', '🧊', 'Гигант из льда и снега. Владеет ледяной магией.', 15, 'giant', 150),
('blizzard_spirit', 'Дух метели', '❄️', 'Элементаль зимы. Создает снежные бури.', 11, 'elemental', 110),
('treant_guardian', 'Страж-энт', '🌳', 'Древний страж леса. Защищает природу.', 13, 'plant', 130),
('forest_drake', 'Лесной дракончик', '🐉', 'Молодой дракон природы. Использует растительную магию.', 14, 'dragon', 140),
('nature_spirit', 'Дух природы', '🍃', 'Воплощение силы леса. Лечит союзников.', 12, 'elemental', 120),
('star_guardian', 'Звездный страж', '⭐', 'Хранитель звездных тайн. Использует астральную магию.', 18, 'celestial', 180),
('void_wraith', 'Призрак пустоты', '🌌', 'Существо из межзвездной тьмы. Поглощает энергию.', 16, 'void', 160),
('celestial_construct', 'Небесный конструкт', '🔮', 'Магический автомат обсерватории. Стреляет звездной энергией.', 17, 'construct', 170);

-- Характеристики новых врагов
INSERT INTO enemy_stats (enemy_id, health, energy, physical_defense, spiritual_defense, accuracy, evasion) VALUES
('swamp_wraith', 90, 60, 8, 20, 70, 45),
('poison_toad', 110, 40, 20, 10, 65, 25),
('mist_spirit', 80, 80, 5, 25, 80, 60),
('crystal_golem', 200, 50, 35, 15, 60, 10),
('cave_bat', 70, 30, 10, 8, 85, 70),
('earth_elemental', 180, 70, 30, 20, 65, 20),
('fire_salamander', 160, 90, 20, 25, 75, 40),
('lava_beast', 250, 100, 25, 30, 70, 25),
('desert_scorpion', 130, 60, 25, 15, 80, 50),
('ice_wolf', 150, 80, 18, 22, 85, 55),
('frost_giant', 300, 120, 40, 35, 65, 15),
('blizzard_spirit', 170, 110, 15, 40, 80, 50),
('treant_guardian', 280, 100, 35, 30, 60, 20),
('forest_drake', 220, 130, 25, 35, 85, 45),
('nature_spirit', 160, 120, 20, 45, 75, 40),
('star_guardian', 250, 150, 30, 50, 90, 60),
('void_wraith', 200, 140, 20, 45, 85, 70),
('celestial_construct', 230, 130, 35, 40, 80, 35);

-- Обновление enemy_spawns для новых локаций
DELETE FROM enemy_spawns;

INSERT INTO enemy_spawns (location_id, enemy_id, min_level, max_level, weight, time_of_day, weather_condition) VALUES
-- Долина Начала
('starting_valley', 'training_dummy', 1, 2, 60, NULL, NULL),
('starting_valley', 'weak_spirit_beast', 2, 4, 40, NULL, NULL),

-- Туманные Болота
('misty_swamps', 'swamp_wraith', 4, 6, 40, 'ночь', 'Туман'),
('misty_swamps', 'poison_toad', 3, 5, 50, NULL, NULL),
('misty_swamps', 'mist_spirit', 5, 7, 30, NULL, 'Туман'),
('misty_swamps', 'weak_spirit_beast', 3, 4, 20, NULL, NULL),

-- Кристальные Пещеры
('crystal_caves', 'crystal_golem', 8, 10, 40, NULL, NULL),
('crystal_caves', 'cave_bat', 4, 6, 50, 'ночь', NULL),
('crystal_caves', 'earth_elemental', 7, 9, 30, NULL, NULL),
('crystal_caves', 'mountain_bandit', 5, 7, 20, NULL, NULL),

-- Пылающие Пустоши
('burning_wastelands', 'fire_salamander', 9, 11, 40, 'день', 'Ясно'),
('burning_wastelands', 'lava_beast', 12, 14, 25, NULL, NULL),
('burning_wastelands', 'desert_scorpion', 6, 8, 45, NULL, NULL),
('burning_wastelands', 'lightning_spirit', 8, 10, 20, NULL, 'Гроза'),

-- Ледяные Вершины
('frozen_peaks', 'ice_wolf', 10, 12, 50, NULL, 'Снег'),
('frozen_peaks', 'frost_giant', 15, 17, 20, NULL, 'Снег'),
('frozen_peaks', 'blizzard_spirit', 11, 13, 30, NULL, 'Снег'),
('frozen_peaks', 'mountain_bandit', 8, 10, 25, NULL, NULL),

-- Древний Лес
('ancient_forest', 'treant_guardian', 13, 15, 30, NULL, NULL),
('ancient_forest', 'forest_drake', 14, 16, 25, NULL, NULL),
('ancient_forest', 'nature_spirit', 12, 14, 35, 'рассвет', NULL),
('ancient_forest', 'weak_spirit_beast', 8, 10, 40, NULL, NULL),

-- Небесная Обсерватория
('celestial_observatory', 'star_guardian', 18, 20, 30, 'ночь', 'Ясно'),
('celestial_observatory', 'void_wraith', 16, 18, 35, 'ночь', NULL),
('celestial_observatory', 'celestial_construct', 17, 19, 25, NULL, NULL),
('celestial_observatory', 'ancient_guardian', 15, 17, 20, NULL, NULL);
