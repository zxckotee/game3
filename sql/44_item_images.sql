-- Удаляем старую таблицу, если она существует, чтобы избежать конфликтов типов
DROP TABLE IF EXISTS item_images;
/* SELECT ic_.item_id, ic_.name, ic_.description, ic_.rarity, ic_.type FROM item_catalog ic_ WHERE NOT EXISTS ( SELE
CT ic.item_id, ic.name, ic.description, ic.rarity, ic.type FROM item_catalog ic JOIN item_images ii ON ic_.item_id = ii.
item_id );  ---> для быстрой проверки. Нейронка, не стирай */
-- Создаем таблицу для хранения URL изображений предметов
-- item_id должен быть текстовым, чтобы соответствовать item_catalog.item_id
CREATE TABLE IF NOT EXISTS item_images (
    item_id VARCHAR(255) PRIMARY KEY, -- Текстовый ID предмета, соответствует item_catalog
    image_url TEXT NOT NULL,          -- URL изображения, не может быть пустым
    FOREIGN KEY (item_id) REFERENCES item_catalog(item_id) ON DELETE CASCADE -- Связь с каталогом предметов
);

-- Наполняем таблицу данными для созданных иконок
-- Пути теперь являются URL-адресами, доступными через сервер

-- Добавляем записи для оружия
INSERT INTO item_images (item_id, image_url) VALUES
('bronze_sword', '/assets/images/items/bronze_sword.png'),
('iron_sword', '/assets/images/items/iron_sword.png'),
('spirit_dagger', '/assets/images/items/spirit_dagger.png'),
('eastern_wind_blade', '/assets/images/items/eastern_wind_blade.png'),
('five_element_sword', '/assets/images/items/five_element_sword.png'),
('spirit_attraction_staff', '/assets/images/items/spirit_attraction_staff.png'),
('azure_dragon_sword', '/assets/images/items/azure_dragon_sword.png'),
('pvp_reward_5', '/assets/images/items/pvp_reward_5.png'),
('heaven_cleaving_sword', '/assets/images/items/heaven_cleaving_sword.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;


-- Добавляем записи для брони
INSERT INTO item_images (item_id, image_url) VALUES
('basic_spirit_robes', '/assets/images/items/basic_spirit_robes.png'),
('water_flow_armor', '/assets/images/items/water_flow_armor.png'),
('golden_core_armor', '/assets/images/items/golden_core_armor.png'),
('immortal_robes', '/assets/images/items/immortal_robes.png'),
('cloth_robe', '/assets/images/items/cloth_robe.png'),
('leather_armor', '/assets/images/items/leather_armor.png'),
('mountain_guardian_armor', '/assets/images/items/mountain_guardian_armor.png'),
('azure_dragon_robe', '/assets/images/items/azure_dragon_robe.png'),
('leather_cap', '/assets/images/items/leather_cap.png'),
('perception_circlet', '/assets/images/items/perception_circlet.png'),
('cloth_gloves', '/assets/images/items/cloth_gloves.png'),
('iron_gauntlets', '/assets/images/items/iron_gauntlets.png'),
('spirit_channeling_gloves', '/assets/images/items/spirit_channeling_gloves.png'),
('cloth_shoes', '/assets/images/items/cloth_shoes.png'),
('swift_wind_boots', '/assets/images/items/swift_wind_boots.png'),
('pvp_reward_6', '/assets/images/items/pvp_reward_6.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- Книги
INSERT INTO item_images (item_id, image_url) VALUES
('secret_techniques_book', '/assets/images/items/secret_techniques_book.png'),
('basic_techniques_book', '/assets/images/items/basic_techniques_book.png'),
('advanced_techniques_book', '/assets/images/items/advanced_techniques_book.png'),
('basic_cultivation_manual', '/assets/images/items/basic_cultivation_manual.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- Расходуемые предметы (пилюли/зелья)
INSERT INTO item_images (item_id, image_url) VALUES
('soul_enlightenment_pill', '/assets/images/items/soul_enlightenment_pill.png'),
('qi_gathering_pill', '/assets/images/items/qi_gathering_pill.png'),
('core_formation_pill', '/assets/images/items/core_formation_pill.png'),
('spirit_concentration_pill', '/assets/images/items/spirit_concentration_pill.png'),
('body_strengthening_pill', '/assets/images/items/body_strengthening_pill.png'),
('meridian_clearing_pill', '/assets/images/items/meridian_clearing_pill.png'),
('pvp_reward_7', '/assets/images/items/pvp_reward_7.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- Аксессуары
INSERT INTO item_images (item_id, image_url) VALUES
('spirit_storage_bracelet', '/assets/images/items/spirit_storage_bracelet.png'),
('azure_dragon_scale_pendant', '/assets/images/items/azure_dragon_scale_pendant.png'),
('nine_dragon_crown', '/assets/images/items/nine_dragon_crown.png'),
('celestial_perception_ring', '/assets/images/items/celestial_perception_ring.png'),
('spirit_enhancement_ring', '/assets/images/items/spirit_enhancement_ring.png'),
('five_element_amulet', '/assets/images/items/five_element_amulet.png'),
('pvp_reward_8', '/assets/images/items/pvp_reward_8.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;


-- Талисманы
INSERT INTO item_images (item_id, image_url) VALUES
('protection_talisman', '/assets/images/items/protection_talisman.png'),
('five_elements_talisman', '/assets/images/items/five_elements_talisman.png'),
('fire_talisman', '/assets/images/items/fire_talisman.png'),
('water_talisman', '/assets/images/items/water_talisman.png'),
('spirit_sight_talisman', '/assets/images/items/spirit_sight_talisman.png'),
('reflection_talisman', '/assets/images/items/reflection_talisman.png'),
('fire_bird_talisman', '/assets/images/items/fire_bird_talisman.png'),
('stone_skin_talisman', '/assets/images/items/stone_skin_talisman.png'),
('wind_summoning_talisman', '/assets/images/items/wind_summoning_talisman.png'),
('thunder_strike_talisman', '/assets/images/items/thunder_strike_talisman.png'),
('spirit_shield_talisman', '/assets/images/items/spirit_shield_talisman.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- Ресурсы: Травы
INSERT INTO item_images (item_id, image_url) VALUES
('herb_qigathering', '/assets/images/items/herb_qigathering.png'),
('herb_ironroot', '/assets/images/items/herb_ironroot.png'),
('herb_clearflow', '/assets/images/items/herb_clearflow.png'),
('herb_spiritbloom', '/assets/images/items/herb_spiritbloom.png'),
('herb_goldensage', '/assets/images/items/herb_goldensage.png'),
('herb_soulwhisper', '/assets/images/items/herb_soulwhisper.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- Ресурсы: Вода и Эссенции
INSERT INTO item_images (item_id, image_url) VALUES
('water_spirit', '/assets/images/items/water_spirit.png'),
('water_pure', '/assets/images/items/water_pure.png'),
('essence_concentration', '/assets/images/items/essence_concentration.png'),
('essence_purity', '/assets/images/items/essence_purity.png'),
('essence_enlightenment', '/assets/images/items/essence_enlightenment.png'),
('essence_reflection', '/assets/images/items/essence_reflection.png'),
('essence_heaven', '/assets/images/items/essence_heaven.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- Ресурсы: Минералы и Кристаллы
INSERT INTO item_images (item_id, image_url) VALUES
('mineral_dust', '/assets/images/items/mineral_dust.png'),
('mineral_iron', '/assets/images/items/mineral_iron.png'),
('crystal_clear', '/assets/images/items/crystal_clear.png'),
('crystal_mind', '/assets/images/items/crystal_mind.png'),
('crystal_formation', '/assets/images/items/crystal_formation.png'),
('crystal_soul', '/assets/images/items/crystal_soul.png'),
('crystal_star', '/assets/images/items/crystal_star.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- Ресурсы: Металлы и Особые Материалы
INSERT INTO item_images (item_id, image_url) VALUES
('metal_celestial', '/assets/images/items/metal_celestial.png'),
('metal_heavenly', '/assets/images/items/metal_heavenly.png'),
('paper_talisman', '/assets/images/items/paper_talisman.png'),
('ink_basic', '/assets/images/items/ink_basic.png'),
('ink_fire', '/assets/images/items/ink_fire.png'),
('feather_phoenix', '/assets/images/items/feather_phoenix.png'),
('beast_bone', '/assets/images/items/beast_bone.png'),
('dust_stardust', '/assets/images/items/dust_stardust.png'),
('spirit_ancient', '/assets/images/items/spirit_ancient.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- Корм для питомцев
INSERT INTO item_images (item_id, image_url) VALUES
('basic_pet_food', '/assets/images/items/basic_pet_food.png'),
('improved_pet_food', '/assets/images/items/improved_pet_food.png'),
('deluxe_pet_food', '/assets/images/items/deluxe_pet_food.png')
ON CONFLICT (item_id) DO UPDATE SET image_url = EXCLUDED.image_url;