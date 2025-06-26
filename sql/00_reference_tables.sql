-- SQL скрипт для создания и заполнения справочных таблиц
-- Использует PostgreSQL синтаксис
\encoding UTF8
-- Удаление существующих таблиц
DROP TABLE IF EXISTS quest_categories CASCADE;
DROP TABLE IF EXISTS resource_categories CASCADE;
DROP TABLE IF EXISTS rarities CASCADE;
DROP TABLE IF EXISTS item_types CASCADE;
DROP TABLE IF EXISTS technique_categories CASCADE;
DROP TABLE IF EXISTS element_types CASCADE;

-- Таблица категорий квестов
CREATE TABLE quest_categories (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Таблица категорий ресурсов
CREATE TABLE resource_categories (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Таблица редкостей предметов
CREATE TABLE rarities (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Таблица типов предметов
CREATE TABLE item_types (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Таблица категорий техник
CREATE TABLE technique_categories (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Таблица типов элементов
CREATE TABLE element_types (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7)
);

-- Заполнение таблицы категорий квестов
INSERT INTO quest_categories (id, name) VALUES
('all', 'все'),
('main', 'основные'),
('side', 'побочные'),
('sect', 'секты'),
('daily', 'ежедневные');

-- Заполнение таблицы категорий ресурсов
INSERT INTO resource_categories (id, name) VALUES
('herb', 'Травы'),
('pill', 'Пилюли'),
('mineral', 'Минералы'),
('essence', 'Эссенции'),
('material', 'Материалы'),
('artifact', 'Артефакты'),
('soul', 'Души существ'),
('currency', 'Валюта');

-- Заполнение таблицы редкостей предметов
INSERT INTO rarities (id, name) VALUES
('common', 'Обычный'),
('uncommon', 'Необычный'),
('rare', 'Редкий'),
('epic', 'Эпический'),
('legendary', 'Легендарный'),
('mythic', 'Мифический');

-- Заполнение таблицы типов предметов
INSERT INTO item_types (id, name) VALUES
('pill', 'Пилюли'),
('talisman', 'Талисманы'),
('weapon', 'Оружие'),
('armor', 'Броня'),
('accessory', 'Аксессуары'),
('consumable', 'Расходуемые'),
('resource', 'Ресурсы');

-- Заполнение таблицы категорий техник
INSERT INTO technique_categories (id, name) VALUES
('all', 'все'),
('attack', 'атакующие'),
('defense', 'защитные'),
('support', 'поддержка'),
('cultivation', 'культивация');

-- Заполнение таблицы типов элементов
INSERT INTO element_types (id, name, color) VALUES
('fire', 'Огонь', '#ff4d4d'),
('water', 'Вода', '#4d94ff'),
('earth', 'Земля', '#a67c00'),
('wind', 'Ветер', '#80ff80'),
('lightning', 'Молния', '#ffff4d'),
('darkness', 'Тьма', '#660066'),
('light', 'Свет', '#ffff99'),
('void', 'Пустота', '#1a1a1a');
