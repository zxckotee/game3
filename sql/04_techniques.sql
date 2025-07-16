-- SQL скрипт для создания и заполнения таблиц техник
-- Использует PostgreSQL синтаксис
\encoding UTF8
-- Удаление существующих таблиц
DROP TABLE IF EXISTS technique_effect_stats CASCADE;
DROP TABLE IF EXISTS technique_effects CASCADE;
DROP TABLE IF EXISTS techniques CASCADE;

-- Зависимость: technique_categories должна быть создана ранее (00_reference_tables.sql)
-- Зависимость: element_types должна быть создана ранее (00_reference_tables.sql)

-- Таблица техник
CREATE TABLE techniques (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    damage INTEGER DEFAULT 0,
    damage_type VARCHAR(20),
    energy_cost INTEGER DEFAULT 0,
    cooldown INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    max_level INTEGER DEFAULT 5,
    type VARCHAR(20),
    required_level INTEGER DEFAULT 1,
    healing INTEGER DEFAULT 0
);

-- Таблица эффектов техник
CREATE TABLE technique_effects (
    id SERIAL PRIMARY KEY,
    technique_id VARCHAR(30) REFERENCES techniques(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    duration INTEGER DEFAULT 0,
    damage INTEGER,
    damage_type VARCHAR(20),
    healing INTEGER
);

-- Таблица статистик эффектов техник
CREATE TABLE technique_effect_stats (
    id SERIAL PRIMARY KEY,
    effect_id INTEGER REFERENCES technique_effects(id) ON DELETE CASCADE,
    stat_name VARCHAR(50) NOT NULL,
    value DECIMAL(10, 5) NOT NULL
);

-- Заполнение таблицы техник (из techniques.js)
INSERT INTO techniques (id, name, description, icon, damage, damage_type, energy_cost, cooldown, max_level, type, required_level) VALUES
('basic_punch', 'Удар кулака', 'Базовая техника рукопашного боя', '👊', 15, 'physical', 5, 0, 5, 'attack', 1),
('heavenly_breath', 'Дыхание Небес', 'Базовая техника культивации, позволяющая накапливать духовную энергию', '🌬️', 0, 'spiritual', 0, 0, 5, 'cultivation', 1),
('crimson_flame_art', 'Искусство Багряного Пламени', 'Мощная огненная техника, наносящая урон и оставляющая эффект горения', '🔥', 25, 'spiritual', 20, 3, 5, 'attack', 2),
('heavenly_sword_art', 'Искусство Небесного Меча', 'Техника владения мечом, позволяющая наносить быстрые и точные удары', '⚔️', 30, 'physical', 25, 4, 5, 'attack', 3),
('immortal_sword_art', 'Искусство Бессмертного Меча', 'Легендарная техника владения мечом, передаваемая только избранным', '🗡️', 45, 'spiritual', 40, 6, 5, 'attack', 10),
('spirit_palm', 'Духовная ладонь', 'Атака, наполненная духовной энергией', '🌟', 20, 'spiritual', 10, 2, 5, 'attack', 1),
('vital_strike', 'Удар по точкам', 'Точечная атака, ослабляющая противника', '🎯', 15, 'physical', 15, 3, 5, 'attack', 2),
('spirit_burst', 'Духовный взрыв', 'Мощный выброс духовной энергии', '💥', 35, 'spiritual', 25, 4, 5, 'attack', 3),
('dragon_fist', 'Кулак дракона', 'Легендарная техника, имитирующая силу дракона', '🐉', 50, 'physical', 35, 5, 5, 'attack', 5),
('healing_breath', 'Дыхание исцеления', 'Техника восстановления жизненной силы', '💚', 0, NULL, 20, 4, 5, 'support', 2),
('spirit_shield', 'Духовный щит', 'Создает защитный барьер из духовной энергии', '🛡️', 0, NULL, 15, 4, 5, 'defense', 3),
-- стремительные шаги удалены, ее реализация сломает механику pvp
('spirit_blade', 'Духовный клинок', 'Создает клинок из чистой духовной энергии', '⚔️', 40, 'spiritual', 30, 4, 5, 'attack', 4),
('thunder_strike', 'Удар грома', 'Молниеносная атака с оглушающим эффектом', '⚡', 35, 'physical', 30, 5, 5, 'attack', 4);

-- Заполнение таблицы эффектов техник
INSERT INTO technique_effects (technique_id, type, name, duration, damage, damage_type) VALUES
-- Эффекты для Дыхания Небес
('heavenly_breath', 'regenerate', 'Накопление энергии', 7, NULL, NULL),
-- Эффекты для Искусства Багряного Пламени
('crimson_flame_art', 'burn', 'Багряное пламя', 6, 8, 'spiritual'),
-- Эффекты для Искусства Небесного Меча
('heavenly_sword_art', 'bleed', 'Рассечение', 5, 10, 'physical'),
-- Эффекты для Искусства Бессмертного Меча
('immortal_sword_art', 'pierce', 'Пронзающий удар', 2, NULL, NULL),
('immortal_sword_art', 'bleed', 'Глубокое рассечение', 4, 15, 'spiritual'),
-- Эффекты для Удара по точкам
('vital_strike', 'weaken', 'Ослабление', 10, NULL, NULL),
-- Эффекты для Кулака дракона
('dragon_fist', 'burn', 'Драконье пламя', 5, 10, 'spiritual'),
-- Эффекты для Дыхания исцеления
('healing_breath', 'regenerate', 'Регенерация', 5, NULL, NULL),
-- Эффекты для Духовного щита
('spirit_shield', 'protect', 'Духовная защита', 7, NULL, NULL),
-- Эффекты для Стремительных шагов -- удалены

-- Эффекты для Духовного клинка
('spirit_blade', 'bleed', 'Духовное кровотечение', 6, 10, 'spiritual'),
-- Эффекты для Удара грома
('thunder_strike', 'stun', 'Оглушение', 10, NULL, NULL);

-- Заполнение таблицы статистик эффектов техник
INSERT INTO technique_effect_stats (effect_id, stat_name, value) VALUES
-- Статистики для эффекта Накопление энергии (Дыхание Небес)
(1, 'energyRegen', 5),
-- Статистики для эффекта Пронзающий удар (Искусство Бессмертного Меча)
(4, 'ignoreDefense', 30),
-- Статистики для эффекта Ослабление (Удар по точкам)
(6, 'physicalDefense', -5),
(6, 'spiritualDefense', -5),
-- Статистики для эффекта Регенерация (Дыхание исцеления)
(8, 'healing', 10),
-- Статистики для эффекта Духовная защита (Духовный щит)
(9, 'physicalDefense', 15),
(9, 'spiritualDefense', 15),
-- Статистики для эффекта Ускорение (Стремительные шаги) -- удалены

