-- Скрипт для исправления API обновления количества предметов у торговцев
-- Решает проблему с обновлением количества товаров при покупке/продаже предметов

-- Создаем или обновляем функцию обновления количества предметов у торговца
CREATE OR REPLACE FUNCTION update_merchant_item_quantity(
  p_merchant_id INTEGER,    -- ID торговца
  p_item_id VARCHAR,        -- ID предмета (строковый идентификатор)
  p_user_id INTEGER,        -- ID пользователя (покупателя/продавца)
  p_quantity INTEGER,       -- Количество предметов для обновления
  p_action VARCHAR          -- Действие: 'add' или 'subtract'
)
RETURNS JSON AS $$
DECLARE
  v_current_quantity INTEGER;
  v_updated_quantity INTEGER;
  v_merchant_inventory JSON;
  v_item_record RECORD;
  v_result JSON;
  v_updated_items JSON[];
BEGIN
  -- Проверка наличия торговца
  IF NOT EXISTS (SELECT 1 FROM merchants WHERE id = p_merchant_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Торговец не найден'
    );
  END IF;

  -- Проверка наличия пользователя
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Пользователь не найден'
    );
  END IF;

  -- Получаем текущий инвентарь торговца
  SELECT inventory INTO v_merchant_inventory
  FROM merchants
  WHERE id = p_merchant_id;

  -- Если инвентарь пуст или NULL, создаем новый
  IF v_merchant_inventory IS NULL THEN
    v_merchant_inventory := '[]'::JSON;
    
    -- Добавление записи в лог
    INSERT INTO transaction_log (user_id, merchant_id, action, details, created_at)
    VALUES (p_user_id, p_merchant_id, 'initialize_inventory', 
            json_build_object('note', 'Инициализирован пустой инвентарь'),
            NOW());
  END IF;

  -- Проверяем, есть ли предмет в инвентаре торговца
  SELECT *
  INTO v_item_record
  FROM json_array_elements(v_merchant_inventory) AS items
  WHERE (items->>'itemId')::VARCHAR = p_item_id
  LIMIT 1;

  -- Если предмета нет в инвентаре и действие 'add', добавляем его
  IF v_item_record IS NULL AND p_action = 'add' THEN
    -- Получаем информацию о предмете из каталога предметов
    SELECT info INTO v_item_record
    FROM item_catalog 
    WHERE item_id = p_item_id
    LIMIT 1;
    
    IF v_item_record IS NULL THEN
      -- Если предмета нет в каталоге, создаем базовую запись
      v_item_record := json_build_object(
        'itemId', p_item_id,
        'quantity', 0,
        'maxQuantity', 100,
        'price', 100,
        'name', 'Неизвестный предмет ' || p_item_id,
        'description', 'Описание отсутствует',
        'itemType', 'misc',
        'rarity', 'common'
      );
    END IF;
    
    -- Устанавливаем начальное количество
    v_current_quantity := 0;
  ELSIF v_item_record IS NULL AND p_action = 'subtract' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Предмет не найден в инвентаре торговца'
    );
  ELSE
    -- Получаем текущее количество предмета
    v_current_quantity := (v_item_record->>'quantity')::INTEGER;
  END IF;

  -- Обновляем количество в зависимости от действия
  IF p_action = 'add' THEN
    v_updated_quantity := v_current_quantity + p_quantity;
  ELSIF p_action = 'subtract' THEN
    v_updated_quantity := v_current_quantity - p_quantity;
    
    -- Проверка достаточности количества
    IF v_updated_quantity < 0 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Недостаточное количество предметов'
      );
    END IF;
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Неизвестное действие. Допустимые значения: add, subtract'
    );
  END IF;

  -- Обновляем инвентарь
  IF v_item_record IS NULL THEN
    -- Создаем новую запись предмета
    v_merchant_inventory := v_merchant_inventory || json_build_object(
      'itemId', p_item_id,
      'quantity', v_updated_quantity,
      'maxQuantity', 100,
      'price', 100,
      'name', 'Предмет ' || p_item_id,
      'description', 'Описание отсутствует',
      'itemType', 'misc',
      'rarity', 'common'
    );
  ELSE
    -- Обновляем существующую запись
    v_merchant_inventory := jsonb_set(
      v_merchant_inventory::jsonb,
      array[array_position(array_agg(i), v_item_record::json)::text, 'quantity'],
      to_jsonb(v_updated_quantity)
    )::json
    FROM json_array_elements(v_merchant_inventory) WITH ORDINALITY AS i;
  END IF;

  -- Сохраняем обновленный инвентарь
  UPDATE merchants
  SET inventory = v_merchant_inventory,
      updated_at = NOW()
  WHERE id = p_merchant_id;

  -- Добавление записи в лог транзакций
  INSERT INTO transaction_log (user_id, merchant_id, item_id, quantity, action, details, created_at)
  VALUES (p_user_id, p_merchant_id, p_item_id, p_quantity, p_action, 
          json_build_object(
            'previous_quantity', v_current_quantity,
            'new_quantity', v_updated_quantity
          ),
          NOW());

  -- Получаем обновленный список предметов для возврата
  SELECT array_agg(items)
  INTO v_updated_items
  FROM json_array_elements(v_merchant_inventory) AS items;

  -- Формируем результат
  v_result := json_build_object(
    'success', true,
    'merchant_id', p_merchant_id,
    'item', json_build_object(
      'itemId', p_item_id,
      'quantity', v_updated_quantity,
      'previous_quantity', v_current_quantity
    ),
    'updatedItems', v_updated_items
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Создаем или обновляем таблицу логов транзакций, если ее еще нет
CREATE TABLE IF NOT EXISTS transaction_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  merchant_id INTEGER NOT NULL,
  item_id VARCHAR,
  quantity INTEGER,
  action VARCHAR NOT NULL,
  details JSON,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Добавляем индекс для быстрого поиска по пользователю и торговцу
CREATE INDEX IF NOT EXISTS idx_transaction_log_user_merchant 
ON transaction_log(user_id, merchant_id);

-- Добавляем индекс для быстрого поиска по предмету
CREATE INDEX IF NOT EXISTS idx_transaction_log_item
ON transaction_log(item_id);

-- Создаем представление для анализа популярных предметов
CREATE OR REPLACE VIEW popular_items AS
SELECT 
  item_id,
  COUNT(*) AS transaction_count,
  SUM(CASE WHEN action = 'subtract' THEN quantity ELSE 0 END) AS total_sold,
  SUM(CASE WHEN action = 'add' THEN quantity ELSE 0 END) AS total_bought
FROM transaction_log
WHERE created_at > (NOW() - INTERVAL '30 days')
GROUP BY item_id
ORDER BY transaction_count DESC;

-- Обновляем или создаем таблицу каталога предметов, если ее еще нет
CREATE TABLE IF NOT EXISTS item_catalog (
  item_id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  item_type VARCHAR NOT NULL,
  rarity VARCHAR DEFAULT 'common',
  price INTEGER DEFAULT 100,
  info JSON,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Функция получения всех предметов торговца для пользователя
CREATE OR REPLACE FUNCTION get_merchant_items_for_user(
  p_merchant_id INTEGER,
  p_user_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_merchant_inventory JSON;
  v_relationship_level INTEGER;
  v_discount DECIMAL;
BEGIN
  -- Проверка наличия торговца
  IF NOT EXISTS (SELECT 1 FROM merchants WHERE id = p_merchant_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Торговец не найден'
    );
  END IF;

  -- Получаем уровень отношений пользователя с торговцем
  SELECT COALESCE(relationship_level, 0) INTO v_relationship_level
  FROM user_merchant_relationships
  WHERE user_id = p_user_id AND merchant_id = p_merchant_id;
  
  -- Вычисляем скидку на основе уровня отношений
  v_discount := CASE 
    WHEN v_relationship_level >= 10 THEN 0.15
    WHEN v_relationship_level >= 7 THEN 0.10
    WHEN v_relationship_level >= 5 THEN 0.07
    WHEN v_relationship_level >= 3 THEN 0.05
    WHEN v_relationship_level >= 1 THEN 0.03
    ELSE 0
  END;

  -- Получаем инвентарь торговца
  SELECT inventory INTO v_merchant_inventory
  FROM merchants
  WHERE id = p_merchant_id;

  -- Если инвентарь пуст или NULL, возвращаем пустой список
  IF v_merchant_inventory IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'merchant_id', p_merchant_id,
      'items', '[]'::JSON,
      'relationship_level', v_relationship_level,
      'discount', v_discount
    );
  END IF;

  -- Применяем скидку к ценам предметов
  WITH items AS (
    SELECT 
      jsonb_set(
        item::jsonb, 
        '{price}', 
        to_jsonb(ROUND((item->>'price')::numeric * (1 - v_discount)))
      ) AS item_with_discount
    FROM json_array_elements(v_merchant_inventory) AS item
  )
  SELECT json_agg(item_with_discount) INTO v_merchant_inventory
  FROM items;

  -- Возвращаем результат
  RETURN json_build_object(
    'success', true,
    'merchant_id', p_merchant_id,
    'items', v_merchant_inventory,
    'relationship_level', v_relationship_level,
    'discount', v_discount
  );
END;
$$ LANGUAGE plpgsql;

-- Создаем или обновляем таблицу отношений пользователя с торговцем, если ее еще нет
CREATE TABLE IF NOT EXISTS user_merchant_relationships (
  user_id INTEGER NOT NULL,
  merchant_id INTEGER NOT NULL,
  relationship_level INTEGER DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, merchant_id)
);

-- Триггерная функция для обновления уровня отношений при транзакции
CREATE OR REPLACE FUNCTION update_merchant_relationship()
RETURNS TRIGGER AS $$
BEGIN
  -- Увеличиваем счетчик взаимодействий
  UPDATE user_merchant_relationships
  SET 
    interaction_count = interaction_count + 1,
    last_interaction = NOW(),
    updated_at = NOW()
  WHERE 
    user_id = NEW.user_id AND 
    merchant_id = NEW.merchant_id;
    
  -- Если записи не существует, создаем ее
  IF NOT FOUND THEN
    INSERT INTO user_merchant_relationships (
      user_id, merchant_id, interaction_count, last_interaction
    ) VALUES (
      NEW.user_id, NEW.merchant_id, 1, NOW()
    );
  END IF;
  
  -- Обновляем уровень отношений на основе количества взаимодействий
  UPDATE user_merchant_relationships
  SET relationship_level = 
    CASE 
      WHEN interaction_count >= 100 THEN 10
      WHEN interaction_count >= 75 THEN 7
      WHEN interaction_count >= 50 THEN 5
      WHEN interaction_count >= 25 THEN 3
      WHEN interaction_count >= 10 THEN 1
      ELSE 0
    END
  WHERE 
    user_id = NEW.user_id AND 
    merchant_id = NEW.merchant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для обновления отношений при транзакции
DROP TRIGGER IF EXISTS transaction_update_relationship ON transaction_log;
CREATE TRIGGER transaction_update_relationship
AFTER INSERT ON transaction_log
FOR EACH ROW
EXECUTE FUNCTION update_merchant_relationship();