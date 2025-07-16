-- SQL скрипт для создания и заполнения таблиц торговцев
-- Использует PostgreSQL синтаксис
\encoding UTF8
-- Удаление существующих таблиц
DROP TABLE IF EXISTS item_effects CASCADE;
DROP TABLE IF EXISTS item_requirements CASCADE;
DROP TABLE IF EXISTS merchant_inventories CASCADE;
DROP TABLE IF EXISTS merchant_reputations CASCADE;
DROP TABLE IF EXISTS merchant_inventory_templates CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;

-- Таблица торговцев
CREATE TABLE merchants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image VARCHAR(50),
    default_discount INTEGER,
    description TEXT,
    location VARCHAR(100) NOT NULL,
    specialization VARCHAR(50) NOT NULL,
    reputation INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица эталонных шаблонов товаров торговцев
-- Эти шаблоны будут копироваться для каждого нового пользователя
CREATE TABLE merchant_inventory_templates (
    id SERIAL PRIMARY KEY,
    merchant_id VARCHAR(50) REFERENCES merchants(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL, -- Изменено с INTEGER на VARCHAR для хранения строковых идентификаторов
    item_type VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    max_quantity INTEGER NOT NULL,
    restock_rate DECIMAL(5, 2) NOT NULL,
    last_restock_time TIMESTAMP,
    rarity VARCHAR(20) DEFAULT 'common',
    nutrition_value INTEGER,
    loyalty_bonus INTEGER,
    restock_time TIMESTAMP
);

-- Таблица товаров торговцев для конкретных пользователей
CREATE TABLE merchant_inventories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    merchant_id VARCHAR(50) REFERENCES merchants(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL, -- Изменено обратно на VARCHAR для хранения строковых идентификаторов
    item_type VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    max_quantity INTEGER NOT NULL,
    restock_rate DECIMAL(5, 2) NOT NULL,
    last_restock_time TIMESTAMP,
    rarity VARCHAR(20) DEFAULT 'common',
    nutrition_value INTEGER,
    loyalty_bonus INTEGER,
    restock_time TIMESTAMP, -- Добавлено поле для соответствия модели JS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица репутации у торговцев
CREATE TABLE merchant_reputations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    merchant_id VARCHAR(50) REFERENCES merchants(id) ON DELETE CASCADE,
    reputation INTEGER NOT NULL DEFAULT 0 CHECK (reputation >= 0 AND reputation <= 100),
    discount_rate FLOAT NOT NULL DEFAULT 0 CHECK (discount_rate >= 0 AND discount_rate <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем уникальный индекс для быстрого поиска
CREATE UNIQUE INDEX idx_merchant_reputation_user_merchant ON merchant_reputations(user_id, merchant_id);

-- Таблица эффектов предметов
CREATE TABLE item_effects (
    id SERIAL PRIMARY KEY,
    item_id BIGINT REFERENCES merchant_inventories(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    target VARCHAR(50) NOT NULL,
    value DECIMAL(10, 5) NOT NULL,
    operation VARCHAR(20),
    duration VARCHAR(20)
);

-- Таблица требований к предметам
CREATE TABLE item_requirements (
    id SERIAL PRIMARY KEY,
    item_id BIGINT REFERENCES merchant_inventories(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    value INTEGER NOT NULL
);

-- Заполнение таблицы торговцев (из merchants.js)
INSERT INTO merchants (id, name, description, location, specialization, reputation) VALUES
('merchant_chen', 'Торговец Чен', 'Опытный торговец травами и пилюлями. Имеет связи со многими сектами.', 'Город Восточного Ветра', 'травы', 80),
('master_li', 'Мастер Ли', 'Кузнец с многолетним опытом. Его оружие ценится многими культиваторами.', 'Город Восточного Ветра', 'оружие', 75),
('lady_yun', 'Госпожа Юнь', 'Загадочная женщина, торгующая духовными артефактами и талисманами.', 'Секта Облачной Горы', 'талисманы', 90),
('elder_zhang', 'Старейшина Чжан', 'Бывший культиватор, ныне торгующий редкими книгами и техниками.', 'Секта Пяти Стихий', 'книги', 85),
('merchant_zhao', 'Торговец Чжао', 'Странствующий торговец, продающий разнообразные товары по всему миру.', 'Странствующий', 'разное', 70);

-- Вставка шаблонов товаров Торговца Чена (id=merchant_chen)
INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
-- Некорректные ресурсы удалены. Корректные алхимические ингредиенты добавляются ниже.


-- Товары для питомцев
('merchant_chen', 'basic_pet_food', 'pet_food', 'Обычный корм для питомцев', 'Простая еда для духовных питомцев, восстанавливает сытость', 10, 10, 10, 3, NOW(), NULL, 'common'),
('merchant_chen', 'improved_pet_food', 'pet_food', 'Улучшенный корм для питомцев', 'Питательная еда с духовными травами для питомцев среднего уровня', 15, 5, 5, 1, NOW(), NULL, 'uncommon'),
('merchant_chen', 'deluxe_pet_food', 'pet_food', 'Деликатесы для питомцев', 'Редкие деликатесы, которые очень нравятся всем духовным питомцам', 10, 3, 3, 0.5, NOW(), NULL, 'rare');

-- Вставка шаблонов товаров Мастера Ли (id=master_li) - оружие и броня
INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
-- Оружие
('master_li', 'bronze_sword', 'weapon', 'Бронзовый меч', 'Простой бронзовый меч, подходящий для начинающих культиваторов', 75, 3, 3, 1.5, NOW(), NULL, 'common'),
('master_li', 'iron_sword', 'weapon', 'Железный меч', 'Крепкий железный меч, выкованный опытным кузнецом', 180, 2, 2, 1.0, NOW(), NULL, 'uncommon'),
('master_li', 'eastern_wind_blade', 'weapon', 'Клинок Восточного Ветра', 'Легкий и острый меч, созданный по древним техникам Восточного региона', 450, 1, 1, 0.5, NOW(), NULL, 'rare'),
('master_li', 'azure_dragon_sword', 'weapon', 'Меч Лазурного Дракона', 'Легендарный меч, в лезвии которого заключена частица силы древнего дракона', 1000, 1, 1, 0.2, NOW(), NULL, 'epic'),

-- Броня для тела
('master_li', 'cloth_robe', 'armor', 'Льняная роба', 'Простая льняная роба, обеспечивающая минимальную защиту', 60, 3, 3, 1.5, NOW(), NULL, 'common'),
('master_li', 'leather_armor', 'armor', 'Кожаный доспех', 'Прочный доспех из обработанной кожи', 170, 2, 2, 1.0, NOW(), NULL, 'uncommon'),
('master_li', 'mountain_guardian_armor', 'armor', 'Доспех Горного Стража', 'Крепкий доспех, выкованный из руды, добытой в древних горах', 400, 1, 1, 0.5, NOW(), NULL, 'rare'),
('master_li', 'azure_dragon_robe', 'armor', 'Одеяние Лазурного Дракона', 'Мистическое одеяние, сотканное из чешуи лазурного дракона', 850, 1, 1, 0.2, NOW(), NULL, 'epic'),

-- Шлемы
('master_li', 'leather_cap', 'armor', 'Кожаный шлем', 'Простой кожаный шлем, защищающий голову от ударов', 40, 3, 3, 1.5, NOW(), NULL, 'common'),
('master_li', 'perception_circlet', 'armor', 'Венец Восприятия', 'Легкий обруч с драгоценным камнем, усиливающий духовное восприятие', 300, 1, 1, 0.5, NOW(), NULL, 'rare'),

-- Перчатки
('master_li', 'cloth_gloves', 'armor', 'Тканевые перчатки', 'Простые тканевые перчатки, защищающие руки от холода', 30, 3, 3, 1.5, NOW(), NULL, 'common'),
('master_li', 'iron_gauntlets', 'armor', 'Железные рукавицы', 'Крепкие железные рукавицы для защиты рук', 100, 2, 2, 1.0, NOW(), NULL, 'uncommon'),
('master_li', 'spirit_channeling_gloves', 'armor', 'Перчатки духовной проводимости', 'Особые перчатки, улучшающие проводимость духовной энергии', 240, 1, 1, 0.5, NOW(), NULL, 'rare'),

-- Обувь
('master_li', 'cloth_shoes', 'armor', 'Тканевые ботинки', 'Простые тканевые ботинки для повседневного ношения', 35, 3, 3, 1.5, NOW(), NULL, 'common'),
('master_li', 'swift_wind_boots', 'armor', 'Сапоги Стремительного Ветра', 'Легкие сапоги, зачарованные для увеличения скорости и маневренности', 260, 1, 1, 0.5, NOW(), NULL, 'rare');

-- Вставка шаблонов товаров Госпожи Юнь (id=lady_yun) - талисманы и аксессуары
INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
-- Аксессуары
('lady_yun', 'celestial_perception_ring', 'accessory', 'Кольцо Небесного Восприятия', 'Древнее кольцо, улучшающее способность воспринимать духовную энергию', 380, 2, 2, 0.5, NOW(), NULL, 'rare'),
('lady_yun', 'azure_dragon_scale_pendant', 'accessory', 'Подвеска из чешуи Лазурного Дракона', 'Редкая подвеска, изготовленная из чешуи легендарного Лазурного Дракона', 750, 1, 1, 0.2, NOW(), NULL, 'epic'),

-- Талисманы
('lady_yun', 'fire_talisman', 'talisman', 'Талисман огня', 'Простой талисман, усиливающий контроль над стихией огня', 100, 3, 3, 1.5, NOW(), NULL, 'common'),
('lady_yun', 'water_talisman', 'talisman', 'Талисман воды', 'Простой талисман, усиливающий контроль над стихией воды', 100, 3, 3, 1.5, NOW(), NULL, 'common'),
('lady_yun', 'protection_talisman', 'talisman', 'Талисман защиты', 'Талисман, создающий защитный барьер вокруг культиватора', 180, 2, 2, 1.0, NOW(), NULL, 'uncommon'),
('lady_yun', 'spirit_sight_talisman', 'talisman', 'Талисман духовного зрения', 'Редкий талисман, позволяющий видеть скрытые духовные силы', 320, 1, 1, 0.5, NOW(), NULL, 'rare'),
('lady_yun', 'five_elements_talisman', 'talisman', 'Талисман пяти стихий', 'Могущественный талисман, гармонизирующий все пять основных стихий', 550, 1, 1, 0.2, NOW(), NULL, 'epic');

-- Вставка шаблонов товаров Старейшины Чжана (id=elder_zhang)
INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
-- Книги
('elder_zhang', 'basic_techniques_book', 'book', 'Книга базовых техник', 'Содержит основы культивации для начинающих', 800, 2, 2, 0.5, NOW(), NULL, 'common'),
('elder_zhang', 'advanced_techniques_book', 'book', 'Книга продвинутых техник', 'Содержит техники для культиваторов среднего уровня', 1500, 1, 1, 0.3, NOW(), NULL, 'uncommon'),
('elder_zhang', 'secret_techniques_book', 'book', 'Книга секретных техник', 'Редкие техники, собранные Старейшиной Ву за долгие годы', 3000, 1, 1, 0.1, NOW(), NULL, 'rare');
 
-- Алхимические ингредиенты
-- Некорректные ресурсы удалены.


-- Вставка шаблонов товаров Торговца Чжао (id=5)
-- Некорректные INSERT-запросы для Торговца Чжао (id=5) и некорректные пилюли для Торговца Чена (id=1) были удалены.


-- 1. Добавление алхимических ингредиентов к Торговцу Чену (ID=1)
-- Удаление старых ресурсов больше не требуется, так как исходные INSERT-запросы были удалены.

-- Добавляем алхимические ингредиенты из файла alchemy_ingredients.sql
-- Травы для Торговца Чена
INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
('merchant_chen', 'herb_qigathering', 'resource', 'Трава сбора ци', 'Базовая трава, способная собирать и сохранять ци из окружающей среды.', 25, 15, 15, 3, NOW(), NULL, 'common'),
('merchant_chen', 'herb_ironroot', 'resource', 'Железный корень', 'Прочный корень растения, произрастающего на железосодержащих почвах.', 35, 10, 10, 2, NOW(), NULL, 'common'),
('merchant_chen', 'herb_clearflow', 'resource', 'Кристальный цветок', 'Прозрачный цветок с тонкими лепестками, растущий возле чистых источников.', 60, 10, 10, 2, NOW(), NULL, 'uncommon'),
('merchant_chen', 'herb_spiritbloom', 'resource', 'Духовный цвет', 'Редкое растение, цветущее только в местах с высокой концентрацией духовной энергии.', 120, 8, 8, 1, NOW(), NULL, 'rare'),
('merchant_chen', 'herb_goldensage', 'resource', 'Золотой шалфей', 'Легендарное растение с листьями, содержащими частицы чистого золота.', 350, 5, 5, 0.5, NOW(), NULL, 'epic'),
('merchant_chen', 'herb_soulwhisper', 'resource', 'Шепот души', 'Мистическое растение видимое только просветленным культиваторам', 1200, 2, 2, 0.2, NOW(), NULL, 'legendary');


-- Эссенции и жидкости для Торговца Чена
INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
('merchant_chen', 'water_spirit', 'resource', 'Духовная вода', 'Вода, собранная в местах с высокой концентрацией природной энергии.', 20, 15, 15, 3, NOW(), NULL, 'common'),
('merchant_chen', 'water_pure', 'resource', 'Очищенная вода', 'Вода, прошедшая специальный процесс очистки от всех примесей.', 50, 12, 12, 2, NOW(), NULL, 'uncommon'),
('merchant_chen', 'essence_concentration', 'resource', 'Эссенция концентрации', 'Концентрированная эссенция, усиливающая ментальную фокусировку.', 140, 8, 8, 1, NOW(), NULL, 'rare'),
('merchant_chen', 'essence_purity', 'resource', 'Эссенция чистоты', 'Редкая субстанция абсолютной чистоты, используемая в высокоуровневой алхимии.', 400, 5, 5, 0.5, NOW(), NULL, 'epic'),
('merchant_chen', 'essence_enlightenment', 'resource', 'Эссенция просветления', 'Легендарная эссенция, содержащая частицы просветленного сознания.', 1400, 2, 2, 0.2, NOW(), NULL, 'legendary'),
('merchant_chen', 'essence_reflection', 'resource', 'Эссенция отражения', 'Жидкая субстанция с зеркальной поверхностью, отражающая энергетические атаки.', 100, 8, 8, 1, NOW(), NULL, 'uncommon'),
('merchant_chen', 'essence_heaven', 'resource', 'Эссенция небес', 'Капля чистой энергии небесной стихии.', 2500, 1, 1, 0.1, NOW(), NULL, 'legendary');


-- Минералы и металлы для Торговца Чена
INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
('merchant_chen', 'mineral_dust', 'resource', 'Минеральная пыль', 'Смесь мелко измельченных минералов с остаточной энергией.', 15, 15, 15, 3, NOW(), NULL, 'common'),
('merchant_chen', 'mineral_iron', 'resource', 'Духовное железо', 'Железная руда с высоким содержанием духовной энергии.', 30, 12, 12, 2, NOW(), NULL, 'common'),
('merchant_chen', 'crystal_clear', 'resource', 'Чистый кристалл', 'Прозрачный кристалл, усиливающий естественные энергетические потоки.', 80, 10, 10, 1.5, NOW(), NULL, 'uncommon'),
('merchant_chen', 'crystal_mind', 'resource', 'Кристалл разума', 'Кристалл, усиливающий ментальные способности культиватора.', 180, 8, 8, 1, NOW(), NULL, 'rare'),
('merchant_chen', 'crystal_formation', 'resource', 'Кристалл формирования', 'Редкий кристалл, способствующий формированию стабильных энергетических структур.', 450, 5, 5, 0.5, NOW(), NULL, 'epic'),
('merchant_chen', 'crystal_soul', 'resource', 'Кристалл души', 'Легендарный кристалл, содержащий фрагмент древней души.', 1800, 2, 2, 0.2, NOW(), NULL, 'legendary'),
('merchant_chen', 'crystal_star', 'resource', 'Звездный кристалл', 'Кристалл, сформировавшийся из осколка упавшей звезды.', 3500, 1, 1, 0.1, NOW(), NULL, 'legendary'),
('merchant_chen', 'metal_celestial', 'resource', 'Небесный металл', 'Металл неземного происхождения с уникальными свойствами.', 600, 5, 5, 0.5, NOW(), NULL, 'epic'),
('merchant_chen', 'metal_heavenly', 'resource', 'Металл небожителей', 'Легендарный металл, которым, по легенде, пользуются сами бессмертные.', 5500, 1, 1, 0.1, NOW(), NULL, 'legendary');


-- 2. Добавление материалов для талисманов к Госпоже Юнь (ID=lady_yun)
INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
('lady_yun', 'paper_talisman', 'resource', 'Талисманная бумага', 'Особая бумага для создания талисманов, способная хранить духовную энергию.', 40, 15, 15, 3, NOW(), NULL, 'common'),
('lady_yun', 'ink_basic', 'resource', 'Базовые чернила', 'Чернила с примесью духовных трав для создания простых талисманов.', 35, 15, 15, 3, NOW(), NULL, 'common'),
('lady_yun', 'ink_fire', 'resource', 'Огненные чернила', 'Чернила с эссенцией огня для создания талисманов огненной стихии.', 80, 8, 8, 1, NOW(), NULL, 'uncommon'),
('lady_yun', 'feather_phoenix', 'resource', 'Перо феникса', 'Перо мифической птицы феникса, сохраняющее огненную энергию.', 250, 5, 5, 0.5, NOW(), NULL, 'rare');

-- 3. Добавление прочих алхимических ингредиентов к Торговцу Чжао (ID=merchant_zhao)
INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
('merchant_zhao', 'beast_bone', 'resource', 'Кость демонического зверя', 'Прочная кость зверя, впитавшего духовную энергию.', 50, 10, 10, 2, NOW(), NULL, 'common'),
('merchant_zhao', 'dust_stardust', 'resource', 'Звездная пыль', 'Мистическая пыль, образующаяся при падении звезд.', 3000, 2, 2, 0.2, NOW(), NULL, 'legendary'),
('merchant_zhao', 'spirit_ancient', 'resource', 'Древний дух', 'Сущность древнего духа, захваченная и сохраненная алхимическими методами.', 12000, 1, 1, 0.1, NOW(), NULL, 'legendary');

-- 4. Обновление расходников - удаление старых пилюль
-- Удаление старых пилюль больше не требуется, так как исходные INSERT-запросы были удалены.

-- 5. Добавление новых пилюль (результатов алхимии) в инвентарь Торговца Чена
INSERT INTO merchant_inventory_templates (merchant_id, item_id, item_type, name, description, price, quantity, max_quantity, restock_rate, last_restock_time, restock_time, rarity) VALUES
-- Пилюли из алхимической системы
('merchant_chen', 'qi_gathering_pill', 'consumable', 'Зелье сбора ци', 'Базовое зелье, помогающее собирать и очищать ци. Ускоряет культивацию на начальных этапах.', 125, 5, 5, 1, NOW(), NULL, 'common'),
('merchant_chen', 'body_strengthening_pill', 'consumable', 'Зелье укрепления тела', 'Жидкая эссенция, укрепляющая физическое тело, повышая выносливость и силу культиватора.', 300, 3, 3, 0.8, NOW(), NULL, 'uncommon'),
('merchant_chen', 'meridian_clearing_pill', 'consumable', 'Зелье очищения меридианов', 'Микстура, очищающая и расширяющая меридианы, облегчая циркуляцию ци по телу.', 480, 3, 3, 0.8, NOW(), NULL, 'uncommon'),
('merchant_chen', 'spirit_concentration_pill', 'consumable', 'Пилюля концентрации духа', 'Помогает культиватору сосредоточиться и улучшает контроль над духовной энергией.', 960, 2, 2, 0.5, NOW(), NULL, 'rare'),
('merchant_chen', 'core_formation_pill', 'consumable', 'Пилюля формирования ядра', 'Способствует формированию золотого ядра, облегчая прорыв на следующую ступень культивации.', 2400, 1, 1, 0.2, NOW(), NULL, 'epic'),
('merchant_chen', 'soul_enlightenment_pill', 'consumable', 'Пилюля просветления души', 'Усиливает духовное восприятие и помогает в формировании души культиватора.', 12000, 1, 1, 0.1, NOW(), NULL, 'legendary');




-- Обновляем основной триггер


-- Вставка эффектов для предметов
-- Примечание: поскольку теперь item_id ссылается на merchant_inventories и зависит от конкретного пользователя,
-- добавление эффектов должно быть реализовано через отдельную процедуру или в коде приложения
-- Ниже приведен пример, который не будет работать напрямую, но показывает структуру

/*
-- Пример для справки (не будет работать напрямую)
INSERT INTO item_effects (item_id, type, target, value, operation, duration) VALUES
-- Эффекты для Пилюли сбора ци (ID: 10)
(10, 'cultivation', 'energyGain', 10, NULL, NULL),
(10, 'cultivation', 'energyRegen', 0.02, NULL, '300'),

-- Пилюля очищения (ID: 11)
(11, 'healing', 'detoxify', 5, NULL, NULL),
(11, 'statusRemoval', 'poison', 0.8, NULL, NULL),
...
*/

CREATE OR REPLACE FUNCTION initialize_merchant_inventory_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Копируем данные из шаблонов в таблицу инвентаря для нового пользователя
    INSERT INTO merchant_inventories (
        user_id, merchant_id, item_id, item_type, name, description,
        price, quantity, max_quantity, restock_rate, last_restock_time,
        rarity, nutrition_value, loyalty_bonus, restock_time
    )
    SELECT
        NEW.id, -- ID нового пользователя
        template.merchant_id, template.item_id, template.item_type, template.name, template.description,
        template.price, template.quantity, template.max_quantity, template.restock_rate, template.last_restock_time,
        template.rarity, template.nutrition_value, template.loyalty_bonus, template.restock_time
    FROM
        merchant_inventory_templates AS template;

    -- Добавляем начальную репутацию для нового пользователя
    INSERT INTO merchant_reputations (user_id, merchant_id, reputation, discount_rate)
    SELECT
        NEW.id,
        m.id,
        CASE
            WHEN m.id = 'master_li' THEN 80
            WHEN m.id = 'elder_zhang' THEN 60
            ELSE 40
        END,
        0 -- начальная скидка
    FROM
        merchants m;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Повторно создаем триггер, если его еще нет
-- ВАЖНО: Sequelize использует 'Users', а не 'users'
DROP TRIGGER IF EXISTS after_user_created ON "users";
CREATE TRIGGER after_user_created
AFTER INSERT ON "users"
FOR EACH ROW
EXECUTE FUNCTION initialize_merchant_inventory_for_user();

\echo 'Заполняем предметами алхимии';
-- \i 'implement_alchemy_system.sql'; 