-- Скрипт для обновления идентификаторов предметов в таблице merchant_inventory_templates
-- в соответствии с новыми строковыми идентификаторами из таблицы equipment_items

-- Изменение идентификаторов оружия
UPDATE merchant_inventory_templates
SET item_id = 'bronze_sword'
WHERE item_id = '1001' OR item_id = 'bronze_sword';

UPDATE merchant_inventory_templates
SET item_id = 'iron_sword'
WHERE item_id = '1002' OR item_id = 'iron_sword';

UPDATE merchant_inventory_templates
SET item_id = 'eastern_wind_blade'
WHERE item_id = '1003' OR item_id = 'east_wind_blade';

UPDATE merchant_inventory_templates
SET item_id = 'azure_dragon_sword'
WHERE item_id = '1004';

-- Изменение идентификаторов брони
UPDATE merchant_inventory_templates
SET item_id = 'cloth_robe'
WHERE item_id = '2001' OR item_id = 'linen_robe';

UPDATE merchant_inventory_templates
SET item_id = 'leather_armor'
WHERE item_id = '2002';

UPDATE merchant_inventory_templates
SET item_id = 'mountain_guardian_armor'
WHERE item_id = '2003' OR item_id = 'steel_breastplate';

UPDATE merchant_inventory_templates
SET item_id = 'azure_dragon_robe'
WHERE item_id = '2004' OR item_id = 'cultivator_silk_robe';

UPDATE merchant_inventory_templates
SET item_id = 'leather_cap'
WHERE item_id = '2005' OR item_id = 'leather_helmet';

UPDATE merchant_inventory_templates
SET item_id = 'perception_circlet'
WHERE item_id = '2007';

UPDATE merchant_inventory_templates
SET item_id = 'cloth_gloves'
WHERE item_id = '2008' OR item_id = 'leather_gloves';

UPDATE merchant_inventory_templates
SET item_id = 'iron_gauntlets'
WHERE item_id = '2009';

UPDATE merchant_inventory_templates
SET item_id = 'spirit_channeling_gloves'
WHERE item_id = '2010';

UPDATE merchant_inventory_templates
SET item_id = 'cloth_shoes'
WHERE item_id = '2011' OR item_id = 'leather_boots';

UPDATE merchant_inventory_templates
SET item_id = 'swift_wind_boots'
WHERE item_id = '2013';

-- Изменение идентификаторов аксессуаров
UPDATE merchant_inventory_templates
SET item_id = 'celestial_perception_ring'
WHERE item_id = '3003';

UPDATE merchant_inventory_templates
SET item_id = 'azure_dragon_scale_pendant'
WHERE item_id = '3004';

-- Изменение идентификаторов талисманов
UPDATE merchant_inventory_templates
SET item_id = 'fire_talisman'
WHERE item_id = '4001' OR item_id = 'fire_talisman';

UPDATE merchant_inventory_templates
SET item_id = 'water_talisman'
WHERE item_id = '4002' OR item_id = 'water_talisman';

UPDATE merchant_inventory_templates
SET item_id = 'protection_talisman'
WHERE item_id = '4003' OR item_id = 'protection_talisman';

UPDATE merchant_inventory_templates
SET item_id = 'spirit_sight_talisman'
WHERE item_id = '4004' OR item_id = 'spiritual_sight_talisman';

UPDATE merchant_inventory_templates
SET item_id = 'five_elements_talisman'
WHERE item_id = '4005';

-- Изменение идентификаторов пилюль
UPDATE merchant_inventory_templates
SET item_id = 'qi_gathering_pill'
WHERE item_id = '5001';

UPDATE merchant_inventory_templates
SET item_id = 'cleansing_pill'
WHERE item_id = '5002';

UPDATE merchant_inventory_templates
SET item_id = 'healing_pill'
WHERE item_id = '5003';

UPDATE merchant_inventory_templates
SET item_id = 'breakthrough_pill'
WHERE item_id = '5004';

UPDATE merchant_inventory_templates
SET item_id = 'mind_calming_pill'
WHERE item_id = '5005';

UPDATE merchant_inventory_templates
SET item_id = 'basic_cultivation_manual'
WHERE item_id = '5006';

-- Проверка результатов
SELECT item_id, item_type, name
FROM merchant_inventory_templates
ORDER BY merchant_id, item_type, item_id;

