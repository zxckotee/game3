-- SQL скрипт для создания таблицы alchemy_effect_details и наполнения ее данными
-- Версия 4 структуры таблицы
\encoding UTF8

DROP TABLE IF EXISTS alchemy_effect_details CASCADE;

CREATE TABLE alchemy_effect_details (
    id SERIAL PRIMARY KEY,
    effect_id INTEGER NOT NULL REFERENCES alchemy_item_effects(id) ON DELETE CASCADE,
    target_attribute VARCHAR(50) NOT NULL,
    value INTEGER NOT NULL,
    value_type VARCHAR(20) NOT NULL DEFAULT 'absolute', -- 'absolute' или 'percentage'
    duration INTEGER NOT NULL, -- в секундах, 1 для моментальных
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_effect_target_attribute_type UNIQUE (effect_id, target_attribute, value_type) -- Уникальность для тройки
);

CREATE INDEX IF NOT EXISTS idx_alchemy_effect_details_effect_id ON alchemy_effect_details(effect_id);
CREATE INDEX IF NOT EXISTS idx_alchemy_effect_details_target_attribute ON alchemy_effect_details(target_attribute);
CREATE INDEX IF NOT EXISTS idx_alchemy_effect_details_value_type ON alchemy_effect_details(value_type);

-- Триггер для автоматического обновления поля updated_at
-- Убедитесь, что функция update_alchemy_updated_at_column или аналогичная (например, update_updated_at_column) существует в вашей БД.
-- Если она была создана в sql/06_alchemy_items.sql как update_alchemy_updated_at_column, используйте это имя.
-- Если она была создана в sql/24_alchemy_tables.sql как update_updated_at_column, используйте это имя.
-- Для консистентности, предполагаем что update_alchemy_updated_at_column более специфична и должна быть использована, если доступна.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_alchemy_updated_at_column') THEN
        EXECUTE 'CREATE TRIGGER trigger_update_alchemy_effect_details_updated_at
                 BEFORE UPDATE ON alchemy_effect_details
                 FOR EACH ROW
                 EXECUTE FUNCTION update_alchemy_updated_at_column();';
    ELSIF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        EXECUTE 'CREATE TRIGGER trigger_update_alchemy_effect_details_updated_at
                 BEFORE UPDATE ON alchemy_effect_details
                 FOR EACH ROW
                 EXECUTE FUNCTION update_updated_at_column();';
    ELSE
        RAISE NOTICE ''Функция триггера для updated_at не найдена. Пожалуйста, создайте update_alchemy_updated_at_column() или update_updated_at_column().'';
    END IF;
END $$;


COMMENT ON TABLE alchemy_effect_details IS 'Хранит числовые характеристики (value, value_type, duration) для каждого конкретного целевого атрибута и типа значения эффекта из alchemy_item_effects.';
COMMENT ON COLUMN alchemy_effect_details.target_attribute IS 'Описывает, на какой стат или аспект направлен данный value (например, health, strength, cultivation_speed).';
COMMENT ON COLUMN alchemy_effect_details.value_type IS 'Тип значения: "absolute" для абсолютных чисел, "percentage" для процентов.';
COMMENT ON COLUMN alchemy_effect_details.uq_effect_target_attribute_type IS 'Ограничение уникальности: для одного effect_id и одного target_attribute может быть не более одной записи с типом absolute и не более одной с типом percentage.';

-- Данные для alchemy_effect_details
-- effect_id соответствует предполагаемому SERIAL ID из alchemy_item_effects в файле 06_alchemy_items.sql

