-- SQL скрипт для создания и заполнения таблиц алхимических предметов
-- Использует PostgreSQL синтаксис
\encoding UTF8
-- Удаление существующих таблиц
DROP TABLE IF EXISTS alchemy_item_effects CASCADE;
DROP TABLE IF EXISTS alchemy_item_properties CASCADE;
DROP TABLE IF EXISTS alchemy_item_stats CASCADE;
DROP TABLE IF EXISTS alchemy_items CASCADE;

-- Зависимость: item_types должна быть создана ранее (00_reference_tables.sql)
-- Зависимость: rarities должна быть создана ранее (00_reference_tables.sql)

-- Таблица алхимических предметов
CREATE TABLE alchemy_items (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) REFERENCES item_types(id),
    rarity VARCHAR(20) REFERENCES rarities(id),
    description TEXT,
    value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица эффектов алхимических предметов
CREATE TABLE alchemy_item_effects (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(30) REFERENCES alchemy_items(id) ON DELETE CASCADE,
    effect_type VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица свойств алхимических предметов
CREATE TABLE alchemy_item_properties (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(30) REFERENCES alchemy_items(id) ON DELETE CASCADE,
    property_name VARCHAR(30) NOT NULL,
    property_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица статистик алхимических предметов
CREATE TABLE alchemy_item_stats (
    id SERIAL PRIMARY KEY,
    item_id VARCHAR(30) REFERENCES alchemy_items(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL,
    stat_name VARCHAR(30) NOT NULL,
    stat_value DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Триггеры для обновления updated_at
CREATE OR REPLACE FUNCTION update_alchemy_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alchemy_items_updated_at
BEFORE UPDATE ON alchemy_items
FOR EACH ROW
EXECUTE FUNCTION update_alchemy_updated_at_column();

CREATE TRIGGER trigger_update_alchemy_item_effects_updated_at
BEFORE UPDATE ON alchemy_item_effects
FOR EACH ROW
EXECUTE FUNCTION update_alchemy_updated_at_column();

CREATE TRIGGER trigger_update_alchemy_item_properties_updated_at
BEFORE UPDATE ON alchemy_item_properties
FOR EACH ROW
EXECUTE FUNCTION update_alchemy_updated_at_column();

CREATE TRIGGER trigger_update_alchemy_item_stats_updated_at
BEFORE UPDATE ON alchemy_item_stats
FOR EACH ROW
EXECUTE FUNCTION update_alchemy_updated_at_column();

-- Заполнение таблицы алхимических предметов (из alchemy-items.js)
INSERT INTO alchemy_items (id, name, type, rarity, description, value) VALUES
-- Пилюли
('qi_gathering_pill', 'Зелье сбора ци', 'consumable', 'common', 'Базовое зелье, помогающее собирать и очищать ци. Ускоряет культивацию на начальных этапах.', 100),
('body_strengthening_pill', 'Зелье укрепления тела', 'consumable', 'uncommon', 'Жидкая эссенция, укрепляющая физическое тело, повышая выносливость и силу культиватора.', 250),
('meridian_clearing_pill', 'Зелье очищения меридианов', 'consumable', 'uncommon', 'Микстура, очищающая и расширяющая меридианы, облегчая циркуляцию ци по телу.', 400),
('spirit_concentration_pill', 'Пилюля концентрации духа', 'consumable', 'rare', 'Помогает культиватору сосредоточиться и улучшает контроль над духовной энергией.', 800),
('core_formation_pill', 'Пилюля формирования ядра', 'consumable', 'epic', 'Способствует формированию золотого ядра, облегчая прорыв на следующую ступень культивации.', 2000),
('soul_enlightenment_pill', 'Пилюля просветления души', 'consumable', 'legendary', 'Усиливает духовное восприятие и помогает в формировании души культиватора.', 10000),

-- Талисманы
('reflection_talisman', 'Талисман отражения', 'talisman', 'common', 'Базовый защитный талисман, отражающий слабые атаки.', 150),
('fire_bird_talisman', 'Талисман огненной птицы', 'talisman', 'uncommon', 'Атакующий талисман, высвобождающий огненную энергию в форме птицы.', 300),
('stone_skin_talisman', 'Талисман каменной кожи', 'talisman', 'rare', 'Защитный талисман, временно придающий коже прочность камня.', 600),
('wind_summoning_talisman', 'Талисман призыва ветра', 'talisman', 'rare', 'Талисман, вызывающий порыв ветра, который может ускорить перемещение или отбросить противников.', 700),
('thunder_strike_talisman', 'Талисман громового удара', 'talisman', 'epic', 'Мощный атакующий талисман, вызывающий удар молнии с неба.', 1500),
('spirit_shield_talisman', 'Талисман духовной защиты', 'talisman', 'legendary', 'Создает невидимый духовный барьер, защищающий от большинства атак.', 8000),

-- Оружие
('spirit_dagger', 'Духовный кинжал', 'weapon', 'uncommon', 'Кинжал, способный проводить духовную энергию и наносить урон как физическим, так и духовным телам.', 500),
('five_element_sword', 'Меч пяти элементов', 'weapon', 'rare', 'Меч, способный проводить энергию пяти элементов, усиливая атаки соответствующей стихией.', 1200),
('spirit_attraction_staff', 'Посох духовного притяжения', 'weapon', 'epic', 'Посох, усиливающий способность культиватора собирать и манипулировать духовной энергией.', 3500),
('heaven_cleaving_sword', 'Меч рассекающий небеса', 'weapon', 'legendary', 'Легендарный меч, способный разрезать даже небеса. Содержит в себе частицу древней души.', 15000),

-- Броня
('basic_spirit_robes', 'Духовные одежды начального уровня', 'armor', 'uncommon', 'Одежды, пропитанные духовной энергией, обеспечивающие базовую защиту от физических и духовных атак.', 450),
('water_flow_armor', 'Броня водного потока', 'armor', 'rare', 'Легкая броня, которая движется вместе с телом как вода, не сковывая движений и обеспечивая хорошую защиту.', 1100),
('golden_core_armor', 'Доспех золотого ядра', 'armor', 'epic', 'Тяжелая броня, резонирующая с золотым ядром культиватора и значительно усиливающая защиту.', 3200),
('immortal_robes', 'Одеяние бессмертного', 'armor', 'legendary', 'Легендарные одежды, созданные по образцу одеяний бессмертных даосов. Обеспечивают непревзойденную защиту.', 12000),

-- Аксессуары
('spirit_enhancement_ring', 'Кольцо духовного усиления', 'accessory', 'uncommon', 'Кольцо, усиливающее контроль над духовной энергией и ускоряющее её восстановление.', 500),
('five_element_amulet', 'Амулет пяти элементов', 'accessory', 'rare', 'Амулет, усиливающий контроль над энергиями пяти стихий и обеспечивающий защиту от них.', 1300),
('spirit_storage_bracelet', 'Браслет духовного хранилища', 'accessory', 'epic', 'Пространственный браслет, позволяющий хранить предметы в отдельном измерении.', 3000),
('nine_dragon_crown', 'Корона девяти драконов', 'accessory', 'legendary', 'Легендарный головной убор, украшенный изображениями девяти драконов, которые усиливают духовное восприятие владельца.', 20000);

-- Заполнение таблицы эффектов алхимических предметов
INSERT INTO alchemy_item_effects (item_id, effect_type, description) VALUES
-- Эффекты пилюль
('qi_gathering_pill', 'instant', 'Восстанавливает 30 единиц духовной энергии'),
('qi_gathering_pill', 'cultivation', 'Увеличивает скорость культивации на 10% на 1 час'),
('qi_gathering_pill', 'stats', 'Временно повышает контроль над ци на 5%'),

('body_strengthening_pill', 'instant', 'Восстанавливает 20 единиц здоровья'),
('body_strengthening_pill', 'stats', 'Временно повышает силу на 10% и выносливость на 15%'),
('body_strengthening_pill', 'combat', 'Увеличивает физическую защиту на 20 единиц на время действия'),

('meridian_clearing_pill', 'instant', 'Восстанавливает 40 единиц духовной энергии'),
('meridian_clearing_pill', 'cultivation', 'Увеличивает скорость медитации на 25% на 2 часа'),
('meridian_clearing_pill', 'special', 'Снимает все негативные эффекты, влияющие на циркуляцию ци'),

('spirit_concentration_pill', 'instant', 'Восстанавливает 80 единиц духовной энергии'),
('spirit_concentration_pill', 'stats', 'Временно повышает интеллект на 15% и восприятие на 20%'),
('spirit_concentration_pill', 'combat', 'Увеличивает духовную защиту на 30 единиц на время действия'),
('spirit_concentration_pill', 'special', 'Улучшает понимание техник культивации на 20% на время действия'),

('core_formation_pill', 'instant', 'Восстанавливает 150 единиц духовной энергии'),
('core_formation_pill', 'cultivation', 'Увеличивает скорость культивации на 40% на 4 часа'),
('core_formation_pill', 'special', 'Увеличивает шанс прорыва на 25% при следующей попытке'),
('core_formation_pill', 'breakthrough', 'Снижает требуемые ресурсы для прорыва на 20%'),

('soul_enlightenment_pill', 'instant', 'Полностью восстанавливает духовную энергию и увеличивает максимум на 10% на время действия'),
('soul_enlightenment_pill', 'cultivation', 'Увеличивает скорость культивации на 80% на 6 часов'),
('soul_enlightenment_pill', 'stats', 'Временно повышает все характеристики на 20%'),
('soul_enlightenment_pill', 'special', 'Позволяет видеть скрытые духовные энергии и потоки'),
('soul_enlightenment_pill', 'breakthrough', 'Гарантирует успешный прорыв при следующей попытке (однократно)'),

-- Эффекты талисманов
('reflection_talisman', 'combat', 'При активации создает щит, отражающий 30% входящего урона обратно в атакующего'),
('reflection_talisman', 'defense', 'Блокирует до 100 единиц урона, затем разрушается'),

('fire_bird_talisman', 'combat', 'При активации создает огненную птицу, которая атакует противника, нанося 200 единиц урона огнем'),
('fire_bird_talisman', 'special', 'Огненная птица преследует цель в течение 10 секунд, нанося дополнительные 10 единиц урона в секунду'),

('stone_skin_talisman', 'combat', 'При активации увеличивает физическую защиту на 100 единиц'),
('stone_skin_talisman', 'special', 'Снижает входящий физический урон на 40%'),
('stone_skin_talisman', 'drawback', 'Снижает скорость передвижения на 20% на время действия'),

('wind_summoning_talisman', 'combat', 'При активации создает мощный порыв ветра, отбрасывающий всех противников в радиусе 10 метров на 5 метров назад'),
('wind_summoning_talisman', 'movement', 'Увеличивает скорость передвижения на 50% на время действия'),
('wind_summoning_talisman', 'special', 'Позволяет совершать прыжки на увеличенные расстояния'),

('thunder_strike_talisman', 'combat', 'При активации вызывает молнию, наносящую 500 единиц урона молнией всем противникам в радиусе 8 метров'),
('thunder_strike_talisman', 'special', 'Имеет 30% шанс оглушить противников на 3 секунды'),
('thunder_strike_talisman', 'advanced', 'При убийстве противника талисманом восстанавливает 10% максимальной духовной энергии'),

('spirit_shield_talisman', 'combat', 'При активации создает непроницаемый барьер, блокирующий любой входящий урон'),
('spirit_shield_talisman', 'special', 'Барьер также защищает всех союзников в радиусе 5 метров'),
('spirit_shield_talisman', 'advanced', 'При разрушении барьера (после поглощения 2000 единиц урона) высвобождает духовную энергию, отбрасывая всех противников'),

-- Эффекты аксессуаров  
('spirit_enhancement_ring', 'stats', 'Увеличивает интеллект на 8 и восприятие на 5'),
('spirit_enhancement_ring', 'cultivation', 'Увеличивает максимум духовной энергии на 100 и регенерацию на 15'),
('spirit_enhancement_ring', 'special', 'Увеличивает эффективность духовных техник на 15%'),

('five_element_amulet', 'stats', 'Увеличивает интеллект на 15, восприятие на 10 и дух на 10'),
('five_element_amulet', 'combat', 'Увеличивает магическую защиту на 60 и магический урон на 30'),
('five_element_amulet', 'special', 'Снижает урон от элементальных атак на 30%'),
('five_element_amulet', 'special', 'Увеличивает урон от элементальных атак владельца на 20%'),

('spirit_storage_bracelet', 'stats', 'Увеличивает интеллект на 20 и ловкость на 15'),
('spirit_storage_bracelet', 'cultivation', 'Увеличивает регенерацию духовной энергии на 10'),
('spirit_storage_bracelet', 'special', 'Обеспечивает дополнительное пространство инвентаря объемом 50 слотов'),
('spirit_storage_bracelet', 'special', 'Позволяет мгновенно доставать предметы из хранилища во время боя без потери времени'),

('nine_dragon_crown', 'stats', 'Увеличивает интеллект на 40, восприятие на 35, дух на 30 и удачу на 20'),
('nine_dragon_crown', 'combat', 'Увеличивает магический урон на 100, магическую защиту на 80, шанс крита на 15% и урон от крита на 100%'),
('nine_dragon_crown', 'cultivation', 'Увеличивает максимум духовной энергии на 300, регенерацию на 25, скорость понимания на 30% и шанс прорыва на 20%'),
('nine_dragon_crown', 'special', 'Каждый дракон даёт уникальное благословение, которое усиливается при использовании соответствующей стихии'),
('nine_dragon_crown', 'special', 'Позволяет видеть скрытые духовные сущности, потоки энергии и определять уровень силы других культиваторов'),
('nine_dragon_crown', 'special', 'Значительно повышает удачу владельца, увеличивая шансы на редкие находки и благоприятные события');

-- Заполнение таблицы свойств алхимических предметов
INSERT INTO alchemy_item_properties (item_id, property_name, property_value) VALUES
-- Свойства пилюль
('qi_gathering_pill', 'duration', 3600),
('qi_gathering_pill', 'cooldown', 1800),

('body_strengthening_pill', 'duration', 1800),
('body_strengthening_pill', 'cooldown', 3600),

('meridian_clearing_pill', 'duration', 7200),
('meridian_clearing_pill', 'cooldown', 14400),

('spirit_concentration_pill', 'duration', 3600),
('spirit_concentration_pill', 'cooldown', 21600),

('core_formation_pill', 'duration', 14400),
('core_formation_pill', 'cooldown', 86400),

('soul_enlightenment_pill', 'duration', 21600),
('soul_enlightenment_pill', 'cooldown', 604800),

-- Свойства талисманов
('reflection_talisman', 'duration', 120),
('reflection_talisman', 'cooldown', 300),
('reflection_talisman', 'charges', 1),

('fire_bird_talisman', 'duration', 10),
('fire_bird_talisman', 'cooldown', 600),
('fire_bird_talisman', 'charges', 1),

('stone_skin_talisman', 'duration', 180),
('stone_skin_talisman', 'cooldown', 1800),
('stone_skin_talisman', 'charges', 1),

('wind_summoning_talisman', 'duration', 120),
('wind_summoning_talisman', 'cooldown', 1200),
('wind_summoning_talisman', 'charges', 1),

('thunder_strike_talisman', 'duration', 1),
('thunder_strike_talisman', 'cooldown', 3600),
('thunder_strike_talisman', 'charges', 1),

('spirit_shield_talisman', 'duration', 300),
('spirit_shield_talisman', 'cooldown', 86400),
('spirit_shield_talisman', 'charges', 1);

-- Заполнение таблицы статистик алхимических предметов для оружия и брони
INSERT INTO alchemy_item_stats (item_id, category, stat_name, stat_value) VALUES
-- Статистики для оружия
('spirit_dagger', 'stats', 'strength', 5),
('spirit_dagger', 'stats', 'dexterity', 10),
('spirit_dagger', 'combat', 'physicalDamage', 30),
('spirit_dagger', 'combat', 'magicDamage', 20),
('spirit_dagger', 'combat', 'critChance', 10),
('spirit_dagger', 'combat', 'critDamage', 50),

('five_element_sword', 'stats', 'strength', 15),
('five_element_sword', 'stats', 'dexterity', 10),
('five_element_sword', 'stats', 'intelligence', 20),
('five_element_sword', 'combat', 'physicalDamage', 60),
('five_element_sword', 'combat', 'magicDamage', 80),
('five_element_sword', 'combat', 'critChance', 8),
('five_element_sword', 'combat', 'critDamage', 70),

('spirit_attraction_staff', 'stats', 'intelligence', 35),
('spirit_attraction_staff', 'stats', 'perception', 25),
('spirit_attraction_staff', 'stats', 'spirit', 20),
('spirit_attraction_staff', 'combat', 'physicalDamage', 40),
('spirit_attraction_staff', 'combat', 'magicDamage', 150),
('spirit_attraction_staff', 'combat', 'critChance', 12),
('spirit_attraction_staff', 'combat', 'critDamage', 90),
('spirit_attraction_staff', 'cultivation', 'energyMax', 200),
('spirit_attraction_staff', 'cultivation', 'energyRegen', 20),
('spirit_attraction_staff', 'cultivation', 'comprehensionRate', 15),

('heaven_cleaving_sword', 'stats', 'strength', 50),
('heaven_cleaving_sword', 'stats', 'dexterity', 30),
('heaven_cleaving_sword', 'stats', 'intelligence', 40),
('heaven_cleaving_sword', 'stats', 'perception', 35),
('heaven_cleaving_sword', 'combat', 'physicalDamage', 200),
('heaven_cleaving_sword', 'combat', 'magicDamage', 200),
('heaven_cleaving_sword', 'combat', 'critChance', 20),
('heaven_cleaving_sword', 'combat', 'critDamage', 150),
('heaven_cleaving_sword', 'combat', 'dodgeChance', 10),
('heaven_cleaving_sword', 'cultivation', 'energyMax', 500),
('heaven_cleaving_sword', 'cultivation', 'energyRegen', 50),
('heaven_cleaving_sword', 'cultivation', 'breakthroughChance', 10),

-- Статистики для брони
('basic_spirit_robes', 'stats', 'vitality', 10),
('basic_spirit_robes', 'stats', 'intelligence', 5),
('basic_spirit_robes', 'combat', 'physicalDefense', 30),
('basic_spirit_robes', 'combat', 'magicDefense', 40),
('basic_spirit_robes', 'cultivation', 'energyMax', 50),

('water_flow_armor', 'stats', 'vitality', 20),
('water_flow_armor', 'stats', 'dexterity', 15),
('water_flow_armor', 'stats', 'intelligence', 10),
('water_flow_armor', 'combat', 'physicalDefense', 70),
('water_flow_armor', 'combat', 'magicDefense', 90),
('water_flow_armor', 'combat', 'dodgeChance', 15),

('golden_core_armor', 'stats', 'strength', 20),
('golden_core_armor', 'stats', 'vitality', 40),
('golden_core_armor', 'stats', 'intelligence', 15),
('golden_core_armor', 'combat', 'physicalDefense', 150),
('golden_core_armor', 'combat', 'magicDefense', 120),
('golden_core_armor', 'combat', 'physicalDamage', 30),
('golden_core_armor', 'cultivation', 'energyMax', 200),
('golden_core_armor', 'cultivation', 'energyRegen', 10),

('immortal_robes', 'stats', 'strength', 30),
('immortal_robes', 'stats', 'vitality', 50),
('immortal_robes', 'stats', 'intelligence', 40),
('immortal_robes', 'stats', 'perception', 30),
('immortal_robes', 'stats', 'spirit', 50),
('immortal_robes', 'combat', 'physicalDefense', 200),
('immortal_robes', 'combat', 'magicDefense', 250),
('immortal_robes', 'combat', 'dodgeChance', 20),
('immortal_robes', 'cultivation', 'energyMax', 500),
('immortal_robes', 'cultivation', 'energyRegen', 30),
('immortal_robes', 'cultivation', 'comprehensionRate', 20),
('immortal_robes', 'cultivation', 'breakthroughChance', 15);
