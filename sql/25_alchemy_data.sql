-- SQL скрипт для заполнения таблиц алхимии данными
-- Использует PostgreSQL синтаксис
\encoding UTF8

-- Вставка рецептов алхимии
INSERT INTO alchemy_recipes (name, description, type, rarity, required_level, required_stage, success_rate) VALUES
-- Пилюли
('Рецепт зелья сбора ци', 'Базовый рецепт для создания зелья, помогающего собирать ци', 'pill', 'common', 1, 'Закалка тела', 90),
('Рецепт зелья укрепления тела', 'Рецепт для создания зелья, укрепляющего физическое тело', 'pill', 'uncommon', 10, 'Закалка тела', 75),
('Рецепт зелья очищения меридианов', 'Рецепт для создания зелья, очищающего и расширяющего меридианы', 'pill', 'uncommon', 15, 'Закалка тела', 70),
('Рецепт пилюли концентрации духа', 'Рецепт для создания пилюли, улучшающей контроль над духовной энергией', 'pill', 'rare', 25, 'Очищение Ци', 60),
('Рецепт пилюли формирования ядра', 'Рецепт для создания пилюли, способствующей формированию золотого ядра', 'pill', 'epic', 40, 'Очищение Ци', 40),
('Рецепт пилюли просветления души', 'Рецепт для создания пилюли, усиливающей духовное восприятие', 'pill', 'legendary', 60, 'Золотое ядро', 20),

-- Талисманы
('Рецепт талисмана отражения', 'Рецепт для создания защитного талисмана, отражающего слабые атаки', 'talisman', 'common', 5, 'Закалка тела', 85),
('Рецепт талисмана огненной птицы', 'Рецепт для создания атакующего талисмана огненной стихии', 'talisman', 'uncommon', 15, 'Закалка тела', 75),
('Рецепт талисмана каменной кожи', 'Рецепт для создания защитного талисмана земляной стихии', 'talisman', 'rare', 30, 'Очищение Ци', 65),
('Рецепт талисмана призыва ветра', 'Рецепт для создания талисмана воздушной стихии', 'talisman', 'rare', 35, 'Очищение Ци', 60),
('Рецепт талисмана громового удара', 'Рецепт для создания атакующего талисмана молнии', 'talisman', 'epic', 45, 'Очищение Ци', 50),
('Рецепт талисмана духовной защиты', 'Рецепт для создания мощного защитного талисмана', 'talisman', 'legendary', 70, 'Золотое ядро', 30),
 
-- Оружие
('Рецепт духовного кинжала', 'Рецепт для создания оружия, поражающего как физические, так и духовные тела', 'weapon', 'uncommon', 20, 'Закалка тела', 70),
('Рецепт меча пяти элементов', 'Рецепт для создания меча, проводящего энергию пяти элементов', 'weapon', 'rare', 40, 'Очищение Ци', 55),
('Рецепт посоха духовного притяжения', 'Рецепт для создания оружия для манипуляции духовной энергией', 'weapon', 'epic', 60, 'Золотое ядро', 45),
('Рецепт меча рассекающего небеса', 'Рецепт для создания легендарного меча необычайной силы', 'weapon', 'legendary', 80, 'Формирование души', 20),

-- Броня
('Рецепт духовных одежд начального уровня', 'Рецепт для создания базовой защитной одежды', 'armor', 'uncommon', 20, 'Закалка тела', 75),
('Рецепт брони водного потока', 'Рецепт для создания легкой гибкой брони', 'armor', 'rare', 40, 'Очищение Ци', 60),
('Рецепт доспеха золотого ядра', 'Рецепт для создания тяжелой брони с высокой защитой', 'armor', 'epic', 60, 'Золотое ядро', 40),
('Рецепт одеяния бессмертного', 'Рецепт для создания легендарного защитного одеяния', 'armor', 'legendary', 80, 'Формирование души', 25),

-- Аксессуары
('Рецепт кольца духовного усиления', 'Рецепт для создания кольца, усиливающего контроль над духовной энергией', 'accessory', 'uncommon', 30, 'Очищение Ци', 65),
('Рецепт амулета пяти элементов', 'Рецепт для создания амулета, усиливающего стихийный контроль', 'accessory', 'rare', 50, 'Золотое ядро', 50),
('Рецепт браслета духовного хранилища', 'Рецепт для создания пространственного браслета', 'accessory', 'epic', 70, 'Золотое ядро', 35),
('Рецепт короны девяти драконов', 'Рецепт для создания легендарного головного убора', 'accessory', 'legendary', 90, 'Формирование души', 15);

-- Вставка ингредиентов для рецептов
INSERT INTO recipe_ingredients (recipe_id, item_id, quantity) VALUES
-- Ингредиенты для пилюли сбора ци (id: 1)
(1, 'herb_qigathering', 2),
(1, 'water_spirit', 1),
(1, 'mineral_dust', 1),

-- Ингредиенты для пилюли укрепления тела (id: 2)
(2, 'herb_ironroot', 3),
(2, 'beast_bone', 1),
(2, 'mineral_iron', 2),

-- Ингредиенты для пилюли очищения меридианов (id: 3)
(3, 'herb_clearflow', 2),
(3, 'water_pure', 3),
(3, 'crystal_clear', 1),

-- Ингредиенты для пилюли концентрации духа (id: 4)
(4, 'herb_spiritbloom', 3),
(4, 'essence_concentration', 1),
(4, 'crystal_mind', 2),

-- Ингредиенты для пилюли формирования ядра (id: 5)
(5, 'herb_goldensage', 4),
(5, 'essence_purity', 2),
(5, 'crystal_formation', 1),
(5, 'metal_celestial', 1),

