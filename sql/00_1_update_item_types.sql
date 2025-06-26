-- SQL скрипт для обновления таблицы item_types
-- Использует PostgreSQL синтаксис
\encoding UTF8

-- Добавление недостающих типов предметов в таблицу item_types
INSERT INTO item_types (id, name) VALUES
('ingredient', 'Ингредиенты'),
('elixir', 'Эликсиры'),
('consumable', 'Расходники'),
('currency', 'Валюта'),
('pet_food', 'Еда для питомцев'),
('resource', 'Ресурсы'),
('book', 'Книги'),
('artifact', 'Артефакты')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;