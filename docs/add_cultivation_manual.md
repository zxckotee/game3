# SQL-запросы для добавления базовых предметов

## Добавление "Базового руководства по культивизации" в item_catalog

```sql
-- Добавление "Базового руководства по культивизации" напрямую в item_catalog
INSERT INTO item_catalog (item_id, name, type, rarity, description, price, source_table)
VALUES ('basic_cultivation_manual', 'Базовое руководство по культивации', 'book', 'common', 
'Простое руководство для начинающих культиваторов.', 50, 'merchant_inventory_templates');
```

## Проверка наличия "Пилюли сбора ци" в alchemy_items

```sql
-- Проверка существования пилюли сбора ци в таблице alchemy_items
SELECT * FROM alchemy_items WHERE id = 'qi_gathering_pill';

-- Если запись не существует, выполнить вставку
INSERT INTO alchemy_items (id, name, type, rarity, description, value)
SELECT 'qi_gathering_pill', 'Пилюля сбора ци', 'pill', 'common', 
'Базовая пилюля, помогающая собирать и очищать ци. Ускоряет культивацию на начальных этапах.', 100
WHERE NOT EXISTS (SELECT 1 FROM alchemy_items WHERE id = 'qi_gathering_pill');
```

## Добавление эффектов для "Пилюли сбора ци" (если они отсутствуют)

```sql
-- Добавление эффектов для пилюли сбора ци
INSERT INTO alchemy_item_effects (item_id, effect_type, description)
SELECT 'qi_gathering_pill', 'instant', 'Восстанавливает 30 единиц духовной энергии'
WHERE NOT EXISTS (SELECT 1 FROM alchemy_item_effects WHERE item_id = 'qi_gathering_pill' AND effect_type = 'instant');

INSERT INTO alchemy_item_effects (item_id, effect_type, description)
SELECT 'qi_gathering_pill', 'cultivation', 'Увеличивает скорость культивации на 10% на 1 час'
WHERE NOT EXISTS (SELECT 1 FROM alchemy_item_effects WHERE item_id = 'qi_gathering_pill' AND effect_type = 'cultivation');

INSERT INTO alchemy_item_effects (item_id, effect_type, description)
SELECT 'qi_gathering_pill', 'stats', 'Временно повышает контроль над ци на 5%'
WHERE NOT EXISTS (SELECT 1 FROM alchemy_item_effects WHERE item_id = 'qi_gathering_pill' AND effect_type = 'stats');
```

## Добавление свойств для "Пилюли сбора ци" (если они отсутствуют)

```sql
-- Добавление свойств для пилюли сбора ци
INSERT INTO alchemy_item_properties (item_id, property_name, property_value)
SELECT 'qi_gathering_pill', 'duration', 3600
WHERE NOT EXISTS (SELECT 1 FROM alchemy_item_properties WHERE item_id = 'qi_gathering_pill' AND property_name = 'duration');

INSERT INTO alchemy_item_properties (item_id, property_name, property_value)
SELECT 'qi_gathering_pill', 'cooldown', 1800
WHERE NOT EXISTS (SELECT 1 FROM alchemy_item_properties WHERE item_id = 'qi_gathering_pill' AND property_name = 'cooldown');