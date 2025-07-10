-- SQL скрипт для полного внедрения алхимической системы
-- Использует PostgreSQL синтаксис
\encoding UTF8

-- SQL скрипт для полного внедрения алхимической системы
-- Использует PostgreSQL синтаксис

-- 1. Обновление типов предметов (добавление типа 'ingredient')

-- 2. Добавление алхимических ингредиентов в таблицу alchemy_items


-- 3. Создание таблиц алхимической системы


-- 4. Заполнение таблиц алхимических рецептов


-- 5. Обновление торговцев для продажи алхимических ингредиентов

-- Это уже интегрировано в 02_merchants.sql, поэтому проверяем, существуют ли записи
DO $$
DECLARE
    ingredient_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ingredient_count FROM merchant_inventory_templates WHERE item_type = 'ingredient';
    
    IF ingredient_count = 0 THEN
        RAISE NOTICE 'Ингредиенты не найдены в таблице merchant_inventory_templates, выполняем обновление...';
        -- Выполняем запросы из 02_merchants.sql (только для ингредиентов)
        -- Удаляем устаревшие ингредиенты
        DELETE FROM merchant_inventory_templates 
        WHERE merchant_id = 1 AND item_type = 'resource' AND item_id IN (
            'common_herb_low', 'basic_herb', 'uncommon_herb', 'rare_herb',
            'low_quality_herb', 'medium_quality_herb', 'high_quality_herb',
            'water_essence', 'spirit_silk'
        );

        -- Добавляем алхимические ингредиенты - Травы
        INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
        (1, 'herb_qigathering', 'resource', 'Трава сбора ци', 'Базовая трава, способная собирать и сохранять ци из окружающей среды.', 25, 15, 15, 3, NOW(), NOW(), 'common'),
        (1, 'herb_ironroot', 'resource', 'Железный корень', 'Прочный корень растения, произрастающего на железосодержащих почвах.', 35, 10, 10, 2, NOW(), NOW(), 'common'),
        (1, 'herb_clearflow', 'resource', 'Кристальный цветок', 'Прозрачный цветок с тонкими лепестками, растущий возле чистых источников.', 60, 10, 10, 2, NOW(), NOW(), 'uncommon'),
        (1, 'herb_spiritbloom', 'resource', 'Духовный цвет', 'Редкое растение, цветущее только в местах с высокой концентрацией духовной энергии.', 120, 8, 8, 1, NOW(), NOW(), 'rare'),
        (1, 'herb_goldensage', 'resource', 'Золотой шалфей', 'Легендарное растение с листьями, содержащими частицы чистого золота.', 350, 5, 5, 0.5, NOW(), NOW(), 'epic'),
        (1, 'herb_soulwhisper', 'resource', 'Шепот души', 'Мистическое растение, видимое только просветленным культиваторам.', 1200, 2, 2, 0.2, NOW(), NOW(), 'legendary');

        -- Эссенции и жидкости
        INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
        (1, 'water_spirit', 'resource', 'Духовная вода', 'Вода, собранная в местах с высокой концентрацией природной энергии.', 20, 15, 15, 3, NOW(), NOW(), 'common'),
        (1, 'water_pure', 'resource', 'Очищенная вода', 'Вода, прошедшая специальный процесс очистки от всех примесей.', 50, 12, 12, 2, NOW(), NOW(), 'uncommon'),
        (1, 'essence_concentration', 'resource', 'Эссенция концентрации', 'Концентрированная эссенция, усиливающая ментальную фокусировку.', 140, 8, 8, 1, NOW(), NOW(), 'rare'),
        (1, 'essence_purity', 'resource', 'Эссенция чистоты', 'Редкая субстанция абсолютной чистоты, используемая в высокоуровневой алхимии.', 400, 5, 5, 0.5, NOW(), NOW(), 'epic'),
        (1, 'essence_enlightenment', 'resource', 'Эссенция просветления', 'Легендарная эссенция, содержащая частицы просветленного сознания.', 1400, 2, 2, 0.2, NOW(), NOW(), 'legendary'),
        (1, 'essence_reflection', 'resource', 'Эссенция отражения', 'Жидкая субстанция с зеркальной поверхностью, отражающая энергетические атаки.', 100, 8, 8, 1, NOW(), NOW(), 'uncommon'),
        (1, 'essence_heaven', 'resource', 'Эссенция небес', 'Капля чистой энергии небесной стихии.', 2500, 1, 1, 0.1, NOW(), NOW(), 'legendary');

        -- Минералы и металлы
        INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
        (1, 'mineral_dust', 'resource', 'Минеральная пыль', 'Смесь мелко измельченных минералов с остаточной энергией.', 15, 15, 15, 3, NOW(), NOW(), 'common'),
        (1, 'mineral_iron', 'resource', 'Духовное железо', 'Железная руда с высоким содержанием духовной энергии.', 30, 12, 12, 2, NOW(), NOW(), 'common'),
        (1, 'crystal_clear', 'resource', 'Чистый кристалл', 'Прозрачный кристалл, усиливающий естественные энергетические потоки.', 80, 10, 10, 1.5, NOW(), NOW(), 'uncommon'),
        (1, 'crystal_mind', 'resource', 'Кристалл разума', 'Кристалл, усиливающий ментальные способности культиватора.', 180, 8, 8, 1, NOW(), NOW(), 'rare'),
        (1, 'crystal_formation', 'resource', 'Кристалл формирования', 'Редкий кристалл, способствующий формированию стабильных энергетических структур.', 450, 5, 5, 0.5, NOW(), NOW(), 'epic'),
        (1, 'crystal_soul', 'resource', 'Кристалл души', 'Легендарный кристалл, содержащий фрагмент древней души.', 1800, 2, 2, 0.2, NOW(), NOW(), 'legendary'),
        (1, 'crystal_star', 'resource', 'Звездный кристалл', 'Кристалл, сформировавшийся из осколка упавшей звезды.', 3500, 1, 1, 0.1, NOW(), NOW(), 'legendary'),
        (1, 'metal_celestial', 'resource', 'Небесный металл', 'Металл неземного происхождения с уникальными свойствами.', 600, 5, 5, 0.5, NOW(), NOW(), 'epic'),
        (1, 'metal_heavenly', 'resource', 'Металл небожителей', 'Легендарный металл, которым, по легенде, пользуются сами бессмертные.', 5500, 1, 1, 0.1, NOW(), NOW(), 'legendary');

        -- Материалы для талисманов у Госпожи Юнь (ID=3)
        INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
        (3, 'paper_talisman', 'resource', 'Талисманная бумага', 'Особая бумага для создания талисманов, способная хранить духовную энергию.', 40, 15, 15, 3, NOW(), NOW(), 'common'),
        (3, 'ink_basic', 'resource', 'Базовые чернила', 'Чернила с примесью духовных трав для создания простых талисманов.', 35, 15, 15, 3, NOW(), NOW(), 'common'),
        (3, 'ink_fire', 'resource', 'Огненные чернила', 'Чернила с эссенцией огня для создания талисманов огненной стихии.', 80, 8, 8, 1, NOW(), NOW(), 'uncommon'),
        (3, 'feather_phoenix', 'resource', 'Перо феникса', 'Перо мифической птицы феникса, сохраняющее огненную энергию.', 250, 5, 5, 0.5, NOW(), NOW(), 'rare');

        -- Прочие алхимические ингредиенты у Торговца Чжао (ID=5)
        INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
        (5, 'beast_bone', 'resource', 'Кость демонического зверя', 'Прочная кость зверя, впитавшего духовную энергию.', 50, 10, 10, 2, NOW(), NOW(), 'common'),
        (5, 'dust_stardust', 'resource', 'Звездная пыль', 'Мистическая пыль, образующаяся при падении звезд.', 3000, 2, 2, 0.2, NOW(), NOW(), 'legendary'),
        (5, 'spirit_ancient', 'resource', 'Древний дух', 'Сущность древнего духа, захваченная и сохраненная алхимическими методами.', 12000, 1, 1, 0.1, NOW(), NOW(), 'legendary');

        RAISE NOTICE 'Ингредиенты добавлены к торговцам';
    ELSE
        RAISE NOTICE 'Обнаружено % алхимических ингредиентов в таблице merchant_inventory_templates, обновление не требуется', ingredient_count;
    END IF;

    -- Обновляем пилюли в инвентаре Торговца Чена
    SELECT COUNT(*) INTO ingredient_count FROM merchant_inventory_templates 
    WHERE merchant_id = 1 AND item_type = 'consumable' AND item_id IN ('qi_gathering_pill', 'body_strengthening_pill', 'meridian_clearing_pill', 'spirit_concentration_pill');
    
    IF ingredient_count < 4 THEN
        RAISE NOTICE 'Добавление пилюль в качестве расходников к Торговцу Чену...';
        
        -- Удаляем старые пилюли
        DELETE FROM merchant_inventory_templates WHERE merchant_id = 1 AND item_type = 'pill';
        
        -- Добавляем новые пилюли в качестве расходников
        INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
        (1, 'qi_gathering_pill', 'consumable', 'Пилюля сбора ци', 'Базовая пилюля, помогающая собирать и очищать ци. Ускоряет культивацию на начальных этапах.', 125, 5, 5, 1, NOW(), NOW(), 'common'),
        (1, 'body_strengthening_pill', 'consumable', 'Пилюля укрепления тела', 'Укрепляет физическое тело, повышая выносливость и силу культиватора.', 300, 3, 3, 0.8, NOW(), NOW(), 'uncommon'),
        (1, 'meridian_clearing_pill', 'consumable', 'Пилюля очищения меридианов', 'Очищает и расширяет меридианы, облегчая циркуляцию ци по телу.', 480, 3, 3, 0.8, NOW(), NOW(), 'uncommon'),
        (1, 'spirit_concentration_pill', 'consumable', 'Пилюля концентрации духа', 'Помогает культиватору сосредоточиться и улучшает контроль над духовной энергией.', 960, 2, 2, 0.5, NOW(), NOW(), 'rare');
        
        RAISE NOTICE 'Пилюли добавлены к Торговцу Чену';
    ELSE
        RAISE NOTICE 'Пилюли уже добавлены к Торговцу Чену, обновление не требуется';
    END IF;
