-- SQL-скрипт для добавления отслеживания урона в PvP-систему
-- Создание: 30.05.2025

-- Добавление поля total_damage в таблицу pvp_participants
ALTER TABLE pvp_participants ADD COLUMN IF NOT EXISTS total_damage INTEGER DEFAULT 0;

-- Добавление индекса для быстрого поиска по урону
CREATE INDEX IF NOT EXISTS idx_pvp_participants_total_damage ON pvp_participants(total_damage);

-- Добавление комментария к полю
COMMENT ON COLUMN pvp_participants.total_damage IS 'Общее количество урона, нанесённого участником за бой';

-- Сообщение об успешном выполнении скрипта
DO $$
BEGIN
    RAISE NOTICE 'SQL-скрипт для добавления отслеживания урона в PvP-систему успешно выполнен';
END $$;