-- Ингредиенты для пилюли просветления души (id: 6)
(6, 'herb_soulwhisper', 5),
(6, 'essence_enlightenment', 3),
(6, 'crystal_soul', 2),
(6, 'dust_stardust', 2),

-- Ингредиенты для талисмана отражения (id: 7)
(7, 'paper_talisman', 2),
(7, 'ink_basic', 1),
(7, 'essence_reflection', 1),

-- Ингредиенты для талисмана огненной птицы (id: 8)
(8, 'paper_talisman', 2),
(8, 'ink_fire', 2),
(8, 'feather_phoenix', 1),

-- Ингредиенты для меча рассекающего небеса (id: 16)
(16, 'metal_heavenly', 5),
(16, 'essence_heaven', 3),
(16, 'crystal_star', 3),
(16, 'spirit_ancient', 1);

-- Вставка ингредиентов для рецептов, которые их не имеют
INSERT INTO recipe_ingredients (recipe_id, item_id, quantity) VALUES
-- Талисман каменной кожи (id: 9)
(9, 'paper_talisman', 2),
(9, 'ink_basic', 2),
(9, 'mineral_iron', 3),
(9, 'crystal_clear', 1),

-- Талисман призыва ветра (id: 10)
(10, 'paper_talisman', 2),
(10, 'ink_basic', 2),
(10, 'essence_concentration', 1),
(10, 'crystal_clear', 2),

-- Талисман громового удара (id: 11)
(11, 'paper_talisman', 3),
(11, 'ink_basic', 3),
(11, 'crystal_mind', 1),
(11, 'essence_purity', 1),

-- Талисман духовной защиты (id: 12)
(12, 'paper_talisman', 4),
(12, 'ink_basic', 4),
(12, 'crystal_soul', 1),
(12, 'essence_enlightenment', 1),
(12, 'dust_stardust', 1),

-- Духовный кинжал (id: 13)
(13, 'metal_celestial', 1),
(13, 'mineral_iron', 3),
(13, 'essence_concentration', 1),
(13, 'beast_bone', 2),

-- Меч пяти элементов (id: 14)
(14, 'metal_celestial', 2),
(14, 'crystal_mind', 2),
(14, 'essence_purity', 1),
(14, 'herb_spiritbloom', 3),

-- Посох духовного притяжения (id: 15)
(15, 'metal_celestial', 3),
(15, 'crystal_formation', 2),
(15, 'herb_goldensage', 3),
(15, 'essence_purity', 2),

-- Духовные одежды начального уровня (id: 17)
(17, 'herb_ironroot', 4),
(17, 'water_pure', 3),
(17, 'beast_bone', 2),
(17, 'mineral_iron', 1),

-- Броня водного потока (id: 18)
(18, 'herb_clearflow', 4),
(18, 'water_pure', 5),
(18, 'crystal_clear', 2),
(18, 'essence_concentration', 1),

-- Доспех золотого ядра (id: 19)
(19, 'metal_celestial', 3),
(19, 'herb_goldensage', 3),
(19, 'crystal_formation', 2),
(19, 'essence_purity', 2),

-- Одеяние бессмертного (id: 20)
(20, 'herb_soulwhisper', 4),
(20, 'crystal_soul', 2),
(20, 'dust_stardust', 2),
(20, 'essence_heaven', 1),
(20, 'spirit_ancient', 1),

-- Кольцо духовного усиления (id: 21)
(21, 'metal_celestial', 1),
(21, 'herb_spiritbloom', 2),
(21, 'crystal_mind', 1),
(21, 'essence_concentration', 2),

-- Амулет пяти элементов (id: 22)
(22, 'metal_celestial', 2),
(22, 'crystal_formation', 1),
(22, 'herb_goldensage', 3),
(22, 'essence_purity', 2),

-- Браслет духовного хранилища (id: 23)
(23, 'metal_celestial', 3),
(23, 'crystal_soul', 1),
(23, 'herb_soulwhisper', 2),
(23, 'essence_enlightenment', 2),

-- Корона девяти драконов (id: 24)
(24, 'metal_heavenly', 3),
(24, 'crystal_star', 2),
(24, 'herb_soulwhisper', 5),
(24, 'essence_heaven', 2),
(24, 'spirit_ancient', 1);



-- Вставка результатов рецептов
INSERT INTO alchemy_results (recipe_id, item_id, quantity) VALUES
(1, 'qi_gathering_pill', 1),
(2, 'body_strengthening_pill', 1),
(3, 'meridian_clearing_pill', 1),
(4, 'spirit_concentration_pill', 1),
(5, 'core_formation_pill', 1),
(6, 'soul_enlightenment_pill', 1),
(7, 'reflection_talisman', 1),
(8, 'fire_bird_talisman', 1),
(9, 'stone_skin_talisman', 1),
(10, 'wind_summoning_talisman', 1),
(11, 'thunder_strike_talisman', 1),
(12, 'spirit_shield_talisman', 1),
(13, 'spirit_dagger', 1),
(14, 'five_element_sword', 1),
(15, 'spirit_attraction_staff', 1),
(16, 'heaven_cleaving_sword', 1),
(17, 'basic_spirit_robes', 1),
(18, 'water_flow_armor', 1),
(19, 'golden_core_armor', 1),
(20, 'immortal_robes', 1),
(21, 'spirit_enhancement_ring', 1),
(22, 'five_element_amulet', 1),
(23, 'spirit_storage_bracelet', 1),
(24, 'nine_dragon_crown', 1);