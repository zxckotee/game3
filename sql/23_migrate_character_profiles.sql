-- Скрипт для миграции данных character_stats в character_profile
-- Создает профили для пользователей, у которых уже есть характеристики, но нет профиля
\encoding UTF8

-- Вставляем профили для пользователей, у которых есть character_stats, но нет character_profile
INSERT INTO character_profile (user_id, name, gender, region, background)
SELECT cs.user_id, 
       CONCAT('Player ', cs.user_id), -- Временное имя
       'male', -- Пол по умолчанию
       'central', -- Регион по умолчанию
       'commoner' -- Предыстория по умолчанию
FROM character_stats cs
LEFT JOIN character_profile cp ON cs.user_id = cp.user_id
WHERE cp.id IS NULL; -- Только для пользователей без профиля

-- Выводим количество созданных профилей
SELECT COUNT(*) as "Профили созданы" FROM character_profile;