-- Главный SQL скрипт для создания и заполнения игровой базы данных
-- Использует PostgreSQL синтаксис
-- Этот файл импортирует все остальные SQL файлы в правильном порядке с учетом зависимостей
-- Последнее обновление: 27.05.2025

-- Создание базы данных (раскомментируйте, если нужно создать новую базу)
-- CREATE DATABASE game_db;
-- \c game_db;

-- Установка кодировки
\encoding UTF8

\i sql/00_reference_tables.sql

\i sql/08_users.sql
\i sql/11_cultivation_progress.sql
\i sql/12_character_stats.sql
\i sql/02_merchants.sql
\i sql/30_item_catalog.sql

-- 2. Создание таблицы quest_progress до создания триггера в quests
\i sql/22_quest_progress.sql

-- 3. Затем основные сущности по порядку зависимостей
\i sql/10_spirit_pets.sql
\i sql/11_spirit_pets_user_relations.sql
\i sql/13_inventory_items.sql
\i sql/00_1_update_item_types.sql
\i sql/01_quests.sql
\i sql/02_merchants.sql
\i sql/03_enemies.sql
\i sql/04_techniques.sql
\i sql/05_resources.sql
\i sql/06_alchemy_items.sql
\i sql/24_alchemy_tables.sql 
\i sql/implement_alchemy_system.sql

\i sql/06_alchemy_ingredients.sql
\i sql/25_alchemy_data.sql
\i sql/07_equipment_items.sql


-- 5. Дополнительные сущности
\i sql/14_sects.sql
\i sql/15_groups.sql
\i sql/16_reputation.sql
\i sql/17_achievements.sql
\i sql/18_learned_techniques.sql
\i sql/19_market.sql
\i sql/20_weather.sql
\i sql/21_enemies.sql
\i sql/23_character_profile.sql
\i sql/23_migrate_character_profiles.sql

-- 6. Алхимическая система

\i sql/26_user_item_cooldowns.sql
\i sql/27_active_player_effects.sql
\i sql/28_alchemy_effect_details_data.sql

-- 8. Функции для работы с торговцами
\i sql/fix_merchant_functions.sql

-- 9. PVP система
\i sql/40_pvp_system.sql
\i sql/41_pvp_effects.sql
\i sql/42_pvp_player_stats.sql
\i sql/43_pvp_damage_tracking.sql

-- 10. Дополнительные функциональные скрипты
\i sql/update_merchant_inventory_templates.sql

\i sql/44_item_images.sql  -- картинки к предметам 
\i sql/50_combats.sql
\i sql/51_benefits.sql




