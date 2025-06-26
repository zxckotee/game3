-- SQL скрипт для исправления таблицы inventory_items
-- Заполняет поле item_id значениями из itemId для всех записей, где item_id NULL или пусто

-- 1. Проверяем наличие колонки item_id и добавляем её, если она отсутствует
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'inventory_items' AND column_name = 'item_id'
    ) THEN
        ALTER TABLE inventory_items ADD COLUMN item_id VARCHAR(255);
        
        RAISE NOTICE 'Колонка item_id добавлена в таблицу inventory_items';
    END IF;
END $$;

-- 2. Обновляем все записи, у которых item_id NULL или пусто, заполняя из поля itemId
UPDATE inventory_items
SET item_id = inventory_items.item_id::VARCHAR 
WHERE item_id IS NULL OR item_id = '';

-- 3. Создаем индекс для ускорения поиска по item_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'inventory_items' AND indexname = 'idx_inventory_items_item_id'
    ) THEN
        CREATE INDEX idx_inventory_items_item_id ON inventory_items(item_id);
        
        RAISE NOTICE 'Индекс idx_inventory_items_item_id создан для таблицы inventory_items';
    END IF;
END $$;

-- 4. Устанавливаем NOT NULL для item_id, если это возможно
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM inventory_items 
        WHERE item_id IS NULL OR item_id = ''
    ) THEN
        ALTER TABLE inventory_items ALTER COLUMN item_id SET NOT NULL;
        
        RAISE NOTICE 'Ограничение NOT NULL установлено для колонки item_id';
    ELSE
        RAISE NOTICE 'В таблице все еще есть записи с NULL в поле item_id. Ограничение NOT NULL не установлено.';
    END IF;
END $$;

-- Логирование для администратора
DO $$
BEGIN
    RAISE NOTICE 'Обновление таблицы inventory_items завершено';
END $$;