-- Изменение типа данных колонки item_id в таблице merchant_inventories
-- с INTEGER на VARCHAR/TEXT для поддержки строковых идентификаторов предметов

-- Проверяем наличие колонки user_id и добавляем её, если она отсутствует
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'merchant_inventories' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE merchant_inventories ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1;
        
        -- Добавляем ограничение внешнего ключа
        ALTER TABLE merchant_inventories ADD CONSTRAINT fk_merchant_inventories_user_id
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Колонка user_id добавлена в таблицу merchant_inventories';
    END IF;
END $$;

-- Сначала добавим временную колонку
ALTER TABLE merchant_inventories ADD COLUMN item_id_temp VARCHAR(255);

-- Скопируем данные из старой колонки, преобразовав INTEGER в строку
UPDATE merchant_inventories SET item_id_temp = item_id::VARCHAR;

-- Удалим старую колонку
ALTER TABLE merchant_inventories DROP COLUMN item_id;

-- Переименуем временную колонку
ALTER TABLE merchant_inventories RENAME COLUMN item_id_temp TO item_id;

-- Сделаем колонку NOT NULL, если это требуется
ALTER TABLE merchant_inventories ALTER COLUMN item_id SET NOT NULL;

-- Добавим индекс для ускорения поиска
CREATE INDEX idx_merchant_inventories_item_id ON merchant_inventories(item_id);

-- Обновим последовательность автоинкремента, если была нарушена
-- SELECT setval('merchant_inventories_id_seq', (SELECT MAX(id) FROM merchant_inventories));

-- Логирование для администратора
DO $$
BEGIN
    RAISE NOTICE 'Тип колонки item_id в таблице merchant_inventories изменен с INTEGER на VARCHAR(255)';
END $$;