END $$;

-- 6. Обновление инвентаря существующих пользователей (если есть)
 
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        RAISE NOTICE 'Обновление инвентаря для пользователя ID=%', user_record.id;
        
        -- Проверяем, есть ли у пользователя ингредиенты
        IF NOT EXISTS (
            SELECT 1 FROM merchant_inventories 
            WHERE user_id = user_record.id AND item_type = 'ingredient'
        ) THEN
            -- Копируем данные из шаблонов для этого пользователя
            INSERT INTO merchant_inventories (
                user_id, merchant_id, item_id, item_type, name, description, 
                price, quantity, max_quantity, restock_rate, last_restock_time, 
                rarity, nutrition_value, loyalty_bonus, restock_time
            )
            SELECT 
                user_record.id, template.merchant_id, template.item_id, template.item_type, template.name, template.description, 
                template.price, template.quantity, template.max_quantity, template.restock_rate, template.last_restock_time, 
                template.rarity, template.nutrition_value, template.loyalty_bonus, template.restock_time
            FROM 
                merchant_inventory_templates AS template
            WHERE 
                template.item_type = 'ingredient' OR 
                (template.merchant_id = 1 AND template.item_type = 'consumable' AND template.item_id IN ('qi_gathering_pill', 'body_strengthening_pill', 'meridian_clearing_pill', 'spirit_concentration_pill'));
        END IF;
    END LOOP;
END $$;

