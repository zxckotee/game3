-- SQL скрипт для создания и заполнения таблиц предметов экипировки
-- Использует PostgreSQL синтаксис
\encoding UTF8
-- Удаление существующих таблиц
DROP TABLE IF EXISTS equipment_item_effects CASCADE;
DROP TABLE IF EXISTS equipment_item_requirements CASCADE;
DROP TABLE IF EXISTS equipment_item_special_effects CASCADE;
DROP TABLE IF EXISTS equipment_items CASCADE;

-- Таблица предметов экипировки
CREATE TABLE equipment_items (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30),
    rarity VARCHAR(20),
    base_price INTEGER,
    description TEXT,
    armor_type VARCHAR(20),
    set_id VARCHAR(30),
    icon VARCHAR(100)
);

-- Таблица эффектов предметов экипировки
CREATE TABLE equipment_item_effects (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(50) REFERENCES equipment_items(item_id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    target VARCHAR(50) NOT NULL,
    value DECIMAL(10, 5) NOT NULL,
    operation VARCHAR(10),
    duration INTEGER
);

-- Таблица требований предметов экипировки
CREATE TABLE equipment_item_requirements (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(50) REFERENCES equipment_items(item_id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    value INTEGER NOT NULL
);

-- Таблица специальных эффектов предметов экипировки
CREATE TABLE equipment_item_special_effects (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(50) REFERENCES equipment_items(item_id) ON DELETE CASCADE,
    effect_id VARCHAR(30),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL
);

-- Заполнение таблицы предметов экипировки с новыми строковыми ID
INSERT INTO equipment_items (item_id, name, type, rarity, base_price, description, armor_type, set_id, icon) VALUES
-- Оружие
('bronze_sword', 'Бронзовый меч', 'weapon', 'common', 75, 'Простой бронзовый меч, подходящий для начинающих культиваторов', NULL, NULL, 'bronze-sword.png'),
('iron_sword', 'Железный меч', 'weapon', 'uncommon', 180, 'Крепкий железный меч, выкованный опытным кузнецом', NULL, NULL, 'iron-sword.png'),
('eastern_wind_blade', 'Клинок Восточного Ветра', 'weapon', 'rare', 450, 'Легкий и острый меч, созданный по древним техникам Восточного региона', NULL, NULL, 'eastern-wind-blade.png'),
('azure_dragon_sword', 'Меч Лазурного Дракона', 'weapon', 'epic', 1000, 'Легендарный меч, в лезвии которого заключена частица силы древнего дракона', NULL, 'azure-dragon', 'azure-dragon-sword.png'),

-- Броня для тела
('cloth_robe', 'Льняная роба', 'armor', 'common', 60, 'Простая льняная роба, обеспечивающая минимальную защиту', 'body', NULL, 'cloth-robe.png'),
('leather_armor', 'Кожаный доспех', 'armor', 'uncommon', 170, 'Прочный доспех из обработанной кожи', 'body', NULL, 'leather-armor.png'),
('mountain_guardian_armor', 'Доспех Горного Стража', 'armor', 'rare', 400, 'Крепкий доспех, выкованный из руды, добытой в древних горах', 'body', NULL, 'mountain-guardian-armor.png'),
('azure_dragon_robe', 'Одеяние Лазурного Дракона', 'armor', 'epic', 850, 'Мистическое одеяние, сотканное из чешуи лазурного дракона', 'body', 'azure-dragon', 'azure-dragon-robe.png'),

-- Шлемы
('leather_cap', 'Кожаный шлем', 'armor', 'common', 40, 'Простой кожаный шлем, защищающий голову от ударов', 'head', NULL, 'leather-cap.png'),
('perception_circlet', 'Венец Восприятия', 'armor', 'rare', 300, 'Легкий обруч с драгоценным камнем, усиливающий духовное восприятие', 'head', NULL, 'perception-circlet.png'),

-- Перчатки
('cloth_gloves', 'Тканевые перчатки', 'armor', 'common', 30, 'Простые тканевые перчатки, защищающие руки от холода', 'hands', NULL, 'cloth-gloves.png'),
('iron_gauntlets', 'Железные рукавицы', 'armor', 'uncommon', 100, 'Крепкие железные рукавицы для защиты рук', 'hands', NULL, 'iron-gauntlets.png'),
('spirit_channeling_gloves', 'Перчатки духовной проводимости', 'armor', 'rare', 240, 'Особые перчатки, улучшающие проводимость духовной энергии', 'hands', NULL, 'spirit-channeling-gloves.png'),

-- Обувь
('cloth_shoes', 'Тканевые ботинки', 'armor', 'common', 35, 'Простые тканевые ботинки для повседневного ношения', 'legs', NULL, 'cloth-shoes.png'),
('swift_wind_boots', 'Сапоги Стремительного Ветра', 'armor', 'rare', 260, 'Легкие сапоги, зачарованные для увеличения скорости и маневренности', 'legs', NULL, 'swift-wind-boots.png'),

-- Талисманы
('fire_talisman', 'Талисман огня', 'talisman', 'common', 100, 'Простой талисман, усиливающий контроль над стихией огня', NULL, NULL, 'fire-talisman.png'),
('water_talisman', 'Талисман воды', 'talisman', 'common', 100, 'Простой талисман, усиливающий контроль над стихией воды', NULL, NULL, 'water-talisman.png'),
('protection_talisman', 'Талисман защиты', 'talisman', 'uncommon', 180, 'Талисман, создающий защитный барьер вокруг культиватора', NULL, NULL, 'protection-talisman.png'),
('spirit_sight_talisman', 'Талисман духовного зрения', 'talisman', 'rare', 320, 'Редкий талисман, позволяющий видеть скрытые духовные силы', NULL, NULL, 'spirit-sight-talisman.png'),
('five_elements_talisman', 'Талисман пяти стихий', 'talisman', 'epic', 550, 'Могущественный талисман, гармонизирующий все пять основных стихий', NULL, NULL, 'five-elements-talisman.png'),

-- Пилюли убрали по ненадобности

-- Аксессуары
('celestial_perception_ring', 'Кольцо Небесного Восприятия', 'accessory', 'rare', 380, 'Древнее кольцо, улучшающее способность воспринимать духовную энергию', NULL, NULL, 'celestial-perception-ring.png'),
('azure_dragon_scale_pendant', 'Подвеска из чешуи Лазурного Дракона', 'accessory', 'epic', 750, 'Редкая подвеска, изготовленная из чешуи легендарного Лазурного Дракона', NULL, 'azure-dragon', 'azure-dragon-scale-pendant.png');

-- Заполнение таблицы эффектов предметов экипировки
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
-- Эффекты для Бронзового меча
('bronze_sword', 'statBoost', 'strength', 2, 'add'),
('bronze_sword', 'combatBoost', 'physicalDamage', 5, NULL),

-- Эффекты для Железного меча
('iron_sword', 'statBoost', 'strength', 4, 'add'),
('iron_sword', 'combatBoost', 'physicalDamage', 8, NULL),

-- Эффекты для Клинка Восточного Ветра
('eastern_wind_blade', 'statBoost', 'strength', 6, 'add'),
('eastern_wind_blade', 'statBoost', 'dexterity', 5, 'add'),
('eastern_wind_blade', 'combatBoost', 'physicalDamage', 12, NULL),
('eastern_wind_blade', 'combatBoost', 'critChance', 0.05, NULL),

-- Эффекты для Меча Лазурного Дракона
('azure_dragon_sword', 'statBoost', 'strength', 10, 'add'),
('azure_dragon_sword', 'statBoost', 'dexterity', 8, 'add'),
('azure_dragon_sword', 'combatBoost', 'physicalDamage', 20, NULL),
('azure_dragon_sword', 'combatBoost', 'critChance', 0.1, NULL),
('azure_dragon_sword', 'elementalBoost', 'water', 15, NULL),

-- Эффекты для Льняной роба

('cloth_robe', 'combatBoost', 'physicalDefense', 3, NULL),

-- Эффекты для Кожаного доспеха

('leather_armor', 'combatBoost', 'physicalDefense', 6, NULL),
('leather_armor', 'combatBoost', 'dodgeChance', 0.02, NULL),

-- Эффекты для Доспеха Горного Стража

('mountain_guardian_armor', 'statBoost', 'strength', 3, 'add'),
('mountain_guardian_armor', 'combatBoost', 'physicalDefense', 12, NULL),
('mountain_guardian_armor', 'elementalBoost', 'earth', 8, NULL),

-- Эффекты для Одеяния Лазурного Дракона

('azure_dragon_robe', 'statBoost', 'intelligence', 6, 'add'),
('azure_dragon_robe', 'combatBoost', 'physicalDefense', 15, NULL),
('azure_dragon_robe', 'combatBoost', 'magicDefense', 15, NULL),
('azure_dragon_robe', 'elementalBoost', 'water', 12, NULL),
('azure_dragon_robe', 'cultivation', 'comprehensionRate', 0.05, NULL);

-- Заполнение таблицы требований предметов экипировки
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
-- Требования для Бронзового меча
('bronze_sword', 'level', 1),
('bronze_sword', 'strength', 5),

-- Требования для Железного меча
('iron_sword', 'level', 2),
('iron_sword', 'strength', 10),

-- Требования для Клинка Восточного Ветра
('eastern_wind_blade', 'level', 3),
('eastern_wind_blade', 'strength', 15),
('eastern_wind_blade', 'dexterity', 12),

-- Требования для Меча Лазурного Дракона
('azure_dragon_sword', 'level', 5),
('azure_dragon_sword', 'strength', 25),
('azure_dragon_sword', 'dexterity', 20),

-- Требования для Доспеха Горного Стража
('mountain_guardian_armor', 'level', 3),


-- Требования для Одеяния Лазурного Дракона
('azure_dragon_robe', 'level', 5),

('azure_dragon_robe', 'intelligence', 20);

-- Заполнение таблицы специальных эффектов предметов экипировки
INSERT INTO equipment_item_special_effects (item_id, effect_id, name, description) VALUES
-- Специальные эффекты для Сапогов Стремительного Ветра
('swift_wind_boots', 'swift-movement', 'Стремительное движение', 'Увеличивает скорость передвижения на 15%'),

-- Специальные эффекты для Кольца Небесного Восприятия
('celestial_perception_ring', 'energy-sight', 'Видение энергии', 'Позволяет видеть потоки духовной энергии'),

-- Специальные эффекты для Талисмана духовного зрения
('spirit_sight_talisman', 'spiritSight', 'Духовное зрение', 'Позволяет видеть скрытые духовные сущности и потоки энергии'),

-- Специальные эффекты для Талисмана пяти стихий
('five_elements_talisman', 'elements-harmony', 'Гармония Стихий', 'Увеличивает эффективность техник всех стихий на 5%');

-- Дополнительные эффекты для предметов экипировки
-- Добавление эффектов для шлемов
-- Leather Cap (common)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES

('leather_cap', 'combatBoost', 'physicalDefense', 3, NULL);

-- Perception Circlet (rare)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('perception_circlet', 'statBoost', 'intelligence', 5, 'add'),
('perception_circlet', 'statBoost', 'perception', 4, 'add'),
('perception_circlet', 'combatBoost', 'magicDefense', 8, NULL),
('perception_circlet', 'cultivation', 'comprehensionRate', 0.03, NULL);

-- Добавление эффектов для перчаток
-- Cloth Gloves (common)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('cloth_gloves', 'statBoost', 'dexterity', 1, 'add'),
('cloth_gloves', 'combatBoost', 'physicalDefense', 2, NULL);

-- Iron Gauntlets (uncommon)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('iron_gauntlets', 'statBoost', 'strength', 3, 'add'),
('iron_gauntlets', 'combatBoost', 'physicalDefense', 5, NULL),
('iron_gauntlets', 'combatBoost', 'attackSpeed', -0.05, NULL);

-- Spirit Channeling Gloves (rare)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('spirit_channeling_gloves', 'statBoost', 'intelligence', 4, 'add'),
('spirit_channeling_gloves', 'statBoost', 'perception', 3, 'add'),
('spirit_channeling_gloves', 'cultivation', 'qiRecovery', 0.08, NULL),
('spirit_channeling_gloves', 'cultivation', 'controlRate', 0.05, NULL);

-- Добавление эффектов для обуви
-- Cloth Shoes (common)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('cloth_shoes', 'statBoost', 'dexterity', 2, 'add'),
('cloth_shoes', 'combatBoost', 'movementSpeed', 0.03, NULL);

-- Swift Wind Boots (rare)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('swift_wind_boots', 'statBoost', 'dexterity', 6, 'add'),
('swift_wind_boots', 'combatBoost', 'movementSpeed', 0.1, NULL),
('swift_wind_boots', 'combatBoost', 'dodgeChance', 0.05, NULL);

-- Добавление эффектов для талисманов
-- Fire Talisman (common)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('fire_talisman', 'elementalBoost', 'fire', 5, NULL),
('fire_talisman', 'statBoost', 'intelligence', 2, 'add');

-- Water Talisman (common)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('water_talisman', 'elementalBoost', 'water', 5, NULL),
('water_talisman', 'statBoost', 'intelligence', 2, 'add');

-- Protection Talisman (uncommon)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('protection_talisman', 'combatBoost', 'physicalDefense', 6, NULL),
('protection_talisman', 'combatBoost', 'magicDefense', 6, NULL),


-- Spirit Sight Talisman (rare) - дополняем, т.к. у него уже есть специальный эффект
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('spirit_sight_talisman', 'statBoost', 'perception', 8, 'add'),
('spirit_sight_talisman', 'cultivation', 'comprehensionRate', 0.05, NULL),
('spirit_sight_talisman', 'cultivation', 'spiritualPower', 0.1, NULL);

-- Five Elements Talisman (epic) - дополняем, т.к. у него уже есть специальный эффект
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('five_elements_talisman', 'elementalBoost', 'fire', 8, NULL),
('five_elements_talisman', 'elementalBoost', 'water', 8, NULL),
('five_elements_talisman', 'elementalBoost', 'earth', 8, NULL),
('five_elements_talisman', 'elementalBoost', 'wind', 8, NULL),
('five_elements_talisman', 'elementalBoost', 'metal', 8, NULL),
('five_elements_talisman', 'statBoost', 'intelligence', 6, 'add'),
('five_elements_talisman', 'cultivation', 'comprehensionRate', 0.08, NULL);

-- Добавление эффектов для аксессуаров
-- Celestial Perception Ring (rare) - дополняем, т.к. у него уже есть специальный эффект
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES
('celestial_perception_ring', 'statBoost', 'perception', 8, 'add'),
('celestial_perception_ring', 'statBoost', 'intelligence', 5, 'add'),
('celestial_perception_ring', 'cultivation', 'comprehensionRate', 0.07, NULL),
('celestial_perception_ring', 'cultivation', 'qiRecovery', 0.05, NULL);

-- Azure Dragon Scale Pendant (epic)
INSERT INTO equipment_item_effects (item_id, type, target, value, operation) VALUES

('azure_dragon_scale_pendant', 'statBoost', 'strength', 6, 'add'),
('azure_dragon_scale_pendant', 'statBoost', 'intelligence', 6, 'add'),
('azure_dragon_scale_pendant', 'elementalBoost', 'water', 15, NULL),
('azure_dragon_scale_pendant', 'combatBoost', 'physicalDefense', 10, NULL),
('azure_dragon_scale_pendant', 'combatBoost', 'magicDefense', 10, NULL),
('azure_dragon_scale_pendant', 'cultivation', 'breakthroughChance', 0.05, NULL);

-- Дополнительные требования для предметов экипировки
-- Добавление требований для доспехов, у которых были только эффекты
-- Cloth Robe (common)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('cloth_robe', 'level', 1),


-- Leather Armor (uncommon)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('leather_armor', 'level', 2),

('leather_armor', 'dexterity', 6);

-- Добавление требований для шлемов
-- Leather Cap (common)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('leather_cap', 'level', 1),


-- Perception Circlet (rare)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('perception_circlet', 'level', 3),
('perception_circlet', 'intelligence', 15),
('perception_circlet', 'perception', 10);

-- Добавление требований для перчаток
-- Cloth Gloves (common)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('cloth_gloves', 'level', 1),
('cloth_gloves', 'dexterity', 3);

-- Iron Gauntlets (uncommon)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('iron_gauntlets', 'level', 2),
('iron_gauntlets', 'strength', 10);

-- Spirit Channeling Gloves (rare)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('spirit_channeling_gloves', 'level', 3),
('spirit_channeling_gloves', 'intelligence', 12),
('spirit_channeling_gloves', 'perception', 10);

-- Добавление требований для обуви
-- Cloth Shoes (common)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('cloth_shoes', 'level', 1),
('cloth_shoes', 'dexterity', 5);

-- Swift Wind Boots (rare)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('swift_wind_boots', 'level', 3),
('swift_wind_boots', 'dexterity', 15);

-- Добавление требований для талисманов
-- Fire Talisman (common)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('fire_talisman', 'level', 2),
('fire_talisman', 'intelligence', 8);

-- Water Talisman (common)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('water_talisman', 'level', 2),
('water_talisman', 'intelligence', 8);

-- Protection Talisman (uncommon)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('protection_talisman', 'level', 2),


-- Spirit Sight Talisman (rare)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('spirit_sight_talisman', 'level', 3),
('spirit_sight_talisman', 'intelligence', 12),
('spirit_sight_talisman', 'perception', 15);

-- Five Elements Talisman (epic)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('five_elements_talisman', 'level', 5),
('five_elements_talisman', 'intelligence', 25),
('five_elements_talisman', 'perception', 20);

-- Добавление требований для аксессуаров
-- Celestial Perception Ring (rare)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('celestial_perception_ring', 'level', 4),
('celestial_perception_ring', 'intelligence', 18),
('celestial_perception_ring', 'perception', 15);

-- Azure Dragon Scale Pendant (epic)
INSERT INTO equipment_item_requirements (item_id, type, value) VALUES
('azure_dragon_scale_pendant', 'level', 5),

('azure_dragon_scale_pendant', 'intelligence', 20),
('azure_dragon_scale_pendant', 'strength', 15);
