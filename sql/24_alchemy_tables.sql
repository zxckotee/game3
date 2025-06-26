-- SQL скрипт для создания таблиц alchemy_recipes и alchemy_results
-- Использует PostgreSQL синтаксис
\encoding UTF8

-- Проверка наличия таблиц и их удаление при необходимости
DROP TABLE IF EXISTS alchemy_results CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS alchemy_recipes CASCADE;

-- Таблица рецептов алхимии
CREATE TABLE IF NOT EXISTS alchemy_recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL,
    rarity VARCHAR(30) NOT NULL,
    required_level INTEGER NOT NULL DEFAULT 1,
    required_stage VARCHAR(50),
    success_rate FLOAT NOT NULL DEFAULT 50.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица ингредиентов для рецептов
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES alchemy_recipes(id) ON DELETE CASCADE,
    item_id VARCHAR(30) REFERENCES alchemy_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица результатов рецептов
CREATE TABLE IF NOT EXISTS alchemy_results (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES alchemy_recipes(id) ON DELETE CASCADE,
    item_id VARCHAR(30) REFERENCES alchemy_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    chance FLOAT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



-- Индексы для оптимизации запросов
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_item_id ON recipe_ingredients(item_id);
CREATE INDEX idx_alchemy_results_recipe_id ON alchemy_results(recipe_id);
CREATE INDEX idx_alchemy_results_item_id ON alchemy_results(item_id);
CREATE INDEX idx_alchemy_recipes_type ON alchemy_recipes(type);
CREATE INDEX idx_alchemy_recipes_rarity ON alchemy_recipes(rarity);

-- Триггеры для обновления timestamp при изменении записей
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alchemy_recipes_updated_at
BEFORE UPDATE ON alchemy_recipes
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_recipe_ingredients_updated_at
BEFORE UPDATE ON recipe_ingredients
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_alchemy_results_updated_at
BEFORE UPDATE ON alchemy_results
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

