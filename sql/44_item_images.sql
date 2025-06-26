-- Удаляем старую таблицу, если она существует, чтобы избежать конфликтов типов
DROP TABLE IF EXISTS item_images;

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