-- qi_gathering_pill (properties duration: 3600 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(1, 'spiritual_energy_restore', 30, 'absolute', 1),
(2, 'cultivation_speed_buff', 10, 'percentage', 3600), 
(3, 'qi_control_buff', 5, 'percentage', 3600);

-- body_strengthening_pill (properties duration: 1800 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(4, 'health_restore', 20, 'absolute', 1),
(5, 'strength_buff', 10, 'percentage', 1800), 
(5, 'stamina_buff', 15, 'percentage', 1800), 
(6, 'physical_defense_buff', 20, 'absolute', 1800);

-- meridian_clearing_pill (properties duration: 7200 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(7, 'spiritual_energy_restore', 40, 'absolute', 1),
(8, 'meditation_speed_buff', 25, 'percentage', 7200), 
(9, 'dispel_negative_circulation_effects', 1, 'absolute', 1);

-- spirit_concentration_pill (properties duration: 3600 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(10, 'spiritual_energy_restore', 80, 'absolute', 1),
(11, 'intelligence_buff', 15, 'percentage', 3600), 
(11, 'perception_buff', 20, 'percentage', 3600), 
(12, 'spiritual_defense_buff', 30, 'absolute', 3600), 
(13, 'technique_comprehension_buff', 20, 'percentage', 3600);

-- core_formation_pill (properties duration: 14400 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(14, 'spiritual_energy_restore', 150, 'absolute', 1),
(15, 'cultivation_speed_buff', 40, 'percentage', 14400), 
(16, 'breakthrough_chance_buff_next_attempt', 25, 'percentage', 1), 
(17, 'breakthrough_resource_cost_reduction', -20, 'percentage', 1);

-- soul_enlightenment_pill (properties duration: 21600 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(18, 'spiritual_energy_full_restore', 1, 'absolute', 1), 
(18, 'max_spiritual_energy_buff', 10, 'percentage', 21600), 
(19, 'cultivation_speed_buff', 80, 'percentage', 21600), 
(20, 'all_stats_buff', 20, 'percentage', 21600), 
(21, 'see_hidden_energies', 1, 'absolute', 21600), 
(22, 'guaranteed_breakthrough_next_attempt', 1, 'absolute', 1);

-- reflection_talisman (properties duration: 120 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(23, 'damage_reflection_shield_percent', 30, 'percentage', 120), 
(24, 'damage_absorption_cap_value', 100, 'absolute', 120);

-- fire_bird_talisman (properties duration: 10 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(25, 'fire_damage_direct', 200, 'absolute', 1),
(26, 'fire_damage_dot', 10, 'absolute', 10);

-- stone_skin_talisman (properties duration: 180 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(27, 'physical_defense_buff', 100, 'absolute', 180), 
(28, 'incoming_physical_damage_reduction_percent', 40, 'percentage', 180), 
(29, 'movement_speed_debuff_percent', -20, 'percentage', 180);

-- wind_summoning_talisman (properties duration: 120 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(30, 'knockback_distance_metres', 5, 'absolute', 1), 
(31, 'movement_speed_buff_percent', 50, 'percentage', 120), 
(32, 'enhanced_jump_active', 1, 'absolute', 120);

-- thunder_strike_talisman (properties duration: 1 из 06_alchemy_items.sql, но оглушение 3с)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(33, 'aoe_lightning_damage_value', 500, 'absolute', 1), 
(34, 'stun_chance_percent', 30, 'percentage', 3), 
(35, 'energy_restore_on_kill_percent', 10, 'percentage', 1);

-- spirit_shield_talisman (properties duration: 300 из 06_alchemy_items.sql)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(36, 'invulnerability_shield_active', 1, 'absolute', 300), 
(37, 'aoe_ally_shield_radius_metres', 5, 'absolute', 300), 
(38, 'shield_absorption_cap_then_knockback_value', 2000, 'absolute', 1);

-- spirit_enhancement_ring (пассивный, duration = 0)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(39, 'intelligence_buff', 8, 'absolute', 0),
(39, 'perception_buff', 5, 'absolute', 0),
(40, 'max_spiritual_energy_buff', 100, 'absolute', 0),
(40, 'spiritual_energy_regen_buff', 15, 'absolute', 0),
(41, 'spiritual_technique_effectiveness_buff_percent', 15, 'percentage', 0);

-- five_element_amulet (пассивный, duration = 0)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(42, 'intelligence_buff', 15, 'absolute', 0),
(42, 'perception_buff', 10, 'absolute', 0),
(42, 'spirit_buff', 10, 'absolute', 0),
(43, 'magic_defense_buff', 60, 'absolute', 0),
(43, 'magic_damage_buff', 30, 'absolute', 0),
(44, 'elemental_damage_reduction_percent', 30, 'percentage', 0), 
(45, 'elemental_damage_output_buff_percent', 20, 'percentage', 0);

-- spirit_storage_bracelet (пассивный, duration = 0)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(46, 'intelligence_buff', 20, 'absolute', 0),
(46, 'dexterity_buff', 15, 'absolute', 0),
(47, 'spiritual_energy_regen_buff', 10, 'absolute', 0),
(48, 'inventory_slots_increase', 50, 'absolute', 0),
(49, 'instant_item_access_in_combat_active', 1, 'absolute', 0);

-- nine_dragon_crown (пассивный, duration = 0)
INSERT INTO alchemy_effect_details (effect_id, target_attribute, value, value_type, duration) VALUES
(50, 'intelligence_buff', 40, 'absolute', 0),
(50, 'perception_buff', 35, 'absolute', 0),
(50, 'spirit_buff', 30, 'absolute', 0),
(50, 'luck_buff', 20, 'absolute', 0),
(51, 'magic_damage_buff', 100, 'absolute', 0),
(51, 'magic_defense_buff', 80, 'absolute', 0),
(51, 'crit_chance_buff_percent', 15, 'percentage', 0),
(51, 'crit_damage_buff_percent', 100, 'percentage', 0),
(52, 'max_spiritual_energy_buff', 300, 'absolute', 0),
(52, 'spiritual_energy_regen_buff', 25, 'absolute', 0),
(52, 'comprehension_rate_buff_percent', 30, 'percentage', 0),
(52, 'breakthrough_chance_buff_percent', 20, 'percentage', 0),
(53, 'dragon_blessing_system_active', 1, 'absolute', 0), 
(54, 'see_hidden_essences_and_power_levels_active', 1, 'absolute', 0), 
(55, 'significant_luck_increase_active', 1, 'absolute', 0);

RAISE NOTICE 'Таблица alchemy_effect_details создана и заполнена данными.';