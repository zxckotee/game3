-- SQL скрипт для исправления системы репутации торговцев
-- Использует PostgreSQL синтаксис
\encoding UTF8

-- 1. Создание функции для инициализации репутации торговцев при регистрации нового пользователя
CREATE OR REPLACE FUNCTION initialize_merchant_reputation_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Создаем записи репутации для всех торговцев
    INSERT INTO merchant_reputations (
        user_id, merchant_id, reputation, discount_rate
    )
    SELECT 
        NEW.id, -- ID нового пользователя
        m.id,   -- ID торговца
        0,      -- Начальная репутация
        0.0     -- Начальная скидка (явно указываем как число с плавающей точкой)
    FROM 
        merchants AS m;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Создаем триггер для автоматического создания записей репутации
DROP TRIGGER IF EXISTS after_user_created_reputation ON users;
CREATE TRIGGER after_user_created_reputation
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION initialize_merchant_reputation_for_user();

-- 3. Миграция для существующих пользователей - создание недостающих записей репутации
INSERT INTO merchant_reputations (
    user_id, merchant_id, reputation, discount_rate
)
SELECT 
    u.id, -- ID пользователя
    m.id, -- ID торговца
    0,    -- Начальная репутация
    0.0   -- Начальная скидка (явно указываем как число с плавающей точкой)
FROM 
    users AS u
    CROSS JOIN merchants AS m
WHERE
    NOT EXISTS (
        SELECT 1 FROM merchant_reputations mr 
        WHERE mr.user_id = u.id AND mr.merchant_id = m.id
    );

-- 4. Исправление существующих записей репутации с NaN значениями
UPDATE merchant_reputations
SET discount_rate = 0.0
WHERE discount_rate IS NULL OR discount_rate::text = 'NaN';

-- 5. Обновление ограничения для поля discount_rate с дополнительной проверкой на NULL и NaN
ALTER TABLE merchant_reputations 
    DROP CONSTRAINT IF EXISTS merchant_reputations_discount_rate_check;

ALTER TABLE merchant_reputations 
    ADD CONSTRAINT merchant_reputations_discount_rate_check 
    CHECK ((discount_rate >= 0 AND discount_rate <= 1) AND discount_rate IS NOT NULL);

-- Логирование для администратора
DO $$
BEGIN
    RAISE NOTICE 'Система репутации торговцев успешно обновлена';
END $$;